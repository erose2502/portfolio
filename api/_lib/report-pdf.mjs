/* Builds the emailed PDF version of a Meta ads audit with pdf-lib.
   Input is the verified report data from /api/audit (see sign.mjs).
   Standard fonts only (no font files to ship); text is reduced to the
   WinAnsi set those fonts can draw, so page names in other scripts or
   with emoji degrade to plain text instead of throwing. */

import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from 'pdf-lib';

const CAL = 'https://plaith.ai/elijahrose/booking';
const WA  = 'https://wa.me/12232401771';

const W = 612, H = 792, M = 48;           /* US Letter, 48pt margins */
const C = {
  ink:   rgb(0.07, 0.08, 0.10),
  ink2:  rgb(0.32, 0.33, 0.36),
  ink3:  rgb(0.55, 0.56, 0.58),
  hair:  rgb(0.88, 0.88, 0.86),
  band:  rgb(0.043, 0.051, 0.071),
  holo:  rgb(0.50, 0.91, 1.00),
  accent:rgb(0.106, 0.231, 1.00),
  good:  rgb(0.15, 0.68, 0.38),
  warn:  rgb(0.86, 0.58, 0.10),
  bad:   rgb(0.86, 0.33, 0.27),
  tint:  rgb(0.96, 0.96, 0.95),
  plan:  rgb(0.94, 0.95, 1.00)
};

function clean(s){
  return String(s == null ? '' : s)
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-').replace(/…/g, '...').replace(/·/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
    .replace(/[ \t]+/g, ' ').trim();
}

export const possessive = n => /s$/i.test(n) ? n + "'" : n + "'s";

const tone = st => st === 'good' ? C.good : st === 'warn' ? C.warn : C.bad;
const scoreTone = n => n >= 80 ? C.good : n >= 60 ? C.holo : n >= 40 ? C.warn : C.bad;

export function summaryOf(d, name){
  const by = d.checks.slice().sort((a, b) => a.pts / a.max - b.pts / b.max);
  const weak = by.filter(c => c.status !== 'good');
  const l = c => (c ? c.label : '').toLowerCase();
  if(d.empty) return name + ' has no ads running on Facebook or Instagram right now. Customers scrolling today see someone else.';
  if(d.score >= 80) return 'This account is well run. The upside now is scale: more budget behind what already works.';
  if(d.score >= 60) return 'The basics are in place, but ' + l(weak[0] || by[0]) + ' is costing you results.';
  if(d.score >= 40) return 'Budget is going out, but ' + l(by[0]) + ' and ' + l(by[1]) + ' are holding it back.';
  return 'Meta has too little to work with here. Fixing ' + l(by[0]) + ' comes first.';
}

