// utils.js - Các hàm tiện ích dùng chung

/**
 * Định dạng kích thước file từ bytes
 */
export function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Định dạng ngày tháng
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

/**
 * Hiển thị toast notification
 */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/**
 * Lấy phần mở rộng của file
 */
export function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Kiểm tra có phải file ảnh không
 */
export function isImage(mimetype) {
    return mimetype.startsWith('image/');
}

/**
 * Lấy icon tương ứng loại file
 */
export function getFileIcon(type) {
    return type === 'image' ? '🖼️' : '🎬';
}