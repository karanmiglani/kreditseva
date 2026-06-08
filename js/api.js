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