const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");


router.post('/update', auth, async (req, res) => {
    try {
        const { field, value } = req.body;
        
        const allowedFields = ['firstName', 'lastName', 'callsign', 'age', 'email', 'phone'];
        if (!allowedFields.includes(field)) {
            return res.status(400).json({ error: 'Недопустимое поле для обновления' });
        }
        
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