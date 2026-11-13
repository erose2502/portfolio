/* POST /api/lead  { email, optin, token, handle, website }
   A visitor who finished an audit asks for it as a PDF:
   1. verify the signed report token from /api/audit (no token, no email:
      the form can't be used to send made-up reports to strangers)
   2. email it through Sender.net; Sender attaches the PDF by fetching
      /api/report?t=<token> from this site
   3. if they ticked the tips box, add them to a Sender subscriber group
   4. save them in HubSpot as a lead (when HUBSPOT_TOKEN is set)
   The report email is transactional (they asked for it); only the opt-in
   adds them to marketing. GET /api/lead tells the page if the form works.

   Env: SENDER_API_TOKEN, REPORT_FROM_EMAIL (on a domain verified in Sender),
        REPORT_FROM_NAME (optional, default "Elijah Rose"),
        SENDER_GROUP_ID (optional, group for opted-in subscribers),
        SITE_URL (optional, public origin for the PDF link; defaults to the request's),
        HUBSPOT_TOKEN (optional). */

import { verifyReport } from './_lib/sign.mjs';
import { summaryOf } from './_lib/report-pdf.mjs';

const HS = 'https://api.hubapi.com/crm/v3/objects/contacts';
const CAL = 'https://plaith.ai/elijahrose/booking';
const RATE = { windowMs: 60 * 60 * 1000, max: 5 };
const PER_EMAIL = { windowMs: 24 * 60 * 60 * 1000, max: 3 };
const hits = new Map(), sent = new Map();

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers:{ 'content-type':'application/json', 'cache-control':'no-store' }
});

function limited(map, k, rule, now){
  const list = (map.get(k) || []).filter(t => now - t < rule.windowMs);
  if(list.length >= rule.max){ map.set(k, list); return true; }
  list.push(now); map.set(k, list);
  if(map.size > 5000) map.clear();
  return false;
}

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const ready = () => !!(process.env.SENDER_API_TOKEN && process.env.REPORT_FROM_EMAIL);
const SENDER = 'https://api.sender.net/v2';
const senderHeaders = () => ({ authorization:'Bearer ' + process.env.SENDER_API_TOKEN, 'content-type':'application/json', accept:'application/json' });

const FAIL = 'Couldn\'t send that right now. Email me at elijah@kazi-orchestrate.com and I\'ll send the report there.';

