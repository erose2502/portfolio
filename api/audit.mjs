/* POST /api/audit  { handle }
   Runs a live Meta Ad Library pull through Apify and streams progress as
   NDJSON, one event per line, so the hero can show the audit as it runs:
     { type:'step', id, state:'run'|'done', note }
     { type:'result', data }
     { type:'error', message }
   Needs APIFY_TOKEN in the Vercel project env. */

import { normalizeHandle, scoreAds, MAX_ADS } from './_lib/meta-audit.mjs';
import { signReport } from './_lib/sign.mjs';

const ACTOR = 'apify~facebook-ads-scraper';
const PAGES_ACTOR = 'apify~facebook-pages-scraper';   /* ~$0.01 per lookup */
const API = 'https://api.apify.com/v2';
const COST_CAP_USD = 0.35;      /* ~40 ads at the free-tier rate, with headroom */
const RUN_TIMEOUT_S = 120;     /* the Ad Library pull varies 25-90s; a cut-off run saves nothing */
const CACHE_MS = 30 * 60 * 1000;
const BLOCK_LIMIT = 3;          /* refusals in the run log before we give up on it */
const RATE = { windowMs: 10 * 60 * 1000, max: 4 };

/* Per-instance memory. Fluid compute reuses instances, so this absorbs
   repeat audits and refresh-spamming; it is not a hard global limit. */
const cache = new Map();
const ids = new Map();          /* handle -> Ad Library page id, once resolved */
const hits = new Map();

