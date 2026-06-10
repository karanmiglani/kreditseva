// ================================================================
//  STATS COUNTUP — reusable across all pages
//  Container: .ks-stats-bar   Counter: .ks-count
//  Attributes: data-target, data-prefix, data-suffix, data-decimals
//  Animates every time bar enters viewport, resets on exit
// ================================================================

const ksNum = (val, fallback) => { const n = parseFloat(val); return isNaN(n) ? fallback : n; };

const ksFormat = (el, n) => {
  const prefix   = el.getAttribute('data-prefix')   || '';
  const suffix   = el.getAttribute('data-suffix')   || '';
  const decimals = ksNum(el.getAttribute('data-decimals'), 0);
  const group    = el.getAttribute('data-group') === 'true';
  let out = n.toFixed(decimals);
  if (group) {
    const parts = out.split('.');
    parts[0] = parseInt(parts[0], 10).toLocaleString('en-IN');
    out = parts.join('.');
  }
  return prefix + out + suffix;
};

const ksAnimateBar = bar => {
  bar.querySelectorAll('.ks-count').forEach(el => {
    if (el._ksRAF) { cancelAnimationFrame(el._ksRAF); el._ksRAF = null; }

    const target   = ksNum(el.getAttribute('data-target'), 0);
    const duration = ksNum(el.getAttribute('data-duration'), 1800);
    let startTime  = null;

    const step = ts => {
      if (startTime === null) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = ksFormat(el, target * ease);
      if (progress < 1) {
        el._ksRAF = requestAnimationFrame(step);
      } else {
        el.textContent = ksFormat(el, target); // exact final value
        el._ksRAF = null;
      }
    };

    el._ksRAF = requestAnimationFrame(step);
  });
};

const ksResetBar = bar => {
  bar.querySelectorAll('.ks-count').forEach(el => {
    if (el._ksRAF) { cancelAnimationFrame(el._ksRAF); el._ksRAF = null; }
    el.textContent = ksFormat(el, 0);
  });
};

const ksBars = document.querySelectorAll('.ks-stats-bar');
if (ksBars.length) {
  if (!('IntersectionObserver' in window)) {
    // Fallback — seedha animate karo
    ksBars.forEach(ksAnimateBar);
  } else {
    const ksObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.isIntersecting ? ksAnimateBar(entry.target) : ksResetBar(entry.target);
      });
    }, { threshold: 0.4 });

    ksBars.forEach(bar => ksObserver.observe(bar));
  }
}

// ================================================================
//  TRENDING SEARCHES — Collapse/Expand + Location Accordion
//  IDs: #trendingToggle, #trendingBody
//  Classes: .trending-arrow, .tl-acc-btn, .tl-acc-body
// ================================================================

const trendingToggle = document.getElementById('trendingToggle');
const trendingBody   = document.getElementById('trendingBody');
const trendingArrow  = trendingToggle && trendingToggle.querySelector('.trending-arrow');

// Header click pe poora section collapse/expand
if (trendingToggle && trendingBody) {
  trendingToggle.addEventListener('click', () => {
    const hidden = trendingBody.classList.toggle('hidden');
    if (trendingArrow) trendingArrow.classList.toggle('collapsed', hidden);
  });
}

// Location accordion — ek baar mein sirf ek open
document.querySelectorAll('.tl-acc-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const accBody = btn.nextElementSibling;
    const isOpen  = accBody.classList.contains('open');

    // Pehle sab band karo
    document.querySelectorAll('.tl-acc-body').forEach(b => b.classList.remove('open'));
    document.querySelectorAll('.tl-acc-btn').forEach(b => b.classList.remove('open'));

    // Agar band tha toh kholo
    if (!isOpen) {
      accBody.classList.add('open');
      btn.classList.add('open');
    }
  });
});

// Bahar click karne pe accordion band karo
document.addEventListener('click', () => {
  document.querySelectorAll('.tl-acc-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.tl-acc-btn').forEach(b => b.classList.remove('open'));
});

// ================================================================
//  UNIVERSAL SCROLL REVEAL — data-animate attribute
//  Usage: <div data-animate="fade-up"> ya fade-left, fade-right, fade-in, zoom
//  Optional: data-delay="300" (ms)
// ================================================================