export async function POST(request){
  let b = {};
  try{ b = await request.json(); }catch(e){}

  /* honeypot: real visitors never see or fill this field */
  if(b.company_url) return json({ ok:true });

  const email = clip(b.email, 254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return json({ ok:false, message:'That email doesn\'t look right. Check it and try again.' }, 400);

  const now = Date.now();
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
  if(limited(hits, ip, RATE, now) || limited(sent, email, PER_EMAIL, now)){
    return json({ ok:false, message:'That report is already on its way. Check your inbox (and spam folder).' }, 429);
  }

  const d = verifyReport(b.token);
  if(!d) return json({ ok:false, message:'This report has expired. Run the audit again and I\'ll send the fresh one.' }, 400);
  if(!ready()){
    console.error('[lead] email not configured; report not sent to', email);
    return json({ ok:false, message:FAIL }, 503);
  }

  const handle = clip(b.handle, 200);
  const name = clip((d.page && d.page.name) || handle || 'your page', 120);
  const optin = b.optin === true;
  const website = /^https:\/\/(www\.)?facebook\.com\//.test(b.website || '') ? clip(b.website, 300) : '';

  /* Sender fetches the attachment from this URL, so it must be public */
  const origin = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
  const pdfUrl = origin + '/api/report?t=' + encodeURIComponent(b.token);

  const [mail] = await Promise.allSettled([
    sendReport(email, name, d, pdfUrl, /^https:\/\//.test(origin) && !/localhost|127\.0\.0\.1/.test(origin)),
    optin && process.env.SENDER_GROUP_ID ? subscribe(email) : null,
    saveLead(email, name, handle, website, d, optin)
  ]);
  if(mail.status !== 'fulfilled'){
    console.error('[lead] sender', mail.reason && mail.reason.message);
    return json({ ok:false, message:FAIL }, 502);
  }
  return json({ ok:true });
}

/* the page asks this before showing the form */
export function GET(){
  return json({ ready: ready() });
}

async function sendReport(email, name, d, pdfUrl, canAttach){
  const weak = d.checks.slice().sort((a, b) => a.pts / a.max - b.pts / b.max).filter(c => c.status !== 'good').slice(0, 2);
  const summary = summaryOf(d, name);
  const subject = 'Your Meta ads audit: ' + name + ' scored ' + d.score + '/100';
  const fixes = weak.map(c =>
    '<tr><td style="padding:10px 0;border-top:1px solid #e6e6e2"><b style="color:#111">' + esc(c.label) + '</b> <span style="color:#888">' + esc(c.metric) + '</span><br>' +
    '<span style="color:#555">' + esc(c.fix) + '</span></td></tr>').join('');
  const html =
    '<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333;font-size:15px;line-height:1.55">' +
      '<p style="margin:0 0 4px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#1B3BFF;font-weight:700">Meta ads audit</p>' +
      '<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:28px;color:#111">' + esc(name) + ': ' + d.score + '/100</h1>' +
      '<p style="margin:0 0 16px">' + esc(d.grade) + '. ' + esc(summary) + '</p>' +
      (fixes ? '<p style="margin:20px 0 4px;font-weight:600;color:#111">Where I\'d start</p><table style="width:100%;border-collapse:collapse">' + fixes + '</table>' : '') +
      '<p style="margin:20px 0">The full report is attached as a PDF, with every check, what it found and how to fix it. ' +
        '<a href="' + esc(pdfUrl) + '" style="color:#1B3BFF">Download it here</a> if the attachment doesn\'t show.</p>' +
      '<p style="margin:0 0 24px"><a href="' + CAL + '" style="display:inline-block;background:#1B3BFF;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Book a free call to go through it</a></p>' +
      '<p style="margin:0;color:#555">Or just reply to this email.<br>Elijah Rose<br><span style="color:#888">AI Marketing Developer, Plaith partner</span></p>' +
      '<p style="margin:28px 0 0;font-size:11px;color:#999">You\'re getting this because you asked for your Meta ads audit report on my site. Scored from public Meta Ad Library data.</p>' +
    '</div>';
  const text = name + ' scored ' + d.score + '/100 (' + d.grade + ').\n\n' + summary + '\n\n' +
    (weak.length ? 'Where I\'d start:\n' + weak.map(c => '- ' + c.label + ' (' + c.metric + '): ' + c.fix).join('\n') + '\n\n' : '') +
    'The full report is attached as a PDF. Download it here: ' + pdfUrl + '\n\nBook a free call: ' + CAL + '\nOr just reply to this email.\n\nElijah Rose\nAI Marketing Developer, Plaith partner';

  const body = {
    from:{ email:process.env.REPORT_FROM_EMAIL, name:process.env.REPORT_FROM_NAME || 'Elijah Rose' },
    to:{ email },
    subject, html, text
  };
  /* attachments: filename -> public URL; Sender downloads it at send time.
     From localhost there's no public URL, so the email carries the link only. */
  if(canAttach) body.attachments = { ['Meta ads audit - ' + (name.replace(/[^\w .-]+/g, '').trim().slice(0, 60) || 'report') + '.pdf']: pdfUrl };
  const r = await fetch(SENDER + '/message/send', { method:'POST', headers:senderHeaders(), body:JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if(!r.ok || j.success === false) throw new Error('sender ' + r.status + ' ' + JSON.stringify(j).slice(0, 300));
}

/* tips opt-in: add to the Sender group (no automations fire unless the group has them) */
async function subscribe(email){
  const r = await fetch(SENDER + '/subscribers', {
    method:'POST', headers:senderHeaders(),
    body:JSON.stringify({ email, groups:[process.env.SENDER_GROUP_ID] })
  });
  if(!r.ok) console.error('[lead] sender subscribe', r.status, (await r.text()).slice(0, 300));
}

async function saveLead(email, name, handle, website, d, optin){
  const token = process.env.HUBSPOT_TOKEN;
  if(!token) return;
  const weakest = (d.checks.find(c => c.id === d.weakest) || {}).label;
  /* the report is verified (signed by /api/audit), so these numbers are ours */
  const message = [
    'Requested the Meta ads audit PDF on the portfolio site.',
    'Page: ' + name + (handle && handle !== name ? ' (' + handle + ')' : ''),
    'Score: ' + d.score + '/100 (' + d.grade + ')',
    'Active ads: ' + (d.capped ? d.adsFound + '+' : d.adsFound),
    weakest ? 'Weakest check: ' + weakest : '',
    'Marketing opt-in: ' + (optin ? 'YES, asked for Meta ads tips' : 'no, report only')
  ].filter(Boolean).join('\n');

  const props = { email, message, lifecyclestage:'lead', hs_lead_status:'NEW' };
  if(website) props.website = website;
  const auth = { authorization:'Bearer ' + token, 'content-type':'application/json' };
  let r = await fetch(HS, { method:'POST', headers:auth, body:JSON.stringify({ properties:props }) });
  if(r.status === 409){
    /* existing contact: refresh the note, never move their stage backwards */
    const { lifecyclestage, hs_lead_status, ...update } = props;
    r = await fetch(HS + '/' + encodeURIComponent(email) + '?idProperty=email',
      { method:'PATCH', headers:auth, body:JSON.stringify({ properties:update }) });
  }
  if(!r.ok) console.error('[lead] hubspot', r.status, (await r.text()).slice(0, 300));
}
