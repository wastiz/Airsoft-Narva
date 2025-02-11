const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
require('dotenv').config();
const port = process.env.SERVER_PORT;
const host = process.env.HOST || 3000;
const routeController = require('./controllers/routeController');
const eventController = require('./controllers/eventController');
const openGamesController = require('./controllers/openGamesController');
const adminController = require('./controllers/adminController');

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

// Маршруты для страниц
app.use('/', routeController);
app.use('/open-games', routeController);
app.use('/event', routeController);
app.use('/update-event', routeController);

// Маршруты для обработки с ивент странички
app.use('/event', eventController);

// Маршрут для обработки с открытых игр странички
app.use('/open-games', openGamesController);

//Марщрут для обработки с админ панели странички
app.use('/admin', adminController);




app.listen(port, host, () => {
    console.log(`Server running at http://localhost:${port}`);
});