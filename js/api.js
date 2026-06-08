

const BASE_URL = window.location.origin; // e.g. https://kreditseva.onrender.com
let product = null;
let name = null;
let phone_number = null;

function redirect(product=''){
    try {
            const name = document.getElementById('heroName').value.trim();
    if(!name){
        const error  = document.getElementById('err-heroName');
        error.textContent = 'Please enter your name.';
        error.style.display = 'block';
        setTimeout(() => {
            error.textContent = '';
            error.style.display = 'none';
        },4000)        
        return;
    }
    const number = document.getElementById('heroPhone').value.trim();
    console.log(number);
    if(!number){
        const error = document.getElementById('err-heroPhone');
        error.textContent = 'Please enter your mobile number.'
        error.style.display = 'block';
        setTimeout(() => {
            error.textContent = '';
            error.style.display = 'block';
        },4000)  
        return;
    }

    if(name && number && product){
        window.localStorage.setItem('name',name);
        window.localStorage.setItem('number',number);
        window.location.href = '/apply-now?product=' + encodeURIComponent(product);
    }
    } catch (error) {
     console.log(error) ;  
    }
}


if(window.location.pathname == '/apply-now'){
    const params = new URLSearchParams(window.location.search);
    product = params.get('product') || '';
    name = window.localStorage.getItem('name') || '';
    phone_number = window.localStorage.getItem('number') || '';
    document.getElementById('af-name').value = name;
    document.getElementById('af-phone').value = phone_number;
    document.getElementById('af-product').value = product;
    
}

document.get


async function  submitForm(){
    const occupation = document.getElementById('af-occupation').value.trim().toLowerCase();
    const name = document.getElementById('af-name').value.trim().toLowerCase();
    if(!name){ showMessage('err-name', 'Please enter your name'); return; }
    const phone_number = document.getElementById('af-phone').value.trim();
    if(!phone_number){ showMessage('err-phone', 'Please enter mobile number'); return;}
    const mobileRegex = /^[6-9]\d{9}$/;
    if(!mobileRegex.test(phone_number)) { showMessage('err-phone','Please enter correct mobile number'); return; }
    const city = document.getElementById('af-city').value.trim().toLowerCase();
    if(!city) { showMessage('err-city','Please enter city'); return;}
    const net_monthly_salary = document.getElementById('af-income').value;
    if(!net_monthly_salary) { showMessage('err-income','Please select net monthly income'); return;}
    const product = document.getElementById('af-product').value;
    if(!product){ showMessage('err-product','Please select product')}
    const panCard = document.getElementById('af-pan').value.trim().toUpperCase() || null;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if(panCard && !panRegex.test(panCard)){ showMessage('err-pan','Please enter valid pancard number.');return;}
    const total_outstanding_amount = null;



    const btn = document.getElementById('apply-btn');
    const btnText = btn.querySelector('.ap-btn-text');
    const btnSpinner = btn.querySelector('.ap-btn-spinner');
    const successBox = document.getElementById('apply-success');
    const succsessMsg = document.getElementById('apply-success-msg');
    btn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-flex';

    successBox.style.display = 'none';
    succsessMsg.style.display = 'none';

    try {
        const resp = await fetch(`${BASE_URL}/apply-now/save-lead`, {
            method : 'POST',
            headers : {
                'Content-Type' : 'application/json'
            },
            body : JSON.stringify({
                name , phone_number, city, net_monthly_salary, product, occupation, panCard,total_outstanding_amount:null, source : window.location.pathname
            })
    })
    
    const data = await resp.json();
    if(data.success){
        btn.style.display = 'none';
       succsessMsg.style.display = 'block' ;
       successBox.style.display = 'block';
       document.getElementById('applyForm') .reset();
       localStorage.clear();
       setTimeout(() => {
        window.location.reload();
       },5000)
    }else{
        succsessMsg.innerText = data.message || 'Something went wrong';
        succsessMsg.style.display = 'block';
        succsessMsg.style.color = '#dc2626';
    }
    } catch (error) {
        succsessMsg.innerText =  'Network error. Please try again.';
        succsessMsg.style.display = 'block';
        succsessMsg.style.color = '#dc2626';
        console.log(error);
    }finally{
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
}

function showMessage(id,msg){
    const el = document.getElementById(id);
    el.textContent = msg;
    setTimeout(() => {
        el.textContent = '';
    },3000);
}