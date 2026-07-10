// app.js - Khởi tạo ứng dụng, điều phối các module
import { initUpload } from './upload.js';
import { renderGallery } from './gallery.js';
import { fetchFiles } from './api.js';
import { showToast } from './utils.js';

// Biến lưu trạng thái filter hiện tại
let currentFilter = {
    search: '',
    type: '',
    sort: 'newest'
};

// Hàm load gallery từ server
export async function loadGallery() {
    try {
        const files = await fetchFiles(currentFilter);
        renderGallery(files);
    } catch (err) {
        showToast('Không thể tải danh sách file: ' + err.message, 'error');
    }
}

// Gắn sự kiện filter
function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const sortSelect = document.getElementById('sortSelect');

    const updateAndLoad = () => {
        currentFilter.search = searchInput.value.trim();
        currentFilter.type = typeFilter.value;
        currentFilter.sort = sortSelect.value;
        loadGallery();
    };

    searchInput.addEventListener('input', debounce(updateAndLoad, 300));
    typeFilter.addEventListener('change', updateAndLoad);
    sortSelect.addEventListener('change', updateAndLoad);
}

// Debounce helper
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Khởi động toàn bộ app
function init() {
    // Khởi tạo upload với callback load lại gallery sau khi upload thành công
    initUpload(() => loadGallery());
    // Khởi tạo các filter
    initFilters();
    // Load gallery lần đầu
    loadGallery();
}

// Khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', init);