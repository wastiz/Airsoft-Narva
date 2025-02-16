const express = require("express");
const router = express.Router();


router.get('/get-user/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                error: 'Некорректный ID пользователя',
                message: 'Указан неверный формат ID пользователя'
            });
        }

        const userQuery = `
            SELECT 
                id,
                first_name as "firstName",
                last_name as "lastName",
                callsign,
                age,
                email,
                phone,
                created_at as "createdAt"
            FROM users 
            WHERE id = ${userId}
        `;
        
        const userResult = await pool.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Пользователь не найден',
                message: 'Данные пользователя отсутствуют в системе'
            });
        }

        const gamesQuery = `
            SELECT COUNT(*) as games_count
            FROM user_games 
            WHERE user_id = $1
        `;
        
        const gamesResult = await pool.query(gamesQuery, [userId]);
        
        const userData = {
            ...userResult.rows[0],
            gamesPlayed: parseInt(gamesResult.rows[0].games_count) || 0
        };

        if (parseInt(userId) !== req.user.userId) {
            userData.email = 'Скрыто';
            userData.phone = 'Скрыто';
        }

        const hasAdditionalData = Boolean(
            userData.firstName || 
            userData.lastName || 
            userData.callsign || 
            userData.age
        );

        userData.isProfileComplete = hasAdditionalData;
        userData.memberSince = new Date(userData.createdAt).toLocaleDateString('ru-RU');

        res.json({
            success: true,
            data: userData,
            isOwner: parseInt(userId) === req.user.userId
        });

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ 
            error: 'Ошибка при получении данных пользователя',
            message: 'Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.'
        });
    }
});

router.post('/update', auth, async (req, res) => {
    try {
        const { field, value } = req.body;
        
        const allowedFields = ['firstName', 'lastName', 'callsign', 'age', 'email', 'phone'];
        if (!allowedFields.includes(field)) {
            return res.status(400).json({ error: 'Недопустимое поле для обновления' });
        }
        
        // Обновляем только одно поле
        const query = `
            UPDATE users 
            SET ${field} = $1 
            WHERE id = $2 
            RETURNING *
        `;
        
        const result = await pool.query(query, [value, req.user.userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Ошибка при обновлении профиля' });
    }
});

module.exports = router;