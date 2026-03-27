import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "图像背景移除 — 3秒完成",
  description: "极简在线图像背景移除工具，上传图片即可获得透明背景的 PNG。用户无需注册，即用即走。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
