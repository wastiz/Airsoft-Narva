const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const landingConfig = require('./configs/landing-config.json');
const eventConfig = require('./configs/event-config.json');
const openGamesConfig = require('./configs/open-games.json');
const { sendMail } = require('./mail-service');
const { transformData } = require("./functions")
const port = process.env.SERVER_PORT;
const host = process.env.HOST || 3000

// Установка EJS как шаблонизатора
app.set('view engine', 'ejs');

// Настройка ejs-layouts как middleware
app.use(expressLayouts);

// Статические файлы
app.use(express.static('public'));

// Middleware для обработки JSON и URL-кодированных данных
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('pages/index', { layout: 'layouts/main', config: landingConfig, currentPath: req.path });
});


app.get('/event', async (req, res) => {
    try {
        //const restrictedTeam = await checkRestriction(['4gear', 'farmacempentic'], 3);
        res.render('pages/event', { layout: 'layouts/main', restrictedTeam: '', config: eventConfig, currentPath: req.path });
    } catch (e) {
        console.error('Error in checkTeam:', e);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/submit-event-form', async (req, res) => {
    const {name, phone, email, social, age, nickname, aboutCharacter, team} = req.body;

    try {
        const uniqueNumber = Math.floor(Math.random() * (1000 - 10 + 1)) + 10

        const mailOptions = {
            from: {
                name: "Narva CQB Arena",
                address: process.env.MAIL_USER,
            },
            to: ["dmitripersitski@gmail.com", email],
            subject: `Вы зарегистрировались на ${eventConfig["event-title"]}`,
            text: `
                Здравствуй, ${name.split(" ")[0]}. Ты зарегистрировался на игру "${eventConfig["event-title"]}". Смотри обновления в наших соц сетях. Просим оплатить счет в течении 5 дней по этому счету, указав при оплате свой уникальный номер:
                Ваш уникальный номер: ${uniqueNumber}
                EE291010220279349223
                V&V TRADE OÜ
                
                Если есть вопросы - обращайтесь по номеру: +372 5696 9372, Дмитрий
            `,

        }
        await sendMail(mailOptions)
        console.log('email sent')

        const appLink = "https://script.google.com/macros/s/AKfycbx5K7-jJwmoeWhgyyvl3ITsauta4ZE6pSO0G5anU--ML4vTpNBgcloTIhGB4TrfLH0D/exec";
        const formData = new FormData();
        formData.append('id', uniqueNumber);
        for (const key in req.body) {
            formData.append(key, req.body[key]);
        }
        console.log(formData)
        await fetch(appLink, {
            method: "POST",
            body: formData
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

app.get('/open-games', async (req, res) => {
    try {
        res.render('pages/open-games', { layout: 'layouts/main', restrictedTeam: '', config: openGamesConfig, currentPath: req.path });
    } catch (e) {
        console.error('Error in checkTeam:', e);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/submit-open-game-form', async (req, res) => {
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

        const appLink = "https://script.google.com/macros/s/AKfycby61LAj743Ots1n9sGDYEvIVoAYuoP--EKuBj2eDf4jXQhy8APwfmUlQI_vfPbnPzop/exec";
        const requestBody = {
            game: "Death Zone",
            id: uniqueNumber,
            ...req.body
        };

        console.log(requestBody);

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

app.get('/update-event', async (req, res) => {
    res.render('pages/update-event', { layout: 'layouts/main', event: eventConfig });
})

app.post('/submit-update-event', async (req, res) => {
    try {
        let data = req.body;
        console.log("Полученные данные:", data);

        data = transformData(data);
        console.log("Трансформированные данные:", data);

        const filePath = path.join(__dirname, 'configs/event-config.json');

        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        console.log("Содержимое файла до изменения:", fileContent);

        const parsedContent = JSON.parse(fileContent);

        Object.assign(parsedContent, data);

        await fs.promises.writeFile(filePath, JSON.stringify(parsedContent, null, 2), 'utf8');
        console.log("Файл успешно обновлён");

        res.status(200).json({ message: 'Файл успешно обновлён.' });
    } catch (error) {
        console.error("Ошибка:", error);
        res.status(500).json({ message: 'Произошла ошибка на сервере.', error: error.message });
    }
});



app.listen(port, host, () => {
    console.log(`Server running at http://localhost:${port}`);
});