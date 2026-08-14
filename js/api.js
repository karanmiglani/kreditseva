const BASE_URL = window.location.origin;
let phoneTimer;
let phoneNumberSave = false;
let phoneNumber = null;
let phoneRegex = /^[6-9][0-9]{9}$/;
let lastSavedphoneNumber = '';
document.getElementById('btn-submit')?.setAttribute('disabled', 'disabled');
const heroPhone = document.getElementById('heroPhone');
const applyPhone = document.getElementById('af-phone');

function getApplyProduct() {
  const urlProduct = new URLSearchParams(window.location.search).get('product');
  const formProduct = document.getElementById('af-product')?.value;
  const lsProduct = localStorage.getItem('product');
  return urlProduct || formProduct || lsProduct || 'personal-loan';
}

function bindPhoneSave(input, errId) {
  if (!input) return;
  input.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 10);
    clearTimeout(phoneTimer);
    phoneTimer = setTimeout(() => {
      phoneNumber = this.value.trim();
      if (phoneNumber.length < 10) return;
      if (!phoneRegex.test(phoneNumber)) {
        if (errId) showMessage(errId, 'Please enter valid mobile number');
        return;
      }
      if (phoneNumber === lastSavedphoneNumber) return;
      lastSavedphoneNumber = phoneNumber;
      savePhoneNumber();
    }, 500);
  });
}

// Hero phone (homepage)
bindPhoneSave(heroPhone, 'err-heroPhone');

// Apply-now phone — save to DB as soon as valid number is entered
bindPhoneSave(applyPhone, 'err-phone');

async function savePhoneNumber(){
  const onApply = window.location.pathname === '/apply-now';
  const product = onApply
    ? getApplyProduct()
    : (window.location.pathname.replace('/', '') || 'personal-loan');
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
      if (onApply) {
        if (typeof showToast === 'function') showToast(data.message || 'Mobile number saved');
        sendOtp(phoneNumber);
      } else {
        if (typeof showToast === 'function') showToast('Please click on Proceed button to continue');
        const btn = document.getElementById('btn-submit');
        if (btn) btn.disabled = false;
      }
    } else if (onApply) {
      showMessage('err-phone', data.message || 'Could not save mobile number');
    }
  } catch (error) {
    console.log(error);
    if (onApply) showMessage('err-phone', 'Network error. Please try again.');
  }
}

// ── OTP (frontend only — backend endpoint to be wired later) ──
let otpSentFor = '';
let otpResendTimer = null;
let otpResendSeconds = 0;

function showOtpField() {
  const field = document.getElementById('ap-otp-field');
  const input = document.getElementById('af-otp');
  if (!field) return;
  field.style.display = '';
  if (input) {
    input.value = '';
    input.focus();
  }
}

function startOtpResendCooldown(seconds = 30) {
  const btn = document.getElementById('af-otp-resend');
  if (!btn) return;
  clearInterval(otpResendTimer);
  otpResendSeconds = seconds;
  btn.style.display = 'inline-block';
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.style.cursor = 'not-allowed';
  btn.textContent = `Resend OTP in ${otpResendSeconds}s`;
  otpResendTimer = setInterval(() => {
    otpResendSeconds -= 1;
    if (otpResendSeconds <= 0) {
      clearInterval(otpResendTimer);
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.textContent = 'Resend OTP';
      return;
    }
    btn.textContent = `Resend OTP in ${otpResendSeconds}s`;
  }, 1000);
}

