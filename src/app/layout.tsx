import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_TC } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "家庭共用金管理",
  description: "管理家庭共用資金、收支與退款",
};

const notoSansTc = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-sans-tc",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${notoSansTc.variable} ${jetbrainsMono.variable}`}
      lang="zh-TW"
    >
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
