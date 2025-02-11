const express = require("express");
const router = express.Router();
const {sendMail} = require("../mail-service");


router.post('/submit-open-game-form', async (req, res) => {
    const {name, email} = req.body;

    try {
        const uniqueNumber = Math.floor(Math.random() * (1000 - 10 + 1)) + 10

        const mailOptions = {
            from: {
                name: "Narva CQB Arena",
                address: process.env.MAIL_USER,
            },
            to: ["dmitripersitski@gmail.com", email],
            subject: `Вы зарегистрировались на Открытую Игру`,
            text: `
                Здравствуй, ${name.split(" ")[0]}. Ты зарегистрировался на Открытую игру. Хорошей тебе игры и смотри обновления в наших соц сетях.
                
                Facebook: https://www.facebook.com/NarvaCQB
                YouTube: https://youtube.com/@dmitripersitski6065?si=cjISOSNzcDVww0bK
                Vkontakte: https://vk.com/narvacqb
                Telegram: https://t.me/+xxISHNZT35phMDg0
                
                Инициалы для перевода:
                EE291010220279349223
                V&V TRADE OÜ
            `,

        }
        await sendMail(mailOptions)
        console.log('email sent')

        const appLink = "https://script.google.com/macros/s/AKfycbyXhQZllYFroiCsbKALdb4HpB36UiDzKTiN5_i5CfQtY2FqigVnCfqMW3XDM57pbs2i/exec";
        const requestBody = {
            game: "Open Game",
            id: uniqueNumber,
            ...req.body
        };

        await fetch(appLink, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        console.log('inserted to table');


        res.status(200).send('Все сделано');
    } catch (error) {
        if (error.code === '23505') {
            res.status(409).send('Емайл уже зарегистрирован');
        } else {
            console.error(error);
            res.status(500).send('Ошибка при заполнении даты');
        }
    }
});