CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS kdm_items (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    item_type VARCHAR(100) NOT NULL,
    net_weight NUMERIC(10,3) NOT NULL,
    charges NUMERIC(10,3) NOT NULL,
    making_cost NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT kdm_status_check
    CHECK (status IN ('available', 'sold'))
);


CREATE TABLE IF NOT EXISTS hallmark_items (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    item_type VARCHAR(100) NOT NULL,
    net_weight NUMERIC(10,3) NOT NULL,
    charges NUMERIC(10,3) NOT NULL,
    making_cost NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT hallmark_status_check
    CHECK (status IN ('available', 'sold'))
);

CREATE TABLE IF NOT EXISTS silver_items (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    item_type VARCHAR(100) NOT NULL,
    weight NUMERIC(10,3) NOT NULL,
    making_cost NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT silver_status_check
    CHECK (status IN ('available', 'sold'))
);

CREATE TABLE IF NOT EXISTS rates (
    id INTEGER PRIMARY KEY,
    gold_rate NUMERIC(12,2) NOT NULL,
    hallmark_rate NUMERIC(12,2) NOT NULL,
    silver_rate NUMERIC(12,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT only_one_rate_row CHECK (id = 1)
);