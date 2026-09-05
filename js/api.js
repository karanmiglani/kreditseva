const BASE_URL = window.location.origin;
let phoneTimer;
let phoneNumberSave = false;
let phoneNumber = null;
let phoneRegex = /^[6-9][0-9]{9}$/;
let lastSavedphoneNumber = '';
let applyStep = 1;
const applyPhone = document.getElementById('af-phone');

function getApplyProduct() {
  const urlProduct = new URLSearchParams(window.location.search).get('product');
  const formProduct = document.getElementById('af-product')?.value;
  const lsProduct = localStorage.getItem('product');
  return urlProduct || formProduct || lsProduct || 'personal-loan';
}

function setApplyNextVisible(visible, btnId = 'ap-next-btn') {
  const nextBtn = document.getElementById(btnId);
  if (!nextBtn) return;
  nextBtn.classList.toggle('is-visible', !!visible);
}

function bindPhoneSave(input, errId) {
  if (!input) return;
  input.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 10);
    clearTimeout(phoneTimer);

    const current = this.value.trim();
    if (current !== lastSavedphoneNumber || !phoneNumberSave) {
      phoneNumberSave = false;
      syncApplyStep1Next();
    }

    phoneTimer = setTimeout(() => {
      phoneNumber = this.value.trim();
      if (phoneNumber.length < 10) return;
      if (!phoneRegex.test(phoneNumber)) {
        if (errId) showMessage(errId, 'Please enter valid mobile number');
        return;
      }
      if (phoneNumber === lastSavedphoneNumber && phoneNumberSave) {
        syncApplyStep1Next();
        return;
      }
      lastSavedphoneNumber = phoneNumber;
      savePhoneNumber();
    }, 500);
  });
}

// Apply-now phone — save to DB as soon as valid number is entered
bindPhoneSave(applyPhone, 'err-phone');

async function savePhoneNumber() {
  const product = getApplyProduct();
  localStorage.setItem('product', product);
  try {
    const resp = await fetch(`${BASE_URL}/api/leads/save-phone-number`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        phone_number: phoneNumber,
        product
      })
    });
    const data = await resp.json();
    if (data.success) {
      sessionStorage.setItem('id', data.rawLeadId);
      phoneNumberSave = true;
      syncApplyStep1Next();
      if (typeof showToast === 'function') showToast(data.message || 'Mobile number saved');
    } else {
      phoneNumberSave = false;
      syncApplyStep1Next();
      showMessage('err-phone', data.message || 'Could not save mobile number');
    }
  } catch (error) {
    console.error('savePhoneNumber:', error);
    phoneNumberSave = false;
    syncApplyStep1Next();
    showMessage('err-phone', 'Network error. Please try again.');
  }
}

const APPLY_STEP_META = {
  1: {
    width: '33%',
    label: 'Step 1',
    title: 'Loan Type & Mobile Number',
    sub: 'Pick the loan you want and the number we should verify.'
  },
  2: {
    width: '66%',
    label: 'Step 2',
    title: 'How You Earn & Where',
    sub: 'Your occupation and city decide which lenders can match you.'
  },
  3: {
    width: '100%',
    label: 'Step 3',
    title: 'Income & Your Details',
    sub: 'Share your income, required amount, name, and PAN if available.'
  }
};

