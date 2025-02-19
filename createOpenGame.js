const { pool } = require('./db.js');

async function createNextOpenGame() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const today = new Date();
        const nextSaturday = new Date();
        nextSaturday.setDate(today.getDate() + ((7 - today.getDay() + 6) % 7 || 7));
        
        // Форматируем дату для PostgreSQL
        const formattedDate = nextSaturday.toISOString().split('T')[0];

        // Проверяем, существует ли уже игра на эту дату
        const existingGame = await client.query(
            'SELECT id FROM open_games WHERE game_date = $1',
            [formattedDate]
        );

        if (existingGame.rows.length > 0) {
            console.log(`Game for ${formattedDate} already exists`);
            await client.query('ROLLBACK');
            return;
        }

        // Находим текущую активную игру и убираем флаг current
        await client.query('UPDATE open_games SET current = false WHERE current = true');

        // Создаем новую игру
        const insertQuery = `
            INSERT INTO open_games (
                game_date,
                arrival_time,
                briefing_time,
                start_time,
                end_time,
                description,
                current
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

        const values = [
            formattedDate,
            '18:00',
            '18:45',
            '19:00',
            '22:00',
            `Открытая игра ${nextSaturday.toLocaleDateString('ru-RU')} на территории NarvaCQB`,
            true
        ];

        const result = await client.query(insertQuery, values);
        
        await client.query('COMMIT');
        
        console.log(`Created new open game with ID: ${result.rows[0].id} for ${formattedDate}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating open game:', error);
        throw error;
    } finally {
        client.release();
    }
}
// Для тестирования можно раскомментировать следующую строку
// createNextOpenGame();

console.log('Open games scheduler is running...');