function limited(ip, now){
  const list = (hits.get(ip) || []).filter(t => now - t < RATE.windowMs);
  if(list.length >= RATE.max){ hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  if(hits.size > 5000) hits.clear();
  return false;
}

const json = (obj, status) => new Response(JSON.stringify(obj), {
  status, headers:{ 'content-type':'application/json', 'cache-control':'no-store' }
});

export async function POST(request){
  let body = {};
  try{ body = await request.json(); }catch(e){}
  const target = normalizeHandle(body.handle);
  if(!target) return json({ type:'error', message:'That doesn\'t look like a Facebook page. Try the name after facebook.com/, for example joespizzanyc.' }, 400);

  const token = process.env.APIFY_TOKEN;
  if(!token) return json({ type:'error', message:'The audit engine isn\'t connected yet. Book a call and I\'ll run it for you by hand.' }, 503);

  const now = Date.now();
  const key = target.handle.toLowerCase();
  const hit = cache.get(key);
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
  if(!(hit && now - hit.at < CACHE_MS) && limited(ip, now)){
    return json({ type:'error', message:'You\'ve run a few audits in a row. Give it ten minutes, or send me the page and I\'ll audit it myself.' }, 429);
  }

  const enc = new TextEncoder();
  let runId = null, lookupRunId = null;

  const stream = new ReadableStream({
    async start(ctrl){
      let closed = false;
      const send = ev => { if(!closed) ctrl.enqueue(enc.encode(JSON.stringify(ev) + '\n')); };
      const step = (id, state, note) => send({ type:'step', id, state, note });
      const end = () => { if(!closed){ closed = true; ctrl.close(); } };
      const auth = { authorization:'Bearer ' + token };

      try{
        step('resolve', 'run', target.url.replace('https://www.', ''));

        if(hit && now - hit.at < CACHE_MS){
          step('resolve', 'done', hit.data.page.name || target.handle);
          step('library', 'done', hit.data.adsFound + ' ads, from a run ' + Math.round((now - hit.at) / 60000) + ' min ago');
          await scoringSteps(step, hit.data);
          send({ type:'result', data:hit.data, token:signReport(hit.data) });
          return end();
        }

        /* Facebook often blocks the scraper when it opens facebook.com/<name>
           to find the page. The Ad Library itself isn't blocked, so:
           - a numeric id (or one we've resolved before) goes straight there;
           - a name tries the page URL first while, in parallel, a separate
             page lookup resolves the Ad Library id. If Facebook blocks the
             first run, it's aborted and the second run uses that id. */
        const isId = /^\d+$/.test(target.handle);
        const knownId = isId ? target.handle : ids.get(key);
        const lookupP = knownId ? null : startLookup(target.url, auth);
        if(lookupP) lookupP.then(lk => { lookupRunId = lk.runId; });
        const plan = knownId ? [libUrl(knownId), libUrl(knownId)] : [target.url, null];

        let state = null, blocked = false, missing = false;
        for(let attempt = 1; attempt <= plan.length; attempt++){
          let url = plan[attempt - 1];
          if(url === null){
            step('library', 'run', 'Facebook blocked the page, finding it another way');
            const lk = await lookupP;
            const found = await lk.done;
            if(found && found.missing){ missing = true; break; }
            const id = found && found.id;
            if(!id){ blocked = true; break; }
            ids.set(key, id);
            url = libUrl(id);
          }
          const start = await fetch(
            `${API}/acts/${ACTOR}/runs?timeout=${RUN_TIMEOUT_S}&maxTotalChargeUsd=${COST_CAP_USD}`,
            { method:'POST', headers:Object.assign({ 'content-type':'application/json' }, auth),
              body:JSON.stringify({
                startUrls:[{ url }],
                resultsLimit:MAX_ADS,
                activeStatus:'active',
                includeAboutPage:false,
                isDetailsPerAd:false
              }) });
          if(!start.ok) throw new Error('start ' + start.status);
          const run = (await start.json()).data;
          runId = run.id;
          if(attempt === 1){
            step('resolve', 'done', target.handle);
            step('library', 'run', 'Opening the Meta Ad Library');
          }else if(plan[attempt - 1] !== null){
            step('library', 'run', 'Facebook was slow to answer, trying again');
          }else{
            step('library', 'run', 'Found it. Reading the Ad Library');
          }

          /* waitForFinish long-polls, so each loop is one cheap request that
             returns as soon as the run moves, and we relay Apify's own status. */
          state = run;
          let lastMsg = '', pollErrs = 0;
          blocked = false;
          const deadline = Date.now() + (RUN_TIMEOUT_S + 10) * 1000;
          while(!/SUCCEEDED|FAILED|ABORTED|TIMED-OUT/.test(state.status)){
            if(Date.now() > deadline) throw new Error('timeout');
            const r = await fetch(`${API}/actor-runs/${runId}?waitForFinish=4`, { headers:auth }).catch(() => null);
            /* a one-off 5xx from Apify mustn't kill a run that's still going */
            if(!r || !r.ok){
              if(++pollErrs > 5) throw new Error('poll ' + (r ? r.status : 'network'));
              await new Promise(res => setTimeout(res, 1000));
              continue;
            }
            pollErrs = 0;
            state = (await r.json()).data;
            const msg = tidy(state.statusMessage);
            if(msg && msg !== lastMsg){ lastMsg = msg; step('library', 'run', msg); }
            if(!/SUCCEEDED|FAILED|ABORTED|TIMED-OUT/.test(state.status)
               && await blockCount(runId, auth) >= BLOCK_LIMIT){
              blocked = true;
              await fetch(`${API}/actor-runs/${runId}/abort`, { method:'POST', headers:auth }).catch(() => {});
              break;
            }
          }
          if(!blocked) break;
          console.warn('[audit]', target.handle, 'blocked by Facebook, attempt', attempt);
        }
        /* the lookup is only needed when the direct route was blocked */
        if(lookupP) lookupP.then(lk => { if(lk.runId) abortRun(lk.runId, auth); });
        if(missing){
          step('library', 'done', 'Page isn\'t public');
          send({ type:'error', message:'Facebook says "' + target.handle + '" isn\'t a public page, or doesn\'t exist. Check the name after facebook.com/ on your page, or paste the full link.' });
          return end();
        }
        if(blocked){
          step('library', 'done', 'Facebook didn\'t let us in');
          send({ type:'error', message:'Facebook wouldn\'t open "' + target.handle + '" just now. Try again in a minute, or paste your page\'s full link from the About section.' });
          return end();
        }
        if(state.status !== 'SUCCEEDED') throw new Error('run ' + state.status);

        const items = await fetch(
          `${API}/datasets/${state.defaultDatasetId}/items?clean=true&limit=${MAX_ADS + 2}`,
          { headers:auth }).then(r => r.json());

        const data = scoreAds(items, Date.now());
        /* A numeric id is a real page, and the Ad Library route returns an
           empty row when it has nothing running, so that's "no ads", not an error */
        if(!data.page.name && data.adsFound === 0 && !/^\d+$/.test(target.handle)){
          /* Apify returns the same empty row for a missing page and for one
             Facebook refused to load, so don't claim the page doesn't exist */
          step('library', 'done', 'Couldn\'t open the page');
          send({ type:'error', message:'Couldn\'t open "' + target.handle + '" in the Ad Library. Check the spelling, paste the full facebook.com link, or try again in a minute.' });
          return end();
        }
        step('library', 'done', data.adsFound === 0 ? 'No active ads' : (data.capped ? MAX_ADS + '+ active ads' : data.adsFound + (data.adsFound === 1 ? ' active ad' : ' active ads')) + ' pulled');
        await scoringSteps(step, data);

        if(data.page.id && /^\d+$/.test(String(data.page.id))) ids.set(key, String(data.page.id));
        cache.set(key, { at:Date.now(), data });
        if(cache.size > 500) cache.delete(cache.keys().next().value);
        send({ type:'result', data, token:signReport(data) });
      }catch(err){
        console.error('[audit]', target.handle, err && err.message);
        send({ type:'error', message:'The Ad Library didn\'t answer in time. Try again in a minute, or send me the page and I\'ll run it myself.' });
      }
      end();
    },
    async cancel(){
      /* visitor left mid-run: stop paying for it */
      const auth = { authorization:'Bearer ' + token };
      if(runId) abortRun(runId, auth);
      if(lookupRunId) abortRun(lookupRunId, auth);
    }
  });

  return new Response(stream, {
    headers:{
      'content-type':'application/x-ndjson; charset=utf-8',
      'cache-control':'no-store',
      'x-accel-buffering':'no'
    }
  });
}

export function GET(){
  return json({ type:'error', message:'POST a { handle } to run an audit.' }, 405);
}

/* the scoring is instant; a short beat per check keeps each step readable
   in the UI, and every note is the real number for that check */
async function scoringSteps(step, data){
  const by = Object.fromEntries(data.checks.map(c => [c.id, c]));
  for(const id of ['freshness', 'mix', 'testing', 'placements', 'conversion']){
    const c = by[id];
    step(id, 'run');
    await new Promise(r => setTimeout(r, 260));
    step(id, 'done', c ? c.metric : 'Skipped, nothing running');
  }
  step('score', 'done', data.score + ' / 100');
}

const libUrl = id => 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&search_type=page&view_all_page_id=' + id;
const abortRun = (id, auth) => fetch(`${API}/actor-runs/${id}/abort`, { method:'POST', headers:auth }).catch(() => {});

/* Resolve a page name to its Ad Library id with the pages scraper, which
   gets through where the ads scraper's own page fetch is blocked. Returns
   { runId, done }: done resolves to { id }, { missing:true } when Facebook
   says the page isn't public, or null when the lookup itself failed. */
async function startLookup(url, auth){
  try{
    const r = await fetch(`${API}/acts/${PAGES_ACTOR}/runs?timeout=60&maxTotalChargeUsd=0.05`, {
      method:'POST', headers:Object.assign({ 'content-type':'application/json' }, auth),
      body:JSON.stringify({ startUrls:[{ url }] })
    });
    if(!r.ok) return { runId:null, done:Promise.resolve(null) };
    const run = (await r.json()).data;
    const done = (async () => {
      let st = run;
      const until = Date.now() + 70000;
      while(!/SUCCEEDED|FAILED|ABORTED|TIMED-OUT/.test(st.status)){
        if(Date.now() > until) return null;
        const p = await fetch(`${API}/actor-runs/${run.id}?waitForFinish=10`, { headers:auth }).catch(() => null);
        if(p && p.ok) st = (await p.json()).data;
        else await new Promise(res => setTimeout(res, 1000));
      }
      if(st.status !== 'SUCCEEDED') return null;
      const items = await fetch(`${API}/datasets/${st.defaultDatasetId}/items?clean=true&limit=1`, { headers:auth })
        .then(x => x.json()).catch(() => []);
      const it = (Array.isArray(items) && items[0]) || {};
      if(it.error === 'not_available') return { missing:true };
      const id = String((it.pageAdLibrary && it.pageAdLibrary.id) || '');
      return /^\d{5,20}$/.test(id) ? { id } : null;
    })().catch(() => null);
    return { runId:run.id, done };
  }catch(e){ return { runId:null, done:Promise.resolve(null) }; }
}

/* how many times Facebook has refused this run so far, from Apify's log */
async function blockCount(runId, auth){
  try{
    const r = await fetch(`${API}/actor-runs/${runId}/log`, { headers:auth });
    if(!r.ok) return 0;
    const t = await r.text();
    return (t.match(/BLOCKED|Page access was blocked/g) || []).length;
  }catch(e){ return 0; }
}

/* Apify's status lines are crawler jargon; translate the ones we know
   into what's actually happening and drop anything we can't explain */
function tidy(m){
  if(!m) return '';
  m = String(m).replace(/\s+/g, ' ').trim();
  if(/^Finished!|Collecting results/i.test(m)) return 'Collecting the ads Meta returned';
  if(/^Starting the crawler/i.test(m)) return 'Connecting to Meta\'s Ad Library';
  const c = /^Crawled (\d+)\/(\d+) pages/i.exec(m);
  if(c) return +c[1] === 0 ? 'Opening your page in the Ad Library' : 'Reading your ads, batch ' + c[1];
  return '';
}
