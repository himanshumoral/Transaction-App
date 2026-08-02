const form = document.querySelector('form');

form.addEventListener('submit', async function(e) {
    e.preventDefault(); // page reload rokta hai

    const username = document.querySelector('input[name="username"]').value;
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;

const response = await fetch(`http://localhost:3000/api/auth/register`,{
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
})

const result = await response.json();

console.log(result);

if(response.ok){
    alert('Register successful!');
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'NoAccount.html';
} else {
    alert(result.message); // error 
}
});