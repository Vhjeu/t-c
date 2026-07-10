// upload.js - Quản lý khu vực upload, drag & drop, preview, progress
import { uploadFiles } from './api.js';
import { formatSize, showToast, isImage, getFileExtension } from './utils.js';
import { loadGallery } from './app.js'; // sẽ import trong app.js, tránh vòng lặp, ta dùng callback

// Các biến toàn cục trong module
let selectedFiles = [];
let currentUploadController = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const previewContainer = document.getElementById('previewContainer');
const previewList = document.getElementById('previewList');
const previewCount = document.getElementById('previewCount');
const clearPreviewBtn = document.getElementById('clearPreview');
const uploadBtn = document.getElementById('uploadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressPercentage = document.getElementById('progressPercentage');
const progressFilename = document.getElementById('progressFilename');

// Hàm khởi tạo các sự kiện upload
export function initUpload(onUploadSuccess) {
    // Kéo thả
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        addFilesToPreview(files);
    });

    // Click chọn file
    browseBtn.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('click', (e) => {
        if (e.target === uploadArea || e.target.closest('.upload-icon, .upload-title, .upload-hint, .upload-limit')) {
            fileInput.click();
        }
    });
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        addFilesToPreview(files);
        fileInput.value = ''; // reset để chọn lại file trùng
    });

    // Nút clear preview
    clearPreviewBtn.addEventListener('click', () => {
        selectedFiles = [];
        renderPreview();
    });

    // Nút upload
    uploadBtn.addEventListener('click', startUpload);

    async function startUpload() {
        if (selectedFiles.length === 0) return;
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));

        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressPercentage.textContent = '0%';
        progressFilename.textContent = 'Đang chuẩn bị...';

        try {
            const response = await uploadFiles(formData, (percent) => {
                progressFill.style.width = percent + '%';
                progressPercentage.textContent = percent + '%';
                progressFilename.textContent = `Đang tải ${selectedFiles.length} file...`;
            });

            // Hiển thị kết quả
            if (response.success) {
                showToast(response.message);
                if (response.errors && response.errors.length > 0) {
                    response.errors.forEach(e => showToast(`${e.filename}: ${e.error}`, 'error'));
                }
                // Reset preview
                selectedFiles = [];
                renderPreview();
                // Load lại gallery
                if (onUploadSuccess) onUploadSuccess();
            } else {
                showToast(response.message || 'Upload thất bại', 'error');
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            progressContainer.style.display = 'none';
        }
    }
}

// Thêm file vào danh sách preview
function addFilesToPreview(files) {
    // Lọc file hợp lệ (extension, size)
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mkv'];
    const maxImageSize = 20 * 1024 * 1024;
    const maxVideoSize = 500 * 1024 * 1024;

    files.forEach(file => {
        const ext = getFileExtension(file.name);
        if (!allowedExtensions.includes(ext)) {
            showToast(`Định dạng ${ext} không được hỗ trợ`, 'error');
            return;
        }
        if (isImage(file.type) && file.size > maxImageSize) {
            showToast(`${file.name}: Ảnh vượt quá 20MB`, 'error');
            return;
        }
        if (!isImage(file.type) && file.size > maxVideoSize) {
            showToast(`${file.name}: Video vượt quá 500MB`, 'error');
            return;
        }
        // Tránh trùng tên tạm (có thể trùng, chấp nhận)
        selectedFiles.push(file);
    });
    renderPreview();
}

function renderPreview() {
    previewList.innerHTML = '';
    if (selectedFiles.length === 0) {
        previewContainer.style.display = 'none';
        return;
    }
    previewContainer.style.display = 'block';
    previewCount.textContent = selectedFiles.length;

    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item';

        if (isImage(file.type)) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            item.appendChild(img);
        } else {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.preload = 'metadata';
            item.appendChild(video);
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'preview-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', () => {
            selectedFiles.splice(index, 1);
            renderPreview();
        });
        item.appendChild(removeBtn);
        previewList.appendChild(item);
    });
}