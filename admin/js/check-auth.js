(function(){

    

    async function checkAuth(){
        try{
            const resp = await fetch('http://localhost:3000/api/auth/check-auth', {
                credentials : 'include'
            });
            const data = await resp.json();
            if(!data.success){
              console.log(data);
            }
            document.getElementById('adminName').textContent = data.admin.name;
            document.getElementById('adminRole').textContent = data.admin.role;
        }catch(err){
            console.log('Message from console : ',err);
            // setTimeout(() => {
            //     window.location.href = '/admin/index.html';
            // },5000)
        }
    }
    checkAuth();
})();