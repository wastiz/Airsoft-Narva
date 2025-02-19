const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
require('dotenv').config();

router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        const checkUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({
                error: 'Пользователь с таким email уже существует'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (
                email, 
                password_hash, 
                first_name, 
                last_name, 
                created_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
            RETURNING id, email, first_name, last_name`,
            [email, hashedPassword, firstName, lastName]
        );

        const token = jwt.sign(
            { 
                userId: result.rows[0].id,
                firstName: result.rows[0].first_name,
                lastName: result.rows[0].last_name
            },
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Регистрация успешна'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Ошибка при регистрации'
        });
    }
});

// Вход пользователя
router.post('/login', async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        // Ищем пользователя
        const result = await pool.query(
            'SELECT id, email, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Неверный email или пароль'
            });
        }

        const user = result.rows[0];

        // Проверяем пароль
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Неверный email или пароль'
            });
        }

        const expiresIn = remember ? '180d' : '3d'; // 180 дней или 3 дня
        const maxAge = remember ? 
            180 * 24 * 60 * 60 * 1000 : // 180 дней
            3 * 24 * 60 * 60 * 1000;    // 3 дня

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge
        });

        res.json({
            success: true,
            message: 'Вход выполнен успешно'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Ошибка при входе'
        });
    }
});

// Выход пользователя
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Выход выполнен успешно'
    });
});


// Обработка логина
router.post('/admin-login', (req, res) => {
    const { login, password } = req.body;
    
    if (login === process.env.ADMIN_LOGIN && password === process.env.ADMIN_PASSWORD) {
        res.cookie('adminToken', 'true', { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 часа
        });
        res.status(200).send('OK');
    } else {
        res.status(401).send('Неверный логин или пароль');
    }
});

// Выход из админки
router.post('/admin-logout', (req, res) => {
    res.clearCookie('adminToken');
    res.redirect('/admin/login');
});


module.exports = router; 