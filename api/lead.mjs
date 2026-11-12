/* POST /api/lead  { email, handle, page, score, ads, grade, weakest, website }
   Saves a visitor who finished an audit as a HubSpot contact, so a warm
   lead doesn't leave with the report. Creates the contact, or updates it
   when the email already exists. Needs HUBSPOT_TOKEN (a private app token
   with crm.objects.contacts.read + write) in the Vercel project env. */

const HS = 'https://api.hubapi.com/crm/v3/objects/contacts';
const RATE = { windowMs: 60 * 60 * 1000, max: 5 };
const hits = new Map();

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers:{ 'content-type':'application/json', 'cache-control':'no-store' }
});

function limited(ip, now){
  const list = (hits.get(ip) || []).filter(t => now - t < RATE.windowMs);
  if(list.length >= RATE.max){ hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  if(hits.size > 5000) hits.clear();
  return false;
}

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const num = (v, lo, hi) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null; };

export async function POST(request){
  let b = {};
  try{ b = await request.json(); }catch(e){}

  /* honeypot: real visitors never see or fill this field */
  if(b.company_url) return json({ ok:true });

  const email = clip(b.email, 254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return json({ ok:false, message:'That email doesn\'t look right. Check it and try again.' }, 400);

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
  if(limited(ip, Date.now())) return json({ ok:false, message:'Already got it. I\'ll be in touch.' }, 429);

  const token = process.env.HUBSPOT_TOKEN;
  if(!token){
    console.error('[lead] HUBSPOT_TOKEN missing; lead not saved for', email);
    return json({ ok:false, message:'Couldn\'t save that right now. Message me on WhatsApp instead and I\'ll send the plan there.' }, 503);
  }

  const handle = clip(b.handle, 200);
  const page = clip(b.page, 120) || handle;
  const score = num(b.score, 0, 100);
  const ads = num(b.ads, 0, 999);
  const website = /^https:\/\/(www\.)?facebook\.com\//.test(b.website || '') ? clip(b.website, 300) : '';

  /* the score comes from the visitor's browser; it's context for the
     follow-up, so it's labelled as such and never trusted for anything else */
  const message = [
    'Meta ads audit on elijahrose site: wants the fix plan.',
    'Page: ' + page + (handle && handle !== page ? ' (' + handle + ')' : ''),
    score == null ? '' : 'Score: ' + score + '/100' + (b.grade ? ' (' + clip(b.grade, 40) + ')' : ''),
    ads == null ? '' : 'Active ads: ' + ads,
    b.weakest ? 'Weakest check: ' + clip(b.weakest, 60) : ''
  ].filter(Boolean).join('\n');

  const props = { email, message, lifecyclestage:'lead', hs_lead_status:'NEW' };
  if(website) props.website = website;

  const auth = { authorization:'Bearer ' + token, 'content-type':'application/json' };
  try{
    let r = await fetch(HS, { method:'POST', headers:auth, body:JSON.stringify({ properties:props }) });
    if(r.status === 409){
      /* existing contact: refresh the audit note, but never move an existing
         customer's lifecycle stage backwards to "lead" */
      const { lifecyclestage, hs_lead_status, ...update } = props;
      r = await fetch(HS + '/' + encodeURIComponent(email) + '?idProperty=email',
        { method:'PATCH', headers:auth, body:JSON.stringify({ properties:update }) });
    }
    if(!r.ok){
      console.error('[lead] hubspot', r.status, (await r.text()).slice(0, 300));
      throw new Error('hubspot ' + r.status);
    }
    return json({ ok:true });
  }catch(err){
    return json({ ok:false, message:'Couldn\'t save that right now. Message me on WhatsApp instead and I\'ll send the plan there.' }, 502);
  }
}

/* the report asks this before showing the form, so visitors never get a
   form that can't save until HUBSPOT_TOKEN is configured */
export function GET(){
  return json({ ready: !!process.env.HUBSPOT_TOKEN });
}
