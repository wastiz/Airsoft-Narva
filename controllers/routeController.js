const express = require('express');
const path = require("path");
const fs = require("fs");
const openGamesConfig = require("../configs/open-games.json");
const router = express.Router();
const {getEventConfig} = require("../functions");
const {auth, checkAdmin} = require("../middleware/auth");
const { pool } = require('../db');


router.get('/', (req, res) => {
    res.render('pages/index', { layout: 'layouts/main', config: require("../configs/landing-config.json"), currentPath: req.path });
});

router.get('/open-games', async (req, res) => {
    try {
        const currentGameResult = await pool.query(`
            SELECT type
            FROM open_games
            WHERE current = true
        `);

        const gameType = currentGameResult.rows[0]?.type || 'evening';
        const configResult = await pool.query(`
            SELECT game_date, arrival_time, briefing_time, start_time, end_time
            FROM open_games
            WHERE type = $1
        `, [gameType]);

        const baseConfig = openGamesConfig;

        const config = {
            ...baseConfig,
            date: configResult.rows[0]?.game_date || '',
            gameType,
            schedule: {
                arrivalTime: configResult.rows[0]?.arrival_time || '19:00',
                briefingTime: configResult.rows[0]?.briefing_time || '19:30',
                startTime: configResult.rows[0]?.start_time || '20:00',
                endTime: configResult.rows[0]?.end_time || '22:00'
            }
        };

        res.render('pages/open-games', { 
            layout: 'layouts/main', 
            restrictedTeam: '', 
            config, 
            currentPath: req.path 
        });
    } catch (e) {
        console.error('Error in open games:', e);
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
                games_attended,
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
    
        
        const userData = {
            ...userResult.rows[0],
            memberSince: new Date(userResult.rows[0].createdAt).toLocaleDateString('ru-RU'),
            isProfileComplete: Boolean(
                userResult.rows[0].firstName || 
                userResult.rows[0].lastName || 
                userResult.rows[0].callsign || 
                userResult.rows[0].age
            )
        };

        res.render('pages/profile', {
            layout: 'layouts/main',
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

router.get('/login', auth, (req, res) => {
    res.render('pages/login', { layout: 'layouts/main', currentPath: req.path, isAuthenticated: req.isAuthenticated });
});

router.get('/register', auth, (req, res) => {
    res.render('pages/register', { layout: 'layouts/main', currentPath: req.path, isAuthenticated: req.isAuthenticated });
});

router.get('/admin-login', (req, res) => {
    if (req.cookies.adminToken) {
        return res.redirect('/admin');
    }
    res.render('pages/admin-login', { layout: 'layouts/main', currentPath: req.path });
});

router.get('/admin', checkAdmin, async (req, res) => {
    try {
        // Получаем статистику открытой игры
        const openGameResult = await pool.query(`
            SELECT og.id, og.game_date,
                   COUNT(ogr.id) as registrations_count
            FROM open_games og
            LEFT JOIN open_games_registrations ogr ON og.id = ogr.game_id
            WHERE og.current = true
            GROUP BY og.id, og.game_date
        `);

        // Получаем статистику ивента
        const eventResult = await pool.query(`
            SELECT e.id, e.name, e.event_date,
                   COUNT(er.id) as registrations_count,
                   COUNT(CASE WHEN er.payment_status = 'paid' THEN 1 END) as paid_count
            FROM events e
            LEFT JOIN event_registrations er ON e.id = er.event_id
            WHERE e.current = true
            GROUP BY e.id, e.name, e.event_date
        `);

        const openGameStats = openGameResult.rows[0] || {
            id: null,
            game_date: null,
            registrations_count: 0
        };

        const eventStats = eventResult.rows[0] || {
            id: null,
            name: 'Нет активного ивента',
            event_date: null,
            registrations_count: 0,
            paid_count: 0
        };

        res.render('pages/admin', {
            currentPath: req.path,
            openGameStats: {
                id: openGameStats.id,
                date: openGameStats.game_date ? new Date(openGameStats.game_date).toLocaleDateString('ru-RU') : '-',
                registrationsCount: parseInt(openGameStats.registrations_count)
            },
            eventStats: {
                id: eventStats.id,
                name: eventStats.name,
                date: eventStats.event_date ? new Date(eventStats.event_date).toLocaleDateString('ru-RU') : '-',
                registrationsCount: parseInt(eventStats.registrations_count),
                paidCount: parseInt(eventStats.paid_count)
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Ошибка сервера');
    }
});


router.get('/edit-open-games', checkAdmin, async (req, res) => {
    try {
        // Получаем текущую открытую игру со всеми данными
        const currentGameResult = await pool.query(`
            SELECT og.id, og.game_date, og.type,
                   COUNT(ogr.id) as registrations_count
            FROM open_games og
            LEFT JOIN open_games_registrations ogr ON og.id = ogr.game_id
            WHERE og.current = true
            GROUP BY og.id, og.game_date, og.type
        `);

        // Получаем предыдущие игры со статистикой
        const previousGamesResult = await pool.query(`
            SELECT 
                og.id, 
                og.game_date,
                og.type,
                COUNT(ogr.id) as registrations_count,
                COUNT(CASE WHEN ogr.payment_status = 'paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN ogr.arrived = true THEN 1 END) as arrived_count
            FROM open_games og
            LEFT JOIN open_games_registrations ogr ON og.id = ogr.game_id
            WHERE og.current = false
            GROUP BY og.id, og.game_date, og.type
            ORDER BY og.game_date DESC
        `);

        const openGameStats = currentGameResult.rows[0] || {
            id: null,
            game_date: null,
            type: 'evening', // дефолтное значение
            registrations_count: 0
        };

        res.render('pages/edit-open-games', {
            currentPath: '/edit-open-games',
            currentGame: {
                id: openGameStats.id,
                type: openGameStats.type
            },
            openGameStats: {
                id: openGameStats.id,
                date: openGameStats.game_date ? new Date(openGameStats.game_date).toLocaleDateString('ru-RU') : '-',
                registrationsCount: parseInt(openGameStats.registrations_count)
            },
            previousGames: previousGamesResult.rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Ошибка сервера');
    }
});



router.get('/update-event-page', checkAdmin, async (req, res) => {
    if (!req.cookies.adminToken) {
        return res.redirect('/admin-login');
    }
    const eventConfig = getEventConfig();
    res.render('pages/update-event-page', { layout: 'layouts/main', event: eventConfig });
});

router.get('/player-list/:gameType/:gameId', checkAdmin, async (req, res) => {
    try {
        const { gameType, gameId } = req.params;
        
        let query, gameResult;

        if (gameType === 'open-games') {
            query = `
                SELECT 
                    ogr.id,
                    u.first_name,
                    u.last_name,
                    u.callsign,
                    ogr.payment_status,
                    ogr.arrived
                FROM open_games_registrations ogr
                JOIN users u ON ogr.user_id = u.id
                WHERE ogr.game_id = $1
                ORDER BY ogr.created_at ASC
            `;
            
            gameResult = await pool.query(
                'SELECT game_date FROM open_games WHERE id = $1',
                [gameId]
            );
        } else if (gameType === 'event') {
            query = `
                SELECT 
                    er.id,
                    er.name,
                    er.team,
                    er.payment_status,
                    er.arrived
                FROM event_registrations er
                LEFT JOIN users u ON er.user_id = u.id
                WHERE er.event_id = $1
                ORDER BY er.created_at ASC
            `;
            
            gameResult = await pool.query(
                'SELECT event_date as game_date FROM events WHERE id = $1',
                [gameId]
            );

            if (gameResult.rows.length === 0) {
                return res.status(404).send('Игра не найдена');
            }
        }

        const result = await pool.query(query, [gameId]);

        res.render('pages/player-list', {
            layout: 'layouts/main',
            currentPath: req.path,
            players: result.rows,
            gameType,
            gameDate: new Date(gameResult.rows[0].game_date).toLocaleDateString('ru-RU'),
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server Error');
    }
});

router.get('/edit-events', checkAdmin, async (req, res) => {
    try {
        const currentEventResult = await pool.query(`
            SELECT 
                e.id, e.name, e.event_date, e.created_at, e.updated_at,
                COUNT(er.id) as registrations_count
            FROM events e
            LEFT JOIN event_registrations er ON e.id = er.event_id
            WHERE e.current = true
            GROUP BY e.id, e.name, e.event_date, e.created_at, e.updated_at
        `);

        // Получаем все предыдущие ивенты с количеством регистраций
        const previousEventsResult = await pool.query(`
            SELECT 
                e.id, e.name, e.event_date, e.created_at, e.updated_at,
                COUNT(er.id) as registrations_count
            FROM events e
            LEFT JOIN event_registrations er ON e.id = er.event_id
            WHERE e.current = false
            GROUP BY e.id, e.name, e.event_date, e.created_at, e.updated_at
            ORDER BY e.event_date DESC
        `);

        res.render('pages/edit-events', { 
            layout: 'layouts/main',
            currentPath: req.path,
            currentEvent: currentEventResult.rows[0] || null,
            previousEvents: previousEventsResult.rows,
            eventStats: {
                id: currentEventResult.rows[0]?.id || null,
                registrationsCount: parseInt(currentEventResult.rows[0]?.registrations_count || 0)
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).send('Server Error');
    }
});

//const landingConfig = require("../configs/landing-config.json");

module.exports = router;
