const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            req.isAuthenticated = false;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Проверяем существование пользователя в базе
        const result = await pool.query(
            'SELECT id, email FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            req.isAuthenticated = false;
            res.clearCookie('token');
            return next();
        }

        req.user = {
            userId: decoded.userId,
            email: result.rows[0].email
        };
        req.isAuthenticated = true;
        next();

        console.log('Auth middleware - decoded token:', decoded);
    } catch (error) {
        console.error('Auth middleware error:', error);
        req.isAuthenticated = false;
        res.clearCookie('token');
        next();
    }
};

module.exports = auth; 