async function sendOtp(phone) {
  const mobile = (phone || phoneNumber || document.getElementById('af-phone')?.value || '').trim();
  if (!phoneRegex.test(mobile)) {
    showMessage('err-phone', 'Please enter valid mobile number');
    return;
  }
  if (otpSentFor === mobile && otpResendSeconds > 0) return;

  showOtpField();

  try {
    const resp = await fetch(`${BASE_URL}/api/leads/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        phone_number: mobile,
        product: getApplyProduct()
      })
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok && data.success !== false) {
      otpSentFor = mobile;
      startOtpResendCooldown(30);
      if (typeof showToast === 'function') {
        showToast(data.message || 'OTP sent to your mobile number');
      }
    } else {
      showMessage('err-otp', data.message || 'Failed to send OTP. Please try again.');
    }
  } catch (error) {
    // Backend not ready yet — still show OTP field for UI flow
    console.log('sendOtp:', error);
    otpSentFor = mobile;
    startOtpResendCooldown(30);
    if (typeof showToast === 'function') {
      showToast('OTP sent to your mobile number');
    }
  }
}

document.getElementById('af-otp')?.addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 6);
  const err = document.getElementById('err-otp');
  if (err) err.textContent = '';
});

document.getElementById('af-otp-resend')?.addEventListener('click', function () {
  if (this.disabled) return;
  otpSentFor = '';
  sendOtp(document.getElementById('af-phone')?.value);
});

// ── Hero form redirect — consent + phone ──
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


// ── Cloudflare Turnstile (Apply Now) ──
let applyTurnstileToken = '';

function setApplySubmitEnabled(enabled) {
  const btn = document.getElementById('apply-btn');
  if (!btn) return;
  btn.disabled = !enabled;
  btn.style.opacity = enabled ? '1' : '0.55';
  btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
}

function onApplyTurnstileSuccess(token) {
  applyTurnstileToken = token || '';
  const err = document.getElementById('err-turnstile');
  if (err) err.textContent = '';
  setApplySubmitEnabled(true);
}

function onApplyTurnstileError() {
  applyTurnstileToken = '';
  setApplySubmitEnabled(false);
  showMessage('err-turnstile', 'Verification failed. Please try again.');
}

function onApplyTurnstileExpired() {
  applyTurnstileToken = '';
  setApplySubmitEnabled(false);
  showMessage('err-turnstile', 'Verification expired. Please check again.');
}

function resetApplyTurnstile() {
  applyTurnstileToken = '';
  setApplySubmitEnabled(false);
  if (window.turnstile) {
    try {
      window.turnstile.reset();
    } catch (e) {
      console.log(e);
    }
  }
}

window.onApplyTurnstileSuccess = onApplyTurnstileSuccess;
window.onApplyTurnstileError = onApplyTurnstileError;
window.onApplyTurnstileExpired = onApplyTurnstileExpired;

// ── Apply-now form submit ──
async function submitForm() {
  const occupation = document.getElementById('af-occupation').value;
  if (!occupation) { showMessage('err-occupation', 'Please select occupation'); return; }

  const name         = document.getElementById('af-name').value.trim().toLowerCase();
  if (!name) { showMessage('err-name', 'Please enter your name'); return; }

  const city = document.getElementById('af-city').value.trim().toLowerCase();
  if (!city) { showMessage('err-city', 'Please enter city'); return; }

  const net_monthly_salary = document.getElementById('af-income').value;
  if (!net_monthly_salary) { showMessage('err-income', 'Please select income'); return; }

  const product = document.getElementById('af-product').value;
  if (!product) { showMessage('err-product', 'Please select product'); return; }

  const loanAmountRaw = document.getElementById('af-loan-amount').value;
  const loan_amount = product === 'credit-card' ? null : loanAmountRaw;
  if(product !== 'credit-card' && !loan_amount) { showMessage('err-loan-amount','Please enter loan amount'); return; }

  const panRaw = (document.getElementById('af-pan').value || '').trim().toUpperCase();
  const pancard = panRaw || null;
  if (pancard && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pancard)) {
    showMessage('err-pan', 'Please enter a valid PAN (e.g. ABCDE1234F)');
    return;
  }

  const otpField = document.getElementById('ap-otp-field');
  const otp = (document.getElementById('af-otp')?.value || '').trim();
  if (otpField && otpField.style.display !== 'none') {
    if (!/^\d{4,6}$/.test(otp)) {
      showMessage('err-otp', 'Please enter the OTP sent to your mobile');
      return;
    }
  }

  const turnstileToken =
    applyTurnstileToken ||
    document.querySelector('textarea[name="cf-turnstile-response"]')?.value ||
    document.querySelector('input[name="cf-turnstile-response"]')?.value ||
    '';
  if (!turnstileToken) {
    showMessage('err-turnstile', 'Please complete the verification check');
    setApplySubmitEnabled(false);
    return;
  }

  const btn        = document.getElementById('apply-btn');
  const btnText    = btn.querySelector('.ap-btn-text');
  const btnSpinner = btn.querySelector('.ap-btn-spinner');
  const successBox = document.getElementById('apply-success');
  const successMsg = document.getElementById('apply-success-msg');

  btn.disabled = true;
  btnText.style.display   = 'none';
  btnSpinner.style.display = 'inline-flex';
  successBox.style.display = 'none';
  successMsg.style.display = 'none';
  if(!sessionStorage.getItem('id')){    
      successMsg.innerText     = 'Session expired, Please enter your phone number to continue...';
      successMsg.style.display = 'block';
      successMsg.style.color   = '#dc2626';
      showToast('Session expired, Please enter your phone number to continue...');
      setTimeout(() => {
        window.location.reload();
      },2000)
      return;
  }

  const rawLeadId = sessionStorage.getItem('id');

  try {
    
    const resp = await fetch(`${BASE_URL}/apply-now/save-lead`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawLeadId, name, city, net_monthly_salary, product, loan_amount,
        occupation, pancard, otp,
        'cf-turnstile-response': turnstileToken,
        source: window.location.pathname
      })
    });

    const data = await resp.json();
    if(!data.success && rawLeadId == null){
      showToast(data.message);
    }
    if (data.success) {
      btn.style.display        = 'none';
      successBox.style.display = 'block';
      successMsg.style.display = 'block';
      document.getElementById('applyForm').reset();
      localStorage.clear();
      sessionStorage.clear();
      if (typeof showCelebration === 'function') showCelebration();
      setTimeout(() => window.location.reload(), 5000);
    } else {
      successMsg.innerText     = data.message || 'Something went wrong';
      successMsg.style.display = 'block';
      successMsg.style.color   = '#dc2626';
      resetApplyTurnstile();
      if(data.rawLeadId === null){
         showToast(data.message);
         setTimeout(() => {
          window.location.reload();
         }, 3000);
      }
    }
  } catch (err) {
    successMsg.innerText     = 'Network error. Please try again.';
    successMsg.style.display = 'block';
    successMsg.style.color   = '#dc2626';
    resetApplyTurnstile();
    console.error(err);
  } finally {
    btnText.style.display    = 'inline';
    btnSpinner.style.display = 'none';
    setApplySubmitEnabled(!!applyTurnstileToken);
  }
}

function showMessage(id, msg) {

  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block'
  setTimeout(() => { el.textContent = '';el.style.display = 'none' }, 3000);
}


function creditCard(){
  if(!sessionStorage.getItem('id')){ showMessage('', 'Session expired, Please fill the application form again.')}
}
