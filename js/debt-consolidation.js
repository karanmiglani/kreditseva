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
  const newEmi   = calcEMI(total, 12, 60);
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
