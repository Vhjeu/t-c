// confirm-modal.js - Modal xác nhận hiện đại thay thế confirm()

let currentCallback = null;

const overlay = document.getElementById('confirmOverlay');
const cancelBtn = document.getElementById('confirmCancel');
const deleteBtn = document.getElementById('confirmDelete');

function showConfirm(message = 'Bạn có chắc muốn xóa file này không?') {
    return new Promise((resolve) => {
        currentCallback = resolve;
        // Cập nhật message nếu muốn động
        const msgElement = document.querySelector('.confirm-message');
        if (msgElement) msgElement.textContent = message;
        overlay.style.display = 'flex';
    });
}

function hideConfirm(confirmed) {
    overlay.style.display = 'none';
    if (currentCallback) {
        currentCallback(confirmed);
        currentCallback = null;
    }
}

cancelBtn.addEventListener('click', () => hideConfirm(false));
deleteBtn.addEventListener('click', () => hideConfirm(true));

// Đóng khi click ngoài dialog
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideConfirm(false);
});

export { showConfirm };