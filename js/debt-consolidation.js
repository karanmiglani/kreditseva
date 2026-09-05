// Occupation toggle + income dropdown
var SALARY_OPTIONS = {
  salaried: [
    'Below ₹25,000',
    '₹25,000 – ₹50,000',
    '₹50,000 – ₹1 Lakh',
    '₹1 Lakh – ₹3 Lakh',
    'Above ₹3 Lakh'
  ],
  'self-employed': [
    'Below 25 Lakhs',
    '25-50 Lakhs',
    '50 Lakhs - 1 Cr',
    '1 Cr - 5 Cr',
    'Above 5 Cr'
  ]
};

function initSalarySelect2() {
  if (!window.jQuery || !jQuery.fn.select2) return;
  var $sel = jQuery('#formSalary');
  if ($sel.data('select2')) $sel.select2('destroy');
  $sel.select2({
    placeholder: 'Select Income',
    allowClear: true,
    width: '100%'
  });
}

function setSalaryFieldMode(occupation) {
  var select = document.getElementById('formSalary');
  var label = document.getElementById('dc-salary-label');
  if (!select || !label) return;

  var isSelf = occupation === 'self-employed';
  var options = SALARY_OPTIONS[isSelf ? 'self-employed' : 'salaried'];

  label.innerHTML = (isSelf ? 'Annual Income' : 'Net Monthly Salary') + ' <span class="dc-req">*</span>';

  if (window.jQuery) {
    var $sel = jQuery('#formSalary');
    if ($sel.data('select2')) $sel.select2('destroy');
  }

  select.innerHTML = '<option value="">Select Income</option>' +
    options.map(function (opt) { return '<option>' + opt + '</option>'; }).join('');
  select.value = '';

  initSalarySelect2();
  if (window.jQuery) {
    jQuery('#formSalary').val('').trigger('change.select2');
  }
}

document.querySelectorAll('.dc-occ-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.dc-occ-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var occ = btn.getAttribute('data-occ');
    document.getElementById('dc-occupation').value = occ;
    setSalaryFieldMode(occ);
    showMsg('err-dcSalary', '');
  });
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    initSalarySelect2();
    setSalaryFieldMode(document.getElementById('dc-occupation')?.value || 'salaried');
  });
} else {
  initSalarySelect2();
  setSalaryFieldMode(document.getElementById('dc-occupation')?.value || 'salaried');
}

const ccInput   = document.getElementById('dcCcBills');
const loanInput = document.getElementById('dcLoanOut');
const ccRange   = document.getElementById('dcCcRange');
const loanRange = document.getElementById('dcLoanRange');
const ccLabel   = document.getElementById('dcCcLabel');
const loanLabel = document.getElementById('dcLoanLabel');
const totalAmt  = document.getElementById('dcTotalAmt');
const newEmiEl  = document.getElementById('dcNewEmi');
const savingEl  = document.getElementById('dcSavingsPct');
let dcChart     = null;

function numLabel(n) {
  if (n >= 10000000) return (n/10000000).toFixed(1) + ' Crore';
  if (n >= 100000)   return (n/100000).toFixed(1) + ' Lakh';
  if (n >= 1000)     return (n/1000).toFixed(1) + ' Thousand';
  return n;
}

function formatINR(n) {
  return '₹ ' + Math.round(n).toLocaleString('en-IN');
}

function calcEMI(principal, ratePA, months) {
  if (principal <= 0) return 0;
  const r = ratePA / 12 / 100;
  if (r === 0) return principal / months;
  return principal * r * Math.pow(1+r, months) / (Math.pow(1+r, months) - 1);
}

