"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Download, RefreshCw, AlertCircle, Clock, CheckCircle2, Loader2 } from "lucide-react";

type PageState = "empty" | "loading" | "success" | "error" | "limit";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || "https://your-worker.workers.dev/remove";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DAILY_REQUESTS = 10;

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Home() {
  const [state, setState] = useState<PageState>("empty");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("处理失败，请换一张图片试试");
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [dailyCount, setDailyCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDailyCount = useCallback((): number => {
    if (typeof window === "undefined") return 0;
    const today = new Date().toDateString();
    const stored = localStorage.getItem("removebg_daily");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return data.count || 0;
      }
    }
    return 0;
  }, []);

  const incrementDailyCount = useCallback(() => {
    const today = new Date().toDateString();
    const current = getDailyCount();
    localStorage.setItem("removebg_daily", JSON.stringify({ date: today, count: current + 1 }));
    setDailyCount(current + 1);
  }, [getDailyCount]);

  const validateFile = (file: File): string | null => {
    if (!VALID_TYPES.includes(file.type)) {
      return "请上传 JPG、PNG 或 WebP 格式的图片";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "图片大小不能超过 10MB";
    }
    return null;
  };

  const processFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setState("error");
      return;
    }

    const count = getDailyCount();
    if (count >= MAX_DAILY_REQUESTS) {
      setState("limit");
      return;
    }

    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    setPreviewUrl(URL.createObjectURL(file));
    setState("loading");

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
        setState("limit");
        return;
      }

      if (!response.ok) {
        throw new Error(`API 返回错误: ${response.status}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("返回的图片为空");
      }

      incrementDailyCount();
      setProcessedUrl(URL.createObjectURL(blob));
      setState("success");
    } catch (err) {
      console.error("Process error:", err);
      setErrorMessage(err instanceof Error ? err.message : "处理失败，请换一张图片试试");
      setState("error");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [getDailyCount]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement("a");
    link.href = processedUrl;
    link.download = `${fileName}_nobg.png`;
    link.click();
  };

  const handleRetry = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setState("empty");
    setErrorMessage("处理失败，请换一张图片试试");
  };

  const handleNewImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setState("empty");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            🖼️ 图像背景移除
          </h1>
          <p className="text-white/90 text-sm sm:text-base">
            3秒去除背景 · 直接下载透明图
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6 sm:p-8 min-h-[420px] flex flex-col items-center justify-center">
          {/* Empty State - Upload Area */}
          {state === "empty" && (
            <div
              className={`w-full border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? "border-indigo-500 bg-indigo-50 scale-[1.02]"
                  : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-5xl mb-4">📤</div>
              <p className="text-gray-700 text-base sm:text-lg font-medium mb-2">
                拖拽图片到这里，或{" "}
                <span className="text-indigo-500 font-semibold">点击选择</span>
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">
                支持 JPG、PNG、WebP，最大 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Loading State */}
          {state === "loading" && (
            <div className="w-full text-center">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
              <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold text-lg mb-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                正在移除背景…
              </div>
              <p className="text-gray-400 text-sm">通常需要 2-5 秒，请耐心等待</p>
            </div>
          )}

          {/* Success State */}
          {state === "success" && processedUrl && (
            <div className="w-full text-center">
              {/* Preview with checkerboard */}
              <div className="relative inline-block mb-6 rounded-xl overflow-hidden shadow-lg">
                {/* Checkerboard background */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
                      linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
                      linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)
                    `,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                />
                <img
                  src={processedUrl}
                  alt="处理结果预览"
                  className="relative max-w-full max-h-80 object-contain"
                />
              </div>

              {/* Success badge */}
              <div className="flex items-center justify-center gap-2 text-green-600 font-medium mb-6">
                <CheckCircle2 className="w-5 h-5" />
                处理完成！
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Download className="w-5 h-5" />
                  下载透明背景图
                </button>
                <button
                  onClick={handleNewImage}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  <RefreshCw className="w-5 h-5" />
                  处理另一张
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="w-full text-center">
              <div className="text-5xl mb-4">❌</div>
              <p className="text-red-500 text-base font-medium mb-6">
                {errorMessage}
              </p>
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                重试
              </button>
            </div>
          )}

          {/* Rate Limit State */}
          {state === "limit" && (
            <div className="w-full text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-amber-600 text-base font-semibold mb-2">
                今日使用次数已用完
              </p>
              <p className="text-gray-400 text-sm mb-6">
                每天可免费使用 {MAX_DAILY_REQUESTS} 次，请明天再来 👋
              </p>
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                重试
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-xs">
            隐私保护 · 图片不存储 ·{" "}
            <a
              href="https://www.remove.bg/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline"
            >
              Powered by Remove.bg API
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
