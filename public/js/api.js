// api.js - Giao tiếp với backend API
import { showToast } from './utils.js';

const BASE_URL = 'https://unison-disarray-easel.ngrok-free.dev/'; // cùng origin

export async function uploadFiles(formData, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BASE_URL}/upload`);

        // Progress event
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (err) {
                    reject(new Error('Invalid JSON response'));
                }
            } else {
                let msg = 'Upload thất bại';
                try {
                    const res = JSON.parse(xhr.responseText);
                    msg = res.message || msg;
                } catch (e) { }
                reject(new Error(msg));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Lỗi kết nối')));
        xhr.send(formData);
    });
}

export async function fetchFiles(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/files?${query}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Lỗi tải danh sách');
    return data.data;
}

export async function deleteFile(id) {
    const res = await fetch(`${BASE_URL}/file/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Xóa thất bại');
    return data;
}

export async function getFileInfo(id) {
    const res = await fetch(`${BASE_URL}/file/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Không tìm thấy file');
    return data.data;
}

export function getDownloadUrl(id) {
    return `${BASE_URL}/download/${id}`;
}