export async function buildReportPdf(d, opts = {}){
  const doc = await PDFDocument.create();
  const name = clean((d.page && d.page.name) || opts.handle || 'your page');
  doc.setTitle('Meta ads audit - ' + name);
  doc.setAuthor('Elijah Rose');
  doc.setSubject('Meta Ad Library audit');
  doc.setCreator('Elijah Rose');

  const F  = await doc.embedFont(StandardFonts.Helvetica);
  const FB = await doc.embedFont(StandardFonts.HelveticaBold);
  const FS = await doc.embedFont(StandardFonts.TimesRoman);
  const FI = await doc.embedFont(StandardFonts.TimesRomanItalic);

  let page, y;
  const pages = [];

  function wrap(text, font, size, width){
    const out = [];
    for(const para of clean(text).split('\n')){
      let line = '';
      for(const w of para.split(' ')){
        const t = line ? line + ' ' + w : w;
        if(font.widthOfTextAtSize(t, size) <= width) line = t;
        else { if(line) out.push(line); line = w; }
      }
      out.push(line);
    }
    return out;
  }
  function text(str, x, yy, font, size, color = C.ink){
    page.drawText(clean(str), { x, y:yy, font, size, color });
  }
  function para(str, x, width, font, size, color = C.ink2, lead = 1.45){
    for(const ln of wrap(str, font, size, width)){
      need(size * lead);
      text(ln, x, y - size, font, size, color);
      y -= size * lead;
    }
  }
  function link(x, yy, w, h, url){
    const annot = doc.context.obj({
      Type:'Annot', Subtype:'Link', Rect:[x, yy, x + w, yy + h], Border:[0, 0, 0],
      A:{ Type:'Action', S:'URI', URI:PDFString.of(url) }
    });
    const ref = doc.context.register(annot);
    const annots = page.node.lookup(PDFName.of('Annots'));
    if(annots) annots.push(ref); else page.node.set(PDFName.of('Annots'), doc.context.obj([ref]));
  }
  function button(label, x, yy, url, fill = C.accent){
    const size = 10, w = FB.widthOfTextAtSize(clean(label), size) + 32, h = 28;
    page.drawRectangle({ x, y:yy, width:w, height:h, color:fill, borderRadius:14 });
    text(label, x + 16, yy + 9.5, FB, size, rgb(1, 1, 1));
    link(x, yy, w, h, url);
    return w;
  }
  function newPage(){
    page = doc.addPage([W, H]);
    pages.push(page);
    y = H - M;
  }
  function need(h){ if(y - h < M + 36) newPage(); }

  /* ── page 1 header band ── */
  newPage();
  page.drawRectangle({ x:0, y:H - 150, width:W, height:150, color:C.band });
  text('META ADS AUDIT', M, H - 52, FB, 9, C.holo);
  const title = wrap(name, FS, 30, W - 2 * M - 140);
  title.slice(0, 2).forEach((ln, i) => text(ln, M, H - 90 - i * 32, FS, 30, rgb(0.96, 0.95, 0.94)));
  const when = new Date(d.auditedAt || Date.now()).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  text('Audited ' + when + ' from the public Meta Ad Library', M, H - 134, F, 9, rgb(0.72, 0.72, 0.70));
  text('Elijah Rose', W - M - FB.widthOfTextAtSize('Elijah Rose', 11), H - 52, FB, 11, rgb(0.96, 0.95, 0.94));
  const role = 'AI Marketing Developer - Plaith partner';
  text(role, W - M - F.widthOfTextAtSize(role, 8.5), H - 66, F, 8.5, rgb(0.72, 0.72, 0.70));
  y = H - 150 - 36;

  /* ── score ring + summary ── */
  const cx = M + 62, cy = y - 62, r = 52, col = scoreTone(d.score);
  page.drawCircle({ x:cx, y:cy, size:r, borderColor:C.hair, borderWidth:9 });
  const pct = Math.max(0, Math.min(100, d.score)) / 100;
  if(pct > 0){
    /* arc from 12 o'clock clockwise, as an SVG path (pdf-lib's y is flipped there) */
    const a1 = -Math.PI / 2, a2 = a1 + pct * 2 * Math.PI - (pct >= 1 ? 0.0001 : 0);
    const p = (a) => [ (r * Math.cos(a)).toFixed(2), (r * Math.sin(a)).toFixed(2) ];
    const [x1, y1] = p(a1), [x2, y2] = p(a2);
    page.drawSvgPath(`M ${x1} ${y1} A ${r} ${r} 0 ${pct > .5 ? 1 : 0} 1 ${x2} ${y2}`,
      { x:cx, y:cy, borderColor:col, borderWidth:9, borderLineCap:1 });
  }
  const sTxt = String(d.score);
  text(sTxt, cx - FS.widthOfTextAtSize(sTxt, 40) / 2, cy - 8, FS, 40, C.ink);
  text('out of 100', cx - F.widthOfTextAtSize('out of 100', 8) / 2, cy - 22, F, 8, C.ink3);

  const sx = M + 150, sw = W - M - sx;
  y = y - 8;
  text(d.grade || '', sx, y - 20, FS, 22, C.ink); y -= 34;
  const facts = d.empty ? 'No active ads found' :
    (d.capped ? d.adsFound + '+' : d.adsFound) + (d.adsFound === 1 ? ' active ad' : ' active ads') + ' found - ' + (d.mode === 'boost' ? 'Boost mode' : 'Save mode');
  text(facts, sx, y - 10, FB, 9, C.ink3); y -= 22;
  para(summaryOf(d, name), sx, sw, F, 11, C.ink2);
  y = Math.min(y, cy - r - 30);

  /* ── checks ── */
  need(40);
  text('WHAT WE CHECKED', M, y - 10, FB, 9, C.ink3); y -= 22;
  page.drawLine({ start:{ x:M, y }, end:{ x:W - M, y }, thickness:.6, color:C.hair });
  for(const c of d.checks){
    need(110);
    y -= 18;
    page.drawCircle({ x:M + 4, y:y - 5, size:4, color:tone(c.status) });
    text(c.label, M + 16, y - 9, FB, 11.5, C.ink);
    const pts = c.pts + ' / ' + c.max;
    text(pts, W - M - FB.widthOfTextAtSize(pts, 10), y - 9, FB, 10, C.ink);
    const metric = clean(c.metric);
    text(metric, W - M - 70 - F.widthOfTextAtSize(metric, 9.5), y - 9, F, 9.5, C.ink3);
    y -= 18;
    page.drawRectangle({ x:M + 16, y:y - 3, width:W - 2 * M - 16, height:3, color:C.tint });
    page.drawRectangle({ x:M + 16, y:y - 3, width:(W - 2 * M - 16) * (c.pts / c.max), height:3, color:tone(c.status) });
    y -= 12;
    para(c.detail, M + 16, W - 2 * M - 16, F, 9.5, C.ink2, 1.5);
    if(c.fix){
      y -= 2;
      need(14);
      text('How Plaith fixes this', M + 16, y - 9, FB, 9, C.accent); y -= 13;
      para(c.fix, M + 16, W - 2 * M - 16, F, 9.5, C.ink2, 1.5);
    }
    y -= 8;
    page.drawLine({ start:{ x:M, y }, end:{ x:W - M, y }, thickness:.6, color:C.hair });
  }

  /* ── recommended plan ── */
  if(d.plan){
    const why = wrap(d.plan.why, F, 10, W - 2 * M - 40);
    const boxH = 118 + why.length * 15;
    need(boxH + 24);
    y -= 24;
    page.drawRectangle({ x:M, y:y - boxH, width:W - 2 * M, height:boxH, color:C.plan, borderColor:rgb(0.70, 0.75, 1), borderWidth:.8, borderRadius:12 });
    let yy = y - 26;
    text('RECOMMENDED FOR ' + name.toUpperCase().slice(0, 60), M + 20, yy, FB, 8.5, C.accent); yy -= 30;
    text(d.plan.name, M + 20, yy, FS, 24, C.ink);
    text(d.plan.price, W - M - 20 - FB.widthOfTextAtSize(clean(d.plan.price), 11), yy + 4, FB, 11, C.ink);
    yy -= 22;
    for(const ln of why){ text(ln, M + 20, yy, F, 10, C.ink2); yy -= 15; }
    text('Plus one-time setup of $1,699. Your ad budget goes to Meta directly. Cancel monthly.', M + 20, yy - 2, F, 8.5, C.ink3);
    yy -= 34;
    const bx = M + 20;
    const w1 = button('Start with ' + d.plan.name, bx, yy, /^https:\/\/buy\.stripe\.com\//.test(d.plan.checkout || '') ? d.plan.checkout : CAL);
    button('Book a free call', bx + w1 + 10, yy, CAL, C.ink);
    y -= boxH;
  }

  /* ── next step ── */
  need(90);
  y -= 30;
  text('Want me to walk you through it?', M, y - 16, FS, 18, C.ink); y -= 30;
  para('Reply to this email, book a free call, or message me on WhatsApp. I\'ll go through ' + possessive(name) + ' ads with you and show what I\'d change first.', M, W - 2 * M, F, 10.5, C.ink2);
  y -= 8;
  const bw = button('Book a free call', M, y - 28, CAL);
  button('Message on WhatsApp', M + bw + 10, y - 28, WA, C.good);
  y -= 40;

  /* ── footer on every page ── */
  const foot = 'Scored from public Meta Ad Library data. Spend, clicks and return on ad spend live inside your ad account. Plaith commits to the weekly process, never to specific results.';
  pages.forEach((pg, i) => {
    page = pg;
    const lines = wrap(foot, F, 7.5, W - 2 * M - 60);
    lines.forEach((ln, j) => text(ln, M, M - 4 - j * 10 + (lines.length - 1) * 10, F, 7.5, C.ink3));
    const n = (i + 1) + ' / ' + pages.length;
    text(n, W - M - F.widthOfTextAtSize(n, 7.5), M - 4 + (lines.length - 1) * 10, F, 7.5, C.ink3);
  });

  return Buffer.from(await doc.save());
}
