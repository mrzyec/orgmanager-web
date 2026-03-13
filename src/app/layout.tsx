import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "OrgManager",
  description: "OrgManager web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-[#e5e7eb] text-slate-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
