// Обработка кнопки выхода
document.querySelector('.admin-logout-btn')?.addEventListener('click', async () => {
    try {
        const response = await fetch('/auth/admin-logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            window.location.href = '/admin/login';
        } else {
            throw new Error('Ошибка при выходе');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при выходе');
    }
});

// Загрузка статистики при загрузке страницы
async function loadDashboardStats() {
    try {
        const response = await fetch('/admin/dashboard-stats');
        if (response.ok) {
            const stats = await response.json();
            
            // Обновляем статистику открытой игры
            document.getElementById('openGameRegistrations').textContent = 
                stats.openGame.registrationsCount || '0';
            document.getElementById('openGameDate').textContent = 
                stats.openGame.date || '-';
            
            // Обновляем статистику ивента
            document.getElementById('eventRegistrations').textContent = 
                stats.event.registrationsCount || '0';
            document.getElementById('eventDate').textContent = 
                stats.event.date || '-';
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }

    try {
        const response = await fetch('/admin/get-registered-users');
        const users = await response.json();
        const thead = document.getElementById('registered-users-head');
        thead.innerText = 'Зарегано по проекту (' + users.length + ")";
        const tbody = document.getElementById('registered-users-body');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.unique_code}</td>
                <td>${user.email || 'Не указан'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching registered users:', error);
    }
}

// Загружаем статистику при загрузке страницы
document.addEventListener('DOMContentLoaded', loadDashboardStats);
