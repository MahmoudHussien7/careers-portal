import type { Metadata } from 'next'
import { AuthProvider } from "../lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Careers Portal",
  description: "Standalone Careers / HR portal mockup extracted from GI CMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="cz-shortcut-listen='true'">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