function isValidApplyCity(value) {
  return /^[a-zA-Z\s.'-]{2,60}$/.test((value || '').trim());
}

/*
 * A step's Continue stays dimmed until every field on that step is filled, so
 * the two questions merged into each step are gated together rather than one
 * unlocking the button on its own.
 */
function applyHasSavedPhone() {
  const typed = (document.getElementById('af-phone')?.value || '').trim();
  const saved = phoneNumberSave || !!sessionStorage.getItem('id');
  // A number in the box must be a valid one that reached the server. An empty
  // box still passes on a saved session: send-otp works off the lead id, not
  // this field, so a reloaded page must not strand the user.
  if (typed) return phoneRegex.test(typed) && saved;
  return saved;
}

function syncApplyStep1Next() {
  const product = document.getElementById('af-product')?.value || '';
  setApplyNextVisible(!!product && applyHasSavedPhone(), 'ap-next-btn-1');
}

function syncApplyStep2Next() {
  const occupation = document.getElementById('af-occupation')?.value || '';
  const city = document.getElementById('af-city')?.value || '';
  setApplyNextVisible(!!occupation && isValidApplyCity(city), 'ap-next-btn-2');
}

function syncCityField() {
  const city = document.getElementById('af-city')?.value || '';
  const valid = isValidApplyCity(city);
  const err = document.getElementById('err-city');
  if (err && city.trim().length > 0 && !valid) {
    err.textContent = 'Please enter a valid city name';
    err.style.display = 'block';
  } else if (err) {
    err.textContent = '';
    err.style.display = 'none';
  }
  syncApplyStep2Next();
}

window.syncApplyStep1Next = syncApplyStep1Next;
window.syncApplyStep2Next = syncApplyStep2Next;

/*
 * Changing step used to send the window to the top, which on a phone threw
 * the fields being read off-screen. Correct the scroll only when the card is
 * genuinely out of view, and never further than the top of the card.
 */
function keepApplyFormInView() {
  const card = document.querySelector('.ap-card');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const outOfView = rect.top < 0 || rect.top > window.innerHeight * 0.5;
  if (!outOfView) return;
  window.scrollTo({ top: window.scrollY + rect.top - 16, behavior: 'smooth' });
}

function goToApplyStep(step) {
  const target = document.getElementById('ap-step-' + step);
  if (!target) return;

  if (step === 2) {
    if (!document.getElementById('af-product')?.value) {
      showMessage('err-product', 'Please select a loan type');
      return;
    }
    if (!applyHasSavedPhone()) {
      showMessage('err-phone', 'Please enter a valid mobile number first');
      return;
    }
  }

  if (step === 3) {
    if (!document.getElementById('af-occupation')?.value) {
      showMessage('err-occupation', 'Please select your occupation');
      return;
    }
    if (!isValidApplyCity(document.getElementById('af-city')?.value)) {
      showMessage('err-city', 'Please enter a valid city name');
      return;
    }
  }

  document.querySelectorAll('.ap-step').forEach((el) => el.classList.remove('active'));
  target.classList.add('active');
  applyStep = step;

  const meta = APPLY_STEP_META[step];
  const fill = document.getElementById('ap-progress-fill');
  const label = document.getElementById('ap-progress-label');
  const title = document.getElementById('ap-form-title');
  const sub = document.getElementById('ap-form-sub');
  if (meta) {
    if (fill) fill.style.width = meta.width;
    if (label) label.textContent = meta.label;
    if (title) title.textContent = meta.title;
    if (sub) {
      if (step === 3 && document.getElementById('af-product')?.value === 'debt-consolidation') {
        sub.textContent = 'Enter income, total outstanding amount, name, and PAN (optional).';
      } else {
        sub.textContent = meta.sub;
      }
    }
  }

  if (step === 1) {
    if (typeof initApplyProductSelect2 === 'function') initApplyProductSelect2();
    syncApplyStep1Next();
  }

  if (step === 2) {
    syncApplyStep2Next();
    // preventScroll: focusing a field must not undo the scroll rule above
    setTimeout(() => document.getElementById('af-city')?.focus({ preventScroll: true }), 120);
  }

  if (step === 3) {
    if (typeof updateApplyAmountField === 'function') updateApplyAmountField();
    const occ = document.getElementById('af-occupation')?.value;
    const incomeLabel = document.getElementById('ap-income-label');
    if (incomeLabel) {
      incomeLabel.innerHTML = (occ === 'self-employed' ? 'Annual Income' : 'Net Monthly Income') + ' <span>*</span>';
    }
    if (typeof initApplyIncomeSelect2 === 'function') initApplyIncomeSelect2();
  }

  keepApplyFormInView();
}

function selectApplyOccupation(occ) {
  const input = document.getElementById('af-occupation');
  if (!input || !occ) return;
  input.value = occ;

  document.querySelectorAll('.ap-occ-card').forEach((card) => {
    const active = card.getAttribute('data-occ') === occ;
    card.classList.toggle('active', active);
    card.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  const err = document.getElementById('err-occupation');
  if (err) {
    err.textContent = '';
    err.style.display = 'none';
  }

  syncApplyStep2Next();

  if (typeof updateApplyIncomeField === 'function') {
    updateApplyIncomeField();
  }
}

window.goToApplyStep = goToApplyStep;
window.selectApplyOccupation = selectApplyOccupation;

document.querySelectorAll('.ap-occ-card').forEach((card) => {
  card.addEventListener('click', function () {
    selectApplyOccupation(this.getAttribute('data-occ'));
  });
});

document.getElementById('af-city')?.addEventListener('input', function () {
  this.value = this.value.replace(/[^a-zA-Z\s.'-]/g, '');
  syncCityField();
});

document.getElementById('af-city')?.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && isValidApplyCity(this.value)) {
    e.preventDefault();
    // Step 4 later — keep Next visible only for now
  }
});

// Top back button: within wizard go previous step
document.querySelector('.ap-back-btn')?.addEventListener('click', function (e) {
  if (applyStep > 1) {
    e.preventDefault();
    goToApplyStep(applyStep - 1);
  }
});

// ── Hero form redirect — consent check then apply-now ──
function redirect(product = '') {
  const agree = document.getElementById('ks-agree');
  if (agree && !agree.checked) {
    if (document.getElementById('err-ksAgree')) {
      showMessage('err-ksAgree', 'Please agree to continue');
    } else if (typeof showToast === 'function') {
      showToast('Please agree to continue');
    }
    return;
  }
  window.location.href = '/apply-now?product=' + encodeURIComponent(product);
}

// Collect all apply-now form fields (used on OTP Submit)
function collectApplyFormData() {
  const occupation = document.getElementById('af-occupation').value;
  const name = document.getElementById('af-name').value.trim().toLowerCase();
  const city = document.getElementById('af-city').value.trim().toLowerCase();
  const net_monthly_salary = document.getElementById('af-income').value;
  const product = document.getElementById('af-product').value;
  const loanAmountRaw = document.getElementById('af-loan-amount').value;
  const loan_amount = product === 'credit-card' ? null : loanAmountRaw;
  const panRaw = (document.getElementById('af-pan').value || '').trim().toUpperCase();
  const pancard = panRaw || null;
  return { occupation, name, city, net_monthly_salary, product, loan_amount, pancard };
}

// ── Step 6 Submit → send OTP → open Verify OTP popup ──
// Form is NOT saved here. It is saved only after the user enters the OTP and clicks Submit.
let applyOtpResendTimer = null;
let applyOtpResendSeconds = 0;

function maskPhone(phone) {
  const p = String(phone || '');
  if (p.length < 4) return p;
  return p.slice(0, 2) + '******' + p.slice(-2);
}

function closeApplyOtpPopup() {
  const overlay = document.getElementById('apOtpOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
}

function openApplyOtpPopup() {
  const overlay = document.getElementById('apOtpOverlay');
  const input = document.getElementById('apOtpInput');
  const err = document.getElementById('apOtpErr');
  const sub = document.getElementById('apOtpSub');
  const phone = document.getElementById('af-phone')?.value || phoneNumber || '';
  if (!overlay) return;

  if (sub) {
    sub.innerHTML = `Enter the OTP sent to <strong>+91 ${maskPhone(phone)}</strong>`;
  }
  if (input) input.value = '';
  if (err) err.textContent = '';
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => input?.focus(), 80);
}

function startApplyOtpResendCooldown(seconds = 90) {
  const btn = document.getElementById('apOtpResend');
  if (!btn) return;
  clearInterval(applyOtpResendTimer);
  applyOtpResendSeconds = Number(seconds) || 90;;
  btn.disabled = true;
  btn.textContent = `Resend OTP in ${applyOtpResendSeconds}s`;
  applyOtpResendTimer = setInterval(() => {
    applyOtpResendSeconds -= 1;
    if (applyOtpResendSeconds <= 0) {
      clearInterval(applyOtpResendTimer);
      btn.disabled = false;
      btn.textContent = 'Resend OTP';
      return;
    }
    btn.textContent = `Resend OTP in ${applyOtpResendSeconds}s`;
  }, 1000);
}

// Calls existing backend: POST /api/leads/send-otp
async function sendApplyOtp() {
  const rawLeadId = sessionStorage.getItem('id');

  // ==========================================
  // SESSION CHECK
  // ==========================================
  if (!rawLeadId) {
    if (typeof showToast === 'function') {
      showToast(
        'Session expired, Please enter your phone number to continue...'
      );
    }

    goToApplyStep(1);
    return false;
  }

  // ==========================================
  // PHONE CHECK
  // ==========================================
  const mobile = (
    document.getElementById('af-phone')?.value ||
    phoneNumber ||
    ''
  ).trim();

  if (mobile && !phoneRegex.test(mobile)) {
    showMessage('err-phone', 'Please enter valid mobile number');
    return false;
  }

  try {
    // ==========================================
    // SEND OTP API
    // ==========================================
    const resp = await fetch(`${BASE_URL}/api/leads/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        rawLeadId,
        phone_number: mobile,
        product: getApplyProduct()
      })
    });

    const data = await resp.json().catch(() => ({}));

    // ==========================================
    // OTP SENT SUCCESSFULLY
    // ==========================================
    if (resp.ok && data.success) {

      if (typeof showToast === 'function') {
        showToast(
          data.message ||
          'OTP sent to your mobile number'
        );
      }

      // Backend decides cooldown
      startApplyOtpResendCooldown(
        Number(data.retryAfter) || 90
      );

      return true;
    }

    // ==========================================
    // RATE LIMITED
    // ==========================================
    if (data.rateLimited) {

      // If backend sends remaining cooldown,
      // sync frontend timer with backend
      if (data.retryAfter) {
        startApplyOtpResendCooldown(
          Number(data.retryAfter)
        );
      }

      if (typeof showToast === 'function') {
        showToast(
          data.message ||
          'Please wait before requesting another OTP.'
        );
      }

      return false;
    }

    // ==========================================
    // OTHER API ERROR
    // ==========================================
    if (typeof showToast === 'function') {
      showToast(
        data.message ||
        'Could not send OTP. Please try again.'
      );
    }

    return false;

  } catch (error) {

    // ==========================================
    // NETWORK / SERVER ERROR
    // ==========================================
    console.error('sendApplyOtp:', error);

    if (typeof showToast === 'function') {
      showToast(
        'Network error. Please try again.'
      );
    }

    return false;
  }
}

// Step 6 Submit: validate form → send OTP → open popup (do not save lead yet)
async function submitForm() {
  const agree = document.getElementById('ks-agree');
  if (agree && !agree.checked) {
    showMessage('err-ksAgree', 'Please agree to continue');
    return;
  }

  const form = collectApplyFormData();
  if (!form.occupation) { showMessage('err-occupation', 'Please select occupation'); return; }
  if (!form.name) { showMessage('err-name', 'Please enter your name'); return; }
  if (!form.city) { showMessage('err-city', 'Please enter city'); return; }
  if (!form.net_monthly_salary) { showMessage('err-income', 'Please select income'); return; }
  if (!form.product) { showMessage('err-product', 'Please select product'); return; }
  if (form.product !== 'credit-card' && !form.loan_amount) {
    showMessage('err-loan-amount', 'Please enter loan amount');
    return;
  }
  if (form.pancard && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pancard)) {
    showMessage('err-pan', 'Please enter a valid PAN (e.g. ABCDE1234F)');
    return;
  }

  if (!sessionStorage.getItem('id')) {
    if (typeof showToast === 'function') showToast('Session expired, Please enter your phone number to continue...');
    goToApplyStep(1);
    return;
  }

  const btn = document.getElementById('apply-btn');
  const btnText = btn?.querySelector('.ap-btn-text');
  const btnSpinner = btn?.querySelector('.ap-btn-spinner');
  if (btn) btn.disabled = true;
  if (btnText) btnText.style.display = 'none';
  if (btnSpinner) btnSpinner.style.display = 'inline-flex';

  try {
    const sent = await sendApplyOtp();
    if (sent) openApplyOtpPopup();
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.style.display = 'inline';
    if (btnSpinner) btnSpinner.style.display = 'none';
  }
}

// OTP popup Submit: OTP + form details → /apply-now/save-lead
async function saveApplyWithOtp() {
  const otp = (document.getElementById('apOtpInput')?.value || '').trim();
  const err = document.getElementById('apOtpErr');
  const saveBtn = document.getElementById('apOtpSave');

  if (!/^\d{4,6}$/.test(otp)) {
    if (err) err.textContent = 'Please enter a valid OTP';
    return;
  }
  if (err) err.textContent = '';

  // Re-read latest form values at save time
  const form = collectApplyFormData();
  const rawLeadId = sessionStorage.getItem('id');
  if (!rawLeadId) {
    if (err) err.textContent = 'Session expired. Please start again.';
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Submitting...';
  }

  const successBox = document.getElementById('apply-success');
  const successMsg = document.getElementById('apply-success-msg');
  const applyBtn = document.getElementById('apply-btn');

  try {
    const resp = await fetch(`${BASE_URL}/apply-now/save-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawLeadId,
        otp,
        ...form,
        source: window.location.pathname
      })
    });
    const data = await resp.json().catch(() => ({}));

    if (data.success) {
      closeApplyOtpPopup();
      document.querySelectorAll('.ap-step').forEach((el) => el.classList.remove('active'));
      if (applyBtn) applyBtn.style.display = 'none';
      if (successBox) successBox.style.display = 'block';
      if (successMsg) {
        successMsg.style.display = 'block';
        successMsg.style.color = '#15803d';
        successMsg.innerText = data.message || 'Application submitted successfully';
      }
      localStorage.clear();
      sessionStorage.clear();
      if (typeof showCelebration === 'function') showCelebration();
      if (typeof showToast === 'function') showToast(data.message || 'Application saved successfully');

      /*
       * Home, not reload. Reloading dropped the user back on an empty form,
       * which reads as if the submission failed. The note in the success box
       * says this is coming, so the navigation is not a surprise.
       */
      setTimeout(() => { window.location.href = '/'; }, 6000);
    } else {
      if (err) err.textContent = data.message || 'Invalid OTP or save failed. Try again.';
      if (data.rawLeadId === null) {
        if (typeof showToast === 'function') showToast(data.message || 'Session expired');
        setTimeout(() => window.location.reload(), 2500);
      }
    }
  } catch (e) {
    console.error(e);
    if (err) err.textContent = 'Network error. Please try again.';
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Submit';
    }
  }
}

// OTP popup UI events
document.getElementById('apOtpClose')?.addEventListener('click', closeApplyOtpPopup);
document.getElementById('apOtpOverlay')?.addEventListener('click', function (e) {
  if (e.target === this) closeApplyOtpPopup();
});
document.getElementById('apOtpInput')?.addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 6);
  const errEl = document.getElementById('apOtpErr');
  if (errEl) errEl.textContent = '';
});
document.getElementById('apOtpSave')?.addEventListener('click', saveApplyWithOtp);
document.getElementById('apOtpResend')?.addEventListener('click', async function () {
  if (this.disabled) return;
   await sendApplyOtp();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeApplyOtpPopup();
  if (e.key === 'Enter' && document.getElementById('apOtpOverlay')?.classList.contains('active')) {
    e.preventDefault();
    saveApplyWithOtp();
  }
});

window.submitForm = submitForm;
window.saveApplyWithOtp = saveApplyWithOtp;
window.closeApplyOtpPopup = closeApplyOtpPopup;

function showMessage(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.textContent = ''; el.style.display = 'none'; }, 3000);
}
