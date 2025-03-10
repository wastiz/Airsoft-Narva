const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const cron = require('node-cron');
const port = process.env.SERVER_PORT;
const host = process.env.HOST || 3000;
const routeController = require('./controllers/routeController');
const eventController = require('./controllers/eventController');
const openGamesController = require('./controllers/openGamesController');
const adminController = require('./controllers/adminController');
const bookFormController = require('./controllers/bookFormController');
const profileController = require('./controllers/profileController');
const authController = require('./controllers/authController');
const { createNextOpenGame } = require('./createOpenGame');
// Установка EJS как шаблонизатора
app.set('view engine', 'ejs');

// Настройка ejs-layouts как middleware
app.use(expressLayouts);

// Статические файлы
app.use(express.static('public'));
app.set('layout', 'layouts/main');

// Увеличиваем лимит до 50 МБ в теле запроса
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware для обработки JSON и URL-кодированных данных
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Маршруты для страниц
app.use('/', routeController);
app.use('/open-games', routeController);
app.use('/event', routeController);
app.use('/update-event', routeController);

//Маршруты для обработки форм бронирования
app.use('/',bookFormController);

// Маршруты для обработки с ивент странички
app.use('/event', eventController);

// Маршрут для обработки с открытых игр странички
app.use('/open-games', openGamesController);

// Маршрут для обработки с профиля странички
app.use('/profile', profileController);

//Марщрут для обработки с админ панели странички
app.use('/admin', adminController);

//Маршрут для обработки с регистрации и авторизации странички
app.use('/auth', authController);


// Запускаем задачу каждый понедельник в 00:01
cron.schedule('1 0 * * 1', async () => {
    console.log('Running scheduled task to create next open game...');
    try {
        await createNextOpenGame();
    } catch (error) {
        console.error('Failed to create next open game:', error);
    }
});

app.listen(port, host, () => {
    console.log(`Server running at http://localhost:${port}`);
});