const express = require("express");
const router = express.Router();
const {sendMail} = require("../mail-service");
const {pool} = require('../db');
const {auth} = require("../middleware/auth");


router.post('/submit-book-form', async (req, res) => {
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

router.post('/submit-user-register', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log('userId from token:', userId);

        const userResult = await pool.query(
            'SELECT id, first_name, last_name, email, phone, age FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).send('Пользователь не найден');
        }

        const user = userResult.rows[0];

        const currentGameResult = await pool.query(
            'SELECT id FROM open_games WHERE current = true'
        );

        if (currentGameResult.rows.length === 0) {
            return res.status(404).send('Активная игра не найдена');
        }

        const gameId = currentGameResult.rows[0].id;

        const existingRegistration = await pool.query(
            'SELECT id FROM open_games_registrations WHERE game_id = $1 AND user_id = $2',
            [gameId, userId]
        );

        if (existingRegistration.rows.length > 0) {
            return res.status(409).send('Вы уже зарегистрированы на эту игру');
        }

        await pool.query(
            `INSERT INTO open_games_registrations 
            (game_id, user_id, name, email, phone, age, payment_method, payment_status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                gameId, 
                userId,
                `${user.first_name} ${user.last_name}`,
                user.email,
                user.phone,
                user.age,
                req.body.payment_method,
                'pending'
            ]
        );

        const mailOptions = {
            from: {
                name: "Narva CQB Arena",
                address: process.env.MAIL_USER,
            },
            to: [user.email],
            subject: `Вы зарегистрировались на Открытую Игру`,
            text: `
                Здравствуй, ${user.first_name}. Ты зарегистрировался на Открытую игру. Хорошей тебе игры и смотри обновления в наших соц сетях.
                
                Facebook: https://www.facebook.com/NarvaCQB
                YouTube: https://youtube.com/@dmitripersitski6065?si=cjISOSNzcDVww0bK
                Vkontakte: https://vk.com/narvacqb
                Telegram: https://t.me/+xxISHNZT35phMDg0
                
                ${req.body.payment_method === 'bank-transfer' ? `
                Инициалы для перевода:
                EE291010220279349223
                V&V TRADE OÜ
                ` : ''}
            `,
        };
        await sendMail(mailOptions);

        res.status(200).send('Регистрация успешно завершена');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Ошибка при регистрации');
    }
});

module.exports = router;