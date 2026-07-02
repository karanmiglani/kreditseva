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

if(window.location.pathname == '/apply-now'){
  if(rawLeadId){
    document.getElementById('ap-phone-field').style.display = 'none';
  }else{
    const overlay = document.getElementById('navPopupOverlay');
    if (overlay) overlay.classList.add('active');
  }
 }
async function savePhoneNumber(){
  const product =  window.location.pathname.replace('/','');
  localStorage.setItem('product',product);
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
      showToast('Please click on Proceed button to continue');
      document.getElementById('btn-submit').disabled = false;
      sessionStorage.setItem('id', data.rawLeadId)
    }
  } catch (error) {
    console.log(error);
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
  if(!rawLeadId){ showMessage('', 'Session expired, Please fill the application form again.')}
}
