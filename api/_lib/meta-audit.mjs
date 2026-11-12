/* Meta ads audit: turns public Ad Library rows into a scored report.
   Everything here is deterministic. The numbers in every finding come
   straight from the ads we pulled, so the copy never claims what the
   data can't show (spend, CTR and ROAS are not public). */

const P = 'https://plaith.ai/en/elijahrose';
const STRIPE = 'client_reference_id=elijah-rose&utm_source=elijah-rose';

export const PLAITH = {
  page:       P,
  how:        P + '#ablauf',
  examples:   P + '#beispiel',
  calculator: P + '#rechner',
  growthHack: P + '#booster',
  faq:        P + '#fragen',
  contact:    P + '#kontakt',
  booking:    P + '/booking',
  plans:      P + '/booking#pakete',
  partner:    P + '/partner',
  whatsapp:   'https://wa.me/12232401771',
  checkout: {
    start:  'https://buy.stripe.com/4gM5kFeAv0LK6Gb9L72wU0r?' + STRIPE,
    growth: 'https://buy.stripe.com/3cIdRb4ZVbqoe8D4qN2wU0w?' + STRIPE,
    scale:  'https://buy.stripe.com/28E00l7838ece8D1eB2wU0B?' + STRIPE
  }
};

export const MAX_ADS = 40;
const DAY = 86400000;

/* Accepts a handle, @handle, a page URL, or profile.php?id=… and returns
   the canonical page URL, or null if it can't be a Facebook page. */
export function normalizeHandle(raw){
  let s = String(raw || '').trim();
  if(!s || s.length > 200) return null;
  s = s.replace(/^@/, '');
  if(/^[\w.-]+\.[a-z]{2,}\//i.test(s) || /^https?:\/\//i.test(s)){
    let u;
    try{ u = new URL(/^https?:/i.test(s) ? s : 'https://' + s); }catch(e){ return null; }
    if(!/(^|\.)(facebook|fb)\.com$/i.test(u.hostname)) return null;
    const id = u.searchParams.get('id') || u.searchParams.get('view_all_page_id');
    if(id && /^\d{5,20}$/.test(id)) return { handle:id, url:'https://www.facebook.com/profile.php?id=' + id };
    const seg = u.pathname.split('/').filter(Boolean);
    if(seg[0] === 'pages' && seg.length >= 3 && /^\d+$/.test(seg[2])) s = seg[2];
    else s = seg[0] || '';
  }
  if(/^\d{5,20}$/.test(s)) return { handle:s, url:'https://www.facebook.com/profile.php?id=' + s };
  if(!/^[A-Za-z0-9.\-_]{2,80}$/.test(s)) return null;
  if(/^(profile\.php|pages|ads|groups|events|watch|marketplace|login|home\.php)$/i.test(s)) return null;
  return { handle:s, url:'https://www.facebook.com/' + s };
}

function startMs(ad){
  if(typeof ad.startDate === 'number') return ad.startDate * 1000;
  const t = Date.parse(ad.startDateFormatted || '');
  return isNaN(t) ? null : t;
}

function textOf(ad){
  const sn = ad.snapshot || {};
  const card = (sn.cards || [])[0] || {};
  const body = (sn.body && sn.body.text) || card.body || '';
  const title = sn.title || card.title || '';
  /* dynamic creative leaves template tokens in the copy; they aren't a message */
  const clean = v => /\{\{.*\}\}/.test(v) ? '' : String(v).trim();
  return { title:clean(title), body:clean(body) };
}

function thumbOf(ad){
  const sn = ad.snapshot || {};
  const v = (sn.videos || [])[0], i = (sn.images || [])[0], c = (sn.cards || [])[0];
  return (v && v.videoPreviewImageUrl) ||
         (i && (i.resizedImageUrl || i.originalImageUrl)) ||
         (c && (c.resizedImageUrl || c.videoPreviewImageUrl || c.originalImageUrl)) || null;
}

function formatOf(ad){
  const sn = ad.snapshot || {};
  const f = String(sn.displayFormat || '').toUpperCase();
  if(f === 'VIDEO' || (sn.videos || []).length) return 'video';
  if(f === 'CAROUSEL') return 'carousel';
  if(f === 'DCO' || f === 'DPA') return 'dynamic';
  return 'image';
}

