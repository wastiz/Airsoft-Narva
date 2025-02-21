document.addEventListener("DOMContentLoaded", function() {
    const statusText = document.querySelector('.g-form__title_respond');
    const btnSend = document.querySelector('.g-form__button');
    const navTabs = document.querySelectorAll('.nav-item');
    const eventContents = [document.querySelector(".event-main"), document.querySelector(".event-plot"), document.querySelector(".event-rules"), document.querySelector(".event-teams")];

    document.querySelector('.g-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        btnSend.disabled = true;
        statusText.innerHTML = 'Отправляем...';

        let formData = new FormData(this);

        let data = {
            game: document.getElementById('event-title').textContent,
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            social: formData.get('social'),
            age: formData.get("age"),
            nickname: formData.get('nickname'),
            aboutCharacter: formData.get('about-character'),
            team: formData.get('team'),
            payment_method: 'bank-transfer',
        };

        console.log(data);

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

    document.querySelector('.user-register-btn').addEventListener('click', async () => {
        const selectedTeam = document.querySelector('input[name="team"]:checked')?.value;

        if (!selectedTeam) {
            alert('Пожалуйста, выберите команду');
            return;
        }

        const cookies = document.cookie.split(';').reduce((cookies, cookie) => {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = value;
            return cookies;
        }, {});
        
        const token = cookies['token'];
        
        if (!token) {
            const modalHtml = `
                <div class="auth-modal">
                    <div class="auth-modal-content">
                        <h3>Требуется авторизация</h3>
                        <p>Для регистрации необходимо войти в аккаунт</p>
                        <div class="auth-buttons">
                            <a href="/login" class="btn btn-primary">Войти</a>
                            <a href="/register" class="btn btn-secondary">Зарегистрироваться</a>
                        </div>
                    </div>
                </div>
            `;
    
            const modalElement = document.createElement('div');
            modalElement.innerHTML = modalHtml;
            document.body.appendChild(modalElement);
    
            const style = document.createElement('style');
            style.textContent = `
                .auth-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .auth-modal-content {
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }
                .auth-buttons {
                    margin-top: 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                .auth-modal-content h3 {
                    margin-bottom: 10px;
                }
            `;
            document.head.appendChild(style);
    
            modalElement.addEventListener('click', (e) => {
                if (e.target === modalElement) {
                    modalElement.remove();
                }
            });
    
            return;
        }
    
        try {
            const response = await fetch('event/submit-user-register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    payment_method: document.querySelector('input[name="payment"]:checked')?.value || 'bank-transfer',
                    team: selectedTeam
                })
            });
    
            if (response.ok) {
                alert('Вы успешно зарегистрировались на игру!');
                window.location.reload();
            } else {
                const errorText = await response.text();
                alert(errorText || 'Ошибка при регистрации');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ошибка сервера');
        }
    });
})
