-- Tạo database nếu chưa có
CREATE DATABASE IF NOT EXISTS filehub;
USE filehub;

-- Bảng lưu thông tin file đã upload
CREATE TABLE IF NOT EXISTS files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  originalname VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  type ENUM('image', 'video') NOT NULL,
  width INT DEFAULT NULL,
  height INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);