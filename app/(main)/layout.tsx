// app/(main)/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SideMenu from '@/components/Layout/SideMenu';
import '../../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gerador de Documentos',
  description: 'Sistema para geração automática de documentos Word',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <SideMenu />
          <main className="flex-1 p-8 bg-gray-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}