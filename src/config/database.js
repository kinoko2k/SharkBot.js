require('dotenv').config();

async function connectDatabase() {
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    console.log(`${dbType} に接続中です...`);

    try {
        switch (dbType.toLowerCase()) {
            case 'mongodb': {
                const mongoose = require('mongoose');
                await mongoose.connect(process.env.MONGODB_URI);
                console.log('MongoDB に接続しました。');
                return mongoose.connection;
            }
            case 'mysql': {
                const mysql = require('mysql2/promise');
                const connection = await mysql.createConnection({
                    host: process.env.MYSQL_HOST,
                    user: process.env.MYSQL_USER,
                    password: process.env.MYSQL_PASSWORD,
                    database: process.env.MYSQL_DATABASE
                });
                console.log('MySQL に接続しました。');
                return connection;
            }
            case 'postgresql':
            case 'pg': {
                const { Client } = require('pg');
                const client = new Client({
                    connectionString: process.env.POSTGRES_URI
                });
                await client.connect();
                console.log('PostgreSQL に接続しました。');
                return client;
            }
            case 'sqlite':
            default: {
                const sqlite3 = require('sqlite3').verbose();
                const path = process.env.SQLITE_PATH || './database.sqlite';
                const db = new sqlite3.Database(path, (err) => {
                    if (err) {
                        console.error('SQLite への接続に失敗しました:', err.message);
                    } else {
                        console.log('SQLite に接続しました。');
                    }
                });
                return db;
            }
        }
    } catch (error) {
        console.error(`${dbType} への接続に失敗しました。`, error);
        process.exit(1);
    }
}

module.exports = { connectDatabase };
