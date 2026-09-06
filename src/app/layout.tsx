import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import "react-grid-layout/css/styles.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prism AI | 데이터에 질문하고 대시보드를 만드세요",
  description:
    "데이터에서 직접 계산한 근거로 대시보드를 만드는 인공지능 분석 공간입니다.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f8f9fb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
