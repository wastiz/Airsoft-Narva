const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const {pool, postUser, isTeamOverLimit, createTableIfNotExists} = require('./db')
require('dotenv').config();
const landingConfig = require('./landing-config.json');
const eventConfig = require('./event-config.json');
const { sendMail } = require('./mail-service');
const port = process.env.SERVER_PORT || 3000;

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

async function checkTeam () {
    return ''
}

app.get('/', (req, res) => {
    res.render('pages/index', { layout: 'layouts/main', config: landingConfig });
});


app.get('/event', async (req, res) => {
    try {
        const restrictedTeam = await checkTeam();
        res.render('pages/event', { layout: 'layouts/main', restrictedTeam: restrictedTeam, config: eventConfig });
    } catch (e) {
        console.error('Error in checkTeam:', e);
        res.status(500).send('Internal Server Error');
    }
});

// Обработка POST-запроса
app.post('/submit-event-form', async (req, res) => {
    const {name, phone, email, age, nickname, aboutCharacter, team} = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO object3_reg(name, phone, email, age, nickname, about_character, team) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [name, phone, email, age, nickname, aboutCharacter, team]
        );
        const uniqueNumber = result.rows[0].id;
        console.log('inserted to db and got id')

        const mailOptions = {
            from: {
                name: "Narva CQB Arena",
                address: process.env.MAIL_USER,
            },
            to: ["dmitripersitski@gmail.com", email],
            subject: `Вы зарегистрировались на ${eventConfig["event-title"]}`,
            text: `
                Привет. Ты зарегистрировался на игру "${eventConfig["event-title"]}". Смотри обновления в наших соц сетях. Просим оплатить счет в течении 5 дней по этому счету, указав при оплате свой уникальный номер:
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



async function startApp() {
    await createTableIfNotExists();
    // Здесь запускается сервер
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startApp();
