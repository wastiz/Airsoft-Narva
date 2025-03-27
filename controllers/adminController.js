const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const {pool} = require('../db');
const {checkAdmin} = require("../middleware/auth");
const eventConfig = require('../configs/event-config.json');

router.post('/submit-update-event', async (req, res) => {
    try {
        let { password, active, ...data } = req.body;

        if (password === "1234") {
            return res.status(405).json({ message: 'Серьезно?!' });
        } else if (!password || password !== process.env.ADMIN_PASSWORD) {
            console.log("Попытка с неверным паролем");
            return res.status(403).json({ message: 'Доступ запрещён. Неверный пароль.' });
        }

        const imageFile = data["bg-file"];
        if (imageFile) {
            const base64Data = imageFile.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const uploadPath = path.join(__dirname, '..', 'public', 'img', 'event');

            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            const filename = data.bgname;
            const filePath = path.join(uploadPath, filename);

            fs.writeFile(filePath, buffer, (err) => {
                if (err) {
                    console.error('Ошибка записи файла:', err);
                    return res.status(500).json({ message: 'Ошибка сохранения изображения' });
                }

                const imageUrl = `public/img/event/${filename}`;
                console.log("Изображение успешно загружено");

                return res.json({ message: 'Изображение успешно загружено', imageUrl: imageUrl });
            });
        } else {
            const output = {};

            const convertDate = (date) => {
                const [year, month, day] = date.split('-');
                return `${day}.${month}.${year}`;
            };

            output["header"] = {
                "bg": data.bgname ? `img/event/${data.bgname}` : eventConfig.header.bg,
                "type": data.image ? "image" : (data.video ? "video" : "none"),
                "before-title": "Объявляем регистрацию на",
                "title": data.title,
                "after-title": convertDate(data.date) || "Дата не указана",
                "button": "Регистрация"
            };

            output["schedule"] = data.schedule;
            output["story"] = data.story;
            output["rules"] = data.rules;
            output["teams"] = data.teams;
            output["teamrestriction"] = parseInt(data.teamrestriction, 10) || null;

            output["dates-prices"] = data.pricing.map(item => {
                const formattedStartDate = item[0].split('-').reverse().join('.');
                const formattedEndDate = item[1].split('-').reverse().join('.');
                return `${formattedStartDate}-${formattedEndDate}-${item[2]}`;
            });

            output["active"] = active;

            const filePath = path.join(__dirname, '../configs/event-config.json');
            const fileContent = await fs.promises.readFile(filePath, 'utf8');

            const parsedContent = JSON.parse(fileContent);

            if (data.teams) {
                parsedContent.teams = data.teams;
            }

            Object.assign(parsedContent, output);

            await fs.promises.writeFile(filePath, JSON.stringify(parsedContent, null, 2), 'utf8');
            console.log("Файл успешно обновлён");

            return res.status(200).json({ message: 'Файл успешно обновлён.' });
        }
    } catch (error) {
        console.error("Ошибка:", error);
        return res.status(500).json({ message: 'Произошла ошибка на сервере.', error: error.message });
    }
});


router.post('/delete-current-game', checkAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Проверяем, есть ли регистрации на игру
        const registrationsResult = await client.query(`
            SELECT COUNT(*) as count
            FROM open_games og
            JOIN open_games_registrations ogr ON og.id = ogr.game_id
            WHERE og.current = true
        `);

        if (registrationsResult.rows[0].count > 0) {
            // Если есть регистрации, отправляем уведомления
            const registeredUsers = await client.query(`
                SELECT email
                FROM open_games og
                JOIN open_games_registrations ogr ON og.id = ogr.game_id
                WHERE og.current = true
            `);

            // Здесь можно добавить отправку уведомлений зарегистрированным пользователям
            // await sendCancellationEmails(registeredUsers.rows);
        }

        // Удаляем текущую игру
        await client.query('DELETE FROM open_games WHERE current = true');

        await client.query('COMMIT');
        res.status(200).send('Игра успешно отменена');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting game:', error);
        res.status(500).send('Ошибка при отмене игры');
    } finally {
        client.release();
    }
});