const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));

/* Each check returns points out of a max, a status, the evidence line,
   and the Plaith service that answers it. */
export function scoreAds(items, now = Date.now()){
  const rows = (items || []).filter(r => r && (r.adArchiveId || r.adArchiveID || r.snapshot));
  const pageRow = (items || []).find(r => r && r.pageInfo && r.pageInfo.page) || {};
  const first = rows[0] || {};
  const sn0 = first.snapshot || {};
  const page = {
    name: first.pageName || sn0.pageName || (pageRow.pageInfo && pageRow.pageInfo.page.name) || null,
    id: first.pageId || first.pageID || sn0.pageId || (pageRow.pageInfo && pageRow.pageInfo.page.id) || null,
    likes: typeof sn0.pageLikeCount === 'number' ? sn0.pageLikeCount : null,
    avatar: sn0.pageProfilePictureUrl || null,
    category: (sn0.pageCategories || [])[0] || null
  };

  const n = rows.length;
  const capped = n >= MAX_ADS;
  const checks = [];

  /* 1. Activity: are they in the feed at all */
  {
    const pts = n === 0 ? 0 : n === 1 ? 8 : n <= 3 ? 13 : n <= 9 ? 17 : 20;
    checks.push({
      id:'activity', label:'Ads in market', max:20, pts,
      status: n === 0 ? 'bad' : n <= 3 ? 'warn' : 'good',
      metric: n === 0 ? 'None running' : (capped ? MAX_ADS + '+' : n) + ' active',
      detail: n === 0
        ? 'No active ads in the Meta Ad Library right now. Every day off the feed is a day a competitor gets those customers.'
        : n <= 3
          ? plural(n, 'active ad') + '. With this few, Meta has almost nothing to compare, so it can\'t find a winner for you.'
          : (capped ? MAX_ADS + ' or more' : n) + ' active ads. Enough volume for Meta to learn what works.',
      fix: n <= 3
        ? 'Your Plaith team launches new ads every week, so the account always has something fresh to test.'
        : 'Plaith keeps the winners running and replaces the rest weekly, so volume turns into results.',
      cta: { label:'See how the weekly cycle works', href:PLAITH.how }
    });
  }

  if(n === 0){
    return finish(page, checks, rows, capped, now, true);
  }

  const starts = rows.map(startMs).filter(Boolean);
  const ages = starts.map(t => Math.max(0, Math.round((now - t) / DAY)));
  const newest = ages.length ? Math.min.apply(null, ages) : null;
  const stale = ages.filter(a => a > 60).length;
  const staleShare = ages.length ? stale / ages.length : 0;

  /* 2. Freshness: how recently new creative went live, how much is tired */
  {
    const a = newest == null ? 99 : newest;
    let pts = a <= 7 ? 10 : a <= 14 ? 8 : a <= 30 ? 5 : a <= 60 ? 3 : 1;
    pts += staleShare <= .2 ? 10 : staleShare <= .5 ? 6 : 2;
    const tired = Math.round(staleShare * 100);
    checks.push({
      id:'freshness', label:'Creative freshness', max:20, pts,
      status: pts >= 16 ? 'good' : pts >= 9 ? 'warn' : 'bad',
      metric: newest == null ? 'Unknown' : 'Newest ' + (newest === 0 ? 'today' : plural(newest, 'day') + ' old'),
      detail: (newest == null ? 'Start dates weren\'t available. ' :
               'The newest ad went live ' + (newest === 0 ? 'today' : plural(newest, 'day') + ' ago') + '. ') +
              (stale ? tired + '% of active ads (' + stale + ') have run longer than 60 days, where audiences usually stop reacting and cost per result climbs.'
                     : 'Nothing has run longer than 60 days.'),
      fix: 'Every plan includes new AI videos each month (4, 12 or 40), so tired ads get replaced before they waste budget.',
      cta: { label:'Compare what each plan includes', href:PLAITH.plans }
    });
  }

  /* 3. Creative mix: video carries reach on Reels and Stories */
  const fm = { video:0, image:0, carousel:0, dynamic:0 };
  rows.forEach(r => { fm[formatOf(r)]++; });
  {
    let pts = 0;
    if(fm.video) pts += fm.video / n >= .25 ? 10 : 6;
    if(fm.image || fm.carousel) pts += 5;
    if(fm.dynamic || rows.some(r => (r.collationCount || 1) > 1)) pts += 5;
    const kinds = Object.keys(fm).filter(k => fm[k]);
    checks.push({
      id:'mix', label:'Creative mix', max:20, pts,
      status: pts >= 15 ? 'good' : pts >= 8 ? 'warn' : 'bad',
      metric: kinds.map(k => fm[k] + ' ' + k).join(', '),
      detail: fm.video
        ? Math.round(fm.video / n * 100) + '% of active ads are video. ' + (kinds.length > 1 ? 'Formats are mixed, which gives Meta more placements to use.' : 'Only one format is running, which narrows where Meta can show you.')
        : 'No video ads running. Reels and Stories favour video, so this account is missing the cheapest reach on Instagram.',
      fix: 'Plaith\'s team writes, shoots and edits AI videos for you, checked and labelled before they go live.',
      cta: { label:'See real Plaith ads', href:PLAITH.examples }
    });
  }

  /* 4. Testing depth: different angles, not one message on repeat */
  const msgs = new Set();
  rows.forEach(r => {
    const t = textOf(r);
    const key = (t.title + '|' + t.body.slice(0, 120)).toLowerCase().replace(/\s+/g, ' ').trim();
    if(key !== '|') msgs.add(key);
  });
  const hooks = new Set(rows.map(r => textOf(r).body.split(/[.!?\n]/)[0].toLowerCase().trim()).filter(Boolean));
  {
    const d = Math.max(msgs.size, hooks.size);
    const pts = d >= 4 ? 15 : d === 3 ? 11 : d === 2 ? 7 : 3;
    checks.push({
      id:'testing', label:'Message testing', max:15, pts,
      status: pts >= 11 ? 'good' : pts >= 7 ? 'warn' : 'bad',
      metric: plural(d, 'distinct angle'),
      detail: d <= 1
        ? 'Every active ad says essentially the same thing. Without different hooks there is nothing to learn from.'
        : plural(d, 'different message') + ' across ' + plural(n, 'ad') + (d < 4 ? '. More angles would show faster which one your customers answer to.' : '. Good spread for finding a winning hook.'),
      fix: 'Build, test, keep, replace, every week. Plaith tests hooks against each other and keeps only what wins.',
      cta: { label:'How Plaith tests your ads', href:PLAITH.how }
    });
  }

  /* 5. Placements */
  const plat = { FACEBOOK:0, INSTAGRAM:0, OTHER:0 };
  rows.forEach(r => (r.publisherPlatform || []).forEach(p => {
    if(p === 'FACEBOOK' || p === 'INSTAGRAM') plat[p]++; else plat.OTHER++;
  }));
  {
    const ig = plat.INSTAGRAM / n;
    let pts = (ig >= .5 ? 6 : ig > 0 ? 3 : 0) + (plat.FACEBOOK ? 2 : 0) + (plat.OTHER ? 2 : 0);
    checks.push({
      id:'placements', label:'Placements', max:10, pts,
      status: pts >= 8 ? 'good' : pts >= 5 ? 'warn' : 'bad',
      metric: Math.round(ig * 100) + '% on Instagram',
      detail: ig === 0
        ? 'None of the active ads run on Instagram. That leaves out a large share of people under 45.'
        : Math.round(ig * 100) + '% of ads reach Instagram' + (plat.OTHER ? ', and some also run on Messenger, Threads or the Audience Network.' : '.'),
      fix: 'Your Plaith team manages placements across Facebook and Instagram and watches the campaign around the clock.',
      cta: { label:'Book the technical onboarding', href:PLAITH.booking }
    });
  }

  /* 6. Conversion setup: CTA, landing page, tracking */
  {
    let cta = 0, off = 0, utm = 0, links = new Set();
    rows.forEach(r => {
      const s = r.snapshot || {};
      const c = (s.cards || [])[0] || {};
      const link = s.linkUrl || c.linkUrl || '';
      if((s.ctaType && s.ctaType !== 'NO_BUTTON') || s.ctaText) cta++;
      const host = link.replace(/^https?:\/\//, '').split(/[\/?#]/)[0].toLowerCase();
      if(link && !/(^|\.)(facebook\.com|fb\.com|fb\.me|instagram\.com|m\.me|wa\.me|whatsapp\.com)$/.test(host)){
        off++; links.add(link.split('?')[0]);
      }
      if(/[?&]utm_/i.test(link)) utm++;
    });
    let pts = (cta / n >= .8 ? 5 : cta ? 2 : 0) + (off / n >= .5 ? 5 : off ? 2 : 0) + (utm / n >= .5 ? 5 : utm ? 2 : 0);
    const gaps = [];
    if(cta / n < .8) gaps.push(plural(n - cta, 'ad') + ' without a button');
    if(off / n < .5) gaps.push('most ads don\'t send people to your website');
    if(utm / n < .5) gaps.push(Math.round((1 - utm / n) * 100) + '% of links carry no tracking tags');
    checks.push({
      id:'conversion', label:'Conversion and tracking', max:15, pts,
      status: pts >= 12 ? 'good' : pts >= 7 ? 'warn' : 'bad',
      metric: Math.round(utm / n * 100) + '% tracked',
      detail: gaps.length
        ? 'Gaps: ' + gaps.join('; ') + '. Without these you can\'t tell which ad actually brought a customer.'
        : 'Every ad has a button, a landing page and tracking tags. ' + plural(links.size, 'landing page') + ' in rotation.',
      fix: 'Plaith sets up the tracking, then shows every result in your dashboard and a weekly PDF report.',
      cta: { label:'Work out what a customer is worth', href:PLAITH.calculator }
    });
  }

  return finish(page, checks, rows, capped, now, false, { ages, fm, plat, newest, stale });
}

function finish(page, checks, rows, capped, now, empty, stats){
  const score = checks.reduce((a, c) => a + c.pts, 0);
  const max = empty ? 100 : checks.reduce((a, c) => a + c.max, 0);
  const total = Math.round(score / max * 100);
  const grade = empty ? 'Not running ads' : total >= 80 ? 'Strong' : total >= 60 ? 'Solid, with leaks' : total >= 40 ? 'Leaking budget' : 'Underpowered';
  const n = rows.length;

  /* Boost when the account works and needs more fuel; Save when budget is
     going into ads that have stopped working, or nothing is running at all. */
  const mode = !empty && total >= 60 ? 'boost' : 'save';
  const plan = empty || n <= 3 ? 'start' : n <= 15 ? 'growth' : 'scale';
  const planInfo = {
    start:  { name:'Start',  price:'$899 / month',   why:'1 managed campaign theme and up to 4 new AI videos a month: enough to get you back in the feed with ads that are tested, not guessed.' },
    growth: { name:'Growth', price:'$1,699 / month', why:'3 campaign themes at once and up to 12 new AI videos a month, matched to the volume you already run.' },
    scale:  { name:'Scale',  price:'$5,599 / month', why:'10 campaign themes, up to 40 new AI videos a month, a dedicated contact and a weekly strategy hour for an account your size.' }
  }[plan];

  const weakest = checks.slice().sort((a, b) => (a.pts / a.max) - (b.pts / b.max))[0];

  return {
    page, empty, capped,
    adsFound: n,
    score: total,
    grade, mode,
    checks,
    weakest: weakest ? weakest.id : null,
    plan: Object.assign({ id:plan, checkout:PLAITH.checkout[plan], details:PLAITH.plans }, planInfo),
    samples: rows.slice(0, 3).map(r => {
      const t = textOf(r), s = startMs(r);
      return {
        title: t.title || t.body.split('\n')[0].slice(0, 80) || 'Untitled ad',
        format: formatOf(r),
        days: s ? Math.max(0, Math.round((now - s) / DAY)) : null,
        thumb: thumbOf(r)
      };
    }),
    links: PLAITH,
    auditedAt: new Date(now).toISOString()
  };
}
