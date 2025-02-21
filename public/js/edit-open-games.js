document.getElementById('deleteGameBtn')?.addEventListener('click', async () => {
    if (confirm('Вы уверены, что хотите отменить текущую игру?')) {
        try {
            const response = await fetch('/admin/delete-current-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('Игра успешно отменена');
                window.location.reload();
            } else {
                const error = await response.text();
                alert(error || 'Ошибка при отмене игры');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ошибка сервера');
        }
    }
});

async function makeGameCurrent(gameId) {
    if (!confirm('Сделать эту игру текущей?')) {
        return;
    }

    try {
        const response = await fetch(`/open-games/${gameId}/make-current`, {
            method: 'POST'
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при обновлении игры');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка сервера');
    }
}

async function deleteGame(gameId) {
    if (!confirm('Вы уверены, что хотите удалить эту игру?')) {
        return;
    }

    try {
        const response = await fetch(`/open-games/${gameId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при удалении игры');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка сервера');
    }
}

async function changeGameType(type) {
    if (!confirm(`Изменить тип текущей игры на ${type === 'morning' ? 'утреннюю' : 'вечернюю'}?`)) {
        return;
    }

    try {
        const response = await fetch('admin/open-games/change-type', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type })
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при изменении типа игры');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка сервера');
    }
}

let currentConfigType = '';
const modal = document.getElementById('configModal');
const closeBtn = document.getElementsByClassName('close')[0];

async function openConfigModal(type) {
    currentConfigType = type;
    document.getElementById('modalTitle').textContent = 
        `Настройки ${type === 'morning' ? 'утренней' : 'вечерней'} игры`;

    try {
        const response = await fetch(`admin/open-games/config/${type}`);
        if (response.ok) {
            const config = await response.json();
            document.querySelector('[name="arrival_time"]').value = config.arrival_time;
            document.querySelector('[name="briefing_time"]').value = config.briefing_time;
            document.querySelector('[name="start_time"]').value = config.start_time;
            document.querySelector('[name="end_time"]').value = config.end_time;
        }
    } catch (error) {
        console.error('Error:', error);
    }

    modal.style.display = 'block';
}

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

document.getElementById('configForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const config = {
        type: currentConfigType,
        arrival_time: formData.get('arrival_time'),
        briefing_time: formData.get('briefing_time'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time')
    };

    try {
        const response = await fetch('admin/open-games/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        if (response.ok) {
            alert('Настройки сохранены');
            modal.style.display = 'none';
        } else {
            const error = await response.text();
            alert(error || 'Ошибка при сохранении настроек');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка сервера');
    }
}); 