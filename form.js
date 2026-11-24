// Sends a form on this site to the organisation's existing Google Form (same sheet as before)
// and emails a readable copy to contactus@smartmoneylab.info through FormSubmit.
(() => {
  const form = document.querySelector('form[data-google]');
  if (!form) return;
  const status = form.querySelector('.form__status');
  const btn = form.querySelector('button[type=submit]');
  const label = btn.querySelector('.cta__label');

  const errorFor = (el) => {
    if (el.validity.valueMissing) return el.type === 'checkbox' ? 'Choose at least one option.' : 'Please fill this in.';
    if (el.validity.typeMismatch && el.type === 'email') return 'Enter an email address like name@example.com.';
    if (el.validity.rangeUnderflow || el.validity.rangeOverflow) return 'Enter an age between 8 and 100.';
    return '';
  };
  const setErr = (field, msg) => {
    let p = field.querySelector('.field__err');
    const input = field.querySelector('input, select, textarea');
    if (!msg) { p?.remove(); input?.removeAttribute('aria-invalid'); return; }
    if (!p) { p = document.createElement('p'); p.className = 'field__err'; p.id = (input?.id || 'f') + '-err'; field.append(p); }
    p.textContent = msg;
    if (input) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', p.id); }
  };

  // a checkbox group is required as a whole: at least one ticked
  const groups = [...form.querySelectorAll('[data-required-group]')];
  const groupOk = (g) => g.querySelectorAll('input:checked').length > 0;

  form.addEventListener('input', (e) => {
    const field = e.target.closest('.field');
    if (field && field.querySelector('[aria-invalid]')) setErr(field, errorFor(e.target));
    const g = e.target.closest('[data-required-group]');
    if (g && groupOk(g)) setErr(g, '');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    let first = null;
    form.querySelectorAll('.field').forEach((field) => {
      const el = field.querySelector('input, select, textarea');
      if (!el) return;
      const msg = el.checkValidity() ? '' : errorFor(el);
      setErr(field, msg);
      if (msg && !first) first = el;
    });
    groups.forEach((g) => {
      const ok = groupOk(g);
      setErr(g, ok ? '' : 'Choose at least one option.');
      if (!ok && !first) first = g.querySelector('input');
    });
    if (first) { first.focus(); return; }

    btn.disabled = true;
    label.textContent = 'Sending…';
    try {
      // readable copy for the inbox: "Label: answer" instead of Google's entry IDs
      const copy = { _subject: `New ${form.dataset.kind || 'form'} response: ${form.querySelector('input[type=text]')?.value || ''}`.trim(), _template: 'table', _captcha: 'false' };
      form.querySelectorAll('.field, [data-required-group]').forEach((f) => {
        const label = (f.querySelector('label, legend')?.childNodes[0]?.textContent || '').trim();
        const els = [...f.querySelectorAll('input, select, textarea')];
        if (!label || !els.length) return;
        const val = els.filter((el) => !['checkbox', 'radio'].includes(el.type) || el.checked).map((el) => el.value).join(', ');
        copy[label] = val;
      });
      const mail = form.querySelector('input[type=email]');
      if (mail) copy._replyto = mail.value;
      const [g, m] = await Promise.allSettled([
        fetch(form.action, { method: 'POST', mode: 'no-cors', body: new FormData(form) }),
        fetch('https://formsubmit.co/ajax/contactus@smartmoneylab.info', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(copy) }),
      ]);
      if (g.status === 'rejected' && m.status === 'rejected') throw new Error('offline');
      const done = document.getElementById(form.dataset.done);
      form.hidden = true;
      done.hidden = false;
      done.querySelector('h2').focus();
      scrollTo({ top: done.getBoundingClientRect().top + scrollY - 120, behavior: 'smooth' });
    } catch {
      status.textContent = 'That didn’t go through. Check your connection and try again, or email contactus@smartmoneylab.info.';
      btn.disabled = false;
      label.textContent = form.dataset.label;
    }
  });
})();
