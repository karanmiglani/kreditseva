/* ============================================================
   PARTNER FORM SECTION JS
   Add to your custom.js or include as separate script
============================================================ */

(function () {
  const fields = ['pf-name', 'pf-mobile', 'pf-location', 'pf-firm', 'pf-dsa-type'];

  function updateProgress() {
    const filled = fields.filter(id => (document.getElementById(id)?.value || '').trim() !== '').length;
    const pct = Math.round((filled / fields.length) * 100);
    const fill = document.getElementById('progressFill');
    const label = document.getElementById('progressLabel');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = filled + ' of ' + fields.length + ' filled';
  }

  window.selectDSAType = function (type) {
    ['Company', 'Individual'].forEach(t => {
      document.getElementById('type-' + t.toLowerCase())?.classList.toggle('active', t === type);
    });
    const hidden = document.getElementById('pf-dsa-type');
    if (hidden) hidden.value = type;
    updateProgress();
  };

  function validate() {
    const rules = [
      { id: 'pf-name',     errId: 'err-name',     fieldId: 'field-name',     msg: 'Please enter your full name.',           test: v => v.trim().length >= 2 },
      { id: 'pf-mobile',   errId: 'err-mobile',   fieldId: 'field-mobile',   msg: 'Enter a valid 10-digit mobile number.',  test: v => /^[6-9]\d{9}$/.test(v.trim()) },
      { id: 'pf-location', errId: 'err-location', fieldId: 'field-location', msg: 'Please enter your city / location.',     test: v => v.trim().length >= 2 },
      { id: 'pf-firm',     errId: 'err-firm',     fieldId: 'field-firm',     msg: 'Please enter your firm or partner name.', test: v => v.trim().length >= 2 },
    ];

    let ok = true;
    rules.forEach(r => {
      const val = document.getElementById(r.id)?.value || '';
      const pass = r.test(val);
      const errEl = document.getElementById(r.errId);
      const fieldEl = document.getElementById(r.fieldId);
      if (errEl) errEl.textContent = pass ? '' : r.msg;
      fieldEl?.classList.toggle('error', !pass);
      if (!pass) ok = false;
    });
    return ok;
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Live progress update
    ['pf-name', 'pf-mobile', 'pf-location', 'pf-firm'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', function () {
        const fieldId = 'field-' + id.replace('pf-', '');
        document.getElementById(fieldId)?.classList.remove('error');
        const errId = 'err-' + id.replace('pf-', '');
        const errEl = document.getElementById(errId);
        if (errEl) errEl.textContent = '';
        updateProgress();
      });
    });

    updateProgress();

    // Form submit
    document.getElementById('partnerForm')?.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      const btn = this.querySelector('.pf-submit');
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
        btn.disabled = true;
      }

      setTimeout(() => {
        const form = document.getElementById('partnerForm');
        const progress = document.getElementById('progressFill')?.closest('.pf-progress');
        const header = document.querySelector('.pf-form-header');
        const success = document.getElementById('successMsg');

        if (form) form.style.display = 'none';
        if (progress) progress.style.display = 'none';
        if (header) header.style.display = 'none';
        if (success) success.style.display = 'flex';
      }, 1400);
    });
  });
})();

function scrollToSection() {
  document.getElementById('pf-section').scrollIntoView({
    behavior: 'smooth'
  });
}