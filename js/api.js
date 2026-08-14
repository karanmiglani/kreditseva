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
        occupation, pancard,
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
    console.error(err);
  } finally {
    btn.disabled             = false;
    btnText.style.display    = 'inline';
    btnSpinner.style.display = 'none';
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
