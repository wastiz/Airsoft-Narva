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