/* POST /api/audit  { handle }
   Runs a live Meta Ad Library pull through Apify and streams progress as
   NDJSON, one event per line, so the hero can show the audit as it runs:
     { type:'step', id, state:'run'|'done', note }
     { type:'result', data }
     { type:'error', message }
   Needs APIFY_TOKEN in the Vercel project env. */

import { normalizeHandle, scoreAds, MAX_ADS } from './_lib/meta-audit.mjs';

const ACTOR = 'apify~facebook-ads-scraper';
const API = 'https://api.apify.com/v2';
const COST_CAP_USD = 0.35;      /* ~40 ads at the free-tier rate, with headroom */
const RUN_TIMEOUT_S = 75;
const CACHE_MS = 30 * 60 * 1000;
const RATE = { windowMs: 10 * 60 * 1000, max: 4 };

/* Per-instance memory. Fluid compute reuses instances, so this absorbs
   repeat audits and refresh-spamming; it is not a hard global limit. */
const cache = new Map();
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
  let runId = null;

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
          send({ type:'result', data:hit.data });
          return end();
        }

        const start = await fetch(
          `${API}/acts/${ACTOR}/runs?timeout=${RUN_TIMEOUT_S}&maxTotalChargeUsd=${COST_CAP_USD}`,
          { method:'POST', headers:Object.assign({ 'content-type':'application/json' }, auth),
            body:JSON.stringify({
              startUrls:[{ url:target.url }],
              resultsLimit:MAX_ADS,
              activeStatus:'active',
              includeAboutPage:false,
              isDetailsPerAd:false
            }) });
        if(!start.ok) throw new Error('start ' + start.status);
        const run = (await start.json()).data;
        runId = run.id;
        step('resolve', 'done', target.handle);
        step('library', 'run', 'Opening the Meta Ad Library');

        /* waitForFinish long-polls, so each loop is one cheap request that
           returns as soon as the run moves, and we relay Apify's own status. */
        let state = run, lastMsg = '';
        const deadline = Date.now() + (RUN_TIMEOUT_S + 10) * 1000;
        while(!/SUCCEEDED|FAILED|ABORTED|TIMED-OUT/.test(state.status)){
          if(Date.now() > deadline) throw new Error('timeout');
          const r = await fetch(`${API}/actor-runs/${runId}?waitForFinish=4`, { headers:auth });
          if(!r.ok) throw new Error('poll ' + r.status);
          state = (await r.json()).data;
          const msg = tidy(state.statusMessage);
          if(msg && msg !== lastMsg){ lastMsg = msg; step('library', 'run', msg); }
        }
        if(state.status !== 'SUCCEEDED') throw new Error('run ' + state.status);

        const items = await fetch(
          `${API}/datasets/${state.defaultDatasetId}/items?clean=true&limit=${MAX_ADS + 2}`,
          { headers:auth }).then(r => r.json());

        const data = scoreAds(items, Date.now());
        if(!data.page.name && data.adsFound === 0){
          step('library', 'done', 'Page not found');
          send({ type:'error', message:'Meta has no page under "' + target.handle + '". Check the spelling, or paste the full facebook.com link.' });
          return end();
        }
        step('library', 'done', data.adsFound === 0 ? 'No active ads' : (data.capped ? MAX_ADS + '+ active ads' : data.adsFound + (data.adsFound === 1 ? ' active ad' : ' active ads')) + ' pulled');
        await scoringSteps(step, data);

        cache.set(key, { at:Date.now(), data });
        if(cache.size > 500) cache.delete(cache.keys().next().value);
        send({ type:'result', data });
      }catch(err){
        console.error('[audit]', target.handle, err && err.message);
        send({ type:'error', message:'The Ad Library didn\'t answer in time. Try again in a minute, or send me the page and I\'ll run it myself.' });
      }
      end();
    },
    async cancel(){
      /* visitor left mid-run: stop paying for it */
      if(runId) fetch(`${API}/actor-runs/${runId}/abort`, {
        method:'POST', headers:{ authorization:'Bearer ' + token }
      }).catch(() => {});
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

function tidy(m){
  if(!m) return '';
  m = String(m).replace(/\s+/g, ' ').trim();
  if(/^Finished!/i.test(m)) return 'Collecting results';
  return m.length > 64 ? m.slice(0, 61) + '...' : m;
}
