const express = require("express");
const router = express.Router();
const {sendMail} = require("../mail-service");


router.post('/submit-book-form', async (req, res) => {
    const data = req.body;

    try {
        const mailOptions = {
            from: {
                name: "Narva CQB Arena",
                address: process.env.MAIL_USER,
            },
            to: ["dmitripersitski@gmail.com", data.email],
            subject: `Вы  на ${eventConfig["event-title"]}`,
            text: `
                Здравствуй, ${data.name.split(" ")[0]}. Ты зарегистрировался на игру "${eventConfig.header.title}". Смотри обновления в наших соц сетях. Просим оплатить счет в течении 5 дней по этому счету, указав при оплате свой уникальный номер:
                Ваш уникальный номер: ${uniqueNumber}
                EE291010220279349223
                V&V TRADE OÜ
                
                Если есть вопросы - обращайтесь по номеру: +372 5696 9372, Дмитрий
            `,

        }
        await sendMail(mailOptions)
        console.log('email sent')

        const appLink = "https://script.google.com/macros/s/AKfycbyXhQZllYFroiCsbKALdb4HpB36UiDzKTiN5_i5CfQtY2FqigVnCfqMW3XDM57pbs2i/exec";
        data["id"] = uniqueNumber;
        console.log(data);
        await fetch(appLink, {
            method: "POST",
            body: JSON.stringify(data)
        })
        console.log('inserted to table')

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

module.exports = router;