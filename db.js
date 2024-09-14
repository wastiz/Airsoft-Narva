const { Pool } = require('pg');
require('dotenv').config();

const user = process.env.DB_USER;
const host = process.env.DB_HOST;
const database = process.env.DB_DATABASE;
const password = process.env.DB_PASSWORD;
const port = process.env.DB_PORT;

const pool = new Pool({
    user: user,
    host: host,
    database: database,
    password: password,
    port: port,
});

async function createTableIfNotExists() {
    const query = `
       CREATE TABLE IF NOT EXISTS object3_reg (
            id SERIAL PRIMARY KEY,  -- Порядковый номер с автоинкрементом
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(15) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            age SMALLINT NOT NULL,
            nickname VARCHAR(100),
            about_character TEXT,
            team VARCHAR(100) NOT NULL,
            registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       );
    `;

    try {
        await pool.query(query);
        console.log('Table created or already exists');
    } catch (err) {
        console.error('Error creating table:', err);
    }
}

function postUser () {
    pool.query('INSERT INTO object2_reg(name, phone, email, about_character, payment_method) VALUES($1, $2, $3, $4, $5)', [name, phone, email, aboutCharacter, paymentMethod]);
}

async function isTeamOverLimit(teamName, limit = 20) {
    try {
        const result = await pool.query(`
          SELECT team, COUNT(*) AS total_members 
          FROM object3_reg 
          WHERE team IN ('4gear', 'farmacempentic') 
          GROUP BY team;
        `);


        const numberOfPeople = parseInt(result.rows[0].number_of_people, 10);
        return numberOfPeople > limit;
    } catch (error) {
        console.error('Error checking team size:', error);
        throw error;
    }
}


module.exports = {pool, createTableIfNotExists, postUser, isTeamOverLimit};