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

        // Получаем данные текущей игры
        const currentGameResult = await client.query(`
            SELECT 
                arrival_time,
                briefing_time,
                start_time,
                end_time,
                type
            FROM open_games 
            WHERE current = true
        `);
        
        const currentGame = currentGameResult.rows[0] || {
            arrival_time: '18:00',
            briefing_time: '18:45',
            start_time: '19:00',
            end_time: '22:00',
            type: 'evening'
        };

        // Находим текущую активную игру и убираем флаг current
        await client.query('UPDATE open_games SET current = false WHERE current = true');

        // Создаем новую игру с теми же данными
        const insertQuery = `
            INSERT INTO open_games (
                game_date,
                arrival_time,
                briefing_time,
                start_time,
                end_time,
                description,
                current,
                type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `;

        const values = [
            formattedDate,
            currentGame.arrival_time,
            currentGame.briefing_time,
            currentGame.start_time,
            currentGame.end_time,
            `Открытая игра ${nextSaturday.toLocaleDateString('ru-RU')} на территории NarvaCQB`,
            true,
            currentGame.type
        ];

        const result = await client.query(insertQuery, values);
        
        await client.query('COMMIT');
        
        console.log(`Created new open game with ID: ${result.rows[0].id} for ${formattedDate}, type: ${currentGame.type}`);
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