if ('IntersectionObserver' in window) {
  const animateEls = document.querySelectorAll('[data-animate]');

  animateEls.forEach(el => {
    if (el.style.opacity === '0') return; // already handled
    const type = el.getAttribute('data-animate') || 'fade-up';
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    if (type === 'fade-up')    el.style.transform = 'translateY(40px)';
    if (type === 'fade-left')  el.style.transform = 'translateX(-40px)';
    if (type === 'fade-right') el.style.transform = 'translateX(40px)';
    if (type === 'zoom')       el.style.transform = 'scale(0.92)';
    if (type === 'fade-in')    el.style.transform = 'none';
  });

  const scrollRevealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const delay = parseInt(el.getAttribute('data-delay') || '0');
      setTimeout(() => {
        el.style.opacity   = '1';
        el.style.transform = 'none';
      }, delay);
      scrollRevealObserver.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  animateEls.forEach(el => scrollRevealObserver.observe(el));
}

// ================================================================
//  EMI CALCULATOR
//  IDs: #loanAmount, #interestRate, #loanTenure (number inputs)
//       #loanRange, #rateRange, #tenureRange   (range sliders)
//       #monthlyEmi, #totalInterest, #totalPayable, #principalAmount
//       #emiPieChart (canvas), #emiDonutTotal
//  Classes: .emi-tenure-toggle button (Years/Months toggle)
// ================================================================

const emiAmtInput    = document.getElementById('loanAmount');
const emiRateInput   = document.getElementById('interestRate');
const emiTenureInput = document.getElementById('loanTenure');

if (emiAmtInput && emiRateInput && emiTenureInput) {

  const emiLoanRange   = document.getElementById('loanRange');
  const emiRateRange   = document.getElementById('rateRange');
  const emiTenureRange = document.getElementById('tenureRange');
  const emiMonthlyEl   = document.getElementById('monthlyEmi');
  const emiTotalIntEl  = document.getElementById('totalInterest');
  const emiTotalPayEl  = document.getElementById('totalPayable');
  const emiPrincipalEl = document.getElementById('principalAmount');
  const emiDonutTotal  = document.getElementById('emiDonutTotal');
  const emiCanvas      = document.getElementById('emiPieChart');
  const emiTenureBtns  = document.querySelectorAll('.emi-tenure-toggle button');

  let emiTenureUnit = 'years';
  let emiChart      = null;

  const emiFormatINR = n => '₹ ' + Math.round(n).toLocaleString('en-IN');

  // Donut chart initialize
  if (emiCanvas && typeof Chart !== 'undefined') {
    emiChart = new Chart(emiCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Principal', 'Total Interest'],
        datasets: [{
          data: [100000, 10000],
          backgroundColor: ['#1a52cc', '#00cfff'],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => ' ₹ ' + Math.round(ctx.raw).toLocaleString('en-IN') }
          }
        }
      }
    });
  }

  const emiGetMonths = () => {
    const tenure = parseFloat(emiTenureInput.value) || 1;
    return emiTenureUnit === 'years' ? tenure * 12 : tenure;
  };

  const emiCalculate = () => {
    const P = parseFloat(emiAmtInput.value)  || 0;
    const R = parseFloat(emiRateInput.value) || 0;
    const N = emiGetMonths();

    const monthlyRate = R / 12 / 100;
    let emi = 0;
    if (P > 0 && monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, N);
      emi = (P * monthlyRate * factor) / (factor - 1);
      if (!isFinite(emi)) emi = 0;
    } else if (P > 0) {
      emi = P / N;
    }

    const payable  = emi * N;
    const interest = Math.max(0, payable - P);

    if (emiMonthlyEl)   emiMonthlyEl.textContent   = emiFormatINR(emi);
    if (emiTotalIntEl)  emiTotalIntEl.textContent  = emiFormatINR(interest);
    if (emiTotalPayEl)  emiTotalPayEl.textContent  = emiFormatINR(payable);
    if (emiPrincipalEl) emiPrincipalEl.textContent = emiFormatINR(P);
    if (emiDonutTotal)  emiDonutTotal.textContent  = emiFormatINR(payable);

    if (emiChart) {
      emiChart.data.datasets[0].data = [P || 1, interest || 0];
      emiChart.update();
    }
  };

  // Number input aur range slider sync — input + change dono listen karo (touch support)
  const emiSync = (input, range) => {
    if (!input || !range) return;

    input.addEventListener('input', function () {
      const val = parseFloat(this.value);
      if (isFinite(val)) range.value = val;
      emiCalculate();
    });

    // 'change' — touch drag end pe fire hota hai jahan 'input' miss ho jaata hai
    ['input', 'change'].forEach(evt => {
      range.addEventListener(evt, function () {
        input.value = this.value;
        emiCalculate();
      });
    });
  };

  emiSync(emiAmtInput,    emiLoanRange);
  emiSync(emiRateInput,   emiRateRange);
  emiSync(emiTenureInput, emiTenureRange);

  // Years / Months toggle
  emiTenureBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      emiTenureBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      emiTenureUnit = this.dataset.unit || 'years';
      emiCalculate();
    });
  });

  emiCalculate(); // initial render
}

