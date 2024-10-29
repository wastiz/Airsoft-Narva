const statusText = document.querySelector('.g-form__title_respond');
const btnSend = document.querySelector('.g-form__button');

document.querySelector('.g-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    btnSend.disabled = true;
    statusText.innerHTML = 'Отправляем...';

    let formData = new FormData(this);

    let data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        age: formData.get("age"),
    };

    try {
        const response = await fetch("/submit-open-game-form", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        if (response.ok) {
            statusText.innerHTML = "Отправлено, спасибо";
        } else if (response.status === 409) {
            statusText.innerHTML = "Этот email уже зарегистрирован на игру";
        } else {
            statusText.innerHTML = "Что-то пошло не так...";
        }

    } catch (error) {
        console.error('Request failed:', error);
        statusText.innerHTML = "Ошибка сети или сервера. Попробуйте еще раз позже.";
    } finally {
        btnSend.disabled = false;
    }
});
