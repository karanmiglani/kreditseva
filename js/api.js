const BASE_URL = window.location.origin;
const rawLeadId = sessionStorage?.getItem('id');
let phoneTimer;
let phoneNumberSave = false;
let phoneNumber = null;
let phoneRegex = /^[6-9][0-9]{9}$/;
let lastSavedphoneNumber = '';
document.getElementById('btn-submit')?.setAttribute('disabled', 'disabled');
const heroPhone = document.getElementById('heroPhone');

// User ka phone number lo
heroPhone?.addEventListener('input', function(){
  clearTimeout(phoneTimer);
  phoneTimer = setTimeout(()=> {
    phoneNumber = this.value;
    if(phoneNumber.length < 10) return;
    if(!phoneRegex.test(phoneNumber)){ showMessage('err-heroPhone','Please enter valid mobile number'); return; }
    if(phoneNumber === lastSavedphoneNumber) return;
    lastSavedphoneNumber = phoneNumber;
    savePhoneNumber();

  },500);  
});

if(window.location.pathname == '/apply-now' && rawLeadId){
  document.getElementById('ap-phone-field').style.display = 'none';
} else if (window.location.pathname !== '/apply-now') {
  // Not on apply-now page — open navbar popup if available
  const overlay = document.getElementById('navPopupOverlay');
  if (overlay) overlay.classList.add('active');
}
async function savePhoneNumber(){
  const product =  window.location.pathname.replace('/','');
  try {
        const resp = await fetch(`${BASE_URL}/api/leads/save-phone-number`,{
      method : 'POST',
      headers : { 
        'Content-Type' : 'application/json'
      },
      credentials : 'include',
      body : JSON.stringify({
        phone_number : phoneNumber,
        product : product
      })
    })
    const data = await resp.json();
    if(data.success){
      showToast(data.message);
      document.getElementById('btn-submit').disabled = false;
      sessionStorage.setItem('id', data.rawLeadID)
    }
  } catch (error) {
    console.log(error);
  }
}

// ── Hero form redirect — sirf phone validate karo ──
function redirect(product = '') {
  window.location.href = '/apply-now?product=' + encodeURIComponent(product);
}


// ── Apply-now form submit ──
async function submitForm() {


  const name         = document.getElementById('af-name').value.trim().toLowerCase();
  if (!name) { showMessage('err-name', 'Please enter your name'); return; }

  const phone_number = document.getElementById('af-phone').value.trim();
  if (!phone_number) { showMessage('err-phone', 'Please enter mobile number'); return; }
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(phone_number)) { showMessage('err-phone', 'Please enter a valid 10-digit mobile number'); return; }

  const city = document.getElementById('af-city').value.trim().toLowerCase();
  if (!city) { showMessage('err-city', 'Please enter city'); return; }

  const net_monthly_salary = document.getElementById('af-income').value;
  if (!net_monthly_salary) { showMessage('err-income', 'Please select net monthly income'); return; }

  const product = document.getElementById('af-product').value;
  if (!product) { showMessage('err-product', 'Please select product'); return; }

  const loan_amount = document.getElementById('af-loan-amount').value;
  if(!loan_amount) { showMessage('err-loan-amount','Please enter loan amount'); return;};

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

  try {
    const resp = await fetch(`${BASE_URL}/apply-now/save-lead`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, phone_number, city, net_monthly_salary, product, loan_amount,
          source: window.location.pathname
      })
    });

    const data = await resp.json();
    if (data.success) {
      btn.style.display        = 'none';
      successBox.style.display = 'block';
      successMsg.style.display = 'block';
      document.getElementById('applyForm').reset();
      localStorage.clear();
      if (typeof showToast === 'function') showToast('Application submitted successfully!');
      setTimeout(() => window.location.reload(), 5000);
    } else {
      successMsg.innerText     = data.message || 'Something went wrong';
      successMsg.style.display = 'block';
      successMsg.style.color   = '#dc2626';
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
