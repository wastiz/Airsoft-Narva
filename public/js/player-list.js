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
async function showPlayerDetails(playerId, gameType) {
    try {
        const response = await fetch(`/admin/player-details/${playerId}/${gameType}`);
        if (response.ok) {
            const player = await response.json();
            
            document.getElementById('playerDetails').innerHTML = `
                <div class="player-info">
                    <p><strong>Имя Фамилимя:</strong> ${player.name}</p>
                    <p><strong>Email:</strong> ${player.email}</p>
                    <p><strong>Телефон:</strong> ${player.phone}</p>
                    <p><strong>Возраст:</strong> ${player.age}</p>
                    <p><strong>Соц сеть:</strong> ${player.social_link ?? '-'}</p>
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
async function togglePaymentStatus(playerId, gameType) {
    try {
        const response = await fetch(`/admin/toggle-payment-status/${playerId}/${gameType}`, {
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
async function toggleArrivalStatus(playerId, gameType) {
    try {
        const response = await fetch(`/admin/toggle-arrival-status/${playerId}/${gameType}`, {
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