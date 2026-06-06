import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "家庭共用金管理",
  description: "管理家庭共用資金、收支與退款",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
