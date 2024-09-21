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

async function checkRestriction(teams, limit) {
    try {
        const result = await pool.query(`
          SELECT team, COUNT(*) AS total_members 
          FROM object3_reg 
          WHERE team IN (${teams.map(team => `'${team}'`).join(', ')}) 
          GROUP BY team;
        `);

        const rows = result.rows.map(row => ({
            team: row.team,
            total_members: parseInt(row.total_members, 10)
        }));

        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows.length; j++) {
                if (i !== j && rows[i].total_members >= rows[j].total_members + limit) {
                    return rows[i].team;
                }
            }
        }

        return null;

    } catch (error) {
        console.error('Error checking team size:', error);
        throw error;
    }
}


module.exports = {pool, createTableIfNotExists, postUser, checkRestriction};