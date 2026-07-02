(function () {
  var POPUPS = [
    { popupId: 'dcHomePopup', paths: ['/'], closeId: 'dcHomePopupClose' }
  ];

  var path = window.location.pathname;
  var cfg = null;

  for (var i = 0; i < POPUPS.length; i++) {
    if (POPUPS[i].paths.indexOf(path) !== -1 && document.getElementById(POPUPS[i].popupId)) {
      cfg = POPUPS[i];
      break;
    }
  }

  if (!cfg) return;

  var popup = document.getElementById(cfg.popupId);
  var closeBtn = document.getElementById(cfg.closeId);
  var reopenTimer = null;
  var REOPEN_DELAY = 7000;

  function openPopup() {
    if (popup.classList.contains('active')) return;
    requestAnimationFrame(function () {
      popup.classList.add('active');
      popup.setAttribute('aria-hidden', 'false');
      document.body.classList.add('popup-open');
    });
  }

  function closePopup(reschedule) {
    popup.classList.remove('active');
    popup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('popup-open');
    if (reopenTimer) {
      clearTimeout(reopenTimer);
      reopenTimer = null;
    }
    if (reschedule) {
      reopenTimer = setTimeout(openPopup, REOPEN_DELAY);
    }
  }

  function scheduleInitialOpen() {
    function launch() {
      requestAnimationFrame(openPopup);
    }

    var loader = document.getElementById('ks-loader');
    if (loader && loader.style.display !== 'none' && !loader.classList.contains('ks-loader-hide')) {
      document.addEventListener('ks:loaderhidden', launch, { once: true });
      return;
    }

    launch();
  }

  closeBtn && closeBtn.addEventListener('click', function () { closePopup(true); });
  popup.addEventListener('click', function (e) {
    if (e.target === popup) closePopup(true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popup.classList.contains('active')) closePopup(true);
  });

  scheduleInitialOpen();
})();
