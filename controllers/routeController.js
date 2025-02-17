const express = require('express');
const path = require("path");
const fs = require("fs");
const openGamesConfig = require("../configs/open-games.json");
const router = express.Router();
const {getEventConfig} = require("../functions");
const auth = require("../middleware/auth");


router.get('/', (req, res) => {
    res.render('pages/index', { layout: 'layouts/main', config: require("../configs/landing-config.json"), currentPath: req.path });
});

router.get('/open-games', async (req, res) => {
    try {
        res.render('pages/open-games', { layout: 'layouts/main', restrictedTeam: '', config: openGamesConfig, currentPath: req.path });
    } catch (e) {
        console.error('Error in checkTeam:', e);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/event', async (req, res) => {
    const eventConfig = getEventConfig();
    try {
        //const restrictedTeam = await checkRestriction(['4gear', 'farmacempentic'], 3);
        res.render('pages/event', { layout: 'layouts/main', restrictedTeam: '', config: eventConfig, currentPath: req.path });
    } catch (e) {
        console.error('Error in checkTeam:', e);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/profile', auth, async (req, res) => {
    try {
        if (!req.isAuthenticated) {
            return res.render('pages/profile', { 
                layout: 'layouts/main',
                isAuthenticated: false,
                userData: null,
                message: 'Пожалуйста, войдите в аккаунт или зарегистрируйтесь',
                currentPath: req.path
            });
        }

        const userId = req.user.userId;
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
            WHERE id = $1
        `;
        
        const userResult = await pool.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
            return res.render('pages/profile', { 
                isAuthenticated: false,
                userData: null,
                error: 'Пользователь не найден',
                currentPath: req.path
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
            gamesPlayed: parseInt(gamesResult.rows[0].games_count) || 0,
            memberSince: new Date(userResult.rows[0].createdAt).toLocaleDateString('ru-RU'),
            isProfileComplete: Boolean(
                userResult.rows[0].firstName || 
                userResult.rows[0].lastName || 
                userResult.rows[0].callsign || 
                userResult.rows[0].age
            )
        };

        res.render('pages/profile', {
            isAuthenticated: true,
            userData,
            isOwner: true,
            currentPath: req.path
        });

    } catch (error) {
        console.error('Error processing profile request:', error);
        res.render('pages/profile', {
            isAuthenticated: false,
            userData: null,
            error: 'Произошла ошибка при загрузке профиля',
            currentPath: req.path
        });
    }
});

router.get('/login', (req, res) => {
    res.render('pages/login', { layout: 'layouts/main', currentPath: req.path });
});

router.get('/update-event', async (req, res) => {
    const eventConfig = getEventConfig();
    res.render('pages/update-event', { layout: 'layouts/main', event: eventConfig });
})


//const landingConfig = require("../configs/landing-config.json");

module.exports = router;
