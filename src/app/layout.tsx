
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { AuthInitializer } from "@/components/AuthInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyGym",
  description: "Social Network for Gym Rats",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="transition-colors duration-300 ease-in-out">
      <body className={cn("min-h-screen bg-background font-sans antialiased transition-colors duration-300 ease-in-out", inter.className)}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            <AuthInitializer />
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
