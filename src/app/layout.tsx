import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "밥이음",
  description:
    "남은 반려동물 사료·간식·용품을 필요한 보호자와 연결하는 AI 매칭 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