// ================================================================
//  MOBILE MENU — Hamburger toggle + dropdown support
//  IDs: #menuBtn, #navLinks
//  Classes: .nav-dropdown, .dropdown-menu
// ================================================================

const menuBtn  = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

if (menuBtn && navLinks) {

  // Hamburger click — nav open/close
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    navLinks.classList.toggle('active');
    menuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
  });

  // Mobile pe dropdown toggle
  document.querySelectorAll('.nav-dropdown > a').forEach(trigger => {
    trigger.addEventListener('click', e => {
      if (window.innerWidth > 900) return; // desktop pe CSS hover handle karta hai
      e.preventDefault();
      const dropdown = trigger.parentElement;
      const isOpen   = dropdown.classList.contains('open');
      // Pehle sab band karo
      document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
      if (!isOpen) dropdown.classList.add('open');
    });
  });

  // Nav ke bahar click karne pe band karo
  document.addEventListener('click', e => {
    if (!navLinks.contains(e.target) && e.target !== menuBtn) {
      navLinks.classList.remove('active');
      menuBtn.textContent = '☰';
      document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });

}

// ================================================================
//  FAQ — Toggle open/close, Load More/Less
//  Classes used: .faq-item, .faq-question, .faq-answer, .plx-faq-toggle
//                .hidden-faq, #faqLoadBtn (.pl-faq-load-more)
// ================================================================

// Accordion toggle — har page pe same classes use hoti hain
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    if (!item) return;

    const isOpen = item.classList.contains('active');

    // Pehle sab band karo
    document.querySelectorAll('.faq-item.active').forEach(openItem => {
      openItem.classList.remove('active');
      const toggle = openItem.querySelector('.plx-faq-toggle');
      if (toggle) toggle.textContent = '+';
    });

    // Agar ye band tha toh kholo
    if (!isOpen) {
      item.classList.add('active');
      const toggle = btn.querySelector('.plx-faq-toggle');
      if (toggle) toggle.textContent = '−';
    }
  });
});

// Load More / Show Less button
const faqLoadBtn = document.getElementById('faqLoadBtn');
const hiddenFaqs = document.querySelectorAll('.hidden-faq');

if (faqLoadBtn && hiddenFaqs.length) {
  faqLoadBtn.addEventListener('click', function () {
    const expanded = this.classList.contains('expanded');

    if (!expanded) {
      // Sab hidden FAQs dikhao
      hiddenFaqs.forEach(f => f.classList.add('show'));
      this.textContent = 'Show Less';
      this.classList.add('expanded');
    } else {
      // Wapas chhupaao aur section pe scroll karo
      hiddenFaqs.forEach(f => {
        f.classList.remove('show', 'active');
        const toggle = f.querySelector('.plx-faq-toggle');
        if (toggle) toggle.textContent = '+';
      });
      this.textContent = 'Load More Questions';
      this.classList.remove('expanded');
      const faqSection = document.querySelector('.pl-faq-section');
      if (faqSection) window.scrollTo({ top: faqSection.offsetTop - 100, behavior: 'smooth' });
    }
  });
}

