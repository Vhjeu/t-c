// middleware/upload.js - Cấu hình multer và validate file
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Danh sách MIME types được phép
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Extension tương ứng (để kiểm tra thêm)
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.mkv'];

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');
[imagesDir, videosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Cấu hình storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Xác định thư mục dựa vào MIME type
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
        const destDir = isImage ? imagesDir : videosDir;
        cb(null, destDir);
    },
    filename: (req, file, cb) => {
        // Đổi tên file thành UUID để bảo mật, giữ lại extension gốc
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = uuidv4() + ext;
        cb(null, uniqueName);
    }
});

// Hàm kiểm tra file hợp lệ (extension + MIME)
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`❌ Định dạng file không được hỗ trợ: ${ext}`), false);
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return cb(new Error(`❌ Loại MIME không được phép: ${file.mimetype}`), false);
    }
    cb(null, true);
};

// Khởi tạo multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB chung cho tất cả (sẽ kiểm tra riêng ảnh 20MB ở controller)
    }
});

export default upload;