// controllers/fileController.js - Xử lý logic upload và quản lý file
import path from 'path';
import fs from 'fs/promises';
import { fileTypeFromFile } from 'file-type';
import sizeOf from 'image-size';
import pool from '../database/db.js';

// Hàm lấy kích thước ảnh (width, height)
const getImageDimensions = async (filePath) => {
    try {
        const dimensions = sizeOf(filePath);
        return { width: dimensions.width, height: dimensions.height };
    } catch (error) {
        return { width: null, height: null };
    }
};

// Helper: xóa file trên ổ đĩa (vẫn giữ lại để có thể dùng sau nếu cần)
const deleteFileFromDisk = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (err) {
        console.error('Không thể xóa file:', filePath, err);
    }
};

// POST /upload
export const uploadFiles = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất một file.' });
        }

        const uploaded = [];
        const errors = [];

        for (const file of files) {
            const isImage = file.mimetype.startsWith('image/');
            if (isImage && file.size > 20 * 1024 * 1024) {
                await deleteFileFromDisk(file.path);
                errors.push({ filename: file.originalname, error: 'Kích thước ảnh vượt quá 20MB' });
                continue;
            }

            const typeResult = await fileTypeFromFile(file.path);
            if (!typeResult) {
                await deleteFileFromDisk(file.path);
                errors.push({ filename: file.originalname, error: 'Không thể xác định loại file (hỏng hoặc giả mạo)' });
                continue;
            }

            const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
            if (!ALLOWED_MIME_TYPES.includes(typeResult.mime)) {
                await deleteFileFromDisk(file.path);
                errors.push({ filename: file.originalname, error: `Loại file thực tế không được hỗ trợ: ${typeResult.mime}` });
                continue;
            }

            let width = null, height = null;
            if (isImage) {
                const dims = await getImageDimensions(file.path);
                width = dims.width;
                height = dims.height;
            }

            const type = isImage ? 'image' : 'video';
            const [result] = await pool.execute(
                `INSERT INTO files (filename, originalname, mimetype, size, type, width, height)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [file.filename, file.originalname, typeResult.mime, file.size, type, width, height]
            );

            uploaded.push({
                id: result.insertId,
                filename: file.filename,
                originalname: file.originalname,
                mimetype: typeResult.mime,
                size: file.size,
                type,
                width,
                height,
                url: `/uploads/${type}s/${file.filename}`
            });
        }

        res.json({
            success: true,
            message: `Đã upload ${uploaded.length}/${files.length} file thành công`,
            data: uploaded,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi upload file.' });
    }
};

// GET /files - Lấy danh sách file có search, sort, filter
export const getFiles = async (req, res) => {
    try {
        const { search, sort, type, page = 1, limit = 20 } = req.query;
        let sql = 'SELECT * FROM files WHERE 1=1';
        const params = [];

        if (search) {
            sql += ' AND originalname LIKE ?';
            params.push(`%${search}%`);
        }
        if (type && (type === 'image' || type === 'video')) {
            sql += ' AND type = ?';
            params.push(type);
        }

        const sortOptions = {
            newest: 'created_at DESC',
            oldest: 'created_at ASC',
            name_asc: 'originalname ASC',
            name_desc: 'originalname DESC',
            size_asc: 'size ASC',
            size_desc: 'size DESC'
        };
        const order = sortOptions[sort] || 'created_at DESC';
        sql += ` ORDER BY ${order}`;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.execute(sql, params);

        const filesWithUrl = rows.map(file => ({
            ...file,
            url: `/uploads/${file.type}s/${file.filename}`,
            downloadUrl: `/download/${file.id}`
        }));

        res.json({ success: true, data: filesWithUrl });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách file.' });
    }
};

// GET /file/:id
export const getFileById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute('SELECT * FROM files WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'File không tồn tại.' });
        }
        const file = rows[0];
        file.url = `/uploads/${file.type}s/${file.filename}`;
        file.downloadUrl = `/download/${file.id}`;
        res.json({ success: true, data: file });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
};

// DELETE /file/:id - Chỉ xóa record trong database, giữ nguyên file trên ổ cứng
export const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute('SELECT * FROM files WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'File không tồn tại.' });
        }
        // Chỉ xóa trong database, KHÔNG xóa file vật lý
        await pool.execute('DELETE FROM files WHERE id = ?', [id]);

        // (Tùy chọn) Có thể ghi log hoặc đánh dấu file "mồ côi" để dọn dẹp sau
        res.json({ success: true, message: 'Đã xóa file khỏi danh sách. File vẫn được giữ trên máy chủ.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa file.' });
    }
};

// GET /download/:id - Tải file về
export const downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute('SELECT * FROM files WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'File không tồn tại.' });
        }
        const file = rows[0];
        const filePath = path.join(process.cwd(), 'uploads', `${file.type}s`, file.filename);

        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ success: false, message: 'File đã bị xóa khỏi ổ đĩa.' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
        res.setHeader('Content-Type', file.mimetype);
        const fileStream = (await import('fs')).createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi tải file.' });
    }
};