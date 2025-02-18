async function loadUserData() {
    try {
        const response = await fetch('/api/profile/data', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to load user data');
        }
        
        const userData = await response.json();
        updateProfileFields(userData);
    } catch (error) {
        console.error('Error loading user data:', error);
        // Показываем сообщение об ошибке
        document.querySelectorAll('.field-value').forEach(field => {
            field.textContent = 'Ошибка загрузки';
        });
    }
}

// Функция обновления полей профиля
function updateProfileFields(userData) {
    const fields = [
        'firstName',
        'lastName',
        'callsign',
        'age',
        'email',
        'phone'
    ];

    fields.forEach(field => {
        const container = document.querySelector(`[data-field="${field}"]`);
        if (container) {
            const valueSpan = container.querySelector('.field-value');
            const input = container.querySelector('input');
            const editButton = container.querySelector('.btn-edit');
            
            const value = userData[field] || 'Не указано';
            valueSpan.textContent = value;
            input.value = userData[field] || '';
            
            // Показываем кнопку редактирования
            editButton.style.display = 'inline-block';
        }
    });

    // Обновляем статистику игр
    document.getElementById('gamesPlayed').textContent = userData.gamesPlayed || '0';
}

function enableEdit(button) {
    const fieldContent = button.closest('.field-content');
    const valueSpan = fieldContent.querySelector('.field-value');
    const editControls = fieldContent.querySelector('.edit-controls');
    const input = editControls.querySelector('input');
    
    valueSpan.style.display = 'none';
    button.style.display = 'none';
    editControls.style.display = 'flex';
    input.focus();
}

function cancelEdit(button) {
    const fieldContent = button.closest('.field-content');
    const valueSpan = fieldContent.querySelector('.field-value');
    const editButton = fieldContent.querySelector('.btn-edit');
    const editControls = fieldContent.querySelector('.edit-controls');
    
    valueSpan.style.display = 'inline';
    editButton.style.display = 'inline-block';
    editControls.style.display = 'none';
}

async function saveField(button, fieldName) {
    const fieldContent = button.closest('.field-content');
    const input = fieldContent.querySelector('input');
    const valueSpan = fieldContent.querySelector('.field-value');
    
    try {
        const response = await fetch('/api/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                field: fieldName,
                value: input.value
            })
        });
        
        if (response.ok) {
            const newValue = input.value || 'Не указано';
            valueSpan.textContent = newValue;
            cancelEdit(button);
        } else {
            const error = await response.json();
            alert(error.message || 'Ошибка при обновлении данных');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при обновлении данных');
    }
}