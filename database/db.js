// database/db.js - Kết nối MySQL bằng mysql2/promise
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',        // Thay bằng user MySQL của bạn
    password: '',        // Thay bằng password MySQL
    database: 'filehub',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;