// Chapters globe + mockup ZIP finder. A plain script (not a module) so it also runs when the page is opened from a file.
(() => {
// Chapters globe (cobe, a tiny WebGL dotted globe) + the mockup ZIP finder.
const canvas = document.getElementById('globe');
const chapters = [...document.querySelectorAll('.chapter[data-lat]')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const toAngles = (lat, lng) => [Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180];

let target = toAngles(29.62, -95.63);
let you = null; // [lat, lng] once a ZIP is searched
let setYou = () => {};

// focus a chapter card + spin there
const focus = (lat, lng) => { target = toAngles(lat, lng); };
chapters.forEach((c) => c.addEventListener('click', () => {
  chapters.forEach((x) => { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', String(x === c)); });
  focus(+c.dataset.lat, +c.dataset.lng);
}));

if (canvas) {
  import('https://cdn.jsdelivr.net/npm/cobe@0.6.3/+esm').then(({ default: createGlobe }) => {
    let phi = target[0], theta = 0.3, width = 0, drag = null, dragDelta = 0, idle = true;
    const onResize = () => { width = canvas.offsetWidth; };
    addEventListener('resize', onResize);
    onResize();
    const base = chapters.map((c) => ({ location: [+c.dataset.lat, +c.dataset.lng], size: 0.09 }));
    let markers = base.slice();
    setYou = (loc) => { markers = loc ? [...base, { location: loc, size: 0.06 }] : base.slice(); globe && (state.markers = markers); };
    const state = {};
    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi,
      theta,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 16000,
      mapBrightness: 7,
      baseColor: [0.22, 0.32, 0.55],
      markerColor: [0.95, 0.71, 0.24],
      glowColor: [0.16, 0.24, 0.44],
      markers,
      onRender: (s) => {
        // ease toward the focused chapter; drift slowly when idle
        if (drag === null) {
          const d = ((target[0] - phi + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
          phi += idle ? d * 0.06 : 0;
          if (Math.abs(d) < 0.001 && !reduce) { idle = false; }
          if (!idle && !reduce) phi += 0.0016;
        }
        theta += ((target[1] * 0.85) - theta) * 0.06;
        s.phi = phi + dragDelta;
        s.theta = theta;
        s.width = width * 2;
        s.height = width * 2;
        s.markers = markers;
      },
    });
    // a new focus resumes the ease
    const _focus = focus;
    chapters.forEach((c) => c.addEventListener('click', () => { idle = true; }));
    document.addEventListener('globe:focus', () => { idle = true; });
    // drag to spin
    canvas.addEventListener('pointerdown', (e) => { drag = e.clientX; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => { if (drag !== null) dragDelta = (e.clientX - drag) / 200; });
    const end = () => { if (drag !== null) { phi += dragDelta; dragDelta = 0; drag = null; idle = false; } };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    requestAnimationFrame(() => canvas.classList.add('is-ready'));
  }).catch(() => { canvas.closest('.globe-wrap').hidden = true; });
}

// ---- mockup ZIP finder: ZIP prefix -> state centre -> nearest chapter (real lookup comes later) ----
const ZIP = [[10,27,'MA'],[28,29,'RI'],[30,38,'NH'],[39,49,'ME'],[50,54,'VT'],[55,55,'MA'],[56,59,'VT'],[60,69,'CT'],[70,89,'NJ'],[100,149,'NY'],[150,196,'PA'],[197,199,'DE'],[200,205,'DC'],[206,219,'MD'],[220,246,'VA'],[247,268,'WV'],[270,289,'NC'],[290,299,'SC'],[300,319,'GA'],[320,349,'FL'],[350,369,'AL'],[370,385,'TN'],[386,397,'MS'],[398,399,'GA'],[400,427,'KY'],[430,459,'OH'],[460,479,'IN'],[480,499,'MI'],[500,528,'IA'],[530,549,'WI'],[550,567,'MN'],[570,577,'SD'],[580,588,'ND'],[590,599,'MT'],[600,629,'IL'],[630,658,'MO'],[660,679,'KS'],[680,693,'NE'],[700,714,'LA'],[716,729,'AR'],[730,749,'OK'],[750,799,'TX'],[800,816,'CO'],[820,831,'WY'],[832,838,'ID'],[840,847,'UT'],[850,865,'AZ'],[870,884,'NM'],[885,885,'TX'],[889,898,'NV'],[900,961,'CA'],[967,968,'HI'],[970,979,'OR'],[980,994,'WA'],[995,999,'AK']];
const CENTRE = { AL:[32.8,-86.8],AK:[64.7,-152],AZ:[34.3,-111.7],AR:[34.9,-92.4],CA:[37.2,-119.5],CO:[39,-105.5],CT:[41.6,-72.7],DE:[39,-75.5],DC:[38.9,-77],FL:[28.6,-82.4],GA:[32.7,-83.4],HI:[20.8,-156.3],ID:[44.4,-114.6],IL:[40,-89.2],IN:[39.9,-86.3],IA:[42.1,-93.5],KS:[38.5,-98.4],KY:[37.5,-85.3],LA:[31.1,-92],ME:[45.4,-69.2],MD:[39,-76.8],MA:[42.3,-71.8],MI:[44.3,-85.4],MN:[46.3,-94.3],MS:[32.7,-89.7],MO:[38.4,-92.5],MT:[47,-109.6],NE:[41.5,-99.8],NV:[39.3,-116.6],NH:[43.7,-71.6],NJ:[40.2,-74.7],NM:[34.4,-106.1],NY:[42.9,-75.5],NC:[35.6,-79.4],ND:[47.5,-100.5],OH:[40.3,-82.8],OK:[35.6,-97.5],OR:[43.9,-120.6],PA:[40.9,-77.8],RI:[41.7,-71.5],SC:[33.9,-80.9],SD:[44.4,-100.2],TN:[35.9,-86.4],TX:[31.5,-99.3],UT:[39.3,-111.7],VT:[44.1,-72.7],VA:[37.5,-78.9],WA:[47.4,-120.5],WV:[38.6,-80.6],WI:[44.6,-89.9],WY:[43,-107.6] };
// each chapter's home state and the ZIP prefixes of its metro area
const LOCAL = { 'Sugar Land, Texas': { st: 'TX', zips: [770, 771, 772, 773, 774, 775] }, 'Atlanta, Georgia': { st: 'GA', zips: [300, 301, 302, 303, 311] } };
const miles = ([a, b], [c, d]) => {
  const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 3959 * 2 * Math.asin(Math.sqrt(x));
};
const finder = document.getElementById('finder');
if (finder) {
  const input = finder.querySelector('input');
  const out = document.getElementById('finder-out');
  finder.addEventListener('submit', (e) => {
    e.preventDefault();
    const z = input.value.trim();
    if (!/^\d{5}$/.test(z)) { out.innerHTML = 'Enter a 5-digit US ZIP code.'; input.focus(); return; }
    const p = +z.slice(0, 3);
    const st = (ZIP.find(([a, b]) => p >= a && p <= b) || [])[2];
    if (!st) { out.innerHTML = 'We couldn’t place that ZIP. You can always <a href="workshop.html">join a free online workshop</a>.'; return; }
    const me = CENTRE[st];
    let best = null;
    chapters.forEach((c) => {
      const loc = [+c.dataset.lat, +c.dataset.lng];
      const d = miles(me, loc);
      if (!best || d < best.d) best = { c, d };
    });
    // a chapter in your metro or your state beats raw distance
    const local = chapters.find((c) => LOCAL[c.querySelector('b').textContent]?.zips.includes(p));
    const sameState = chapters.find((c) => LOCAL[c.querySelector('b').textContent]?.st === st);
    const pick = local || sameState || best.c;
    const name = pick.querySelector('b').textContent;
    pick.click();
    if (local) out.innerHTML = `Good news: the <b>${name}</b> chapter is right in your area. <a href="workshop.html">Join a workshop</a>.`;
    else if (sameState) out.innerHTML = `There’s a chapter in your state: <b>${name}</b>. <a href="workshop.html">Join a workshop</a> or ask about one near you.`;
    else out.innerHTML = `Your nearest chapter is <b>${name}</b>, about ${Math.round(best.d / 50) * 50} miles away. No chapter near you yet: <a href="workshop.html">join online</a> or <a href="volunteer.html">start one</a>.`;
  });
}

})();
