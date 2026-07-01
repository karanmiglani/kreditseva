(function () {
  var POPUPS = [
    {
      popupId: 'dcHomePopup',
      paths: ['/'],
      closeId: 'dcHomePopupClose',
      submitId: 'dcHomePopupSubmit',
      phoneId: 'dcHomePhone',
      phoneErrId: 'err-dcHomePhone',
      agreeId: 'ks-agree',
      agreeErrId: 'err-ksAgree'
    },
    {
      popupId: 'dcPagePopup',
      paths: ['/debt-consolidation'],
      closeId: 'dcPagePopupClose',
      submitId: 'dcPagePopupSubmit',
      phoneId: 'dcPagePhone',
      phoneErrId: 'err-dcPagePhone',
      agreeId: 'dc-popup-agree',
      agreeErrId: 'err-dcPopupAgree'
    }
  ];

  var path = window.location.pathname;
  var cfg = null;

  for (var i = 0; i < POPUPS.length; i++) {
    if (POPUPS[i].paths.indexOf(path) !== -1 && document.getElementById(POPUPS[i].popupId)) {
      cfg = POPUPS[i];
      break;
    }
  }

  if (!cfg) return;

  var popup = document.getElementById(cfg.popupId);
  var closeBtn = document.getElementById(cfg.closeId);
  var submitBtn = document.getElementById(cfg.submitId);
  var phoneInput = document.getElementById(cfg.phoneId);
  var phoneErr = document.getElementById(cfg.phoneErrId);
  var agreeErr = document.getElementById(cfg.agreeErrId);
  var agreeEl = document.getElementById(cfg.agreeId);
  var mobileRegex = /^[6-9]\d{9}$/;
  var reopenTimer = null;
  var REOPEN_DELAY = 7000;

  function showErr(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }

  function clearErr(el) {
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
  }

  function openPopup() {
    if (popup.classList.contains('active')) return;
    requestAnimationFrame(function () {
      popup.classList.add('active');
      popup.setAttribute('aria-hidden', 'false');
      document.body.classList.add('popup-open');
      setTimeout(function () {
        if (phoneInput) phoneInput.focus({ preventScroll: true });
      }, 200);
    });
  }

  function closePopup(reschedule) {
    popup.classList.remove('active');
    popup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('popup-open');
    if (reopenTimer) {
      clearTimeout(reopenTimer);
      reopenTimer = null;
    }
    if (reschedule) {
      reopenTimer = setTimeout(openPopup, REOPEN_DELAY);
    }
  }

  function scheduleInitialOpen() {
    function launch() {
      requestAnimationFrame(openPopup);
    }

    var loader = document.getElementById('ks-loader');
    if (loader && loader.style.display !== 'none' && !loader.classList.contains('ks-loader-hide')) {
      document.addEventListener('ks:loaderhidden', launch, { once: true });
      return;
    }

    launch();
  }

  closeBtn && closeBtn.addEventListener('click', function () { closePopup(true); });
  popup.addEventListener('click', function (e) {
    if (e.target === popup) closePopup(true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popup.classList.contains('active')) closePopup(true);
  });

  agreeEl && agreeEl.addEventListener('change', function () {
    if (this.checked) clearErr(agreeErr);
  });

  phoneInput && phoneInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
    clearErr(phoneErr);
  });

  submitBtn && submitBtn.addEventListener('click', async function () {
    clearErr(phoneErr);
    clearErr(agreeErr);

    if (agreeEl && !agreeEl.checked) {
      showErr(agreeErr, 'Please agree to continue');
      return;
    }

    var phone = phoneInput.value.trim();
    if (!mobileRegex.test(phone)) {
      showErr(phoneErr, 'Please enter a valid 10-digit mobile number');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.75';

    try {
      var resp = await fetch(window.location.origin + '/api/leads/save-phone-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone_number: phone, product: 'debt-consolidation' })
      });
      var data = await resp.json();

      if (data.success) {
        sessionStorage.setItem('id', data.rawLeadId || '');
        closePopup(false);
        if (typeof showToast === 'function') showToast(data.message || 'Redirecting...');
        setTimeout(function () {
          window.location.href = '/apply-now?product=debt-consolidation';
        }, 1200);
      } else {
        showErr(phoneErr, data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      showErr(phoneErr, 'Network error. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });

  scheduleInitialOpen();
})();
