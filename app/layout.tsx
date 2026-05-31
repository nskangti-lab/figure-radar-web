import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "피규어레이더",
  description: "피규어 상품 검색 및 외부 판매처 중계 플랫폼",
  other: {
    "format-detection": "telephone=no, date=no, email=no, address=no"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-black text-ink">피규어레이더</span>
              <span className="hidden text-xs font-semibold text-mint sm:inline">
                Figure Radar
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <Link className="rounded-md px-3 py-2 hover:bg-paper" href="/search">
                검색
              </Link>
              <Link className="rounded-md px-3 py-2 hover:bg-paper" href="/admin">
                관리자
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-120px)] max-w-6xl px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-neutral-500">
            피규어레이더는 외부 판매처로 연결만 제공하며 직접 결제나 자체 판매를 하지 않습니다.
          </div>
        </footer>
      </body>
    </html>
  );
}
