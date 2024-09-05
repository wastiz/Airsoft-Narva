const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const {pool, postUser, isTeamOverLimit, createTableIfNotExists} = require('./db')
require('dotenv').config();
const port = process.env.SERVER_PORT || 3000;

// Установка EJS как шаблонизатора
app.set('view engine', 'ejs');

// Настройка ejs-layouts как middleware
app.use(expressLayouts);

// Статические файлы
app.use(express.static('public'));

// Middleware для обработки JSON и URL-кодированных данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function checkTeam () {
    const team1 = '4gear';
    const team2 = 'farmacempentic';

    const isTeam1OverLimit = await isTeamOverLimit(team1);
    const isTeam2OverLimit = await isTeamOverLimit(team2);

    if (isTeam1OverLimit) {
        return team1
    } else if (isTeam2OverLimit) {
        return team2
    } else {
        return ''
    }
}

app.get('/', (req, res) => {
    const config = require('./landing-config.json')
    res.render('pages/index', { layout: 'layouts/main', config: config });
});


app.get('/event', async (req, res) => {
    try {
        const restrictedTeam = await checkTeam();
        const config = require('./event-config.json')
        res.render('pages/event', { layout: 'layouts/main', restrictedTeam: restrictedTeam, config: config });
    } catch (e) {
        console.error('Error in checkTeam:', e);
        res.status(500).send('Internal Server Error');
    }
});

// Обработка POST-запроса
app.post('/submit-event-form', async (req, res) => {
    const {name, phone, email, nickname, aboutCharacter, team, paymentMethod, honeypot} = req.body;

    if (honeypot) {
        return res.status(400).send('Spam detected');
    }

    try {
        await pool.query('INSERT INTO object3_reg(name, phone, email, nickname, about_character, team, payment_method) VALUES($1, $2, $3, $4, $5, $6, $7)', [name, phone, email, nickname, aboutCharacter, team, paymentMethod]);
        console.log('inserted')
        res.status(200).send('Data saved successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving data');
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
