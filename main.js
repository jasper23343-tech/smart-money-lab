(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero entrance, once
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));

  // nav: solid after the first scroll; phone menu
  const nav = document.getElementById('nav');
  const toggle = nav.querySelector('.nav__toggle');
  const solid = nav.classList.contains('is-scrolled');
  const onScroll = () => nav.classList.toggle('is-scrolled', solid || scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.querySelectorAll('.nav__links a, .nav .btn').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  // reveal on scroll, once
  const items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }


  // programs slideshow: arrows, dots, arrow keys and swipe; no autoplay
  const slides = document.querySelector('[data-slides]');
  if (slides) {
    const panels = [...slides.querySelectorAll('.card')];
    const dots = [...slides.querySelectorAll('.slides__dots button')];
    let cur = 0;
    const go = (n) => {
      const next = (n + panels.length) % panels.length;
      if (next === cur) return;
      const dir = n > cur ? 1 : -1;
      panels[cur].hidden = true; panels[cur].classList.remove('is-active');
      dots[cur].classList.remove('is-on'); dots[cur].removeAttribute('aria-current');
      cur = next;
      panels[cur].style.setProperty('--from', dir * 40 + 'px');
      panels[cur].hidden = false; panels[cur].classList.add('is-active');
      dots[cur].classList.add('is-on'); dots[cur].setAttribute('aria-current', 'true');
    };
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    slides.querySelector('[data-prev]').addEventListener('click', () => go(cur - 1));
    slides.querySelector('[data-next]').addEventListener('click', () => go(cur + 1));
    slides.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(cur + 1);
      if (e.key === 'ArrowLeft') go(cur - 1);
    });
    let x0 = null;
    const view = slides.querySelector('.slides__view');
    view.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    view.addEventListener('pointerup', (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 50) go(cur + (e.clientX < x0 ? 1 : -1)); x0 = null; });
  }

  // floating buttons (Apply now, board game): shown once the hero has scrolled away; each opens its own card
  const fabs = [...document.querySelectorAll('[data-fab]')];
  if (fabs.length) {
    const hero = document.querySelector('.hero');
    const parts = fabs.map((f) => ({ f, btn: f.querySelector('button'), menu: f.querySelector('[hidden], .fab__menu') }));
    const setMenu = (p, open) => { p.menu.hidden = !open; p.btn.setAttribute('aria-expanded', String(open)); };
    const check = () => {
      const show = scrollY > (hero ? hero.offsetHeight * 0.7 : 400);
      parts.forEach((p) => { p.f.classList.toggle('is-shown', show); if (!show) setMenu(p, false); });
    };
    addEventListener('scroll', check, { passive: true });
    check();
    parts.forEach((p) => p.btn.addEventListener('click', () => {
      const open = p.menu.hidden;
      parts.forEach((q) => setMenu(q, false));
      setMenu(p, open);
    }));
    document.addEventListener('click', (e) => { if (!fabs.some((f) => f.contains(e.target))) parts.forEach((p) => setMenu(p, false)); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') parts.forEach((p) => setMenu(p, false)); });
  }

  // educator reviews: arrows scroll the track one card at a time
  const track = document.querySelector('.rq-track');
  if (track) {
    const prev = document.querySelector('[data-rq-prev]'), next = document.querySelector('[data-rq-next]');
    const step = () => track.firstElementChild.getBoundingClientRect().width + 20;
    const sync = () => {
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    sync();
  }

  // reviews: open a note full size
  const box = document.getElementById('lightbox');
  if (box) {
    const bimg = box.querySelector('img'), btxt = box.querySelector('p');
    document.querySelectorAll('.note__open').forEach((b) => b.addEventListener('click', () => {
      bimg.src = b.dataset.full; btxt.textContent = b.dataset.quote; box.showModal();
    }));
    box.querySelector('.lightbox__close').addEventListener('click', () => box.close());
    box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  }

  // film: plays muted while on screen (unless the visitor paused it or prefers less motion)
  const film = document.getElementById('film');
  const btn = document.querySelector('[data-film-toggle]');
  if (film && btn) {
    let userPaused = reduce;
    const label = btn.querySelector('span');
    const icon = btn.querySelector('path');
    const sync = () => {
      const playing = !film.paused;
      label.textContent = playing ? 'Pause' : 'Play';
      btn.setAttribute('aria-pressed', String(playing));
      icon.setAttribute('d', playing ? 'M3 1.5h3v11H3zM8 1.5h3v11H8z' : 'M3 1.5v11L12 7z');
    };
    film.addEventListener('play', sync);
    film.addEventListener('pause', sync);
    btn.addEventListener('click', () => {
      if (film.paused) { userPaused = false; film.play(); } else { userPaused = true; film.pause(); }
    });
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !userPaused) film.play().catch(() => {});
      else if (!en.isIntersecting) film.pause();
    }, { threshold: 0.35 }).observe(film);
  }
})();
