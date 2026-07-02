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
    '50 - 1 Cr',
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



async function submitDebtConsolidationForm(product){
  console.log('Function called');
  if(!phone_number || phone_number === undefined || !validatePhone() ) { showMsg('err-dcPhone','Please enter valid mobile number'); return; }
  const name = document.getElementById('dcName').value.trim().toLowerCase();
  if(!name) { showMsg('err-dcName','Please enter your name'); return;}
  const total_outstanding_amount = document.getElementById('formOutstanding').value;
  if(!total_outstanding_amount){showMsg('err-dcOutstanding', 'Please enter outstanding amount'); return;}
  const city = document.getElementById('dcCity').value.trim().toLowerCase();
  if(!city){ showMsg('err-dcCity', 'Please enter city'); return;}
  const net_monthly_salary = document.getElementById('formSalary').value;
  if(!net_monthly_salary) { showMsg('err-dcSalary','Please select income.'); return;}
  const occupation = document.getElementById('dc-occupation')?.value || 'salaried';
  const source = window.location.pathname;
  const spinner = document.querySelector('.dc-btn-spinner');
  const btn = document.getElementById('dc-submit-btn');
  const successMsg = document.getElementById('dc-success-msg');
  if(!sessionStorage.getItem('id')){
    successMsg.style.color = '#dc2626';
    successMsg.innerText =  'Session expired, Please try again';
    return;
  } else{
    rawLeadId = sessionStorage.getItem('id');
  }

  try {
      spinner.style.display = 'inline-flex';
      btn.disabled = true;
    const resp = await fetch(`${window.location.origin}/apply-now/save-lead`, {
      method : 'POST',
      headers : {
        'Content-Type' : 'application/json'
      },
      body : JSON.stringify({
        rawLeadId, name, city, net_monthly_salary, product, loan_amount: total_outstanding_amount, source, occupation
      })
    });
    const data = await resp.json();
    if(data.success){
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
      },5000)
    }else{
      successMsg.style.display = 'block';
      successMsg.style.color = '#dc2626';
      successMsg.innerText = data.message || 'Something went wrong';
    }
  } catch (error) {
    console.error(error);
    successMsg.style.display = 'block';
      successMsg.style.color = '#dc2626';
      successMsg.innerText = data.message || 'Network error, please try again.';
  }finally{
    spinner.style.display = 'none';
    btn.disabled = false;
  }
  
}

function showMsg(id, msg){
  document.getElementById(id).innerText = msg;
  document.getElementById(id).style.display ='block';
  setTimeout(() => {
    document.getElementById(id).innerText = '';
    document.getElementById(id).style.display = 'none'
  },3000)
}

