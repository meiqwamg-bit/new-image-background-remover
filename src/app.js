/**
 * Image Background Remover - Frontend
 * 图像背景移除 - 前端逻辑
 */

(function () {
  "use strict";

  // ========== Config ==========
  // IMPORTANT: Replace with your actual Cloudflare Worker URL after deployment
  const WORKER_URL = "https://your-worker.workers.dev/remove";

  // ========== DOM Elements ==========
  const uploadArea = document.getElementById("upload-area");
  const fileInput = document.getElementById("file-input");
  const previewArea = document.getElementById("preview-area");
  const previewImage = document.getElementById("preview-image");
  const downloadBtn = document.getElementById("download-btn");
  const retryBtn = document.getElementById("retry-btn");
  const loadingArea = document.getElementById("loading-area");
  const errorArea = document.getElementById("error-area");
  const errorMessage = document.getElementById("error-message");
  const errorRetryBtn = document.getElementById("error-retry-btn");
  const limitArea = document.getElementById("limit-area");

  // ========== State ==========
  let currentFileName = "";
  let processedBlob = null;

  // ========== Init ==========
  function init() {
    bindEvents();
  }

  // ========== Event Bindings ==========
  function bindEvents() {
    // Upload area click
    uploadArea.addEventListener("click", () => fileInput.click());

    // File input change
    fileInput.addEventListener("change", handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener("dragover", handleDragOver);
    uploadArea.addEventListener("dragleave", handleDragLeave);
    uploadArea.addEventListener("drop", handleDrop);

    // Buttons
    downloadBtn.addEventListener("click", handleDownload);
    retryBtn.addEventListener("click", resetToUpload);
    errorRetryBtn.addEventListener("click", resetToUpload);
  }

  // ========== Drag & Drop ==========
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add("drag-over");
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove("drag-over");
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove("drag-over");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  // ========== File Handling ==========
  function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function processFile(file) {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showError("请上传 JPG、PNG 或 WebP 格式的图片");
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showError("图片大小不能超过 10MB");
      return;
    }

    currentFileName = file.name.replace(/\.[^/.]+$/, "");
    showLoading();
    uploadAndProcess(file);
  }

  // ========== API Call ==========
  async function uploadAndProcess(file) {
    try {
      const formData = new FormData();
      formData.append("image_file", file);
      formData.append("size", "auto");
      formData.append("format", "png");

      const response = await fetch(WORKER_URL, {
        method: "POST",
        body: formData,
      });

      if (response.status === 429) {
        // Rate limited
        showLimit();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("API Error:", response.status, errorText);
        throw new Error(`API 返回错误: ${response.status}`);
      }

      // Get the processed image
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("返回的图片为空");
      }

      processedBlob = blob;
      showPreview(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Process error:", err);
      showError(err.message || "处理失败，请换一张图片试试");
    }
  }

  // ========== UI State Management ==========
  function showLoading() {
    hideAllAreas();
    loadingArea.hidden = false;
    fileInput.value = ""; // Reset input
  }

  function showPreview(imageUrl) {
    hideAllAreas();
    previewImage.src = imageUrl;
    previewArea.hidden = false;
    fileInput.value = ""; // Reset input
  }

  function showError(message) {
    hideAllAreas();
    errorMessage.textContent = message || "处理失败，请换一张图片试试";
    errorArea.hidden = false;
    fileInput.value = "";
  }

  function showLimit() {
    hideAllAreas();
    limitArea.hidden = false;
    fileInput.value = "";
  }

  function hideAllAreas() {
    uploadArea.hidden = true;
    previewArea.hidden = true;
    loadingArea.hidden = true;
    errorArea.hidden = true;
    limitArea.hidden = true;
  }

  function resetToUpload() {
    hideAllAreas();
    uploadArea.hidden = false;
    fileInput.value = "";
    processedBlob = null;
  }

  // ========== Download ==========
  function handleDownload() {
    if (!processedBlob) return;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(processedBlob);
    link.download = `${currentFileName}_nobg.png`;
    link.click();

    // Release object URL after a short delay
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }

  // ========== Start ==========
  init();
})();
