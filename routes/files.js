// routes/files.js - Định nghĩa các route API
import express from 'express';
import upload from '../middleware/upload.js';
import {
    uploadFiles,
    getFiles,
    getFileById,
    deleteFile,
    downloadFile
} from '../controllers/fileController.js';

const router = express.Router();

// Middleware multer cho upload nhiều file, field name là "files"
const multiUpload = upload.array('files', 10); // tối đa 10 file một lần

// POST /upload
router.post('/upload', (req, res, next) => {
    multiUpload(req, res, (err) => {
        if (err) {
            // Xử lý lỗi từ multer (size, filter...)
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, uploadFiles);

// GET /files
router.get('/files', getFiles);

// GET /file/:id
router.get('/file/:id', getFileById);

// DELETE /file/:id
router.delete('/file/:id', deleteFile);

// GET /download/:id
router.get('/download/:id', downloadFile);

export default router;