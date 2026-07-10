// gallery.js - Hiển thị gallery và xử lý modal, thao tác file
import { fetchFiles, deleteFile, getDownloadUrl } from './api.js';
import { formatSize, formatDate, showToast, isImage, getFileIcon } from './utils.js';
import { showConfirm } from './confirm-modal.js';

let currentFiles = [];

const galleryGrid = document.getElementById('galleryGrid');
const emptyState = document.getElementById('emptyState');
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const modalInfo = document.getElementById('modalInfo');
const modalActions = document.getElementById('modalActions');

// Render danh sách file
export function renderGallery(files) {
    currentFiles = files;
    galleryGrid.innerHTML = '';

    if (files.length === 0) {
        emptyState.style.display = 'block';
        galleryGrid.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    galleryGrid.style.display = 'grid';

    files.forEach(file => {
        const card = createFileCard(file);
        galleryGrid.appendChild(card);
    });
}

function createFileCard(file) {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.dataset.id = file.id;

    // Thumbnail
    const thumbDiv = document.createElement('div');
    if (isImage(file.mimetype)) {
        const img = document.createElement('img');
        img.src = file.url;
        img.alt = file.originalname;
        img.className = 'file-thumbnail';
        img.loading = 'lazy';
        img.addEventListener('click', () => openModal(file));
        thumbDiv.appendChild(img);
    } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'video-thumb-wrapper';
        const video = document.createElement('video');
        video.src = file.url;
        video.className = 'file-thumbnail';
        video.preload = 'metadata';
        video.muted = true;
        wrapper.appendChild(video);
        const playBtn = document.createElement('div');
        playBtn.className = 'play-button';
        playBtn.innerHTML = '▶';
        wrapper.appendChild(playBtn);
        wrapper.addEventListener('click', (e) => {
            if (e.target !== video) return;
            openModal(file);
        });
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(file);
        });
        thumbDiv.appendChild(wrapper);
    }
    card.appendChild(thumbDiv);

    // Info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'file-info';
    infoDiv.innerHTML = `
    <div class="file-name" title="${file.originalname}">${file.originalname}</div>
    <div class="file-meta">
      <span>${getFileIcon(file.type)} ${file.type.toUpperCase()}</span>
      <span>${formatSize(file.size)}</span>
      <span>${file.width ? file.width + 'x' + file.height : ''}</span>
      <span>${formatDate(file.created_at)}</span>
    </div>
  `;
    card.appendChild(infoDiv);

    // Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'file-actions';
    actionsDiv.innerHTML = `
    <button class="btn-icon download-btn" title="Tải xuống">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg> Tải
    </button>
    <button class="btn-icon copy-btn" title="Sao chép link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg> Link
    </button>
    <button class="btn-icon danger delete-btn" title="Xóa">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg> Xóa
    </button>
  `;

    // Gắn sự kiện
    actionsDiv.querySelector('.download-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(getDownloadUrl(file.id), '_blank');
    });
    actionsDiv.querySelector('.copy-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const fullUrl = window.location.origin + file.url;
        navigator.clipboard.writeText(fullUrl).then(() => {
            showToast('Đã sao chép link!');
        });
    });

    // Sự kiện xóa với confirm modal đẹp
    actionsDiv.querySelector('.delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await showConfirm();
        if (confirmed) {
            try {
                await deleteFile(file.id);
                showToast('Đã xóa file khỏi danh sách');
                card.remove();
                if (galleryGrid.children.length === 0) {
                    emptyState.style.display = 'block';
                    galleryGrid.style.display = 'none';
                }
            } catch (err) {
                showToast(err.message, 'error');
            }
        }
    });

    card.appendChild(actionsDiv);
    return card;
}

// Modal xem trước
function openModal(file) {
    modalBody.innerHTML = '';
    if (isImage(file.mimetype)) {
        const img = document.createElement('img');
        img.src = file.url;
        img.alt = file.originalname;
        modalBody.appendChild(img);
    } else {
        const video = document.createElement('video');
        video.src = file.url;
        video.controls = true;
        video.autoplay = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '70vh';
        modalBody.appendChild(video);
    }

    modalInfo.innerHTML = `<strong>${file.originalname}</strong> &mdash; ${formatSize(file.size)} &mdash; ${formatDate(file.created_at)}`;

    modalActions.innerHTML = `
    <button class="btn-primary modal-download">Tải xuống</button>
    <button class="btn-secondary modal-copy">Sao chép link</button>
    <button class="btn-secondary modal-close-btn">Đóng</button>
  `;

    modalActions.querySelector('.modal-download').addEventListener('click', () => {
        window.open(getDownloadUrl(file.id), '_blank');
    });
    modalActions.querySelector('.modal-copy').addEventListener('click', () => {
        const fullUrl = window.location.origin + file.url;
        navigator.clipboard.writeText(fullUrl).then(() => showToast('Đã sao chép link!'));
    });
    modalActions.querySelector('.modal-close-btn').addEventListener('click', closeModal);

    modalOverlay.style.display = 'flex';
}

function closeModal() {
    modalOverlay.style.display = 'none';
    const video = modalBody.querySelector('video');
    if (video) video.pause();
}

document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});