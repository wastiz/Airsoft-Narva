function enableEdit(button) {
    const fieldContent = button.closest('.field-content');
    const valueSpan = fieldContent.querySelector('.field-value');
    const editControls = fieldContent.querySelector('.edit-controls');
    
    valueSpan.style.display = 'none';
    button.style.display = 'none';
    editControls.style.display = 'flex';
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

async function saveField(button, field) {
    const fieldContent = button.closest('.field-content');
    const input = fieldContent.querySelector('input');
    const valueSpan = fieldContent.querySelector('.field-value');
    const value = input.value;

    try {
        const response = await fetch('/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ field, value })
        });

        const data = await response.json();

        if (response.ok) {
            valueSpan.textContent = value || 'Не указано';
            cancelEdit(button);
        } else {
            alert(data.error || 'Ошибка при обновлении');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка сервера');
    }
}

