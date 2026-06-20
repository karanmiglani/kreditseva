const phoneInput = document.getElementById('cc-phone');
const btn = document.getElementById('cc-submit-btn');
btn.disabled = true;
btn.style.display = 'none';
let phoneNumber = null;
let timer ;
if(phoneInput){
    phoneInput.addEventListener('input', function(){
        clearTimeout(timer);
        timer = setTimeout(() => {
            phoneNumber = phoneInput.value.trim();
            const resp = validatePhoneNumber();
            if(resp){ saveNewPhoneNumber(); }
        },500)
    })
}


function validatePhoneNumber(){
    if(phoneNumber){
        if(phoneNumber && phoneNumber.length === 10 && phoneNumber != null && phoneNumber != undefined && /^[6-9]{1}[0-9]{9}$/.test(phoneNumber)) return true;
    }
    return false;
}


async function saveNewPhoneNumber(){
try {
        const resp = await fetch(`${window.location.origin}/api/leads/save-phone-number`,{
        method : 'POST',
        headers : {'Content-Type' : 'application/json'},
        body : JSON.stringify({ phone_number : phoneNumber, product : 'credit-card' })
    });

    const data = await resp.json();
    if(data.success){
         btn.style.display = 'block' ;
         btn.disabled = false;
         sessionStorage.setItem('id', data.rawLeadId);
    }else{
         showMessage('err-success-message', data.message);
    }
} catch (error) {
    console.log(error);
}
}


async function creditCard(){
    try {
            const name = document.getElementById('cc-name').value.trim().toLowerCase();
    if(!name){ showMessage('err-ccName', 'Please enter valid name'); return; }
    const occupation = document.getElementById('cc-employment').value;
    if(!occupation){ showMessage('err-ccEmployment','Please select occupation.'); return; }
    const income = document.getElementById('cc-income').value;
    if(!income){ showMessage('err-ccIncome','Please select your net monthly income.'); return; }
    if(!sessionStorage.getItem('id')){
        showMessage('err-success-message', 'Session expired, Please enter your mobile number again');
        return;
    }
    console.log(sessionStorage.getItem('id'));

    const resp = await fetch(`${window.location.origin}/apply-now/save-lead`, {
        method : 'POST',
        headers  : {'Content-Type' : 'application/json'},
        body : JSON.stringify({
            rawLeadId : sessionStorage.getItem('id'),
            name : name,
            net_monthly_salary : income,
            product : 'credit-card',
            loan_amount : null,
            occupation : occupation,
            source : window.location.pathname 
        })
    });
    const data = await resp.json();
    if(!data.success && rawLeadId == null){
        showToast(data.message);
    }
    if(data.success){
        // Show success message + Coming Soon popup
        const successMsg = document.getElementById('cc-success-msg');
        if(successMsg) successMsg.style.display = 'block';
        localStorage.clear();
        sessionStorage.clear();
        showCelebration();
        setTimeout(() => window.location.reload(), 5000);

        // const overlay = document.getElementById('cc-coming-soon-overlay');
        // if(overlay) overlay.style.display = 'flex';

        const submitBtn = document.getElementById('cc-submit-btn');
        if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Submitted'; }
    }else{
        const successMsg = document.getElementById('cc-success-msg');
        successMsg.textContent = data.message;
        if(successMsg) successMsg.style.display = 'block';
    }
    } catch (error) {
        console.log(error);
    }

    
}


function showMessage(id, msg){
    const el = document.getElementById(id);
    el.style.display = 'block';
    el.textContent = msg;
    setTimeout(() => {
        el.textContent = '';
        el.style.display = 'block';
    },5000)
}