function update() {
  const cc    = parseFloat(ccInput.value)   || 0;
  const loan  = parseFloat(loanInput.value) || 0;
  const total = cc + loan;

  ccLabel.textContent   = numLabel(cc);
  loanLabel.textContent = numLabel(loan);
  totalAmt.textContent  = formatINR(total);

  const ccMinDue = cc * 0.05;
  const loanEmi  = calcEMI(loan, 13, 60);
  const oldEmi   = ccMinDue + loanEmi;
  const newEmi   = calcEMI(total, 9.98, 60);
  const saving   = oldEmi > 0 ? ((oldEmi - newEmi) / oldEmi * 100) : 0;

  newEmiEl.textContent = formatINR(newEmi);
  savingEl.textContent = saving.toFixed(1) + '%';

  if (dcChart) dcChart.destroy();
  const ctx = document.getElementById('dcSavingsChart');
  if (!ctx) return;
  dcChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Old EMI', 'New EMI'],
      datasets: [{
        data: [Math.round(oldEmi), Math.round(newEmi)],
        backgroundColor: ['#1a3a7a', '#1a52cc'],
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 60
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 30 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: c => ' ₹ ' + c.raw.toLocaleString('en-IN')
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          grid: { color: '#f0f0f0' },
          border: { display: false },
          ticks: { callback: v => v >= 1000 ? (v/1000) + 'K' : v }
        }
      }
    },
    plugins: [{
      afterDatasetsDraw(chart) {
        const c2 = chart.ctx;
        chart.data.datasets.forEach((ds, i) => {
          chart.getDatasetMeta(i).data.forEach((bar, idx) => {
            c2.fillStyle = idx === 1 ? '#8b6dff' : '#888';
            c2.font = 'bold 12px Poppins,sans-serif';
            c2.textAlign = 'center';
            c2.fillText('₹' + ds.data[idx].toLocaleString('en-IN'), bar.x, bar.y - 8);
          });
        });
      }
    }]
  });
}

ccRange.addEventListener('input',   () => { ccInput.value   = ccRange.value; update(); });
loanRange.addEventListener('input', () => { loanInput.value = loanRange.value; update(); });
ccInput.addEventListener('input',   () => { ccRange.value   = Math.min(ccInput.value, 5000000); update(); });
loanInput.addEventListener('input', () => { loanRange.value = Math.min(loanInput.value, 5000000); update(); });

update();

// Amount to words hints
function amountToWords(n) {
  n = parseInt(n);
  if (!n || n < 1) return '';
  if (n >= 10000000) return (n / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Crore';
  if (n >= 100000)   return (n / 100000).toFixed(2).replace(/\.?0+$/, '') + ' Lakh';
  if (n >= 1000)     return (n / 1000).toFixed(2).replace(/\.?0+$/, '') + ' Thousand';
  return n;
}

function bindHint(inputId, hintId) {
  const inp  = document.getElementById(inputId);
  const hint = document.getElementById(hintId);
  if (!inp || !hint) return;
  inp.addEventListener('input', function () {
    const raw = this.value.replace(/[^0-9]/g, '');
    const words = amountToWords(raw);
    hint.textContent = words ? '₹ ' + words : '';
  });
}

bindHint('formOutstanding', 'formOutstandingHint');
bindHint('formSalary',      'formSalaryHint');

let phone_number = null;
let timer;
let rawLeadId = null;
document.getElementById('dcPhone').addEventListener('input', function(){
  clearTimeout(timer);
  timer = setTimeout(() => {
    phone_number = this.value;  
    if(validatePhone()){
      savePhoneNumber();
    }else{
      showMsg('err-dcPhone','Please enter a valid 10 digit mobile number') ;
    }
  }, 500);
})

function validatePhone(){
  if(phone_number.length === 10){
    const phoneRegex = /^[6-9]{1}[0-9]{9}$/;
    if(phoneRegex.test(phone_number)){
      return true;
    }
  }
}


async function savePhoneNumber(){
try {
    if(phone_number === null || phone_number === undefined || phone_number.length < 10) return;

  phone_number = phone_number.trim();
  localStorage.setItem('product', 'debt-consolidation');
  const resp = await fetch(`${window.location.origin}/api/leads/save-phone-number`, {
    method : 'POST',
    headers : {'Content-Type' : 'application/json'},
    body : JSON.stringify({
       phone_number : phone_number,
        product : 'debt-consolidation'
    })
  });
  const data = await resp.json();
  if(data.success)  sessionStorage.setItem('id', data.rawLeadId);
} catch (error) {
  console.log(error);
}

}



/*
 * Submit is a two-step flow, same as /apply-now: the form is validated and an
 * OTP is sent, but nothing is written to loan_applications until the user
 * enters the code. The backend's /apply-now/save-lead rejects a request with
 * no otp, so the form values are held here and posted together with the code.
 */
let dcPendingForm = null;
let dcOtpResendTimer = null;
let dcOtpResendSeconds = 0;

function collectDcFormData(product) {
  return {
    name: document.getElementById('dcName').value.trim().toLowerCase(),
    city: document.getElementById('dcCity').value.trim().toLowerCase(),
    net_monthly_salary: document.getElementById('formSalary').value,
    loan_amount: document.getElementById('formOutstanding').value,
    occupation: document.getElementById('dc-occupation')?.value || 'salaried',
    product: product,
    source: window.location.pathname
  };
}

function maskDcPhone(phone) {
  const p = String(phone || '');
  if (p.length < 4) return p;
  return p.slice(0, 2) + '******' + p.slice(-2);
}

function openDcOtpPopup() {
  const overlay = document.getElementById('dcOtpOverlay');
  if (!overlay) return;
  const input = document.getElementById('dcOtpInput');
  const err = document.getElementById('dcOtpErr');
  const sub = document.getElementById('dcOtpSub');

  if (sub) sub.innerHTML = 'Enter the OTP sent to <strong>+91 ' + maskDcPhone(phone_number) + '</strong>';
  if (input) input.value = '';
  if (err) err.textContent = '';

  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => input?.focus(), 80);
}

