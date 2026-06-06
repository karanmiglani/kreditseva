/* ---- KreditSeva Page Loader ---- */
(function () {
  var loader = document.getElementById('ks-loader');
  if (!loader) return;

  function hideLoader() {
    loader.classList.add('ks-loader-hide');
    setTimeout(function () { loader.style.display = 'none'; }, 450);
  }

  if (document.readyState !== 'loading') {
    setTimeout(hideLoader, 200);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(hideLoader, 200);
    });
  }
})();