// ================================================================
//  TESTIMONIALS SWIPER — Auto-scroll, pauses on hover
// ================================================================

const testimonialEl = document.querySelector('.testimonialSwiper');
if (testimonialEl) {
  const testimonialSwiper = new Swiper('.testimonialSwiper', {
    loop: true,
    spaceBetween: 18,
    speed: 600,
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.testimonialSwiper .swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      0:    { slidesPerView: 1 },
      768:  { slidesPerView: 2 },
      1100: { slidesPerView: 3 },
    },
  });

  // Hover pe autoplay rok do
  testimonialEl.addEventListener('mouseenter', () => testimonialSwiper.autoplay.stop());
  testimonialEl.addEventListener('mouseleave', () => testimonialSwiper.autoplay.start());
}

// ================================================================
//  PROMO / ADVERTISEMENT SLIDER
// ================================================================

const promoSliderEl = document.querySelector('.promoSlider');
if (promoSliderEl) {
  new Swiper('.promoSlider', {
    slidesPerView: 1,
    loop: true,
    speed: 800,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.promo-pagination',
      clickable: true,
    },
  });
}

// ================================================================
//  NAVBAR QUICK APPLY POPUP
// ================================================================

(function () {
  // Inject popup HTML
  document.body.insertAdjacentHTML('beforeend', `
    <div class="nav-popup-overlay" id="navPopupOverlay">
      <div class="nav-popup-box">
        <button class="nav-popup-close" id="navPopupClose">&times;</button>
        <div class="nav-popup-logo">Kredit<span>Seva</span></div>
        <div class="nav-popup-title">Get a Free Loan Consultation</div>
        <p class="nav-popup-sub">Enter your number — our expert will call you back.</p>
        <div class="nav-popup-field">
          <span class="nav-popup-prefix"><i class="fa-solid fa-phone"></i> +91</span>
          <input type="tel" id="navPopupPhone" placeholder="Enter mobile number" maxlength="10" />
        </div>
        <span class="nav-popup-err" id="navPopupErr"></span>
        <button class="nav-popup-btn" id="navPopupSubmit">
          Proceed
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
        <p class="nav-popup-note" style="margin-top:6px;font-size:0.68rem;color:#b0bec5;">By entering your phone number, you agree to our <a href="/terms-conditon" style="color:#1a52cc;text-decoration:none;">Terms & Conditions</a> and <a href="/privacy-policy" style="color:#1a52cc;text-decoration:none;">Privacy Policy</a>, and authorise KreditSeva to contact you via Call, SMS, or WhatsApp.</p>
      </div>
    </div>
  `);

  const overlay = document.getElementById('navPopupOverlay');
  const closeBtn = document.getElementById('navPopupClose');
  const submitBtn = document.getElementById('navPopupSubmit');
  const phoneInput = document.getElementById('navPopupPhone');
  const errEl = document.getElementById('navPopupErr');

  // Open popup — store product from href if present
  function openNavPopup(product = '') {
    overlay.dataset.product = product;
    overlay.classList.add('active');
    phoneInput.value = '';
    errEl.textContent = '';
    phoneInput.focus();
  }

  // Navbar Apply Now
  document.querySelectorAll('.desktop-apply-btn, .mobile-apply-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openNavPopup('');
    });
  });

  // Hero slider buttons (.ks-hero-btn) — except credit score link
  document.querySelectorAll('.ks-hero-btn').forEach(btn => {
    const href = btn.getAttribute('href') || '';
    if (href.includes('check') || href.includes('credit') || href.includes('debt')) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      const params = new URLSearchParams(href.split('?')[1] || '');
      openNavPopup(params.get('product') || '');
    });
  });

  // Close disabled — only closes on server success

  const mobileRegex = /^[6-9]\d{9}$/;
  let popupTimer = null;

  // Button by default disabled
  submitBtn.disabled      = true;
  submitBtn.style.opacity = '0.5';
  submitBtn.style.cursor  = 'not-allowed';

  // Only digits + debounce — valid hone pe auto API call
  phoneInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
    errEl.textContent = '';
    clearTimeout(popupTimer);

    const valid = mobileRegex.test(this.value.trim());
    submitBtn.disabled      = !valid;
    submitBtn.style.opacity = valid ? '1' : '0.5';
    submitBtn.style.cursor  = valid ? 'pointer' : 'not-allowed';

    if (valid) {
      popupTimer = setTimeout(() => triggerSave(this.value.trim()), 600);
    }
  });

  async function triggerSave(phone) {
    submitBtn.disabled      = true;
    submitBtn.style.opacity = '0.7';
    submitBtn.innerHTML     = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
      const product = overlay.dataset.product || localStorage.getItem('product') || 'personal-loan';
      const resp = await fetch(`${window.location.origin}/api/leads/save-phone-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, product })
      });
      const data = await resp.json();

      if (data.success) {
        sessionStorage.setItem('id', data.rawLeadId || '');
        overlay.classList.remove('active');
        showToast(data.message || 'Mobile number saved successfully!');
        setTimeout(() => {
          window.location.href = '/apply-now' + (product ? '?product=' + encodeURIComponent(product) : '');
        }, 1500);
      } else {
        errEl.textContent = data.message || 'Something went wrong. Please try again.';
      }
    } catch (err) {
      errEl.textContent = 'Network error. Please try again.';
      console.error(err);
    } finally {
      submitBtn.disabled      = false;
      submitBtn.style.opacity = '1';
      submitBtn.innerHTML     = `Get Free Callback <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    }
  }

  // Button click bhi triggerSave call kare (manual submit)
  submitBtn.addEventListener('click', () => {
    const phone = phoneInput.value.trim();
    if (mobileRegex.test(phone)) triggerSave(phone);
  });

  // Enter key support
  phoneInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const phone = phoneInput.value.trim();
      if (mobileRegex.test(phone)) triggerSave(phone);
    }
  });

})();

