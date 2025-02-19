// Обработка модального окна
const modal = document.getElementById('playerModal');
const closeBtn = document.querySelector('.close');

closeBtn.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Показать детали игрока
async function showPlayerDetails(playerId) {
    try {
        const response = await fetch(`/admin/player-details/${playerId}`);
        if (response.ok) {
            const player = await response.json();
            
            document.getElementById('playerDetails').innerHTML = `
                <div class="player-info">
                    <p><strong>Имя:</strong> ${player.first_name}</p>
                    <p><strong>Фамилия:</strong> ${player.last_name}</p>
                    <p><strong>Позывной:</strong> ${player.callsign || '-'}</p>
                    <p><strong>Email:</strong> ${player.email}</p>
                    <p><strong>Телефон:</strong> ${player.phone}</p>
                    <p><strong>Возраст:</strong> ${player.age}</p>
                    <p><strong>Метод оплаты:</strong> ${player.payment_method === 'bank-transfer' ? 'Банковский перевод' : 'Наличные'}</p>
                </div>
            `;
            
            modal.style.display = "block";
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при загрузке данных игрока');
    }
}

// Переключение статуса оплаты
async function togglePaymentStatus(playerId) {
    try {
        const response = await fetch(`/admin/toggle-payment-status/${playerId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при обновлении статуса оплаты');
    }
}

// Переключение статуса прибытия
async function toggleArrivalStatus(playerId) {
    try {
        const response = await fetch(`/admin/toggle-arrival-status/${playerId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при обновлении статуса прибытия');
    }
} 