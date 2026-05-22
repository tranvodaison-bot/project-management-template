import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FTZ-ERP Platform",
    template: "%s | FTZ-ERP",
  },
  description:
    "Integrated Enterprise Resource Planning Platform for Industrial Zone & FTZ Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
