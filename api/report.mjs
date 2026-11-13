/* GET /api/report?t=<signed token>
   Serves the audit PDF for a report /api/audit signed. Sender.net attaches
   files by fetching a public HTTPS URL, so this is the attachment URL in the
   report email, and also the "Download your PDF" link in its body.
   A forged, edited or week-old token gets a 404, never a PDF. */

import { verifyReport } from './_lib/sign.mjs';
import { buildReportPdf } from './_lib/report-pdf.mjs';

export async function GET(request){
  const t = new URL(request.url).searchParams.get('t');
  const d = verifyReport(t);
  if(!d) return new Response('This report link has expired. Run the audit again on the site.', {
    status:404, headers:{ 'content-type':'text/plain; charset=utf-8', 'cache-control':'no-store' }
  });
  try{
    const pdf = await buildReportPdf(d);
    const name = String((d.page && d.page.name) || 'report').replace(/[^\w .-]+/g, '').trim().slice(0, 60) || 'report';
    return new Response(pdf, { headers:{
      'content-type':'application/pdf',
      'content-disposition':'inline; filename="Meta ads audit - ' + name + '.pdf"',
      /* the token is the whole report, so the same URL always renders the same PDF */
      'cache-control':'public, max-age=86400, immutable',
      'x-robots-tag':'noindex'
    } });
  }catch(err){
    console.error('[report] pdf', err && err.message);
    return new Response('Couldn\'t build the PDF right now. Try again in a minute.', { status:500, headers:{ 'content-type':'text/plain; charset=utf-8' } });
  }
}
