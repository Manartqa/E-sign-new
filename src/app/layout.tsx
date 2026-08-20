import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import { NextAuthProvider } from "@/context/auth/NextAuthProvider";
import { QueryProvider } from "@/context/query/QueryProvider";
import { AppToaster } from "@/components/common/AppToaster";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ระบบการลงนามอนุมัติดิจิทัล",
    template: "%s | ระบบการลงนามอนุมัติดิจิทัล",
  },
  description: "ระบบการลงนามอนุมัติด้วยลายมือชื่อดิจิทัล (E-Signature)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${notoSansThai.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextAuthProvider>
          <QueryProvider>
            {children}
            <AppToaster />
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
