document.querySelector('.g-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    let formData = new FormData(this);

    let data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        nickname: formData.get('nickname'),
        aboutCharacter: formData.get('about-character'),
        team: formData.get('team'),
        paymentMethod: formData.get('payment-method'),
        honeypot: formData.get('honeypot')
    };

    console.log('Form data to be sent:', data);

    try {
        const response = await fetch("/submit-event-form", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Server response:', result);
        } else {
            console.error('Server error:', response.statusText);
        }

    } catch (error) {
        console.error('Request failed:', error);
    }
});
