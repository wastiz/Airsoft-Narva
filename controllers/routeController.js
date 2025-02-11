const express = require('express');
const path = require("path");
const fs = require("fs");
const openGamesConfig = require("../configs/open-games.json");
const router = express.Router();
const {getEventConfig} = require("../functions");


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

router.get('/update-event', async (req, res) => {
    const eventConfig = getEventConfig();
    res.render('pages/update-event', { layout: 'layouts/main', event: eventConfig });
})


//const landingConfig = require("../configs/landing-config.json");

module.exports = router;
