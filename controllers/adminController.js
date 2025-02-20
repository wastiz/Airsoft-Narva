const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const {transformData} = require("../functions");
const {pool} = require('../db');
const {checkAdmin} = require("../middleware/auth");

router.post('/submit-update-event', async (req, res) => {
    try {
        let { password, ...data } = req.body;

        if (password === "1234") {
            return res.status(405).json({ message: 'Пароль 1234 запрещен!' });
        } else if (!password || password !== process.env.ADMIN_PASSWORD) {
            console.log("Попытка с неверным паролем");
            return res.status(403).json({ message: 'Доступ запрещён. Неверный пароль.' });
        }

        console.log(data)
        const imageFile = data["bg-file"]
        if (imageFile) {
            const base64Data = imageFile.split(',')[1];

            const buffer = Buffer.from(base64Data, 'base64');

            const uploadPath = path.join(__dirname, 'public', 'img', 'event');

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

                res.json({ message: 'Изображение успешно загружено', imageUrl: imageUrl });
            });
        }

        data = transformData(data);

        const filePath = path.join(__dirname, 'configs/event-config.json');
        const fileContent = await fs.promises.readFile(filePath, 'utf8');

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
router.get('/player-details/:playerId', checkAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT first_name, last_name, callsign, email, phone, age FROM users WHERE id = $1',
            [req.params.playerId]
        );
        
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
router.post('/toggle-payment-status/:playerId', checkAdmin, async (req, res) => {
    try {
        await pool.query(
            'UPDATE open_games_registrations SET payment_status = CASE WHEN payment_status = \'paid\' THEN \'pending\' ELSE \'paid\' END WHERE id = $1',
            [req.params.playerId]
        );
        res.sendStatus(200);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server Error');
    }
});

// Переключение статуса прибытия
router.post('/toggle-arrival-status/:playerId', checkAdmin, async (req, res) => {
    try {
        await pool.query(
            'UPDATE open_games_registrations SET arrived = NOT arrived WHERE id = $1',
            [req.params.playerId]
        );
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

module.exports = router;
