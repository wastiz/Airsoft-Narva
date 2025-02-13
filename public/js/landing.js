document.addEventListener("DOMContentLoaded", function() {
    const statusText = document.querySelector('.g-form__title_respond');
    const btnSend = document.querySelector('.g-form__button');
    const navTabs = document.querySelectorAll('.nav-item');
    const eventContents = [document.querySelector(".event-main"), document.querySelector(".event-plot"), document.querySelector(".event-rules"), document.querySelector(".event-teams")];

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
        };

        try {
            const response = await fetch("event/submit-book-form", {
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

    navTabs.forEach((tab, index) => {
        tab.addEventListener('click', function(event) {
            eventContents.forEach(item => {
                item.classList.add('hidden')
            })
            eventContents[index].classList.remove('hidden')
            navTabs.forEach((tab) => {
                tab.classList.remove('active')
            })
            navTabs[index].classList.add('active')
        })
    })
})
