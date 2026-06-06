async function loadPopup() {
  if (document.getElementById("loanPopup")) return;

  try {
    const response = await fetch("../popup.html");
    const html = await response.text();

    document.body.insertAdjacentHTML("beforeend", html);

    initPopup();
  } catch (error) {
    console.error("Popup failed to load:", error);
  }
}

function openLoanPopup(selectedProduct = "") {
  const popup = document.getElementById("loanPopup");

  if (!popup) return;

  const popupPhone = document.getElementById("popupPhoneNumber");
  const popupName = document.getElementById("popupFullName");
  const productSelect = document.getElementById("popupProductType");

  const phoneInput =
    document.getElementById("pl-phone-number") ||
    document.querySelector(".pl-phone-number") ||
    document.querySelector('input[type="tel"]');

  const nameInput =
    document.getElementById("pl-full-name") ||
    document.querySelector(".pl-full-name") ||
    document.querySelector('input[type="text"]');

  if (phoneInput && popupPhone && phoneInput.value.trim()) {
    popupPhone.value = phoneInput.value.trim();
  } else {
    popupPhone.value = "";
  }

  if (nameInput && popupName && nameInput.value.trim()) {
    popupName.value = nameInput.value.trim();
  } else {
    popupName.value = "";
  }

  // product autoselect
  if(productSelect){
    if(selectedProduct){
      productSelect.value = selectedProduct;
      productSelect.disabled = true;
    }else{
      productSelect.value = "";
      productSelect.disabled = false;
    }
  }
  

  popup.classList.add("active");
  document.body.classList.add("popup-open");
}

function closeLoanPopup() {
  const popup = document.getElementById("loanPopup");

  if (!popup) return;

  popup.classList.remove("active");
  document.body.classList.remove("popup-open");
}

function initPopup() {
  const popup = document.getElementById("loanPopup");
  const closeBtn = document.getElementById("closeLoanPopup");
  const form = document.getElementById("loanApplicationForm");
  const successMessage = document.getElementById("successMessage");

  if (!popup || !closeBtn || !form) return;

  closeBtn.addEventListener("click", closeLoanPopup);

  popup.addEventListener("click", function (e) {
    if (e.target === popup) {
      closeLoanPopup();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeLoanPopup();
    }
  });

  const validators = {
    popupFullName: {
      validate: value => value.trim().length >= 3,
      message: "Please enter valid full name"
    },

    popupPhoneNumber: {
      validate: value => /^[6-9]\d{9}$/.test(value),
      message: "Enter valid 10 digit mobile number"
    },

    popupEmailAddress: {
      validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: "Enter valid email address"
    },

    popupCity: {
      validate: value => value.trim().length >= 2,
      message: "Please enter city"
    },

    popupOccupation: {
      validate: value => value !== "",
      message: "Please select occupation"
    },

    popupIncome: {
      validate: value => value !== "",
      message: "Please select monthly income"
    },

    popupLoanAmount: {
      validate: value => /^\d+$/.test(value),
      message: "Enter valid loan amount"
    },

    popupPinCode: {
      validate: value => /^\d{6}$/.test(value),
      message: "Enter valid 6 digit pincode"
    },

    popupProductType: {
      validate: value => value !== "",
      message: "Please select product type"
    },

    popupPanCard: {
      validate: value =>
        value === "" || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value),
      message: "PAN format should be ABCDE1234F"
    }
  };

  function showError(input, message) {
    const field = input.closest(".ks-field");
    if (!field) return;

    field.classList.add("error");

    const errorBox = field.querySelector(".ks-error");
    if (errorBox) {
      errorBox.textContent = message;
    }
  }

  function clearError(input) {
    const field = input.closest(".ks-field");
    if (!field) return;

    field.classList.remove("error");

    const errorBox = field.querySelector(".ks-error");
    if (errorBox) {
      errorBox.textContent = "";
    }
  }

  Object.keys(validators).forEach(function (id) {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", function () {
      clearError(input);

      if (
        id === "popupPhoneNumber" ||
        id === "popupLoanAmount" ||
        id === "popupPinCode"
      ) {
        this.value = this.value.replace(/\D/g, "");
      }

      if (id === "popupPanCard") {
        this.value = this.value.toUpperCase();
      }
    });

    input.addEventListener("change", function () {
      clearError(input);
    });
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    let isValid = true;

    Object.keys(validators).forEach(function (id) {
      const input = document.getElementById(id);
      if (!input) return;

      const value = input.value.trim();
      const rule = validators[id];

      if (!rule.validate(value)) {
        showError(input, rule.message);
        isValid = false;
      } else {
        clearError(input);
      }
    });

    if (!isValid) return;

    const submitBtn = form.querySelector(".ks-submit-btn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const payload = {
      fullName: document.getElementById("popupFullName").value.trim(),
      phoneNumber: document.getElementById("popupPhoneNumber").value.trim(),
      emailAddress: document.getElementById("popupEmailAddress").value.trim(),
      city: document.getElementById("popupCity").value.trim(),
      occupation: document.getElementById("popupOccupation").value,
      income: document.getElementById("popupIncome").value,
      loanAmount: document.getElementById("popupLoanAmount").value.trim(),
      panCard: document.getElementById("popupPanCard").value.trim(),
      pinCode: document.getElementById("popupPinCode").value.trim(),
      productType: document.getElementById("popupProductType").value
    };

    try {
      const response = await fetch("http://localhost:3000/api/loan-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        successMessage.innerHTML = data.message;
        successMessage.style.display = "block";
        successMessage.style.background = "#eafbf1";
        successMessage.style.color = "#15803d";

        form.reset();

        setTimeout(function () {
          successMessage.style.display = "none";
          closeLoanPopup();
        }, 5000);
      } else {
        successMessage.innerHTML = data.message;
        successMessage.style.display = "block";
        successMessage.style.background = "#ffeaea";
        successMessage.style.color = "#d32f2f";
      }
    } catch (error) {
      successMessage.innerHTML = "Server connection failed";
      successMessage.style.display = "block";
      successMessage.style.background = "#ffeaea";
      successMessage.style.color = "#d32f2f";
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";
  });
}

document.addEventListener("DOMContentLoaded", loadPopup);