// Получение деталей игрока
router.get('/player-details/:playerId/:gameType', checkAdmin, async (req, res) => {
    try {
        const { playerId, gameType } = req.params;

        let query;
        let result;

        if (gameType === 'open-games') {
            query = 'SELECT name, email, phone, age, payment_method FROM open_games_registrations WHERE id = $1';
            result = await pool.query(query, [playerId]);
        } else if (gameType === 'event') {
            query = 'SELECT name, email, phone, age, payment_method, social_link FROM event_registrations WHERE id = $1';
            result = await pool.query(query, [playerId]);
        } else {
            return res.status(400).json({ error: 'Неверный тип игры' });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Игрок не найден' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Переключение статуса оплаты
router.post('/toggle-payment-status/:playerId/:gameType', checkAdmin, async (req, res) => {
    const { playerId, gameType } = req.params;

    try {
        if (gameType === "open-games") {
            await pool.query(
                'UPDATE open_games_registrations SET payment_status = CASE WHEN payment_status = \'paid\' THEN \'pending\' ELSE \'paid\' END WHERE id = $1',
                [playerId]
            );
        } else if (gameType === "event") {
            await pool.query(
                'UPDATE event_registrations SET payment_status = CASE WHEN payment_status = \'paid\' THEN \'pending\' ELSE \'paid\' END WHERE id = $1',
                [playerId]
            );
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server Error');
    }
});

// Переключение статуса прибытия
router.post('/toggle-arrival-status/:playerId/:gameType', checkAdmin, async (req, res) => {
    const { playerId, gameType } = req.params;

    try {
        if (gameType === "open-games") {
            await pool.query(
                'UPDATE open_games_registrations SET arrived = NOT arrived WHERE id = $1',
                [playerId]
            );

            await pool.query(
                'UPDATE users SET games_attended = games_attended + 1 WHERE id = (SELECT user_id FROM open_games_registrations WHERE id = $1)',
                [playerId]
            );
        } else if (gameType === "event") {
            await pool.query(
                'UPDATE event_registrations SET arrived = NOT arrived WHERE id = $1',
                [playerId]
            );

            await pool.query(
                'UPDATE users SET games_attended = games_attended + 1 WHERE id = (SELECT user_id FROM event_registrations WHERE id = $1)',
                [playerId]
            );
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server Error');
    }
});

// Создание нового ивента
router.post('/create-event', checkAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, event_date, make_current } = req.body;
        
        await client.query('BEGIN');

        // Если новый ивент должен быть текущим, сбрасываем current у остальных
        if (make_current) {
            await client.query('UPDATE events SET current = false WHERE current = true');
        }

        // Создаем новый ивент
        const result = await client.query(`
            INSERT INTO events (name, event_date, current)
            VALUES ($1, $2, $3)
            RETURNING id
        `, [name, event_date, make_current]);

        await client.query('COMMIT');
        
        res.status(201).json({ 
            message: 'Ивент успешно создан',
            eventId: result.rows[0].id 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Ошибка при создании ивента' });
    } finally {
        client.release();
    }
});

// Удаление ивента
router.delete('/delete-event/:eventId', checkAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Проверяем, есть ли регистрации на ивент
        const registrationsResult = await client.query(`
            SELECT COUNT(*) as count
            FROM event_registrations
            WHERE event_id = $1
        `, [req.params.eventId]);

        if (registrationsResult.rows[0].count > 0) {
            // Если есть регистрации, можно добавить отправку уведомлений
            // await sendCancellationEmails(eventId);
            
            // Удаляем регистрации
            await client.query('DELETE FROM event_registrations WHERE event_id = $1', 
                [req.params.eventId]);
        }

        // Удаляем сам ивент
        await client.query('DELETE FROM events WHERE id = $1', 
            [req.params.eventId]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Ивент успешно удален' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Ошибка при удалении ивента' });
    } finally {
        client.release();
    }
});

// Установка ивента текущим
router.post('/make-event-current/:eventId', checkAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Сначала убираем current у всех ивентов
        await client.query('UPDATE events SET current = false');

        // Устанавливаем current для выбранного ивента
        await client.query('UPDATE events SET current = true WHERE id = $1',
            [req.params.eventId]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Статус ивента успешно обновлен' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating event status:', error);
        res.status(500).json({ message: 'Ошибка при обновлении статуса ивента' });
    } finally {
        client.release();
    }
});

