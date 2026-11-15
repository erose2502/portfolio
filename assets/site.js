/* Main page script, moved out of index.html so browsers cache it.
   Loaded with defer, after GSAP, so window.gsap is ready when it runs. */
(function(){
  'use strict';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s){ return document.querySelector(s); };

  /* ── theme toggle ── */
  var root = document.documentElement, tt = $('#themeToggle');
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function label(){
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    tt.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    tt.setAttribute('title', 'Switch to ' + next + ' mode');
  }
  label();
  tt.addEventListener('click', function(){
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try{ localStorage.setItem('er-theme', next); }catch(e){}
    label();
  });
  /* follow the OS while the visitor has not chosen for themselves */
  if(mq && mq.addEventListener){
    mq.addEventListener('change', function(ev){
      var saved = null;
      try{ saved = localStorage.getItem('er-theme'); }catch(e){}
      if(saved !== 'light' && saved !== 'dark'){
        root.setAttribute('data-theme', ev.matches ? 'dark' : 'light');
        label();
      }
    });
  }

  /* ══ Ad Library wall ══
     Decorative backdrop in the Meta Ad Library card layout. Every business,
     ad and Library ID is invented; nothing here depicts a real advertiser.
     Each column holds its cards twice so the drift loops without a seam. */
  (function adWall(){
    var host = $('#adLib');
    if(!host) return;
    var IC = {
      cut:'<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12M20 4 8.12 15.88M14.8 14.8 20 20"/><circle cx="6" cy="18" r="3"/>',
      pulse:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
      tool:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
      cup:'<path d="M10 2v2M14 2v2M6 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>',
      home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
      sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
      car:'<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
      heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
      fb:'<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
      ig:'<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/>'
    };
    var svg = function(k){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + IC[k] + '</svg>'; };
    var ADS = [
      ['Northside Barber Co.', 'Walk-ins welcome until 8pm. Fresh fade, hot towel, no wait on weekdays.', 'Look sharp by Friday', 'northsidebarber.co', 'Book now', 'cut', '#E0A458', '#3A2412', 'Image'],
      ['Lumen Yoga Studio', 'First class free. Small groups, real teachers, and a studio that actually stays warm.', 'Your first class is on us', 'lumenyoga.studio', 'Sign up', 'sun', '#9CC8B4', '#14332A', 'Video'],
      ['Brightwell Plumbing', 'Leak at 2am? We pick up. Flat-rate pricing before we start any job.', 'Same-day repairs', 'brightwellplumbing.com', 'Call now', 'tool', '#6FA8FF', '#122347', 'Image'],
      ['Copper Kettle Bakery', 'Sourdough out of the oven at 7. Pre-order and skip the Saturday line.', 'Warm bread, no line', 'copperkettle.bakery', 'Order now', 'cup', '#F2B880', '#3B2414', 'Carousel'],
      ['Tidewater Homes', 'Thinking of selling this spring? Get a free valuation in 48 hours.', 'What is your home worth?', 'tidewaterhomes.com', 'Learn more', 'home', '#7FD1E3', '#11303A', 'Video'],
      ['Fernbrook Auto Care', 'Brakes, oil, inspection. Book online and watch the work on video.', 'Honest repairs, on camera', 'fernbrookauto.com', 'Get quote', 'car', '#B7C4D6', '#1B2433', 'Image'],
      ['Moxie Strength Club', '6 weeks, 3 sessions a week, one coach who knows your name.', '6 weeks to stronger', 'moxiestrength.club', 'Sign up', 'pulse', '#FF8A6B', '#3A1710', 'Video'],
      ['Willow Lane Flowers', 'Same-day delivery across the city. Order by noon, delivered by six.', 'Flowers by six tonight', 'willowlaneflowers.com', 'Shop now', 'heart', '#F4A6C0', '#3A1626', 'Carousel'],
      ['Summit Roofing', 'Storm damage? Free inspection and we handle the insurance paperwork.', 'Free roof inspection', 'summitroofing.co', 'Learn more', 'home', '#FFC86B', '#3A2A0E', 'Image'],
      ['Saltline Coffee', 'New winter blend is in. Buy two bags, the third ships free.', 'Meet the winter blend', 'saltline.coffee', 'Shop now', 'cup', '#D9A47A', '#2E1C12', 'Video'],
      ['Harbor Smile Dental', 'New patients: exam, cleaning and X-rays for one price. Evenings available.', 'New patient special', 'harborsmile.dental', 'Book now', 'heart', '#8FD3FF', '#10304A', 'Image'],
      ['Ironleaf Landscaping', 'Spring cleanups are booking fast. Get on the calendar before March.', 'Spring slots are filling', 'ironleaf.land', 'Get quote', 'sun', '#A5D97F', '#1E3314', 'Carousel'],
      ['Velvet Room Salon', 'Colour correction specialists. Book a free 15-minute consult.', 'Fix the colour, keep the hair', 'velvetroom.salon', 'Book now', 'cut', '#C9A5FF', '#261A3F', 'Video'],
      ['Bluecrest Mortgage', 'Self-employed? We read your accounts the way lenders do.', 'Approved, even self-employed', 'bluecrestmortgage.com', 'Learn more', 'home', '#7FA8FF', '#121F42', 'Image'],
      ['Little Orbit Daycare', 'Two spots open for January. Tour this week and meet the team.', 'Two spots left for January', 'littleorbit.care', 'Learn more', 'heart', '#FFD27F', '#3A2C10', 'Image'],
      ['Pinecrest Physio', 'Back pain that won\'t quit? Assessment and plan in your first visit.', 'Move without the ache', 'pinecrestphysio.com', 'Book now', 'pulse', '#7FE3C1', '#10332A', 'Video']
    ];
    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var esc = function(v){ return String(v).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); };
    var seed = 7;
    var rnd = function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    function card(a){
      var d = new Date(Date.now() - (2 + Math.floor(rnd() * 80)) * 864e5);
      var id = String(1e15 + Math.floor(rnd() * 8.9e15)).slice(0, 16);
      var ar = a[8] === 'Video' ? '4/5' : a[8] === 'Carousel' ? '1' : '1.91/1';
      return '<div class="lc" style="--a:' + a[6] + ';--b:' + a[7] + ';--ar:' + ar + '">' +
        '<span class="lc__st"><i></i>Active</span>' +
        '<span class="lc__meta">Library ID: ' + id + '</span>' +
        '<span class="lc__meta">Started running on ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '</span>' +
        '<span class="lc__pf">' + svg('fb') + svg('ig') + '</span>' +
        '<div class="lc__rule"></div>' +
        '<div class="lc__h"><span class="lc__av"></span><span><b>' + esc(a[0]) + '</b><small>Sponsored</small></span></div>' +
        '<p class="lc__body">' + esc(a[1]) + '</p>' +
        '<div class="lc__cr"><em>' + a[8] + '</em>' + svg(a[5]) + '<span>' + esc(a[2]) + '</span></div>' +
        '<div class="lc__cta"><span><small>' + esc(a[3]) + '</small><b>' + esc(a[2]) + '</b></span><em>' + esc(a[4]) + '</em></div>' +
      '</div>';
    }

    var built = 0;
    function build(){
      var cols = Math.max(3, Math.ceil(window.innerWidth / 236) + 2);
      if(cols === built) return;
      built = cols; seed = 7;
      var html = '';
      for(var c = 0; c < cols; c++){
        var set = '';
        for(var k = 0; k < 5; k++) set += card(ADS[(c * 5 + k * 3) % ADS.length]);
        html += '<div class="lib__col" style="--dur:' + (80 + (c * 17) % 50) + 's;margin-top:' + (-((c * 97) % 260)) + 'px">' + set + set + '</div>';
      }
      host.innerHTML = html;
    }
    build();
    var rt = 0;
    addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(build, 200); }, { passive:true });

    /* pause the drift while the hero is off screen */
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        host.style.setProperty('--play', es[0].isIntersecting ? 'running' : 'paused');
      }).observe(host);
    }
  })();

  /* ══ Meta ads audit ══
     The form posts to /api/audit, which runs a live Ad Library pull and
     streams NDJSON events. Steps light up as the server reports them; the
     report is built from the scored result. All server text goes in through
     esc() and every link is checked against the hosts we expect. */
  (function metaAudit(){
    var form = $('#aud'), input = $('#audIn'), go = $('#audGo'), err = $('#audErr');
    var panel = $('#audR'), runList = $('#audRun'), rep = $('#audRep'), title = $('#audRT');
    var plate = $('#plate');
    if(!form || !panel) return;

    var STEPS = [
      { id:'resolve',    t:'Find the page',           st:0 },
      { id:'library',    t:'Pull live ads from Meta' },
      { id:'freshness',  t:'Creative freshness',      st:2 },
      { id:'mix',        t:'Creative mix',            st:2 },
      { id:'testing',    t:'Message testing',         st:3 },
      { id:'placements', t:'Placements',              st:3 },
      { id:'conversion', t:'Conversion and tracking' },
      { id:'score',      t:'Score out of 100',        st:5 }
    ];
    var P = 'https://plaith.ai/elijahrose';
    /* Icons are the exact SVGs react-icons ships (Phosphor, Bold weight).
       [viewBox, inner SVG]. */
    var I = {
      check:['0 0 256 256','<path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"></path>']  /* PiCheckBold */,
      arrow:['0 0 256 256','<path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>']  /* PiArrowRightBold */,
      down:['0 0 256 256','<path d="M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z"></path>']  /* PiCaretDownBold */,
      spark:['0 0 256 256','<path d="M199,125.31l-49.88-18.39L130.69,57a19.92,19.92,0,0,0-37.38,0L74.92,106.92,25,125.31a19.92,19.92,0,0,0,0,37.38l49.88,18.39L93.31,231a19.92,19.92,0,0,0,37.38,0l18.39-49.88L199,162.69a19.92,19.92,0,0,0,0-37.38Zm-63.38,35.16a12,12,0,0,0-7.11,7.11L112,212.28l-16.47-44.7a12,12,0,0,0-7.11-7.11L43.72,144l44.7-16.47a12,12,0,0,0,7.11-7.11L112,75.72l16.47,44.7a12,12,0,0,0,7.11,7.11L180.28,144ZM140,40a12,12,0,0,1,12-12h12V16a12,12,0,0,1,24,0V28h12a12,12,0,0,1,0,24H188V64a12,12,0,0,1-24,0V52H152A12,12,0,0,1,140,40ZM252,88a12,12,0,0,1-12,12h-4v4a12,12,0,0,1-24,0v-4h-4a12,12,0,0,1,0-24h4V72a12,12,0,0,1,24,0v4h4A12,12,0,0,1,252,88Z"></path>']  /* PiSparkleBold */,
      up:['0 0 256 256','<path d="M244,56v64a12,12,0,0,1-24,0V85l-75.51,75.52a12,12,0,0,1-17,0L96,129,32.49,192.49a12,12,0,0,1-17-17l72-72a12,12,0,0,1,17,0L136,135l67-67H168a12,12,0,0,1,0-24h64A12,12,0,0,1,244,56Z"></path>']  /* PiTrendUpBold */,
      save:['0 0 256 256','<path d="M244,128v64a12,12,0,0,1-12,12H168a12,12,0,0,1,0-24h35l-67-67-31.51,31.52a12,12,0,0,1-17,0l-72-72a12,12,0,0,1,17-17L96,119l31.51-31.52a12,12,0,0,1,17,0L220,163V128a12,12,0,0,1,24,0Z"></path>']  /* PiTrendDownBold */,
      again:['0 0 256 256','<path d="M228,128a100,100,0,0,1-98.66,100H128a99.39,99.39,0,0,1-68.62-27.29,12,12,0,0,1,16.48-17.45,76,76,0,1,0-1.57-109c-.13.13-.25.25-.39.37L54.89,92H72a12,12,0,0,1,0,24H24a12,12,0,0,1-12-12V56a12,12,0,0,1,24,0V76.72L57.48,57.06A100,100,0,0,1,228,128Z"></path>']  /* PiArrowCounterClockwiseBold */,
      mail:['0 0 256 256','<path d="M224,44H32A12,12,0,0,0,20,56V192a20,20,0,0,0,20,20H216a20,20,0,0,0,20-20V56A12,12,0,0,0,224,44ZM193.15,68,128,127.72,62.85,68ZM44,188V83.28l75.89,69.57a12,12,0,0,0,16.22,0L212,83.28V188Z"></path>']  /* PiEnvelopeSimpleBold */,
      card:['0 0 256 256','<path d="M224,44H32A20,20,0,0,0,12,64V192a20,20,0,0,0,20,20H224a20,20,0,0,0,20-20V64A20,20,0,0,0,224,44Zm-4,24V88H36V68ZM36,188V112H220v76Zm172-24a12,12,0,0,1-12,12H164a12,12,0,0,1,0-24h32A12,12,0,0,1,208,164Zm-68,0a12,12,0,0,1-12,12H116a12,12,0,0,1,0-24h12A12,12,0,0,1,140,164Z"></path>']  /* PiCreditCardBold */,
      cols:['0 0 256 256','<path d="M243.14,131.54l-32-80h0a12,12,0,0,0-13.73-7.25L140,57V40a12,12,0,0,0-24,0V62.37L53.4,76.29a12,12,0,0,0-8.54,7.25h0l0,0v0l-32,79.92A12,12,0,0,0,12,168c0,12.13,6.2,22.43,17.45,29A55,55,0,0,0,56,204a55,55,0,0,0,26.55-7C93.8,190.43,100,180.13,100,168a12,12,0,0,0-.86-4.46L72.38,96.65,116,87V204H104a12,12,0,0,0,0,24h48a12,12,0,0,0,0-24H140V81.63l40.42-9-23.56,58.9A12,12,0,0,0,156,136c0,12.13,6.2,22.43,17.45,29a53.78,53.78,0,0,0,53.1,0C237.8,158.43,244,148.13,244,136A12,12,0,0,0,243.14,131.54ZM56,180c-3.71,0-18-1.87-19.81-10.18L56,120.31l19.81,49.51C74,178.13,59.71,180,56,180Zm144-32c-3.71,0-18-1.87-19.81-10.18L200,88.31l19.81,49.51C218,146.13,203.71,148,200,148Z"></path>']  /* PiScalesBold */,
      out:['0 0 256 256','<path d="M204,64V168a12,12,0,0,1-24,0V93L72.49,200.49a12,12,0,0,1-17-17L163,76H88a12,12,0,0,1,0-24H192A12,12,0,0,1,204,64Z"></path>']  /* PiArrowUpRightBold */
    };
    /* plan card actions: icon | label | arrow on one grid, so all three
       buttons share the same icon column, label centre and arrow column */
    function planBtn(href, icon, label, cls){
      var mail = /^mailto:/.test(href);
      return '<a class="' + cls + ' plan__b" href="' + esc(safe(href)) + '"' + (mail ? '' : ' target="_blank" rel="noopener"') + '>' +
        ic(icon, 'plan__bi') + '<span>' + label + '</span>' + ic('out', 'plan__bo') + '</a>';
    }
    function ic(k, cls){
      var i = I[k];
      return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="' + i[0] + '" fill="currentColor" aria-hidden="true" focusable="false">' + i[1] + '</svg>';
    }
    function esc(v){
      return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
      });
    }
    function safe(u){
      return /^(https:\/\/(plaith\.ai\/|buy\.stripe\.com\/)|mailto:elijah@kazi-orchestrate\.com\?)/.test(u || '') ? plaithLoc(u) : plaithLoc(P);
    }
    function img(u){ return /^https:\/\/[\w.-]+\.fbcdn\.net\//.test(u || '') ? u : ''; }
    function ext(href, label, cls, icon){
      return '<a class="' + cls + '" href="' + esc(safe(href)) + '" target="_blank" rel="noopener">' +
        label + (icon === false ? '' : ic('arrow')) + '</a>';
    }

    var ctrl = null, busy = false, lastToken = null;

    function showErr(msg){
      err.innerHTML = esc(msg) + ' <a href="mailto:elijah@kazi-orchestrate.com?subject=' + encodeURIComponent('Meta ads audit') + '">Email Elijah</a>';
      err.hidden = false;
    }

    /* ── live scan console ──
       Progress is honest about what it knows: the page lookup and each
       scoring check are real milestones; during the long Ad Library pull
       (20-60s) it eases toward 70% on a time curve and never passes it
       until Meta actually answers. */
    var FACTS = [
      ['meta', 'Every active ad on Facebook and Instagram is public in Meta\'s Ad Library. That\'s exactly what this audit is reading right now.'],
      ['plaith', 'Plaith launches new ads every week, keeps the winners running and replaces the rest.'],
      ['meta', 'Meta\'s auction doesn\'t just pick the highest bid. It also weighs how likely people are to act on the ad and how good it is.'],
      ['plaith', 'Every Plaith plan includes new AI videos each month: 4, 12 or 40, depending on the plan.'],
      ['meta', 'Reels and Stories fill the whole phone screen, so vertical 9:16 video gets the most room to work.'],
      ['plaith', 'With Plaith, the ad account and payment method stay yours. You only grant partner access.'],
      ['meta', 'Show the same ad to the same people long enough and results slide. Marketers call it creative fatigue.'],
      ['plaith', 'Every Plaith ad is checked by a person and labelled as made with AI before it goes live.'],
      ['meta', 'Spend, clicks and return on ad spend aren\'t public. Only your ad account shows those, which is why this audit scores what is.'],
      ['plaith', 'Your ad budget goes to Meta directly, not to Plaith, and plans cancel monthly.'],
      ['meta', 'Meta can test several versions of an ad at once and move budget toward whichever one performs.'],
      ['plaith', 'Plaith\'s Growth Hack: pay $5,000 once and $12,000 goes to your ads over 24 months.']
    ];
    var WEIGHT = { resolve:8, library:70, freshness:76, mix:82, testing:87, placements:92, conversion:96, score:100 };
    var scan = $('#audScan'), scanArc = $('#scanArc'), scanPct = $('#scanPct'), scanTime = $('#scanTime'),
        scanNow = $('#scanNow'), scanAds = $('#scanAds'), factEl = $('#scanFact');
    var ARC = 552.9, sc = { pct:0, shown:0, t0:0, libT0:0, raf:0, factI:0, factT:0 };

    var lastSent = '';
    function tellDock(){
      var msg = Math.round(sc.shown) + '|' + scanNow.textContent;
      if(msg === lastSent) return;
      lastSent = msg;
      document.dispatchEvent(new CustomEvent('audit:progress', { detail:{ pct:Math.round(sc.shown), note:scanNow.textContent } }));
    }
    function setNow(t){
      if(!t || scanNow.textContent === t) return;
      scanNow.textContent = t;
      scanNow.classList.remove('is-swap'); void scanNow.offsetWidth; scanNow.classList.add('is-swap');
    }
    function showFact(){
      var f = FACTS[sc.factI++ % FACTS.length];
      factEl.setAttribute('data-src', f[0]);
      $('#factK').textContent = f[0] === 'plaith' ? 'About Plaith' : 'Meta ads fact';
      $('#factT').textContent = f[1];
      factEl.classList.remove('is-swap'); void factEl.offsetWidth; factEl.classList.add('is-swap');
    }
    function scanTick(now){
      var secs = Math.floor((now - sc.t0) / 1000);
      scanTime.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0') + ' · usually under 90s';
      /* during the library pull, ease from 8% toward 68% (time constant ~22s) */
      var target = sc.pct;
      if(sc.libT0 && sc.pct < WEIGHT.library) target = Math.max(sc.pct, 8 + 60 * (1 - Math.exp(-(now - sc.libT0) / 22000)));
      sc.shown += (target - sc.shown) * (RM ? 1 : .08);
      scanArc.style.strokeDashoffset = (ARC * (1 - sc.shown / 100)).toFixed(1);
      scanPct.textContent = Math.round(sc.shown) + '%';
      tellDock();
      sc.raf = requestAnimationFrame(scanTick);
    }
    function scanStart(){
      scanStop();
      sc.pct = 0; sc.shown = 0; sc.libT0 = 0; sc.t0 = performance.now();
      sc.factI = Math.floor(Math.random() * FACTS.length);
      scan.classList.remove('is-found', 'is-none');
      scanAds.textContent = 'Looking for active ads';
      setNow('Finding the page');
      showFact();
      sc.factT = setInterval(showFact, 6500);
      sc.raf = requestAnimationFrame(scanTick);
    }
    function scanStop(){ cancelAnimationFrame(sc.raf); clearInterval(sc.factT); }
    function countAds(n){
      var from = 0, t0 = performance.now(), dur = RM ? 0 : 900;
      scan.classList.add(n > 0 ? 'is-found' : 'is-none');
      (function step(now){
        var k = dur ? Math.min(1, (now - t0) / dur) : 1;
        scanAds.textContent = Math.round(from + (n - from) * (1 - Math.pow(1 - k, 3))) + (n === 1 ? ' active ad found' : ' active ads found');
        if(k < 1) requestAnimationFrame(step);
      })(t0);
    }

    function paintSteps(){
      runList.innerHTML = STEPS.map(function(s){
        return '<li data-step="' + s.id + '" data-s="idle"><span class="run__i">' + ic('check') + '</span>' +
               '<span class="run__t"><b>' + esc(s.t) + '</b><small></small></span></li>';
      }).join('');
      scanStart();
    }
    function setStep(id, state, note){
      var li = runList.querySelector('[data-step="' + id + '"]');
      if(!li) return;
      li.setAttribute('data-s', state);
      var small = li.querySelector('small');
      if(state === 'done' && note) small.textContent = note;
      else if(state === 'run') small.textContent = '';

      if(id === 'library' && state === 'run'){
        if(!sc.libT0) sc.libT0 = performance.now();
        setNow(note && note !== 'Working' ? note : 'Reading Meta\'s Ad Library');
      }
      if(state === 'done' && WEIGHT[id]) sc.pct = Math.max(sc.pct, WEIGHT[id]);
      if(id === 'library' && state === 'done'){
        var m = /(\d+)\+? active ad/.exec(note || '');
        if(m) countAds(+m[1]);
        else if(/No active ads/i.test(note || '')) countAds(0);
      }
      if(state === 'run' && id !== 'library'){
        var s = STEPS.filter(function(x){ return x.id === id; })[0];
        if(s) setNow((id === 'resolve' ? '' : 'Checking ') + s.t.toLowerCase().replace(/^find/, 'Finding'));
      }
      if(id === 'score' && state === 'done'){ setNow('Done. Building your report'); }
    }

    function scoreBand(n){ return n >= 80 ? '80-100' : n >= 60 ? '60-79' : n >= 40 ? '40-59' : '0-39'; }

    /* hero timeline follows the real audit: 1 page, 2 pulling ads, 3 scoring, 4 results */
    var tl = $('#audTl'), SCORING = /^(freshness|mix|testing|placements|conversion|score)$/;
    function tlAt(n){
      if(!tl) return;
      tl.setAttribute('data-at', n);
      [].forEach.call(tl.children, function(li, i){
        var k = i + 1, done = k < n || n === 4, now = !done && k === n;
        li.classList.toggle('is-done', done);
        li.classList.toggle('is-now', now);
        if(now) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
    }

    function scrollTo(el){ goTo(el); }
    function refreshST(){ if(window.ScrollTrigger) setTimeout(function(){ window.ScrollTrigger.refresh(); }, 60); }

    function reset(){
      scanStop();
      if(ctrl){ ctrl.abort(); ctrl = null; }
      busy = false; go.disabled = false;
      panel.hidden = true; panel.classList.remove('is-done');
      plate.classList.remove('is-audit');
      tlAt(1);
      document.dispatchEvent(new CustomEvent('audit:reset'));
      refreshST();
      scrollTo(plate);
      input.focus({ preventScroll:true });
      input.select();
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(busy) return;
      var handle = input.value.trim();
      err.hidden = true;
      if(!handle){ showErr('Type your Facebook page name first.'); input.focus(); return; }
      run(handle);
    });

    /* Deep link: /?audit=pkgreen fills the box and runs the audit, so an
       outreach email can say "I ran your Meta ads audit, here it is".
       The param is dropped from the address bar so a reload doesn't
       start a second (paid) run. */
    (function(){
      var q = null;
      try{ q = new URLSearchParams(location.search).get('audit'); }catch(x){}
      q = String(q || '').trim().slice(0, 200);
      if(!q || !/^[\w.@\/:%-]+$/.test(q)) return;
      input.value = q;
      try{
        var u = new URL(location.href);
        u.searchParams.delete('audit');
        history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      }catch(x){}
      track('Audit deep link');
      setTimeout(function(){ if(!busy) run(q); }, 900);
    })();

    function run(handle){
      busy = true; go.disabled = true;
      tlAt(2);
      document.dispatchEvent(new CustomEvent('audit:start', { detail:{ name:handle.replace(/^https?:\/\/(www\.)?(facebook|fb)\.com\//i, '').replace(/\/.*$/, '').slice(0, 40) } }));
      track('Audit started');
      paintSteps();
      rep.innerHTML = '';
      title.textContent = 'Auditing ' + handle.replace(/^https?:\/\/(www\.)?/, '');
      panel.classList.remove('is-done');
      panel.hidden = false;
      plate.classList.add('is-audit');
      refreshST();
      scrollTo(panel);

      ctrl = 'AbortController' in window ? new AbortController() : null;
      var gotResult = false;

      fetch('/api/audit', {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body:JSON.stringify({ handle:handle }),
        signal:ctrl ? ctrl.signal : undefined
      }).then(function(res){
        var type = res.headers.get('content-type') || '';
        if(!res.ok || type.indexOf('ndjson') < 0){
          return res.json().catch(function(){ return {}; }).then(function(j){
            fail(j.message || 'The audit service is unavailable right now.');
          });
        }
        if(!res.body || !res.body.getReader){
          return res.text().then(function(t){ t.split('\n').forEach(handleLine); });
        }
        var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
        return (function pump(){
          return reader.read().then(function(r){
            if(r.done){ if(buf) handleLine(buf); return; }
            buf += dec.decode(r.value, { stream:true });
            var lines = buf.split('\n');
            buf = lines.pop();
            lines.forEach(handleLine);
            return pump();
          });
        })();
      }).then(function(){
        if(busy && !gotResult) fail('The audit stopped before it finished. Try once more.');
      }).catch(function(e){
        if(e && e.name === 'AbortError') return;
        fail('Couldn\'t reach the audit service. Check your connection and try again.');
      });

      function handleLine(line){
        if(!line.trim()) return;
        var ev;
        try{ ev = JSON.parse(line); }catch(x){ return; }
        if(ev.type === 'step'){
          setStep(ev.id, ev.state, ev.note);
          if(SCORING.test(ev.id)) tlAt(3);
        }
        else if(ev.type === 'error') fail(ev.message);
        else if(ev.type === 'result'){ gotResult = true; lastToken = ev.token || null; done(ev.data); }
      }
    }

    function fail(msg){
      if(!busy) return;
      scanStop();
      document.dispatchEvent(new CustomEvent('audit:reset'));
      busy = false; go.disabled = false; ctrl = null;
      tlAt(1);
      track('Audit failed');
      panel.hidden = true;
      plate.classList.remove('is-audit');
      refreshST();
      showErr(msg);
      scrollTo(plate);
      input.focus({ preventScroll:true });
    }

    function color(score){
      return score >= 80 ? 'var(--good)' : score >= 60 ? 'var(--holo)' : score >= 40 ? 'var(--warn)' : 'var(--bad)';
    }

    function done(d){
      scanStop();
      busy = false; go.disabled = false; ctrl = null;
      tlAt(4);
      setTimeout(function(){
        document.dispatchEvent(new CustomEvent('audit:done', { detail:{ score:d.score, lead:!!document.getElementById('audLead') } }));
      }, 600);
      track('Audit finished', { score:scoreBand(d.score), ads:d.empty ? 'none' : d.adsFound >= 10 ? '10+' : '1-9' });
      var L = d.links || {};
      var name = d.page.name || input.value.trim();
      var byPct = d.checks.slice().sort(function(a, b){ return a.pts / a.max - b.pts / b.max; });
      var weak = byPct.filter(function(c){ return c.status !== 'good'; });
      var sc = color(d.score);

      var summary = d.empty
        ? esc(name) + ' has no ads running on Facebook or Instagram right now. Customers scrolling today see someone else.'
        : d.score >= 80 ? 'This account is well run. The upside now is scale: more budget behind what already works.'
        : d.score >= 60 ? 'The basics are in place, but ' + esc((weak[0] || byPct[0]).label.toLowerCase()) + ' is costing you results.'
        : d.score >= 40 ? 'Budget is going out, but ' + esc(byPct[0].label.toLowerCase()) + ' and ' + esc(byPct[1].label.toLowerCase()) + ' are holding it back.'
        : 'Meta has too little to work with here. Fixing ' + esc(byPct[0].label.toLowerCase()) + ' comes first.';

      var C = 2 * Math.PI * 88;
      var h = '';

      h += '<div class="rep__top">' +
        (img(d.page.avatar) ? '<img class="rep__av" src="' + esc(img(d.page.avatar)) + '" alt="" width="44" height="44" referrerpolicy="no-referrer" onerror="this.remove()">' : '') +
        '<div class="rep__who"><b>' + esc(name) + '</b><small>' +
          (d.empty ? 'No active ads' : (d.capped ? '40+' : d.adsFound) + ' active ad' + (d.adsFound === 1 ? '' : 's')) +
          ' &middot; audited ' + esc(new Date(d.auditedAt).toLocaleString([], { dateStyle:'medium', timeStyle:'short' })) +
        '</small></div>' +
        '<button class="rep__again" type="button" data-again>' + ic('again') + 'Audit another page</button>' +
      '</div>';

      h += '<div class="rep__grid">';
      h += '<div class="score" style="--sc:' + sc + '">' +
        '<div class="score__ring"><svg viewBox="0 0 200 200" aria-hidden="true">' +
          '<circle class="score__track" cx="100" cy="100" r="88"/>' +
          '<circle class="score__arc" cx="100" cy="100" r="88" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '" data-to="' + (C * (1 - d.score / 100)).toFixed(1) + '"/>' +
        '</svg><div class="score__num"><b data-count="' + d.score + '">' + (RM ? d.score : 0) + '</b><small>out of 100</small></div></div>' +
        '<p class="score__grade">' + esc(d.grade) + '</p>' +
        '<span class="score__mode">' + (d.mode === 'boost' ? ic('up') + 'Boost mode' : ic('save') + 'Save mode') + '</span>' +
        '<p class="score__sum">' + summary + '</p>' +
      '</div>';

      /* checks: a row of compact tiles (tabs) and one detail panel below
         them, so the score and all six results fit on one screen */
      var tiles = '', panels = '';
      d.checks.forEach(function(c, i){
        var st = c.status === 'good' ? 'var(--good)' : c.status === 'warn' ? 'var(--warn)' : 'var(--bad)';
        var open = c.id === d.weakest;
        tiles += '<li class="chk__i' + (open ? ' is-open' : '') + '" style="--st:' + st + '">' +
          '<button class="chk__b" type="button" role="tab" id="chk-t-' + i + '" aria-selected="' + open + '" aria-controls="chk-' + i + '"' + (open ? '' : ' tabindex="-1"') + '>' +
            '<span class="chk__top"><span class="chk__dot" aria-hidden="true"></span><b>' + esc(c.label) + '</b></span>' +
            '<span class="chk__m">' + esc(c.metric) + '</span>' +
            '<span class="chk__bar" aria-hidden="true"><i data-w="' + Math.round(c.pts / c.max * 100) + '"></i></span>' +
            '<em class="chk__pts">' + c.pts + ' / ' + c.max + ' points</em>' +
          '</button>' +
        '</li>';
        panels += '<div class="chk__p" role="tabpanel" id="chk-' + i + '" aria-labelledby="chk-t-' + i + '" style="--st:' + st + '"' + (open ? '' : ' hidden') + '>' +
          '<p class="chk__ph"><span class="chk__dot" aria-hidden="true"></span><b>' + esc(c.label) + '</b><span>' + esc(c.metric) + ' &middot; ' + c.pts + ' / ' + c.max + ' points</span></p>' +
          '<p>' + esc(c.detail) + '</p>' +
          '<div class="chk__row">' +
            '<div class="chk__fix">' + ic('spark') + '<span><b>How Plaith fixes this.</b> ' + esc(c.fix) + '</span></div>' +
            ext(c.cta && c.cta.href, esc(c.cta ? c.cta.label : 'See how Plaith works'), 'lnk') +
          '</div>' +
        '</div>';
      });
      h += '<div class="chkw"><ol class="chk" role="tablist" aria-label="What was checked">' + tiles + '</ol>' +
           '<div class="chk__panels">' + panels + '</div></div>';
      h += '</div>';

      var weakLabel = (weak[0] || byPct[0] || {}).label || '';
      h += '<form class="lead" id="audLead" novalidate' +
          ' data-score="' + d.score + '" data-ads="' + d.adsFound + '" data-grade="' + esc(d.grade || '') + '"' +
          ' data-weakest="' + esc(weakLabel) + '" data-page="' + esc(name) + '">' +
        '<div><span class="lead__k">Your report as a PDF</span>' +
          '<p class="lead__h">Get this report in your inbox</p>' +
          '<p class="lead__p">Every check, what it found' + (d.empty ? '' : ' (starting with ' + esc(weakLabel.toLowerCase()) + ')') + ' and how to fix it. Keep it, or forward it to whoever runs your ads.</p></div>' +
        '<div class="lead__f">' +
          '<label class="sr" for="leadEmail">Your email</label>' +
          '<input id="leadEmail" name="email" type="email" autocomplete="email" placeholder="you@business.com" required maxlength="254">' +
          '<span class="lead__hp" aria-hidden="true"><input name="company_url" tabindex="-1" autocomplete="off"></span>' +
          '<button class="btn btn--sig" type="submit">Email me the PDF</button>' +
          '<label class="lead__opt"><input type="checkbox" name="optin"><span>Also send me occasional Meta ads tips. Unsubscribe anytime.</span></label>' +
          '<p class="lead__msg" role="status" aria-live="polite"></p>' +
        '</div>' +
      '</form>';

      /* boost / save: both are always available, the score picks which opens */
      var boostList = [
        'Keep the winners running and get fresh variations of them every week, so good ads don\'t burn out.',
        'Growth Hack: pay in $5,000 once and $12,000 goes to your ads over 24 months, $500 a month straight to Meta.',
        'Run more campaign themes at the same time on the ' + esc(d.plan.name) + ' plan, each with its own tested creative.'
      ];
      var saveList = d.empty
        ? [ 'You connect: give partner access to your ad account. The account and payment method stay yours.',
            'Your team builds: videos, images and copy, checked and labelled as made with AI.',
            'Test and keep: what works stays, the rest is replaced. Every week.' ]
        : (weak.length ? weak : byPct).slice(0, 3).map(function(c){ return '<b>' + esc(c.label) + ':</b> ' + esc(c.fix); });
      var li = function(arr){ return '<ul class="bs__list">' + arr.map(function(t){ return '<li>' + ic('check') + '<span>' + t + '</span></li>'; }).join('') + '</ul>'; };

      var planCard =
        '<div class="plan">' +
          '<span class="plan__k">Recommended for ' + esc(name) + '</span>' +
          '<div class="plan__n"><b>' + esc(d.plan.name) + '</b><span>' + esc(d.plan.price) + '</span></div>' +
          '<p>' + esc(d.plan.why) + '</p>' +
          '<p class="plan__fine">Plus one-time setup of $1,699. Your ad budget goes to Meta directly, not to Plaith. Cancel monthly. Prices net, plus VAT.</p>' +
          '<div class="plan__cta">' +
            planBtn(d.plan.checkout, 'card', 'Start with ' + esc(d.plan.name), 'btn btn--sig') +
            planBtn(L.plans || P + '/booking#pakete', 'cols', 'Compare plans', 'btn btn--line') +
            planBtn('mailto:elijah@kazi-orchestrate.com?subject=' + encodeURIComponent('My Meta ads audit: ' + name + ' scored ' + d.score + '/100') +
                '&body=' + encodeURIComponent('Hi Elijah,\n\nMy Meta ads scored ' + d.score + '/100 on your audit (' + name + '). Can we talk about it?\n\n'),
              'mail', 'Email my score to Elijah', 'btn btn--line') +
          '</div>' +
        '</div>';

      h += '<div class="bs">' +
        '<div class="bs__tabs" role="tablist" aria-label="What Plaith would do">' +
          '<button class="bs__tab" type="button" role="tab" id="bs-t-save" aria-controls="bs-save" aria-selected="' + (d.mode === 'save') + '"' + (d.mode === 'save' ? '' : ' tabindex="-1"') + '>' + ic('save') + 'Save wasted budget</button>' +
          '<button class="bs__tab" type="button" role="tab" id="bs-t-boost" aria-controls="bs-boost" aria-selected="' + (d.mode === 'boost') + '"' + (d.mode === 'boost' ? '' : ' tabindex="-1"') + '>' + ic('up') + 'Boost what works</button>' +
        '</div>' +
        '<div class="bs__pane" role="tabpanel" id="bs-save" aria-labelledby="bs-t-save"' + (d.mode === 'save' ? '' : ' hidden') + '><div>' +
          '<h3 class="bs__h">' + (d.empty ? 'Get back in the feed, without learning ads yourself.' : 'Stop paying for ads that stopped working.') + '</h3>' +
          li(saveList) +
          '<div class="bs__links">' +
            ext(L.calculator || P + '#rechner', 'Calculate what a customer is worth', 'lnk') +
            ext(L.how || P + '#ablauf', 'How Plaith works', 'lnk') +
            ext(L.contact || P + '#kontakt', 'Request a call', 'lnk') +
          '</div></div>' + planCard + '</div>' +
        '<div class="bs__pane" role="tabpanel" id="bs-boost" aria-labelledby="bs-t-boost"' + (d.mode === 'boost' ? '' : ' hidden') + '><div>' +
          '<h3 class="bs__h">Your ads work. Give them more room.</h3>' +
          li(boostList) +
          '<div class="bs__links">' +
            ext(L.growthHack || P + '#booster', 'See the Growth Hack', 'lnk') +
            ext(L.examples || P + '#beispiel', 'See a real example', 'lnk') +
            ext(L.booking || P + '/booking', 'Book directly', 'lnk') +
          '</div></div>' + planCard + '</div>' +
      '</div>';

      if(d.samples && d.samples.length){
        h += '<div class="ads"><p class="ads__h">Ads we found running</p><div class="ads__g">' +
          d.samples.map(function(a){
            return '<div class="ad">' +
              (img(a.thumb) ? '<img class="ad__img" src="' + esc(img(a.thumb)) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility=\'hidden\'">' : '<span class="ad__img" aria-hidden="true"></span>') +
              '<span class="ad__t"><b>' + esc(a.title) + '</b><small>' + esc(a.format) +
                (a.days == null ? '' : ' &middot; live ' + (a.days === 0 ? 'since today' : a.days + ' day' + (a.days === 1 ? '' : 's'))) +
              '</small></span></div>';
          }).join('') + '</div></div>';
      }

      h += '<div class="rep__foot">' +
        '<aside class="rep__fine" aria-label="How to read this score">' +
          '<img src="/images/plaith-sloth.webp" alt="" width="56" height="56" loading="lazy" decoding="async">' +
          '<div><b>How to read this score</b>' +
          '<p>Scored from public Meta Ad Library data. Spend, clicks and return on ad spend live inside your ad account, which Plaith reviews in onboarding with partner access. <strong>Plaith commits to the weekly process, never to specific results.</strong></p></div>' +
        '</aside>' +
        '<nav aria-label="Plaith pages">' +
          ext(L.page || P, 'Plaith overview', '', false) +
          ext(L.booking || P + '/booking', 'Plans and booking', '', false) +
          ext(L.faq || P + '#fragen', 'Questions', '', false) +
          ext(L.partner || P + '/partner', 'Become a partner', '', false) +
        '</nav></div>';

      rep.innerHTML = h;
      /* only offer the fix plan when leads can actually be saved */
      fetch('/api/lead').then(function(r){ return r.json(); }).then(function(j){
        var f = document.getElementById('audLead');
        if(f && !j.ready){ f.remove(); refreshST(); }
      }).catch(function(){ var f = document.getElementById('audLead'); if(f) f.remove(); });
      panel.classList.add('is-done');
      title.textContent = 'Your Meta ads audit';
      title.focus({ preventScroll:true });
      refreshST();

      /* animate the ring, the count and the check bars in */
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        var arc = rep.querySelector('.score__arc');
        if(arc) arc.style.strokeDashoffset = arc.getAttribute('data-to');
        rep.querySelectorAll('.chk__bar i').forEach(function(b){ b.style.width = b.getAttribute('data-w') + '%'; });
        var num = rep.querySelector('[data-count]');
        if(num && !RM){
          var to = +num.getAttribute('data-count'), t0 = performance.now();
          (function tick(t){
            var k = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - k, 3);
            num.textContent = Math.round(to * e);
            if(k < 1) requestAnimationFrame(tick);
          })(t0);
        }
      }); });
    }

    rep.addEventListener('click', function(e){
      if(e.target.closest('[data-again]')){ reset(); return; }
      var b = e.target.closest('.chk__b');
      if(b){ selectCheck(b); return; }
      var t = e.target.closest('.bs__tab');
      if(t) selectTab(t);
    });
    rep.addEventListener('submit', function(e){
      var f = e.target.closest('#audLead');
      if(!f) return;
      e.preventDefault();
      var btn = f.querySelector('button[type=submit]'), msg = f.querySelector('.lead__msg');
      var email = f.email.value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)){
        msg.dataset.s = 'err'; msg.textContent = 'That email doesn\'t look right.'; f.email.focus(); return;
      }
      var raw = input.value.trim();
      var site = /facebook\.com\//i.test(raw) ? (/^https?:/i.test(raw) ? raw : 'https://' + raw).replace(/^http:/i, 'https:').replace('://facebook.', '://www.facebook.')
               : 'https://www.facebook.com/' + raw.replace(/^@/, '');
      btn.disabled = true; msg.dataset.s = ''; msg.textContent = 'Sending...';
      fetch('/api/lead', {
        method:'POST', headers:{ 'content-type':'application/json' },
        body:JSON.stringify({ email:email, optin:f.optin.checked, token:lastToken, handle:raw, website:site,
          company_url:f.company_url.value })
      }).then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return { ok:r.ok && j.ok, j:j }; }); })
        .then(function(res){
          if(res.ok){
            f.classList.add('is-sent');
            msg.textContent = 'Sent. Check your inbox for the PDF (and spam, just in case).';
            track('Report emailed', { score:scoreBand(+f.dataset.score), optin:f.optin.checked ? 'yes' : 'no' });
          }else{
            btn.disabled = false; msg.dataset.s = 'err';
            msg.textContent = res.j.message || 'Couldn\'t send that. Try again in a minute.';
            track('Lead failed');
          }
        }).catch(function(){
          btn.disabled = false; msg.dataset.s = 'err';
          msg.textContent = 'Couldn\'t reach the server. Check your connection and try again.';
        });
    });
    function selectCheck(b){
      rep.querySelectorAll('.chk__b').forEach(function(x){
        var on = x === b;
        x.setAttribute('aria-selected', on);
        x.tabIndex = on ? 0 : -1;
        x.parentNode.classList.toggle('is-open', on);
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      refreshST();
    }
    rep.addEventListener('keydown', function(e){
      var cb = e.target.closest('.chk__b');
      if(cb && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){
        var all = [].slice.call(rep.querySelectorAll('.chk__b'));
        var nx = all[(all.indexOf(cb) + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
        selectCheck(nx); nx.focus(); e.preventDefault(); return;
      }
      var t = e.target.closest('.bs__tab');
      if(!t || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      var tabs = [].slice.call(rep.querySelectorAll('.bs__tab'));
      var n = tabs[(tabs.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(n); n.focus();
    });
    function selectTab(t){
      rep.querySelectorAll('.bs__tab').forEach(function(x){
        var on = x === t;
        x.setAttribute('aria-selected', on);
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      refreshST();
    }
  })();

  /* ── mission progress: single source of truth is data-done ── */
  var mBar = $('#missionBar');
  if(mBar){
    /* 0 means genuinely nothing yet: show an empty rail rather than flooring
       to a sliver that would read as progress that hasn't happened. */
    var done = Math.max(0, Math.min(100, parseInt(mBar.getAttribute('data-done'), 10) || 0));
    mBar.style.setProperty('--fill', done === 0 ? '0%' : Math.max(done, 2) + '%');
  }

  /* ── masthead CTA menu ──
     Hover/focus is handled in CSS. This only covers the cases CSS can't:
     touch (no hover), Escape, and clicking away. */
  var mast = $('#mast'), mastTrigger = $('#mastTrigger');
  if(mast && mastTrigger){
    var noHover = function(){ return matchMedia('(hover: none)').matches; };
    var closeMast = function(){
      mast.classList.remove('open');
      mastTrigger.setAttribute('aria-expanded','false');
    };
    mastTrigger.addEventListener('click', function(e){
      if(!noHover()) return;          /* pointer devices: let the link work */
      e.preventDefault();             /* first tap opens instead of jumping */
      var open = !mast.classList.contains('open');
      mast.classList.toggle('open', open);
      mastTrigger.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function(e){
      if(!mast.contains(e.target)) closeMast();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeMast();
    });
  }

  /* ── nav ── */
  var nav = $('#nav'), burger = $('#burger'), sheet = $('#sheet');
  /* The nav only takes on a surface once it has left the hero — over the
     hero it reads as light ink straight on the black. */
  var plateEl = $('#plate');
  function scrolled(){
    var past = plateEl ? plateEl.offsetHeight - 72 : 20;
    nav.classList.toggle('stuck', scrollY > past);
  }
  scrolled(); addEventListener('scroll', scrolled, {passive:true});

  function shut(){
    nav.classList.remove('open'); sheet.classList.remove('open');
    document.body.classList.remove('lock');
    burger.setAttribute('aria-expanded','false');
  }
  burger.addEventListener('click', function(){
    var o = sheet.classList.toggle('open');
    nav.classList.toggle('open', o);
    document.body.classList.toggle('lock', o);
    burger.setAttribute('aria-expanded', String(o));
  });
  sheet.addEventListener('click', function(e){ if(e.target.closest('a')) shut(); });
  addEventListener('keydown', function(e){ if(e.key === 'Escape') shut(); });

  /* ── clock ── */
  var clock = $('#clock');
  if(clock){
    (function(){
      function tick(){
        var d = new Date(), h = d.getHours(), m = String(d.getMinutes()).padStart(2,'0');
        var ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
        clock.textContent = h + ':' + m + ' ' + ap;
      }
      tick(); setInterval(tick, 20000);
    })();
  }

  /* ── reveal fallback ──
     Only used when GSAP never arrives. With GSAP present, initReveals()
     owns the reveals instead (see below) and this never runs. */
  function revealFallback(){
    /* The fallback's CSS `rise` animation also starts at opacity 0, so it can
       strand content the same way a stalled tween can. The watchdog belongs on
       this path too, not only the GSAP one. */
    revealWatchdog();
    var rvs = document.querySelectorAll('.rv');
    if('IntersectionObserver' in window && !RM){
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
      }, {threshold:.1, rootMargin:'0px 0px -6% 0px'});
      rvs.forEach(function(el){ io.observe(el); });
    }
  }

  /* Everything the reveal system may hide. Shared by the tweens and by the
     watchdog below, so the two can never drift apart. */
  var REVEAL_SEL = '.sec__ttl, .sec__num, .sec__note, .cap, .rail__s, .prin__c, .subhead, ' +
                   '.eng__scroll, .give__c, .dl, .cta__lede, .form, .eng__note, .rv, .clip > span, ' +
                   '.mission > *';

  /* ── reveal watchdog ──────────────────────────────────────────────
     A .from() tween holds its target hidden until it completes, which makes
     page content depend on GSAP's ticker actually running. If that ticker is
     throttled (background tab, heavily loaded device) the body would never
     appear. This net runs on plain IntersectionObserver + setTimeout — no
     GSAP involvement — and force-clears the hidden state if an element has
     been on screen and is still invisible. When animation runs normally the
     element is already visible by the time this fires and it does nothing. */
  var watchdogStarted = false;
  function revealWatchdog(){
    if(watchdogStarted) return;
    watchdogStarted = true;
    function sweep(){
      document.querySelectorAll(REVEAL_SEL).forEach(function(el){
        if(el.closest('.mast__menu')) return;   /* that menu is hidden on purpose */
        var r = el.getBoundingClientRect();
        if(r.bottom < 0 || r.top > innerHeight) return;   /* off screen, leave it */
        var cs = getComputedStyle(el);
        /* 0.5 not 0.05: a stalled CSS animation can park an element at a
           partial opacity that still reads as invisible on the page. */
        if(cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.5){
          /* Cancel the animation first. A filling CSS animation outranks
             inline styles in the cascade, so setting opacity alone is
             silently ignored on the no-GSAP fallback path. */
          el.style.animation = 'none';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
    }
    /* Runs on a fixed interval rather than a scroll-debounce: the ticker can
       die *after* the liveness probe passed, and a debounce can be starved by
       a stream of scroll events, which is exactly when content gets stranded.
       A plain interval can't be starved. It costs one cheap pass per 1.5s and
       retires after 90s, by which point anything real has long since shown. */
    sweep();
    var ticks = 0;
    var iv = setInterval(function(){
      sweep();
      if(++ticks > 60) clearInterval(iv);
    }, 1500);
  }

  /* Wrap each <br>-delimited line of a heading in its own mask, so the
     heading can rise line by line instead of fading as one block.
     Child nodes are moved, not re-serialised, so <em> survives intact. */
  function splitLines(el){
    if(!el || el.getAttribute('data-split')) return [];
    var groups = [[]];
    Array.prototype.slice.call(el.childNodes).forEach(function(n){
      if(n.nodeType === 1 && n.tagName === 'BR'){ groups.push([]); return; }
      groups[groups.length - 1].push(n);
    });
    if(groups.length === 1 && !groups[0].length) return [];
    el.textContent = '';
    var inners = [];
    groups.forEach(function(group){
      var clip = document.createElement('span');
      clip.className = 'clip';
      var inner = document.createElement('span');
      group.forEach(function(n){ inner.appendChild(n); });
      clip.appendChild(inner);
      el.appendChild(clip);
      inners.push(inner);
    });
    el.setAttribute('data-split', '1');
    return inners;
  }

  /* ══ GSAP — hero choreography ══
     Runs only once the deferred CDN scripts land. Every element it touches
     is already visible in CSS, so if GSAP never loads the hero just renders
     static instead of staying blank. */
  /* ══ GSAP — section transitions ══
     Each section arrives as a sequence rather than a fade: an instrument
     line draws across it, the marker slides in, the heading rises line by
     line behind its mask, then the body and rows stagger up. */
  function initReveals(g){
    if(!window.ScrollTrigger){ revealFallback(); return; }
    var STACKED = document.documentElement.classList.contains('stack');
    revealWatchdog();

    document.querySelectorAll('.sec, .cta').forEach(function(sec){
      var head  = sec.querySelector('.sec__head') || sec.querySelector('.wrap') || sec;
      var num   = sec.querySelector('.sec__num, .tag');
      var ttl   = sec.querySelector('.sec__ttl, .h2');
      var note  = sec.querySelector('.sec__note');
      var lines = splitLines(ttl);

      var scan = document.createElement('span');
      scan.className = 'sec__scan';
      scan.setAttribute('aria-hidden', 'true');
      sec.insertBefore(scan, sec.firstChild);

      /* Same contract as the hero: these tweens hold their targets hidden
         until they finish, so once a section starts revealing it must land
         within a few seconds or we snap it to the end state. A stalled
         ticker can't be allowed to leave a whole section invisible. */
      var tl = g.timeline({
        defaults:{ ease:'expo.out' },
        /* not once:true: a once-trigger already past its start when created
           kills itself mid-refresh, and ScrollTrigger then throws on a
           reload partway down the page, taking every later tween with it */
        /* cards slide up from below, so start the entrance as the card's
           top edge enters; a later start shows an empty card first */
        scrollTrigger:{ trigger:sec, start:'top bottom-=40', toggleActions:'play none none none' },
        onStart:function(){
          var self = this;
          setTimeout(function(){ if(self.progress() < 1) self.progress(1); }, 3000);
        }
      });

      /* card entrance: quick and front-loaded, ~.8s for the head */
      tl.fromTo(scan, { scaleX:0, opacity:1 }, { scaleX:1, duration:.7, ease:'power3.inOut' })
        .to(scan, { opacity:.35, duration:.4 }, '-=.15');

      /* Stacked cards slide up over the last one; that slide is the
         entrance. Hiding the content and animating it back in on top of it
         read as a glitch (half-drawn cards mid-slide), so with the stack on
         only the hairline scan plays. */
      if(STACKED) return;
      if(num)   tl.from(num,   { autoAlpha:0, x:-14, duration:.5 }, '-=.6');
      if(lines.length) tl.from(lines, { yPercent:112, duration:.75, stagger:.06 }, '-=.45');
      else if(ttl)     tl.from(ttl,   { autoAlpha:0, y:24, duration:.65 }, '-=.45');
      if(note)  tl.from(note,  { autoAlpha:0, y:20, duration:.6 }, '-=.55');

      /* rows/cards inside this section, minus anything the head already owns */
      var items = Array.prototype.slice.call(
        sec.querySelectorAll('.work__card, .cap, .rail__s, .prin__c, .subhead, .eng__scroll, .give__c, .dl, .cta__lede, .form, .eng__note')
      ).filter(function(el){ return !head.contains(el); });

      if(items.length){
        tl.from(items, { autoAlpha:0, y:30, duration:.6, stagger:.045 }, '-=.45');
      }

      /* No per-element scroll drift here any more: the card stack is the
         depth now, and drift would keep moving content inside a pinned card. */
    });

    /* Anything still tagged .rv that no section timeline picked up. Split
       headings are excluded: their lines are already animated, and hiding
       the heading as well would double-hide it. */
    var left = Array.prototype.slice.call(document.querySelectorAll('.rv')).filter(function(el){
      if(el.getAttribute('data-split') || el.querySelector('.clip')) return false;
      if(STACKED && el.closest('.card:not(.plate)')) return false;
      return !g.getTweensOf(el).length;
    });
    left.forEach(function(el){
      var t = g.from(el, {
        autoAlpha:0, y:22, duration:.7, ease:'expo.out',
        scrollTrigger:{ trigger:el, start:'top 88%', toggleActions:'play none none none' },
        onStart:function(){ setTimeout(function(){ if(t.progress() < 1) t.progress(1); }, 3000); }
      });
    });
  }

  /* Gate every reveal behind proof that GSAP's ticker actually advances.
     These animations work by hiding content first and revealing it as they
     play, so if the ticker is throttled or stalled they would hide the page
     and never bring it back. Confirming liveness first removes that whole
     failure class instead of trying to recover from it afterwards. */
  function heroMotion(){
    if(!window.gsap || RM){ if(RM) return; revealFallback(); return; }
    var g = window.gsap;
    if(window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);

    var ticked = false;
    function probe(){ ticked = true; }
    g.ticker.add(probe);
    setTimeout(function(){
      g.ticker.remove(probe);
      if(ticked) buildMotion(g);
      else revealFallback();   /* no ticker: nothing was hidden, leave it be */
    }, 260);
  }

  /* ── scrolling ──
     Native scroll, no smoothing layer: the page tracks the wheel 1:1. (Lenis
     used to sit here with lerp .085, which is what made scrolling trail the
     input.) In-page jumps use the browser's own smooth scroll, measured in
     plain flow so sticky cards can't skew the target. */
  function flowTop(el){
    var root = document.documentElement, on = root.classList.contains('stack');
    if(on) root.classList.add('stack-measure');
    var y = el.getBoundingClientRect().top + scrollY;
    if(on) root.classList.remove('stack-measure');
    return y;
  }
  /* Cards carry their own top padding, so they land flush at the top.
     Anything else clears the fixed nav. */
  function goTo(el, instant){
    var isCard = el.id === 'top' || el.classList.contains('card') || el.parentNode === document.querySelector('main');
    var navEl = document.getElementById('nav');
    var off = isCard ? 0 : (navEl ? navEl.offsetHeight : 80) + 16;
    window.scrollTo({ top:Math.max(0, flowTop(el) - off), behavior:(RM || instant) ? 'auto' : 'smooth' });
  }
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if(!id || id === '#') return;
      var t;
      try{ t = document.querySelector(id); }catch(x){ return; }
      if(!t) return;
      e.preventDefault();
      goTo(t);
    });
  });

  /* ── card stack ──
     Every top-level section becomes a sticky card (see CARD STACK in the CSS).
     As the next card rises from the viewport bottom to the top, the one under
     it scales back and darkens, scrubbed 1:1 with scroll. */
  function cardStack(g){
    var ST = window.ScrollTrigger, root = document.documentElement;
    if(!ST || RM) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('main > .plate, main > .sec, main > .cta'));
    if(cards.length < 2) return;

    cards.forEach(function(c, i){
      c.classList.add('card');
      if(i === cards.length - 1) c.classList.add('card--last');
      var dim = document.createElement('i');
      dim.className = 'card__dim';
      dim.setAttribute('aria-hidden', 'true');
      c.appendChild(dim);
    });

    function measure(){
      cards.forEach(function(c){ c.style.setProperty('--card-h', c.offsetHeight + 'px'); });
    }
    measure();
    root.classList.add('stack');

    /* Triggers are measured with sticky and scale switched off, so every
       start/end is a flow position no matter where the page is scrolled. */
    ST.addEventListener('refreshInit', function(){
      root.classList.add('stack-measure');
      requestAnimationFrame(function(){ root.classList.remove('stack-measure'); });
    });
    ST.addEventListener('refresh', function(){ root.classList.remove('stack-measure'); });

    /* Height changes (audit panel, interactive demo, fonts) move the stick
       point, then the triggers. */
    var rt;
    if('ResizeObserver' in window){
      var ro = new ResizeObserver(function(){
        measure();
        clearTimeout(rt);
        rt = setTimeout(function(){ ST.refresh(); }, 180);
      });
      cards.forEach(function(c){ ro.observe(c); });
    }
    addEventListener('resize', measure);

    cards.forEach(function(c, i){
      var next = cards[i + 1];
      if(!next) return;
      g.timeline({
        scrollTrigger:{
          trigger:next, start:'top bottom', end:'top top', scrub:true,
          /* while it scales, let the browser scale the drawn card instead
             of repainting it every frame; dropped once it settles */
          onToggle:function(self){ c.style.willChange = self.isActive ? 'transform' : ''; },
          onLeave:function(){ c.classList.add('card--gone'); },
          onEnterBack:function(){ c.classList.remove('card--gone'); }
        }
      })
      .fromTo(c, { scale:1 }, { scale:.94, ease:'none' }, 0)
      .fromTo(c.querySelector('.card__dim'), { opacity:0 }, { opacity:.55, ease:'none' }, 0);
    });
  }

  function buildMotion(g){
    cardStack(g);

    var intro = g.timeline({ defaults:{ ease:'expo.out' } })
      .from('#h1 .clip > span', { yPercent:115, duration:1.15 })
      .from('.nav__side > *',   { y:-14, autoAlpha:0, duration:.7, stagger:.06 }, '-=.95')
      .from('#adLib',           { autoAlpha:0, scale:1.04, duration:1.6 }, '-=.9')
      .from('.holo__bloom',     { autoAlpha:0, scale:.82, duration:1.6 }, '<')
      .from('.holo__br',        { autoAlpha:0, scale:.6, duration:.8, stagger:.07 }, '<.3')
      .from('.plate__role',     { y:26, autoAlpha:0, duration:1 }, '-=1.2')
      .from('.plate__status',   { y:18, autoAlpha:0, duration:.9 }, '-=.82')
      .from('#aud > *',         { y:18, autoAlpha:0, duration:.8, stagger:.07 }, '-=.7')
      .from('.mission > *',     { autoAlpha:0, y:16, duration:.75, stagger:.08 }, '-=.75')
      .from('#missionBar i',    { scaleX:0, transformOrigin:'0 50%', duration:.9 }, '-=.35')
      .from('#plateCta > *',    { autoAlpha:0, y:16, duration:.75, stagger:.08 }, '<-.4')
      .from('.cue',             { autoAlpha:0, duration:.7 }, '-=.55');

    /* loaded partway down (reload, back button, anchor): the hero intro
       would play off-screen while the nav stutters in; land it finished */
    if(scrollY > innerHeight * .5) intro.progress(1);

    initReveals(g);

    /* Failsafe. A .from() tween holds its target hidden until it finishes, so
       a stalled timeline (backgrounded tab, throttled rAF, interrupted load)
       would strand the hero copy invisible. Snap to the end state if the
       intro hasn't landed on its own — content must never depend on motion. */
    setTimeout(function(){ if(intro.progress() < 1) intro.progress(1); }, 4000);
    document.addEventListener('visibilitychange', function(){
      if(!document.hidden && intro.progress() < 1) intro.progress(1);
    });

    if(!window.ScrollTrigger) return;

    /* The hero copy no longer fades out on scroll: the hero is a card that
       recedes under the next one, and the audit report lives in it. */

    /* Hero depth. Each layer leaves at its own rate: the grid and bloom lag
       like a far wall, the rings sit mid-distance, the workflow cards come
       forward. Only yPercent is scrubbed here, because the intro owns scale,
       rotate and opacity on these same elements and a scrubbed tween would
       capture their mid-intro values. */
    /* scrub:true, not a number: a numeric scrub eases toward the scroll
       position and reads as lag */
    var HERO = { trigger:'#plate', start:'top top', end:'bottom top', scrub:true };
    g.to('#adLib',       { yPercent:10, ease:'none', scrollTrigger:HERO });
    g.to('.holo__bloom', { yPercent:34, ease:'none', scrollTrigger:HERO });

    /* Pointer depth on the hero, desktop only. quickTo keeps one tween per
       axis alive and retargets it, so fast mouse movement glides instead of
       stacking new tweens. x/y only: scroll owns yPercent on these. */
    var plate = $('#plate');
    if(plate && matchMedia('(pointer: fine)').matches){
      var layers = [
        ['#adLib', -10]
      ].map(function(l){
        var el = document.querySelector(l[0]);
        return el && { d:l[1],
          x:g.quickTo(el, 'x', { duration:1.1, ease:'power3.out' }),
          y:g.quickTo(el, 'y', { duration:1.1, ease:'power3.out' }) };
      }).filter(Boolean);
      plate.addEventListener('pointermove', function(e){
        var r = plate.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        layers.forEach(function(l){ l.x(nx * l.d); l.y(ny * l.d); });
      });
      plate.addEventListener('pointerleave', function(){
        layers.forEach(function(l){ l.x(0); l.y(0); });
      });
    }

    /* Images drift inside their frames, the frame itself stays put */
    document.querySelectorAll('.work__media > img').forEach(function(img){
      img.classList.add('px');
      /* data-py overrides the travel when the top of an image must stay in frame */
      var r = (img.getAttribute('data-py') || '-6%,6%').split(',');
      g.fromTo(img, { '--py':r[0] }, {
        '--py':r[1], ease:'none',
        scrollTrigger:{ trigger:img.parentNode, start:'top bottom', end:'bottom top', scrub:true }
      });
    });

    /* footer wordmark rises out of the footer's own clip */
    g.fromTo('.foot__w', { yPercent:55 }, {
      yPercent:0, ease:'none',
      scrollTrigger:{ trigger:'.foot', start:'top bottom', end:'bottom bottom', scrub:true }
    });

    /* Loaded with a #hash: re-land once fonts and images have settled the
       layout (not on reload, where the browser restores the old position). */
    var nav0 = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if(location.hash && !(nav0 && nav0.type === 'reload')){
      var hashEl = null;
      try{ hashEl = document.querySelector(location.hash); }catch(x){}
      var moved = false;
      ['wheel','touchstart','keydown'].forEach(function(t){
        addEventListener(t, function(){ moved = true; }, { once:true, passive:true });
      });
      if(hashEl) window.ScrollTrigger.addEventListener('refresh', function land(){
        window.ScrollTrigger.removeEventListener('refresh', land);
        if(!moved) goTo(hashEl, true);
      });
    }

    /* Web fonts and the pipeline canvas both shift layout after load, which
       would leave every trigger measured against stale positions. */
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(function(){ window.ScrollTrigger.refresh(); });
    }
    addEventListener('load', function(){ window.ScrollTrigger.refresh(); });
  }
  if(window.gsap) heroMotion();
  else addEventListener('load', heroMotion);

  /* ── floating call to action ──
     Plain IntersectionObserver, no GSAP, so it works even if the CDN
     scripts never load. Shown once the hero is gone, hidden while the
     contact section is on screen. */
  /* ── mission card, phones: pinned to the viewport bottom ──
     Lives in <body> on phones so the hero's card-stack transform can't trap
     it; goes back into the hero on wider screens. Hidden past the hero (the
     dock owns the bottom then) and while an audit runs. */
  (function missionPin(){
    var m = $('#mission'), plate = $('#plate');
    if(!m || !plate || !window.matchMedia) return;
    var mq = matchMedia('(max-width:700px)'), home = m.nextElementSibling, past = false;
    function place(){
      if(mq.matches){ if(m.parentNode !== document.body) document.body.appendChild(m); }
      else if(m.parentNode !== plate){ plate.insertBefore(m, home); }
      state();
    }
    function state(){
      m.classList.toggle('is-off', mq.matches && (past || plate.classList.contains('is-audit')));
    }
    document.addEventListener('hero:past', function(e){ past = !!e.detail; state(); });
    new MutationObserver(state).observe(plate, { attributes:true, attributeFilter:['class'] });
    if(mq.addEventListener) mq.addEventListener('change', place); else mq.addListener(place);
    place();
  })();

  (function dock(){
    var d = $('#dock'), hero = $('#plate'), contact = $('#contact');
    if(!d || !hero || !contact || !('IntersectionObserver' in window)) return;

    /* Copy follows the visitor: before an audit it sells the free score,
       after one it pitches fixing what the score found. */
    var CAL = 'https://plaith.ai/elijahrose/booking';
    var sEl = $('#dockS > span'), alt = $('#dockAlt'), goA = $('#dockGo'), goT = $('#dockGoT');
    var base = { s:sEl.innerHTML, alt:alt.textContent };
    function asLink(a, href, ext){
      a.setAttribute('href', href);
      if(ext){ a.target = '_blank'; a.rel = 'noopener'; } else { a.removeAttribute('target'); a.removeAttribute('rel'); }
    }
    /* while an audit runs, the dock carries its progress, so visitors can
       browse the rest of the page and still see it working */
    document.addEventListener('audit:start', function(e){
      var nm = (e.detail && e.detail.name) || 'your page';
      d.classList.add('is-run'); d.style.setProperty('--p', '0');
      sEl.textContent = '';
      var b = document.createElement('b'); b.textContent = 'Auditing ' + nm;
      var sm = document.createElement('small'); sm.id = 'dockNote'; sm.textContent = 'Starting \u00b7 0%';
      sEl.appendChild(b); sEl.appendChild(sm);
      alt.textContent = base.alt; asLink(alt, CAL, true);
      goT.textContent = 'View progress'; asLink(goA, '#audR', false); goA.removeAttribute('data-audit');
    });
    document.addEventListener('audit:progress', function(e){
      var x = e.detail || {}, sm = $('#dockNote');
      if(!d.classList.contains('is-run') || !sm) return;
      sm.textContent = (x.note || 'Working') + ' \u00b7 ' + x.pct + '%';
      d.style.setProperty('--p', String(Math.min(1, (x.pct || 0) / 100)));
    });
    document.addEventListener('audit:done', function(e){
      d.classList.remove('is-run');
      var x = e.detail || {};
      sEl.innerHTML = '<b>Your ads scored ' + x.score + '/100</b><small>' + (x.score >= 80 ? 'Ready to scale' : 'Room to fix') + '</small>';
      alt.textContent = x.lead ? 'Email me the report' : 'Send a brief';
      asLink(alt, x.lead ? '#audLead' : '#contact', false);
      goT.textContent = x.score >= 80 ? 'Scale it with me' : 'Fix it with me';
      asLink(goA, CAL, true); goA.removeAttribute('data-audit');
    });
    document.addEventListener('audit:reset', function(){
      d.classList.remove('is-run');
      sEl.innerHTML = base.s; alt.textContent = base.alt; asLink(alt, CAL, true);
      goT.textContent = 'Score my ads'; asLink(goA, '#plate', false); goA.setAttribute('data-audit', '');
    });
    /* "Score my ads" scrolls to the hero; put the cursor in the input on arrival */
    goA.addEventListener('click', function(){
      if(!goA.hasAttribute('data-audit')) return;
      track('Dock audit click');
      setTimeout(function(){ var i = $('#audIn'); if(i) i.focus({ preventScroll:true }); }, 900);
    });
    var pastHero = false, atContact = false;
    function sync(){
      var on = pastHero && !atContact;
      document.dispatchEvent(new CustomEvent('hero:past', { detail:pastHero }));
      d.classList.toggle('is-on', on);
      d.setAttribute('aria-hidden', String(!on));
      d.querySelectorAll('a').forEach(function(a){ a.tabIndex = on ? 0 : -1; });
    }
    /* Watch a 1px marker at the hero's flow bottom, not the hero itself: as
       a sticky card the hero stays in the viewport (covered) all the way
       down. Past the hero = that marker has risen above the 70% line. */
    var mark = document.createElement('div');
    mark.setAttribute('aria-hidden', 'true');
    mark.style.cssText = 'position:absolute;width:1px;height:1px;pointer-events:none';
    hero.parentNode.insertBefore(mark, hero.nextSibling);
    /* A position check on scroll, not an IntersectionObserver: the marker
       is 1px, so a jump that skips straight over the 70% line (reload,
       anchor, restored scroll) never fired the observer and the dock
       stayed hidden. */
    var queued = false;
    function checkHero(){
      queued = false;
      var past = mark.getBoundingClientRect().top < innerHeight * .7;
      if(past !== pastHero){ pastHero = past; sync(); }
    }
    function queue(){ if(!queued){ queued = true; requestAnimationFrame(checkHero); } }
    addEventListener('scroll', queue, { passive:true });
    addEventListener('resize', queue);
    checkHero();
    new IntersectionObserver(function(es){
      atContact = es[0].isIntersecting; sync();
    }, { threshold:0.08 }).observe(contact);
  })();

  /* ── scroll spy ── */
  var links = {};
  document.querySelectorAll('.nav__l').forEach(function(a){
    var h = a.getAttribute('href');
    if(h && h[0] === '#') links[h.slice(1)] = a;
  });
  if('IntersectionObserver' in window){
    var SPY = ['projects','capabilities','principles','engagement','plans','faq','work','contact'];
    /* cards split out of a nav section light up their parent link */
    var PARENT = { principles:'capabilities', plans:'engagement', faq:'engagement', work:'engagement' };
    function setCurrent(id){
      id = PARENT[id] || id;
      Object.keys(links).forEach(function(k){ links[k].removeAttribute('aria-current'); });
      if(id && links[id]) links[id].setAttribute('aria-current','true');
    }
    var sio = new IntersectionObserver(function(es){
      es.forEach(function(e){
        var a = links[PARENT[e.target.id] || e.target.id];
        if(!a) return;
        if(e.isIntersecting) setCurrent(e.target.id);
        /* Scrolling back up, a section drops out below the band. A sticky
           card above it never left the band, so it never re-enters: hand
           the highlight back to the previous section explicitly. */
        else if(a.hasAttribute('aria-current') && e.boundingClientRect.top > 0){
          setCurrent(SPY[SPY.indexOf(e.target.id) - 1]);
        }
      });
    }, {rootMargin:'-45% 0px -50% 0px'});
    SPY.forEach(function(id){
      var s = document.getElementById(id); if(s) sio.observe(s);
    });
  }

  /* ══ USE CASES — pipeline walkthroughs ══
     A scripted walkthrough, not a live model call. Stages reveal in sequence
     with the structured output each one would return, which is the thing
     worth showing: the shape of the contract between stages. Deliberately
     no fabricated latency or token counts - inventing performance numbers
     would be claiming something that was never measured. */
  (function pipelines(){
    var casesEl = $('#demoCases'), ta = $('#demoInput'), runBtn = $('#demoRun');
    var stepsEl = $('#demoSteps'), noteEl = $('#demoNote');
    var tabsEl = $('#demoTabs'), emptyEl = $('#demoEmpty');
    var flowEl = $('#demoFlow'), labEl = $('#demoLab');
    if(!casesEl || !ta || !runBtn || !stepsEl) return;

    var CASES = [
      {
        id:'cold-outreach',
        name:'Cold outreach',
        blurb:'Finds one real reason to write, drafts it, checks it.',
        inputLabel:'Prospect notes',
        placeholder:'Paste notes on a prospect…',
        sample:"Owner of a family bakery in Lancaster. Opened a second location on King Street in September and has posted twice about hiring counter staff. Website still lists one address and has no online ordering.",
        stages:[
          {id:'signal', label:'Find the signal', out:{
            signal_type:'company_news', evidence:'Opened a second location in September.',
            why_it_matters:'The site still shows one address, so people near the new shop cannot find it.',
            confidence:0.86}},
          {id:'write', label:'Write three variants', out:{
            variants:3, structures:['direct','curious','pattern break'],
            longest:'61 words', one_cta_each:true}},
          {id:'gate', label:'Quality gate', out:{
            selected:'curious', sounds_human:true, confidence:0.81,
            reason:'Reads like someone local noticed, not a template.'}},
          {id:'send', label:'Ready to send', out:{
            reply:"Hi Maria, congrats on the King Street shop. I noticed your site still only lists the first address, so anyone searching near the new one won't see you. I mocked up how the site could show both locations. Want me to send it over?"}}
        ]
      },
      {
        id:'ad-brief',
        name:'Ad creative',
        blurb:'Turns an offer into an ad, then checks it before launch.',
        inputLabel:'Business brief',
        placeholder:'Describe the business and the offer…',
        sample:"Mobile dog grooming in Lancaster County. We come to your driveway, one dog at a time, no cages. Booked out on weekends, want more weekday clients. Budget around $20 a day.",
        stages:[
          {id:'offer', label:'Read the offer', out:{
            offer:'Mobile dog grooming at your door',
            audience:'Dog owners within 20 miles who work weekdays',
            goal:'More weekday bookings', daily_budget:'$20'}},
          {id:'angle', label:'Pick the angle', out:{
            angle:'calm_dog', hook:'No cages, no car ride, no stressed dog.', format:'short_video',
            why:'Weekday owners are at work, so the van coming to them is the whole point.'}},
          {id:'adcopy', label:'Write the ad', out:{
            headline:'Grooming that comes to your driveway',
            primary_text:'One dog at a time, in our van, right outside your door. Weekday spots open this month.',
            call_to_action:'book_now'}},
          {id:'check', label:'Pre-flight check', out:{
            policy_flags:[], claims_need_proof:false, owner_approval:true,
            note:'Held for the owner to approve before it runs.'}}
        ]
      },
      {
        id:'lead-qualify',
        name:'Lead qualification',
        blurb:'Reads an enquiry, scores the fit, picks the next move.',
        inputLabel:'Inbound enquiry',
        placeholder:'Paste an inbound enquiry…',
        sample:"Hi, I own two hair salons in Lancaster. We spend about $800 a month boosting posts and can't tell if it brings anyone in. I'd like proper ads running before the holidays. I make the decisions here.",
        stages:[
          {id:'read', label:'Read the enquiry', out:{
            business:'Two hair salons in Lancaster',
            need:'Ads that bring bookings, not boosted posts.',
            timeline:'Before the holidays', budget_signal:'Already spends $800 a month'}},
          {id:'score', label:'Score the fit', out:{
            score:86, tier:'hot',
            missing:'How bookings come in today, online or by phone.',
            rationale:'Already spending, has a deadline, and is the decision maker.'}},
          {id:'next', label:'Pick next action', out:{
            action:'book_call',
            question_to_ask:'How many new clients a month would make the ads worth it to you?',
            priority:'now'}}
        ]
      },
      {
        id:'site-audit',
        name:'Website audit',
        blurb:'Reads a homepage, ranks the fixes, rewrites the hero.',
        inputLabel:'Homepage copy',
        placeholder:'Paste homepage copy…',
        sample:"WELCOME TO KEYSTONE ROOFING\nFamily owned since 1998\nWe provide quality roofing solutions for residential and commercial clients.\nServices | About | Gallery | Contact\nCall us today!",
        stages:[
          {id:'audit', label:'Audit the page', out:{
            headline_says:'Welcome', offer_is_clear:false, phone_in_hero:false,
            trust_signals:['Family owned since 1998'], main_action:null}},
          {id:'rank', label:'Rank the fixes', out:{
            first:'Say what you do and where, in the headline.',
            second:'Put the phone number and a booking button in the hero.',
            third:'Show reviews before the services list.'}},
          {id:'hero', label:'Draft the new hero', out:{
            reply:"Roof repairs and replacements across Lancaster County.\nFamily owned since 1998. Free inspections, booked within the week.\nCall (717) 555-0134 or book online."}}
        ]
      }
    ];

    var nodesEl = $('#demoNodes'), wiresEl = $('#demoWires'), cursorEl = $('#demoCursor');
    var frameEl = $('#demoFrame'), countEl = $('#demoCount');

    /* lucide glyphs, one per kind of stage */
    var ICONS = {
      phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
      inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
      mail:'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
      file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8M16 17H8M10 9H8"/>',
      spark:'<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
      clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
      shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
      voice:'<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 18.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
      tag:'<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
      braces:'<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
      branch:'<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
      reply:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
      user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
      globe:'<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
      megaphone:'<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>'
    };
    var TRIGGER_ICON = {'cold-outreach':'user','ad-brief':'megaphone','lead-qualify':'mail','site-audit':'globe'};
    var STAGE_ICON = {
      signal:'spark', write:'reply', gate:'shield', send:'send',
      offer:'tag', angle:'spark', adcopy:'reply', check:'shield',
      read:'spark', score:'gauge', next:'branch',
      audit:'braces', rank:'gauge', hero:'reply'
    };
    function svg(name){
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.spark) + '</svg>';
    }

    var active = CASES[0], running = false;

    function esc(v){
      return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    /* Samples run from two lines to eight, so grow the field to its content. */
    function fit(){
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight + 2, 300) + 'px';
    }
    ta.addEventListener('input', fit);

    CASES.forEach(function(c){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'demo__case';
      b.setAttribute('aria-pressed', String(c === active));
      b.innerHTML = '<b></b><span></span>';
      b.querySelector('b').textContent = c.name;
      b.querySelector('span').textContent = c.blurb;
      b.addEventListener('click', function(){ select(c); });
      c.el = b;
      casesEl.appendChild(b);
    });

    function select(c){
      if(running) return;
      active = c;
      CASES.forEach(function(x){ x.el.setAttribute('aria-pressed', String(x === c)); });
      labEl.textContent = c.inputLabel;
      ta.placeholder = c.placeholder;
      ta.value = c.sample;
      fit();
      buildCanvas(c);
      reset();
    }

    function nodeHtml(kind, name, out, icon, cls){
      return '<div class="demo__node' + (cls ? ' ' + cls : '') + '" data-state="idle">' +
               '<i class="node__h"></i><i class="node__h"></i><i class="node__h"></i><i class="node__h"></i>' +
               (cls ? '' : '<span class="node__port node__port--in"></span>') +
               '<div class="node__top"><span class="node__ico">' + svg(icon) + '</span>' +
               '<span class="node__k">' + esc(kind) + '</span></div>' +
               '<span class="node__name">' + esc(name) + '</span>' +
               '<span class="node__out">' + esc(out) + '</span>' +
               '<span class="node__port node__port--out"></span>' +
             '</div>';
    }

    function buildCanvas(c){
      frameEl.textContent = c.name;
      countEl.textContent = (c.stages.length + 1) + ' nodes';
      nodesEl.innerHTML = nodeHtml('Trigger', c.inputLabel, 'raw text', TRIGGER_ICON[c.id], 'is-trigger') +
        c.stages.map(function(s, i){
          var n = Object.keys(s.out).length;
          return nodeHtml('Stage ' + String(i+1).padStart(2,'0'), s.label,
                          n + (n === 1 ? ' field' : ' fields'), STAGE_ICON[s.id]);
        }).join('');
      drawWires();
    }

    /* Wires are measured, not hard-coded: port centres relative to the
       canvas, joined with a bezier that leaves each port along its axis. */
    function drawWires(){
      var box = flowEl.getBoundingClientRect();
      var nodes = nodesEl.children;
      var down = getComputedStyle(nodesEl).flexDirection === 'column';
      function centre(el){
        var r = el.getBoundingClientRect();
        return { x: r.left + r.width/2 - box.left, y: r.top + r.height/2 - box.top };
      }
      var d = [];
      for(var i = 0; i < nodes.length - 1; i++){
        var a = centre(nodes[i].querySelector('.node__port--out'));
        var b = centre(nodes[i+1].querySelector('.node__port--in'));
        var k = down ? Math.max(14, (b.y - a.y) * .5) : Math.max(14, (b.x - a.x) * .5);
        d.push(down
          ? 'M' + a.x + ' ' + a.y + ' C' + a.x + ' ' + (a.y + k) + ' ' + b.x + ' ' + (b.y - k) + ' ' + b.x + ' ' + b.y
          : 'M' + a.x + ' ' + a.y + ' C' + (a.x + k) + ' ' + a.y + ' ' + (b.x - k) + ' ' + b.y + ' ' + b.x + ' ' + b.y);
      }
      var prev = Array.prototype.map.call(wiresEl.children, function(p){ return p.getAttribute('class') || ''; });
      wiresEl.innerHTML = d.map(function(p, i){
        return '<path d="' + p + '"' + (prev[i] && prev.length === d.length ? ' class="' + prev[i] + '"' : '') + '/>';
      }).join('');
    }
    if('ResizeObserver' in window) new ResizeObserver(drawWires).observe(flowEl);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(drawWires);

    function setNode(i, state){ if(nodesEl.children[i]) nodesEl.children[i].setAttribute('data-state', state); }
    function setWire(i, cls){ var p = wiresEl.children[i]; if(p) p.setAttribute('class', cls); }
    function moveCursor(i){
      var n = nodesEl.children[i];
      if(!n) return;
      var box = flowEl.getBoundingClientRect(), r = n.getBoundingClientRect();
      cursorEl.style.transform = 'translate(' + (r.right - box.left - 22) + 'px,' + (r.bottom - box.top - 14) + 'px)';
      cursorEl.classList.add('is-on');
    }

    function reset(){
      Array.prototype.forEach.call(nodesEl.children, function(n){ n.setAttribute('data-state','idle'); });
      Array.prototype.forEach.call(wiresEl.children, function(p){ p.removeAttribute('class'); });
      cursorEl.classList.remove('is-on');
      stepsEl.innerHTML = '';
      if(tabsEl) tabsEl.innerHTML = '';
      if(emptyEl) emptyEl.hidden = false;
      active.stages.forEach(function(s, i){
        if(tabsEl){
          var t = document.createElement('button');
          t.type = 'button'; t.className = 'demo__tab'; t.disabled = true;
          t.setAttribute('role', 'tab'); t.setAttribute('aria-selected', 'false');
          t.setAttribute('aria-label', 'Stage ' + String(i+1).padStart(2,'0') + ': ' + s.label);
          t.title = s.label;
          t.textContent = String(i+1).padStart(2,'0');
          t.addEventListener('click', function(){ show(i); });
          tabsEl.appendChild(t);
        }
        var li = document.createElement('li');
        li.className = 'demo__step';
        li.setAttribute('data-state','idle');
        li.innerHTML =
          '<div class="demo__head">' +
            '<span class="demo__dot"></span>' +
            '<span class="demo__n">' + String(i+1).padStart(2,'0') + '</span>' +
            '<span class="demo__name"></span>' +
          '</div>';
        li.querySelector('.demo__name').textContent = s.label;
        stepsEl.appendChild(li);
      });
    }

    function valueHtml(key, v){
      if(v === null || v === undefined || v === '') return '<dd class="is-null">not stated</dd>';
      if(typeof v === 'boolean'){
        return '<dd><span class="demo__pill ' + (v ? 'is-on' : 'is-off') + '">' +
               (v ? 'yes' : 'no') + '</span></dd>';
      }
      if(typeof v === 'number' && /conf|score/.test(key)){
        var pct = v <= 1 ? Math.round(v * 100) : Math.round(v);
        return '<dd><span class="demo__conf"><i style="--w:' + pct + '%"></i><b>' + pct + '%</b></span></dd>';
      }
      if(Array.isArray(v)){
        if(!v.length) return '<dd class="is-null">none</dd>';
        return '<dd>' + v.map(function(x){
          return '<span class="demo__pill">' + esc(x) + '</span>';
        }).join(' ') + '</dd>';
      }
      if(typeof v === 'string' && /^[a-z][a-z0-9_]{0,28}$/.test(v)){
        return '<dd><span class="demo__pill">' + esc(v.replace(/_/g,' ')) + '</span></dd>';
      }
      return '<dd>' + esc(v) + '</dd>';
    }

    function render(li, out){
      var prose = out.reply || out.say;
      var body = document.createElement('div');
      body.className = 'demo__body';
      if(prose){
        body.innerHTML = '<span class="demo__reply">' + esc(prose) + '</span>';
      } else {
        body.innerHTML = '<dl class="demo__fields">' + Object.keys(out).map(function(k){
          return '<div class="demo__f"><dt>' + esc(k.replace(/_/g,' ')) + '</dt>' +
                 valueHtml(k, out[k]) + '</div>';
        }).join('') + '</dl>';
      }
      li.appendChild(body);
    }

    /* One output panel: the stage being viewed fills it, the others wait.
       Picked from the stage buttons or by clicking a finished node. */
    function show(i){
      Array.prototype.forEach.call(stepsEl.children, function(li, k){ li.classList.toggle('is-shown', k === i); });
      if(tabsEl) Array.prototype.forEach.call(tabsEl.children, function(t, k){ t.setAttribute('aria-selected', String(k === i)); });
      Array.prototype.forEach.call(nodesEl.children, function(n, k){ n.classList.toggle('is-view', k === i + 1); });
      if(emptyEl) emptyEl.hidden = true;
      stepsEl.scrollTop = 0;
    }
    nodesEl.addEventListener('click', function(e){
      var n = e.target.closest && e.target.closest('.demo__node');
      if(!n || running) return;
      var k = Array.prototype.indexOf.call(nodesEl.children, n);
      if(k > 0 && n.getAttribute('data-state') === 'done') show(k - 1);
    });

    var wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };

    runBtn.addEventListener('click', async function(){
      if(running) return;
      running = true;
      runBtn.disabled = true;
      reset();
      setNode(0, 'done');
      moveCursor(0);
      await wait(RM ? 0 : 320);

      for(var i = 0; i < active.stages.length; i++){
        var stage = active.stages[i];
        var li = stepsEl.children[i];
        li.setAttribute('data-state','running');
        show(i);
        setWire(i, 'is-live');
        setNode(i + 1, 'running');
        moveCursor(i + 1);
        await wait(RM ? 0 : 420 + Math.random() * 360);
        li.setAttribute('data-state','done');
        setWire(i, 'is-done');
        setNode(i + 1, 'done');
        render(li, stage.out);
        if(tabsEl && tabsEl.children[i]) tabsEl.children[i].disabled = false;
        await wait(RM ? 0 : 520);
      }

      await wait(RM ? 0 : 900);
      cursorEl.classList.remove('is-on');
      running = false;
      runBtn.disabled = false;
    });

    select(active);
  })();

  /* ══ STAGED INTAKE FLOW ══ */
  var form = $('#form'), msg = $('#formMsg'), submit = $('#submit');
  var steps = Array.prototype.slice.call(form.querySelectorAll('.pane-step'));
  var flowN = $('#flowN'), flowBar = $('#flowBar'), flowTtl = $('#flowTtl');
  var flowLive = $('#flowLive'), recap = $('#recap');
  var TITLES = ['What you need','Scope and timing','Your details','Check and send'];
  var cur = 0;

  function show(i, announce){
    cur = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach(function(s, n){
      if(n === cur) s.setAttribute('data-on',''); else s.removeAttribute('data-on');
    });
    flowN.textContent = String(cur + 1).padStart(2,'0');
    flowBar.style.transform = 'scaleX(' + ((cur + 1) / steps.length) + ')';
    flowTtl.textContent = TITLES[cur];
    if(cur === steps.length - 1) buildRecap();
    if(announce){
      flowLive.textContent = 'Step ' + (cur + 1) + ' of ' + steps.length + ': ' + TITLES[cur];
      var f = steps[cur].querySelector('input:not([type=radio]), textarea, input[type=radio]');
      if(f) try{ f.focus({preventScroll:true}); }catch(e){}
    }
  }

  function stepValid(i){
    var s = steps[i];
    var ok = true;
    /* radio groups */
    var names = {};
    s.querySelectorAll('input[type=radio][required]').forEach(function(r){ names[r.name] = true; });
    Object.keys(names).forEach(function(n){
      if(!form.querySelector('input[name="' + n + '"]:checked')) ok = false;
    });
    /* text fields */
    s.querySelectorAll('input:not([type=radio]), textarea').forEach(function(f){
      if(!f.checkValidity()){ ok = false; f.reportValidity(); }
    });
    if(!ok && Object.keys(names).length){
      var first = s.querySelector('input[type=radio]');
      if(first && !form.querySelector('input[name="' + first.name + '"]:checked')) first.focus();
    }
    return ok;
  }

  function val(n){
    var el = form.querySelector('[name="' + n + '"]:checked') || form.querySelector('[name="' + n + '"]');
    return el ? el.value.trim() : '';
  }

  function buildRecap(){
    var rows = [
      ['Need', val('need')],
      ['Working together', val('model')],
      ['Timeline', val('timing')],
      ['Name', (val('firstName') + ' ' + val('lastName')).trim()],
      ['Email', val('email')]
    ];
    if(val('company')) rows.push(['Company', val('company')]);
    recap.innerHTML = rows.filter(function(r){ return r[1]; }).map(function(r){
      return '<div><dt>' + r[0] + '</dt><dd>' + r[1].replace(/</g,'&lt;') + '</dd></div>';
    }).join('');
  }

  form.addEventListener('click', function(e){
    var next = e.target.closest('[data-next]');
    var back = e.target.closest('[data-back]');
    if(next){ if(stepValid(cur)) show(cur + 1, true); }
    if(back){ show(cur - 1, true); }
  });

  /* advance on radio pick in step 1 */
  form.querySelectorAll('input[name="need"]').forEach(function(r){
    r.addEventListener('change', function(){
      setTimeout(function(){ if(cur === 0) show(1, true); }, 260);
    });
  });

  /* Phones: a 4-column comparison table only shows one plan at a time in a
     sideways scroller, so the same data is rebuilt as one card per plan.
     Built here, before the [data-plan] links below get their handlers. */
  (function planCards(){
    var t = document.querySelector('.eng__scroll .tbl');
    if(!t || !t.tHead || !t.tBodies[0]) return;
    var heads = [].slice.call(t.tHead.rows[0].cells, 1);
    var rows = [].slice.call(t.tBodies[0].rows);
    var foot = t.tFoot ? [].slice.call(t.tFoot.rows[0].cells, 1) : [];
    var wrap = document.createElement('div');
    wrap.className = 'plans-m';
    heads.forEach(function(h, i){
      var best = h.querySelector('.tbl__best');
      var card = document.createElement('article');
      card.className = 'plan-m' + (best ? ' is-best' : '');
      var html = '<header class="plan-m__h">' + (best ? '<span class="tbl__best">Most popular</span>' : '') +
        '<h4>' + h.querySelector('.tbl__name').textContent + '</h4></header><ul class="plan-m__l">';
      rows.forEach(function(r, ri){
        var c = r.cells[i + 1], label = r.cells[0].textContent.trim();
        if(!c) return;
        if(ri === 0){ html = html.replace('</h4></header>', '</h4><p>' + c.textContent.trim() + '</p></header>'); return; }
        var no = c.classList.contains('no'), yes = !!c.querySelector('svg');
        html += '<li class="' + (no ? 'is-no' : '') + '"><span>' + label + '</span><b>' +
          (no ? 'Not included' : yes ? 'Included' : c.textContent.trim()) + '</b></li>';
      });
      card.innerHTML = html + '</ul>';
      var cta = foot[i] && foot[i].querySelector('a');
      if(cta) card.appendChild(cta.cloneNode(true));
      wrap.appendChild(card);
    });
    var sc = t.closest('.eng__scroll');
    sc.parentNode.insertBefore(wrap, sc.nextSibling);
  })();

  /* deep link from the pricing table */
  document.querySelectorAll('[data-plan]').forEach(function(a){
    a.addEventListener('click', function(){
      var map = {Starter:'Not sure yet', Growth:'Paid social ads', 'Full Funnel':'Paid social ads'};
      var modelMap = {Starter:'Monthly', Growth:'Monthly', 'Full Funnel':'Monthly'};
      var plan = a.getAttribute('data-plan');
      var need = form.querySelector('input[name="need"][value="' + map[plan] + '"]');
      var model = form.querySelector('input[name="model"][value="' + modelMap[plan] + '"]');
      if(need) need.checked = true;
      if(model) model.checked = true;
      var ms = $('#ms');
      if(ms && !ms.value) ms.value = 'Interested in the ' + plan + ' plan. ';
      show(1, false);
    });
  });

  show(0, false);

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(!stepValid(2)){ show(2, true); return; }
    var label = submit.innerHTML;
    submit.disabled = true; submit.style.opacity = '.6'; submit.textContent = 'Sending…';
    msg.textContent = ''; msg.removeAttribute('data-t');

    var fd = new FormData(form);
    fetch('https://formspree.io/f/xqaqodgw', {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify({
        name: (fd.get('firstName')||'') + ' ' + (fd.get('lastName')||''),
        email: fd.get('email'),
        company: fd.get('company') || '',
        building: fd.get('need') || '',
        engagement: fd.get('model') || '',
        timeline: fd.get('timing') || '',
        message: fd.get('message')
      })
    }).then(function(r){
      if(!r.ok) throw 0;
      form.innerHTML =
        '<div class="form__done">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>' +
          '<h3>Message sent</h3><p>I will get back to you within 24 hours.</p>' +
          '<a class="btn btn--line" href="https://plaith.ai/elijahrose/booking" target="_blank" rel="noopener">Book a call instead</a>' +
        '</div>';
    }).catch(function(){
      submit.disabled = false; submit.style.opacity = ''; submit.innerHTML = label;
      msg.setAttribute('data-t','err');
      msg.textContent = 'Something went wrong. Email elijah@kazi-orchestrate.com directly.';
    });
  });
})();
