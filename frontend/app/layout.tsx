import type { Metadata } from "next";
import "./globals.css";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "PDF Sage — AI-Powered Document Analysis",
  description: "Upload PDFs, ask questions, get answers with source citations. Powered by AI, grounded in your documents.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body>
        <SmoothScrollProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
