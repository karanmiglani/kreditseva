/* ============================================================
   BECOME A PARTNER — JS
============================================================ */

(function () {

  /* ── Scroll reveal ── */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObs.observe(el));

  /* ── Count-up stats ── */
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.floor(ease * target);
      el.textContent = (target >= 1000 ? val.toLocaleString('en-IN') : val) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const countEls = document.querySelectorAll('.bp-count');
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target);
        countObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  countEls.forEach(el => countObs.observe(el));

  /* ── DSA type selector ── */
  const typeBtns = document.querySelectorAll('.bp-type-btn');
  const dsaTypeInput = document.getElementById('bp-dsa-type');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dsaTypeInput.value = btn.dataset.type;
    });
  });

  /* ── Progress bar ── */
  const fields = ['bp-name', 'bp-mobile', 'bp-location', 'bp-firm'];
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const total = fields.length + 1; // +1 for DSA type (always selected)

  function updateProgress() {
    let filled = 1; // DSA type always selected
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim()) filled++;
    });
    const pct = Math.round((filled / total) * 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = filled + ' of ' + total + ' filled';
  }

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateProgress);
  });

  /* ── Form validation & submit ── */
  const form = document.getElementById('partnerForm');
  const successBox = document.getElementById('bp-success');

  function setError(fieldId, errId, msg) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(errId);
    if (!field || !err) return;
    if (msg) {
      field.closest('.bp-field').classList.add('has-error');
      err.textContent = msg;
    } else {
      field.closest('.bp-field').classList.remove('has-error');
      err.textContent = '';
    }
  }

  function validate() {
    let ok = true;
    const name = document.getElementById('bp-name').value.trim();
    const mobile = document.getElementById('bp-mobile').value.trim();
    const location = document.getElementById('bp-location').value.trim();
    const firm = document.getElementById('bp-firm').value.trim();

    if (!name) { setError('bp-name', 'err-name', 'Name is required'); ok = false; }
    else setError('bp-name', 'err-name', '');

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      setError('bp-mobile', 'err-mobile', 'Enter a valid 10-digit mobile number'); ok = false;
    } else setError('bp-mobile', 'err-mobile', '');

    if (!location) { setError('bp-location', 'err-location', 'Location is required'); ok = false; }
    else setError('bp-location', 'err-location', '');

    if (!firm) { setError('bp-firm', 'err-firm', 'Firm / partner name is required'); ok = false; }
    else setError('bp-firm', 'err-firm', '');

    return ok;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate()) return;

      const btn = form.querySelector('.bp-submit');
      btn.classList.add('loading');
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

      await new Promise(r => setTimeout(r, 1200));

      form.style.display = 'none';
      successBox.style.display = 'block';
    });
  }

  /* ── FAQ accordion ── */
  const faqItems = document.querySelectorAll('.bp-faq-item');
  faqItems.forEach(item => {
    item.querySelector('.bp-faq-q').addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── Mobile input — numbers only ── */
  const mobileInput = document.getElementById('bp-mobile');
  if (mobileInput) {
    mobileInput.addEventListener('input', () => {
      mobileInput.value = mobileInput.value.replace(/\D/g, '').slice(0, 10);
      updateProgress();
    });
  }

})();
