const statusText = document.querySelector('.g-form__title_respond');
const btnSend = document.querySelector('.g-form__button');
const navTabs = document.querySelectorAll('.nav-item');
const eventContents = [document.querySelector(".event-main"), document.querySelector(".event-plot"), document.querySelector(".event-rules"), document.querySelector(".event-other")];

document.querySelector('.g-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    statusText.innerHTML = 'Отправляем...';

    let formData = new FormData(this);

    let data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        age: formData.get("age"),
        nickname: formData.get('nickname'),
        aboutCharacter: formData.get('about-character'),
        team: formData.get('team'),
        honeypot: formData.get('honeypot')
    };

    try {
        const response = await fetch("/submit-event-form", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log(response)

        if (response.ok) {
            statusText.innerHTML = "Отправлено, спасибо"
            btnSend.disabled = true;
        } else if (response.status === 409) {
            statusText.innerHTML = "Этот емайл уже зарегистрирован на игру"
        } else {
            statusText.innerHTML = "Что-то пошло не так..."
            console.error('Server error:', response.statusText);
        }

    } catch (error) {
        console.error('Request failed:', error);
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
