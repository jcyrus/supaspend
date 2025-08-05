import type { Metadata } from "next";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Petty Cash Tracker",
  description: "Track and manage your petty cash expenses with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased`}
    >
      <body className="h-full">
        <ThemeProvider>
          <SidebarProvider>
            <AuthGuard>
              <DashboardLayout>{children}</DashboardLayout>
            </AuthGuard>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
