
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/custom/ThemeProvider';
import Header from '@/components/custom/Header';
import Footer from '@/components/custom/Footer';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/app/auth/AuthContext';

export const metadata: Metadata = {
  title: 'MJLT - Mr James Luxury Transport',
  description: 'Book luxury transport rides in advance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 page-transition">
              {children}
            </main>
            <Footer />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
