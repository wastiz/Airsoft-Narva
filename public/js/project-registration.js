document.getElementById('registration-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/admin/submit-project-reg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.text();
        document.getElementById('response-message').innerText = result;

        if (response.ok) {
            this.reset();
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('response-message').innerText = 'Ошибка при добавлении пользователя.';
    }
});
