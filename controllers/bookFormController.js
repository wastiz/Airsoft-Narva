const express = require("express");
const router = express.Router();
const {sendMail} = require("../mail-service");


router.post('/submit-book-form', async (req, res) => {
    const data = req.body;
    const uniqueNumber = Date.now().toString().slice(-6);
    const totalPrice = data.players * (data.paymentMethod === 'transfer' ? 20 : 25);

    try {
        const adminMailOptions = {
            from: {
                name: "Narva CQB Arena",
                address: process.env.MAIL_USER,
            },
            to: "dmitripersitski@gmail.com",
            subject: `Новое бронирование игры #${uniqueNumber}`,
            text: `
                Новое бронирование:
                
                Имя: ${data.name}
                Email: ${data.email}
                Телефон: ${data.phone}
                Дата: ${data.date}
                Время: с ${data.timeStart} до ${data.timeEnd}
                Количество игроков: ${data.players}
                Метод оплаты: ${data.paymentMethod === 'transfer' ? 'Банковский перевод' : 'Наличные'}
                Сумма к оплате: ${totalPrice}€
                
                Сообщение от клиента: ${data.message || 'Не указано'}
            `
        };

        const clientMailOptions = {
            from: {
                name: "Narva CQB Arena",
                address: process.env.MAIL_USER,
            },
            to: data.email,
            subject: `Бронирование игры в Narva CQB Arena`,
            text: `
                Здравствуй, ${data.name.split(" ")[0]}!
                
                Вы забронировали игру на следующее время:
                Дата: ${data.date}
                Время: с ${data.timeStart} до ${data.timeEnd}
                Количество игроков: ${data.players}
                
                ${data.paymentMethod === 'transfer' ? `
                Для оплаты используйте следующие реквизиты:
                EE291010220279349223
                V&V TRADE OÜ
                
                Сумма к оплате: ${totalPrice}€
                
                Пожалуйста, укажите при оплате ваш уникальный номер бронирования: ${uniqueNumber}
                ` : `
                Оплата наличными на месте.
                Сумма к оплате: ${totalPrice}€
                `}
                
                Если у вас есть вопросы, обращайтесь по номеру: +372 5696 9372 (Дмитрий)
                
                Ваш уникальный номер бронирования: ${uniqueNumber}
            `
        };

        await sendMail(adminMailOptions);   
        await sendMail(clientMailOptions);
        console.log('emails sent');

        const appLink = "https://script.google.com/macros/s/AKfycbyXhQZllYFroiCsbKALdb4HpB36UiDzKTiN5_i5CfQtY2FqigVnCfqMW3XDM57pbs2i/exec";
        data["id"] = uniqueNumber;
        console.log(data);
        await fetch(appLink, {
            method: "POST",
            body: JSON.stringify(data)
        });
        console.log('inserted to table');

        res.status(200).send('Все сделано');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при обработке запроса');
    }
});

module.exports = router;