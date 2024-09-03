const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'airsoftnarva-postgresql-e5968e',
    database: 'airsoft',
    password: 'admin',
    port: 5432,
});

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


module.exports = {pool, postUser, isTeamOverLimit};