// Изменение типа текущей игры
router.post('/open-games/change-type', checkAdmin, async (req, res) => {
    try {
        const { type } = req.body;
        
        // Проверяем корректность типа
        if (!['morning', 'evening'].includes(type)) {
            return res.status(400).send('Некорректный тип игры');
        }

        // Обновляем тип текущей игры
        await pool.query(`
            UPDATE open_games 
            SET type = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE current = true
        `, [type]);

        res.status(200).send('Тип игры успешно изменен');
    } catch (error) {
        console.error('Error changing game type:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Получение конфигурации для определенного типа игры
router.get('/open-games/config/:type', checkAdmin, async (req, res) => {
    try {
        const { type } = req.params;

        // Проверяем корректность типа
        if (!['morning', 'evening'].includes(type)) {
            return res.status(400).send('Некорректный тип игры');
        }

        const result = await pool.query(`
            SELECT arrival_time, briefing_time, start_time, end_time
            FROM open_games_config
            WHERE type = $1
        `, [type]);

        if (result.rows.length === 0) {
            // Возвращаем дефолтные значения, если конфигурация не найдена
            const defaultTimes = {
                morning: {
                    arrival_time: '09:00',
                    briefing_time: '09:30',
                    start_time: '10:00',
                    end_time: '12:00'
                },
                evening: {
                    arrival_time: '19:00',
                    briefing_time: '19:30',
                    start_time: '20:00',
                    end_time: '22:00'
                }
            };
            
            // Создаем конфигурацию с дефолтными значениями
            await pool.query(`
                INSERT INTO open_games_config 
                (type, arrival_time, briefing_time, start_time, end_time)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                type,
                defaultTimes[type].arrival_time,
                defaultTimes[type].briefing_time,
                defaultTimes[type].start_time,
                defaultTimes[type].end_time
            ]);

            return res.json(defaultTimes[type]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching game config:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Сохранение конфигурации
router.post('/open-games/config', checkAdmin, async (req, res) => {
    try {
        const { type, arrival_time, briefing_time, start_time, end_time } = req.body;

        // Проверяем корректность типа
        if (!['morning', 'evening'].includes(type)) {
            return res.status(400).send('Некорректный тип игры');
        }

        // Проверяем, что все времена указаны
        if (!arrival_time || !briefing_time || !start_time || !end_time) {
            return res.status(400).send('Все поля времени должны быть заполнены');
        }

        // Проверяем последовательность времени
        const times = [arrival_time, briefing_time, start_time, end_time].map(t => new Date(`1970-01-01T${t}`));
        for (let i = 0; i < times.length - 1; i++) {
            if (times[i] >= times[i + 1]) {
                return res.status(400).send('Некорректная последовательность времени');
            }
        }

        // Проверяем существует ли уже конфигурация для этого типа
        const existingConfig = await pool.query(
            'SELECT id FROM open_games_config WHERE type = $1',
            [type]
        );

        if (existingConfig.rows.length > 0) {
            // Обновляем существующую конфигурацию
            await pool.query(`
                UPDATE open_games_config 
                SET arrival_time = $2,
                    briefing_time = $3,
                    start_time = $4,
                    end_time = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE type = $1
            `, [type, arrival_time, briefing_time, start_time, end_time]);
        } else {
            // Создаем новую конфигурацию
            await pool.query(`
                INSERT INTO open_games_config 
                (type, arrival_time, briefing_time, start_time, end_time)
                VALUES ($1, $2, $3, $4, $5)
            `, [type, arrival_time, briefing_time, start_time, end_time]);
        }

        res.status(200).send('Конфигурация успешно сохранена');
    } catch (error) {
        console.error('Error saving game config:', error);
        res.status(500).send('Ошибка сервера');
    }
});

router.post('/submit-user-register', async (req, res) => {
    try {
        const existingReg = await pool.query(`
            SELECT id 
            FROM open_games_registrations 
            WHERE email = $1 OR phone = $2
        `, [data.email, data.phone]);

        if (existingReg.rows.length > 0) {
            return res.status(409).send('Емайл или номер телефона уже зарегистрированы');
        }

        const insertGuestQuery = `
            INSERT INTO open_games_registrations (game_id, user_id, name, email, phone, age, payment_method, unique_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        await pool.query(insertGuestQuery, [gameId, userId, data.name, data.email, data.phone, data.age, data.payment_method, uniqueNumber]);

        res.status(200).send('Регистрация успешна');
    } catch (error) {
        console.error('Error:', error);
        if (error.code === '23505') {
            res.status(409).send('Емайл уже зарегистрирован');
        } else {
            res.status(500).send('Ошибка при заполнении данных');
        }
    }
});


router.post('/add-player', async (req, res) => {
    const { name, phone, email, age, team, payment_method, social_link } = req.body;

    const unique_number = Math.floor(Math.random() * 1000000);

    try {
        const eventResult = await pool.query(
            'SELECT id FROM events WHERE current = true LIMIT 1'
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).send('Нет текущего ивента');
        }

        const event_id = eventResult.rows[0].id;

        const result = await pool.query(
            `INSERT INTO event_registrations (event_id, name, phone, email, age, team, payment_method, social_link, unique_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [event_id, name, phone, email, age, team, payment_method, social_link, unique_number]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating player:', error);
        res.status(500).send('Ошибка при добавлении игрока');
    }
});


router.post('/submit-project-reg', async (req, res) => {
    const { name, unique_code, email, phone } = req.body;

    if (!name || !unique_code) {
        return res.status(400).send('Имя и Исикукод обязательны для заполнения.');
    }

    try {
        const year = parseInt(unique_code.slice(1, 3), 10);
        const month = parseInt(unique_code.slice(3, 5), 10);
        const day = parseInt(unique_code.slice(5, 7), 10);

        const firstDigit = parseInt(unique_code.charAt(0), 10);
        let fullYear;

        if (firstDigit === 3 || firstDigit === 4) {
            fullYear = 1900 + year;
        } else if (firstDigit === 5 || firstDigit === 6) {
            fullYear = 2000 + year;
        } else {
            return res.status(400).send('Некорректный Исикукод.');
        }

        const dateOfBirth = new Date(fullYear, month - 1, day);

        const today = new Date();
        let age = today.getFullYear() - fullYear;

        if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
            age--;
        }

        const insertQuery = `
            INSERT INTO project_users (name, unique_code, email, phone, age, date_of_birth)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await pool.query(insertQuery, [name, unique_code, email, phone, age, dateOfBirth]);

        res.status(200).send('Пользователь успешно зарегистрирован.');
    } catch (error) {
        console.error('Error:', error);
        if (error.code === '23505') {
            res.status(409).send('Пользователь с таким уникальным кодом уже зарегистрирован.');
        } else {
            res.status(500).send('Ошибка при регистрации пользователя.');
        }
    }
});

router.get('/get-registered-users', checkAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT name, unique_code, email FROM project_users');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching registered users:', error);
        res.status(500).send('Ошибка при получении зарегистрированных пользователей.');
    }
});

router.get('/get-registered-users-count', checkAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) AS count FROM project_users');
        res.json(result.rows[0].count);
    } catch (error) {
        console.error('Error fetching registered users count:', error);
        res.status(500).send('Ошибка при получении количества зарегистрированных пользователей.');
    }
});

module.exports = router;
