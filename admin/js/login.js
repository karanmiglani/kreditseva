(function () {

  var form       = document.getElementById('loginForm');
  var btnText    = document.getElementById('btnText');
  var spinner    = document.getElementById('btnSpinner');
  var alertBox   = document.getElementById('loginAlert');
  var alertMsg   = document.getElementById('loginAlertMsg');

  /* Toggle password visibility */
  document.getElementById('togglePass').addEventListener('click', function () {
    var input = document.getElementById('adminPassword');
    var icon  = this.querySelector('i');
    var isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    icon.className = isPass ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  });

  /* Form submit */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var email    = document.getElementById('adminEmail').value.trim();
    var password = document.getElementById('adminPassword').value;

    /* Reset errors */
    setError('fieldEmail', 'emailErr', '');
    setError('fieldPassword', 'passErr', '');
    alertBox.style.display = 'none';

    /* Validate */
    var ok = true;
    if (!email)    { setError('fieldEmail',    'emailErr', 'Email is required');    ok = false; }
    if (!password) { setError('fieldPassword', 'passErr',  'Password is required'); ok = false; }
    if (!ok) return;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials : 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = 'dashboard';
      } else {
        showAlert(data.message || 'Invalid credentials');
      }
    } catch (err) {
      showAlert('Server error. Try again.');
    }
  });

  function setError(fieldId, errId, msg) {
    document.getElementById(errId).textContent = msg;
    document.getElementById(fieldId).classList.toggle('lb-field--error', !!msg);
  }

  function setLoading(on) {
    btnText.style.display  = on ? 'none' : '';
    spinner.style.display  = on ? 'inline-block' : 'none';
  }

  function showAlert(msg) {
    setLoading(false);
    alertMsg.textContent   = msg;
    alertBox.style.display = 'flex';
  }

})();
