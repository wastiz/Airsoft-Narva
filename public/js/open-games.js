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
        payment: formData.get('payment'),
    };

    try {
        const response = await fetch("open-games/submit-book-form", {
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
        document.querySelector('.g-form').reset()
        btnSend.disabled = false;
    }
});

document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const transferDetails = document.querySelector('.transfer-details');
        if (e.target.value === 'bank-transfer') {
            transferDetails.style.display = 'block';
        } else {
            transferDetails.style.display = 'none';
        }
    });
});

function copyToClipboard(button) {
    const text = button.previousElementSibling.textContent;
    navigator.clipboard.writeText(text).then(() => {
        button.classList.add('copied');
        button.innerHTML = '<i class="fa fa-check"></i>';
        
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = '<i class="fa fa-copy"></i>';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

document.querySelector('.user-register-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('open-games/submit-user-register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]}`
            },
            body: JSON.stringify({
                payment_method: document.querySelector('input[name="payment"]:checked')?.value || 'bank-transfer'
            })
        });

        if (response.ok) {
            alert('Вы успешно зарегистрировались на игру!');
        } else {
            const errorText = await response.text();
            alert(errorText || 'Ошибка при регистрации');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка сервера');
    }
});


