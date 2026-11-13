/* Signed audit results. /api/audit hands the browser its report as a token
   (compressed base64url JSON + HMAC). /api/lead only emails a PDF built from a token it
   can verify, so the form can't be used to send made-up reports to anyone.
   The key is derived from APIFY_TOKEN, so there's no extra secret to manage;
   AUDIT_SECRET overrides it if it's ever set. */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function key(){
  const base = process.env.AUDIT_SECRET || process.env.APIFY_TOKEN;
  if(!base) return null;
  return createHmac('sha256', 'elijah-rose/audit-report/v1').update(base).digest();
}

/* Only what the PDF and email need: the token travels in a URL (Sender
   fetches the PDF attachment from /api/report?t=...), so it's slimmed and
   compressed to stay around 2KB. */
function slim(d){
  return {
    page:{ name:(d.page && d.page.name) || null, id:(d.page && d.page.id) || null },
    empty:d.empty, capped:d.capped, adsFound:d.adsFound, score:d.score, grade:d.grade, mode:d.mode,
    weakest:d.weakest, auditedAt:d.auditedAt,
    checks:(d.checks || []).map(c => ({ id:c.id, label:c.label, max:c.max, pts:c.pts, status:c.status, metric:c.metric, detail:c.detail, fix:c.fix })),
    plan:d.plan ? { name:d.plan.name, price:d.plan.price, why:d.plan.why, checkout:d.plan.checkout } : null
  };
}

export function signReport(data){
  const k = key();
  if(!k) return null;
  const body = deflateRawSync(Buffer.from(JSON.stringify({ v:2, at:Date.now(), data:slim(data) }), 'utf8')).toString('base64url');
  const mac = createHmac('sha256', k).update(body).digest('base64url');
  return body + '.' + mac;
}

/* returns the report data, or null when the token is missing, forged or stale */
export function verifyReport(token){
  const k = key();
  if(!k || typeof token !== 'string' || token.length > 20000) return null;
  const dot = token.lastIndexOf('.');
  if(dot < 1) return null;
  const body = token.slice(0, dot), mac = token.slice(dot + 1);
  const want = createHmac('sha256', k).update(body).digest();
  let got;
  try{ got = Buffer.from(mac, 'base64url'); }catch(e){ return null; }
  if(got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try{
    const p = JSON.parse(inflateRawSync(Buffer.from(body, 'base64url'), { maxOutputLength:200000 }).toString('utf8'));
    if(p.v !== 2 || !p.data || Date.now() - p.at > MAX_AGE_MS) return null;
    return p.data;
  }catch(e){ return null; }
}
