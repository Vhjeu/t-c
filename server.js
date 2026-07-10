// server.js - Entry point của ứng dụng
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import filesRoute from './routes/files.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Fix __dirname khi dùng ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ file tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));
// Cho phép truy cập file uploads thông qua URL /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API
app.use('/', filesRoute);

// Khởi động server
app.listen(PORT, () => {
    console.log(`🚀 FileHub server is running on http://localhost:${PORT}`);
});