// ================================================================
//  GLOBAL TOAST
// ================================================================

function showToast(msg) {
  let toast = document.getElementById('ks-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ks-toast';
    toast.style.cssText = `
      position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(20px);
      background: #0d1b3e; color: #fff; padding: 12px 24px; border-radius: 50px;
      font-size: 0.85rem; font-weight: 600; font-family: 'Open Sans', sans-serif;
      box-shadow: 0 8px 24px rgba(13,21,71,0.25); z-index: 99999;
      display: flex; align-items: center; gap: 10px;
      opacity: 0; transition: all 0.3s ease; white-space: nowrap;
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#4ade80;"></i> ${msg}`;
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2500);
}

// ================================================================
//  HERO SWIPER — Auto-plays, pauses on user interaction
// ================================================================

if (document.querySelector('.ksHeroSwiper')) {

  const heroSwiper = new Swiper('.ksHeroSwiper', {
    slidesPerView: 1,
    loop: true,
    speed: 900,           // slide transition duration (ms)
    effect: 'fade',       // fade animation — slide se zyada smooth
    fadeEffect: {
      crossFade: true,    // dono slides simultaneously fade in/out
    },
    autoplay: {
      delay: 4500,
      disableOnInteraction: false, // interaction ke baad bhi autoplay resume ho
    },
    pagination: {
      el: '.ks-hero-dots-pagination',
      clickable: true,
    },
  });

  // Prev / Next buttons
  const prevBtn = document.querySelector('.ks-hero-prev');
  const nextBtn = document.querySelector('.ks-hero-next');
  if (prevBtn) prevBtn.addEventListener('click', () => heroSwiper.slidePrev());
  if (nextBtn) nextBtn.addEventListener('click', () => heroSwiper.slideNext());

  // Hero section pe mouse aaye toh autoplay rok do, jaaye toh resume karo
  const heroSection = document.querySelector('.ks-hero');
  if (heroSection) {
    heroSection.addEventListener('mouseenter', () => heroSwiper.autoplay.stop());
    heroSection.addEventListener('mouseleave', () => heroSwiper.autoplay.start());
  }

}
