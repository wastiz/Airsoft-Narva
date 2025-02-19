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