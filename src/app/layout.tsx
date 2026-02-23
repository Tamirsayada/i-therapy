import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "i-therapy | זיהוי ושחרור אמונות מגבילות",
  description:
    "אפליקציה חכמה שעוזרת לך לזהות ולשחרר אמונות מגבילות באמצעות NLP",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased min-h-screen bg-background">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
