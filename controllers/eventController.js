const express = require("express");
const router = express.Router();
const {sendMail} = require("../mail-service");
const {getEventConfig} = require("../functions");
const jwt = require('jsonwebtoken');
const {pool} = require("../db");


router.post('/submit-book-form', async (req, res) => {
    const data = req.body;

    try {
        const uniqueNumber = Math.floor(Math.random() * (1000 - 10 + 1)) + 10;

        // Check for existing registration with the same email or phone
        const existingRegistration = await pool.query(`
            SELECT * FROM event_registrations 
            WHERE email = $1 OR phone = $2
        `, [data.email, data.phone]);

        if (existingRegistration.rows.length > 0) {
            return res.status(409).send('Емайл или номер телефона уже зарегистрированы');
        }

        const mailOptions = {
            from: {
                name: "Narva CQB Arena",
                address: process.env.MAIL_USER,
            },
            to: ["dmitripersitski@gmail.com", data.email],
            subject: `Вы зарегистрировались на событие`,
            text: `
                Здравствуй, ${data.name.split(" ")[0]}. Ты зарегистрировался на событие. Смотри обновления в наших соц сетях. Просим оплатить счет в течении 5 дней по этому счету, указав при оплате свой уникальный номер:
                Ваш уникальный номер: ${uniqueNumber}
                EE291010220279349223
                V&V TRADE OÜ
                
                Если есть вопросы - обращайтесь по номеру: +372 5696 9372, Дмитрий
            `,
        };

        await sendMail(mailOptions);
        console.log('email sent');

        const appLink = "https://script.google.com/macros/s/AKfycbyXhQZllYFroiCsbKALdb4HpB36UiDzKTiN5_i5CfQtY2FqigVnCfqMW3XDM57pbs2i/exec";
        data["id"] = uniqueNumber;
        console.log(data);
        
        await fetch(appLink, {
            method: "POST",
            body: JSON.stringify(data)
        });
        console.log('inserted to table');

        // Fetch the current event ID from the database
        const currentEventResult = await pool.query(
            'SELECT id FROM events WHERE current = true'
        );

        if (currentEventResult.rows.length === 0) {
            return res.status(404).send('Нет текущих событий для регистрации');
        }

        const eventId = currentEventResult.rows[0].id; // Get the current event ID

        // Save guest registration to the database
        const insertGuestQuery = `
            INSERT INTO event_registrations (event_id, name, email, phone, age, social_link, payment_method, unique_number, team)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        await pool.query(insertGuestQuery, [eventId, data.name, data.email, data.phone, data.age, data.social_link, data.payment_method, uniqueNumber, data.team]);

        res.status(200).send('Все сделано');
    } catch (error) {
        if (error.code === '23505') {
            res.status(409).send('Емайл уже зарегистрирован');
        } else {
            console.error(error);
            res.status(500).send('Ошибка при заполнении данных');
        }
    }
});

router.post('/submit-user-register', async (req, res) => {
    try {
        // Получаем токен из заголовка
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).send('Не авторизован');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Получаем данные пользователя
        const userResult = await pool.query(`
            SELECT first_name, last_name, email, phone, age, social_link
            FROM users
            WHERE id = $1
        `, [userId]);

        if (!userResult.rows[0]) {
            return res.status(404).send('Пользователь не найден');
        }

        const user = userResult.rows[0];

        // Проверяем наличие всех необходимых полей
        const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'age', 'social_link'];
        for (const field of requiredFields) {
            if (!user[field]) {
                return res.status(400).send(`Пожалуйста, заполните все поля в профиле для завершения регистрации.`);
            }
        }

        // Получаем текущий ивент
        const eventResult = await pool.query(`
            SELECT id, name
            FROM events
            WHERE current = true
        `);

        if (!eventResult.rows[0]) {
            return res.status(404).send('Активный ивент не найден');
        }

        const eventId = eventResult.rows[0].id;

        // Проверяем, не зарегистрирован ли уже пользователь
        const existingReg = await pool.query(`
            SELECT id 
            FROM event_registrations 
            WHERE event_id = $1 AND user_id = $2
        `, [eventId, userId]);

        if (existingReg.rows[0]) {
            return res.status(409).send('Вы уже зарегистрированы на этот ивент');
        }

        // Проверяем выбрана ли команда
        const selectedTeam = req.body.team;
        if (!selectedTeam) {
            return res.status(400).send('Необходимо выбрать команду');
        }

        const uniqueNumber = Math.floor(Math.random() * (1000 - 10 + 1)) + 10;

        // Отправляем письмо
        const mailOptions = {
            from: {
                name: "Narva CQB Arena",
                address: process.env.MAIL_USER,
            },
            to: [user.email],
            subject: `Вы зарегистрировались на ${eventResult.rows[0].name}`,
            text: `
                Здравствуй, ${user.first_name}. Ты зарегистрировался на игру "${eventResult.rows[0].name}". 
                Смотри обновления в наших соц сетях. Просим оплатить счет в течении 5 дней по этому счету, 
                указав при оплате свой уникальный номер:
                
                Ваш уникальный номер: ${uniqueNumber}
                EE291010220279349223
                V&V TRADE OÜ
                
                Если есть вопросы - обращайтесь по номеру: +372 5696 9372, Дмитрий
            `
        };

        await sendMail(mailOptions);

        // Добавляем запись в Google таблицу
        const appLink = "https://script.google.com/macros/s/AKfycbyXhQZllYFroiCsbKALdb4HpB36UiDzKTiN5_i5CfQtY2FqigVnCfqMW3XDM57pbs2i/exec";
        const tableData = {
            id: uniqueNumber,
            name: user.first_name,
            email: user.email,
            phone: user.phone,
            age: user.age,
            social_link: user.social_link,
            team: selectedTeam,
            payment_method: req.body.payment_method || 'bank-transfer'
        };

        await fetch(appLink, {
            method: "POST",
            body: JSON.stringify(tableData)
        });

        // Создаем регистрацию в базе данных
        await pool.query(`
            INSERT INTO event_registrations 
            (event_id, user_id, name, email, phone, age, social_link, team, payment_method, payment_status, unique_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)
        `, [
            eventId,
            userId,
            user.first_name + ' ' + user.last_name,
            user.email,
            user.phone,
            user.age,
            user.social_link,
            selectedTeam,
            req.body.payment_method || 'bank-transfer',
            uniqueNumber
        ]);

        res.status(200).send('Регистрация успешна');
    } catch (error) {
        console.error('Error:', error);
        if (error.name === 'JsonWebTokenError') {
            res.status(401).send('Недействительный токен');
        } else {
            res.status(500).send('Ошибка сервера');
        }
    }
});

module.exports = router;