function closeDcOtpPopup() {
  const overlay = document.getElementById('dcOtpOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
}

function startDcOtpResendCooldown(seconds = 90) {
  const btn = document.getElementById('dcOtpResend');
  if (!btn) return;
  clearInterval(dcOtpResendTimer);
  dcOtpResendSeconds = Number(seconds) || 90;
  btn.disabled = true;
  btn.textContent = `Resend OTP in ${dcOtpResendSeconds}s`;
  dcOtpResendTimer = setInterval(() => {
    dcOtpResendSeconds -= 1;
    if (dcOtpResendSeconds <= 0) {
      clearInterval(dcOtpResendTimer);
      btn.disabled = false;
      btn.textContent = 'Resend OTP';
      return;
    }
    btn.textContent = `Resend OTP in ${dcOtpResendSeconds}s`;
  }, 1000);
}

// POST /api/leads/send-otp — returns true only when the code actually went out
async function sendDcOtp() {
  const id = sessionStorage.getItem('id');
  if (!id) {
    showMsg('err-dcPhone', 'Session expired, Please enter your mobile number again');
    return false;
  }
  rawLeadId = id;

  try {
    const resp = await fetch(`${window.location.origin}/api/leads/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        rawLeadId,
        phone_number: phone_number,
        product: 'debt-consolidation'
      })
    });
    const data = await resp.json().catch(() => ({}));

    if (resp.ok && data.success) {
      if (typeof showToast === 'function') showToast(data.message || 'OTP sent to your WhatsApp');
      // Cooldown length is the backend's call, not the browser's
      startDcOtpResendCooldown(Number(data.retryAfter) || 90);
      return true;
    }

    // Rate limited — daily cap or the 90s cooldown between sends
    if (data.rateLimited) {
      if (data.retryAfter) startDcOtpResendCooldown(Number(data.retryAfter));
      const msg = data.message || 'Please wait before requesting another OTP.';
      if (typeof showToast === 'function') showToast(msg);
      const err = document.getElementById('dcOtpErr');
      if (err && document.getElementById('dcOtpOverlay')?.classList.contains('active')) {
        err.textContent = msg;
      }
      return false;
    }

    /*
     * Session gone server-side — the raw lead expired or was already completed.
     * Status-checked: send-otp's generic 500 handler also returns rawLeadId:null,
     * and a database blip must not wipe a session that is still valid.
     */
    if (resp.status === 400 && data.rawLeadId === null) {
      sessionStorage.removeItem('id');
      showMsg('err-dcPhone', data.message || 'Session expired, Please enter your mobile number again');
      return false;
    }

    if (typeof showToast === 'function') showToast(data.message || 'Could not send OTP. Please try again.');
    return false;
  } catch (error) {
    console.error('sendDcOtp:', error);
    if (typeof showToast === 'function') showToast('Network error. Please try again.');
    return false;
  }
}

async function submitDebtConsolidationForm(product){

  if(!phone_number || phone_number === undefined || !validatePhone() ) { showMsg('err-dcPhone','Please enter valid mobile number'); return; }
  const name = document.getElementById('dcName').value.trim().toLowerCase();
  if(!name) { showMsg('err-dcName','Please enter your name'); return;}
  const total_outstanding_amount = document.getElementById('formOutstanding').value;
  if(!total_outstanding_amount){showMsg('err-dcOutstanding', 'Please enter outstanding amount'); return;}
  const city = document.getElementById('dcCity').value.trim().toLowerCase();
  if(!city){ showMsg('err-dcCity', 'Please enter city'); return;}
  const net_monthly_salary = document.getElementById('formSalary').value;
  if(!net_monthly_salary) { showMsg('err-dcSalary','Please select income.'); return;}

  const spinner = document.querySelector('.dc-btn-spinner');
  const btnText = document.querySelector('.dc-btn-text');
  const btn = document.getElementById('dc-submit-btn');
  const successMsg = document.getElementById('dc-success-msg');

  if(!sessionStorage.getItem('id')){
    successMsg.style.display = 'block';
    successMsg.style.color = '#dc2626';
    successMsg.innerText =  'Session expired, Please try again';
    return;
  }
  rawLeadId = sessionStorage.getItem('id');

  // Held until the OTP comes back — the lead is saved in one call with the code
  dcPendingForm = collectDcFormData(product);

  try {
    spinner.style.display = 'inline-flex';
    if (btnText) btnText.style.display = 'none';
    btn.disabled = true;

    const sent = await sendDcOtp();
    if (sent) openDcOtpPopup();
  } finally {
    spinner.style.display = 'none';
    if (btnText) btnText.style.display = '';
    btn.disabled = false;
  }
}

// OTP popup Submit → POST /apply-now/save-lead with the held form + the code
async function saveDcLeadWithOtp() {
  const otp = (document.getElementById('dcOtpInput')?.value || '').trim();
  const err = document.getElementById('dcOtpErr');
  const saveBtn = document.getElementById('dcOtpSave');
  const btn = document.getElementById('dc-submit-btn');
  const successMsg = document.getElementById('dc-success-msg');

  if (!/^\d{4,6}$/.test(otp)) {
    if (err) err.textContent = 'Please enter a valid OTP';
    return;
  }
  if (err) err.textContent = '';

  const id = sessionStorage.getItem('id');
  if (!id) {
    if (err) err.textContent = 'Session expired. Please start again.';
    return;
  }

  // Re-read the fields at save time so an edit behind the popup is not lost
  const form = dcPendingForm ? collectDcFormData(dcPendingForm.product) : null;
  if (!form) {
    if (err) err.textContent = 'Please fill the form again.';
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Submitting...';
  }

  try {
    const resp = await fetch(`${window.location.origin}/apply-now/save-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawLeadId: id, otp, ...form })
    });
    const data = await resp.json().catch(() => ({}));

    if (data.success) {
      closeDcOtpPopup();
      clearInterval(dcOtpResendTimer);
      dcPendingForm = null;
      btn.style.display = 'none';
      successMsg.style.display = 'block';
      successMsg.style.color = '#0ec68f';
      successMsg.innerText = data.message;
      if (typeof showToast === 'function') showToast('Application submitted successfully!');
      document.getElementById('dc-form-id').reset();
      document.getElementById('formSalary').value = "";
      sessionStorage.clear();
      if (typeof showCelebration === 'function') showCelebration();
      setTimeout(() => {
        btn.style.display = 'block';
        successMsg.style.display = 'none';
        successMsg.innerText = '';
        window.location.reload();
      }, 5000);
    } else {
      if (err) err.textContent = data.message || 'Invalid OTP. Please try again.';
      // Raw lead expired server-side — the popup can do nothing more
      if (data.rawLeadId === null) {
        sessionStorage.removeItem('id');
        if (typeof showToast === 'function') showToast(data.message || 'Session expired');
        setTimeout(() => window.location.reload(), 2500);
      }
    }
  } catch (error) {
    console.error('saveDcLeadWithOtp:', error);
    if (err) err.textContent = 'Network error, please try again.';
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Submit';
    }
  }
}

// OTP popup events
document.getElementById('dcOtpClose')?.addEventListener('click', closeDcOtpPopup);
document.getElementById('dcOtpOverlay')?.addEventListener('click', function (e) {
  if (e.target === this) closeDcOtpPopup();
});
document.getElementById('dcOtpInput')?.addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 6);
  const errEl = document.getElementById('dcOtpErr');
  if (errEl) errEl.textContent = '';
});
document.getElementById('dcOtpSave')?.addEventListener('click', saveDcLeadWithOtp);
document.getElementById('dcOtpResend')?.addEventListener('click', async function () {
  if (this.disabled) return;
  await sendDcOtp();
});
document.addEventListener('keydown', function (e) {
  const open = document.getElementById('dcOtpOverlay')?.classList.contains('active');
  if (!open) return;
  if (e.key === 'Escape') closeDcOtpPopup();
  if (e.key === 'Enter') {
    e.preventDefault();
    saveDcLeadWithOtp();
  }
});

function showMsg(id, msg){
  document.getElementById(id).innerText = msg;
  document.getElementById(id).style.display ='block';
  setTimeout(() => {
    document.getElementById(id).innerText = '';
    document.getElementById(id).style.display = 'none'
  },3000)
}

