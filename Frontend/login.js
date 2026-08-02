const form = document.querySelector('form');

form.addEventListener('submit', async function(e){
    e.preventDefault(); 
    const username = document.querySelector('input[name="username"]').value;
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;

    const response = await fetch(`/api/auth/login`,{ // Login Api
        method: 'POST',
        credentials: 'include',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            email,
            password
        })
    });

    const result = await response.json();

    if(response.ok){
        alert('Login successful!');
        localStorage.setItem('isSystemUser', result.systemUser);
        localStorage.setItem('isLoggedIn', 'true');
        const res = await fetch(`/api/account/`,{ // Find Account Api
        method: 'get',
        credentials: 'include',
        headers:{
        'Content-Type': 'application/json'
        }
        })
       const HasAccount = await res.json();
       if(!HasAccount.hasAccount){
       window.location.href = 'NoAccount.html'; //home page
       }else{
        window.location.href = 'Dashboard.html' //home page
       }
    }else{
        alert(result.message); // error 
    }
})