const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'airsoftnarva-postgresql-e5968e',
    database: 'airsoft',
    password: 'admin',
    port: 5432,
});

async function createTableIfNotExists() {
    const query = `
        CREATE TABLE IF NOT EXISTS object3_reg (
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(15) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            nickname VARCHAR(100),
            about_character TEXT,
            team VARCHAR(100) NOT NULL,
            payment_method VARCHAR(20),
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

async function isTeamOverLimit(teamName, limit = 5) {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) AS number_of_people FROM object3_reg WHERE team = $1',
            [teamName]
        );

        const numberOfPeople = parseInt(result.rows[0].number_of_people, 10);
        return numberOfPeople > limit;
    } catch (error) {
        console.error('Error checking team size:', error);
        throw error;
    }
}


module.exports = {pool, createTableIfNotExists, postUser, isTeamOverLimit};