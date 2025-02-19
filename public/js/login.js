document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('#submit');
    const statusText = document.querySelector('.respond-text');
    
    submitBtn.disabled = true;
    statusText.innerHTML = 'Выполняется вход...';
    
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        remember: document.getElementById('remember').checked
    };
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            statusText.innerHTML = 'Успешный вход!';
            window.location.href = '/profile';
        } else {
            statusText.innerHTML = data.error || 'Ошибка при входе';
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        statusText.innerHTML = 'Ошибка сервера. Попробуйте позже';
        submitBtn.disabled = false;
    }
});