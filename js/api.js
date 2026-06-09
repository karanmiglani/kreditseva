const BASE_URL = window.location.origin;

// ── Hero form redirect — sirf phone validate karo ──
function redirect(product = '') {
  try {
    const number = document.getElementById('heroPhone').value.trim();
    if (!number) {
      const error = document.getElementById('err-heroPhone');
      error.textContent = 'Please enter your mobile number.';
      error.style.display = 'block';
      setTimeout(() => { error.textContent = ''; error.style.display = 'none'; }, 4000);
      return;
    }
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(number)) {
      const error = document.getElementById('err-heroPhone');
      error.textContent = 'Please enter a valid 10-digit mobile number.';
      error.style.display = 'block';
      setTimeout(() => { error.textContent = ''; error.style.display = 'none'; }, 4000);
      return;
    }
    window.localStorage.setItem('number', number);
    if (typeof showToast === 'function') showToast('Mobile number saved successfully!');
    setTimeout(() => {
      window.location.href = '/apply-now?product=' + encodeURIComponent(product);
    }, 1500);
  } catch (err) {
    console.error(err);
  }
}

// ── Pre-fill apply-now form from localStorage + URL param ──
if (window.location.pathname === '/apply-now') {
  const params    = new URLSearchParams(window.location.search);
  const product   = params.get('product') || '';
  const phone     = window.localStorage.getItem('number') || '';

  if (document.getElementById('af-phone'))   document.getElementById('af-phone').value   = phone;
  if (document.getElementById('af-product')) document.getElementById('af-product').value = product;
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

  const loan_amount = document.getElementById('af-loan-amount')?.value || null;

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
        total_outstanding_amount: null, occupation: null, source: window.location.pathname
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
  setTimeout(() => { el.textContent = ''; }, 3000);
}
