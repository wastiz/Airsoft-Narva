// Модальное окно
const modal = document.getElementById('createEventModal');

function openCreateModal() {
    modal.style.display = "block";
}

function closeCreateModal() {
    modal.style.display = "none";
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    if (event.target == modal) {
        closeCreateModal();
    }
}

// Создание нового ивента
document.getElementById('createEventForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        event_date: formData.get('event_date'),
        make_current: formData.get('make_current') === 'on'
    };

    try {
        const response = await fetch('/admin/create-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при создании ивента');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка сервера');
    }
});

// Удаление ивента
async function deleteEvent(eventId) {
    if (confirm('Вы уверены, что хотите удалить этот ивент?')) {
        try {
            const response = await fetch(`/admin/delete-event/${eventId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const error = await response.text();
                alert(error || 'Ошибка при удалении ивента');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ошибка сервера');
        }
    }
}

// Установка ивента текущим
async function makeEventCurrent(eventId) {
    try {
        const response = await fetch(`/admin/make-event-current/${eventId}`, {
            method: 'POST'
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при установке текущего ивента');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка сервера');
    }
}


function openCreatePlayerModal() {
    const playerModal = document.getElementById('createPlayerModal');
    playerModal.style.display = "block";
}

function closeCreatePlayerModal () {
    const playerModal = document.getElementById('createPlayerModal');
    playerModal.style.display = "none";
}


// Обработка отправки формы создания игрока
document.getElementById('createPlayerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        age: formData.get('age'),
        team: formData.get('team'),
        payment_method: formData.get('paymentMethod'),
        social_link: formData.get('socialLink')
    };

    try {
        const response = await fetch('/admin/add-player', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при создании игрока');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка сервера');
    }
}); 