import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "テスタドア | コミュ障開発者のためのテスター支援",
  description:
    "Gmailを登録するだけ。12人集まったら開発者に届けます。Google Playテスター支援サービス。",
  openGraph: {
    title: "テスタドア | コミュ障開発者のためのテスター支援",
    description: "Gmailを登録するだけ。12人集まったら開発者に届けます。",
    url: "https://testadoor.vercel.app",
    siteName: "テスタドア",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "テスタドア | コミュ障開発者のためのテスター支援",
    description: "Gmailを登録するだけ。12人集まったら開発者に届けます。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} h-full`}
      style={{ fontFamily: "var(--font-noto-sans-jp), sans-serif" }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
