document.addEventListener("DOMContentLoaded", function() {
    const statusText = document.querySelector('.respond-text');
    const btnSend = document.querySelector('#q_submit');

    document.querySelector('#quoteForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        btnSend.disabled = true;
        statusText.innerHTML = 'Отправляем...';

        let formData = new FormData(this);

        let data = {
            name: formData.get('q_nam'),
            phone: formData.get('q_phone'),
            email: formData.get('q_email'),
            message: formData.get('q_msg'),
            date: formData.get('q_date'),
            timeStart: formData.get('q_time_start'),
            timeEnd: formData.get('q_time_end'),
            players: formData.get('q_players'),
            paymentMethod: formData.get('payment_method')
        };

        try {
            const response = await fetch("/submit-book-form", {
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
})
