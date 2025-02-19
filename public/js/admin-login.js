document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const login = document.getElementById('admin-login').value;
    const password = document.getElementById('admin-password').value;

    try {
        const response = await fetch('auth/admin-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ login, password })
        });

        if (response.ok) {
            window.location.href = '/admin';
        } else {
            const error = await response.text();
            alert(error || 'Ошибка авторизации');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка сервера');
    }
}); 