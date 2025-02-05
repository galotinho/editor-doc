// components/Layout/SideMenu.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideMenu() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Gerar Documento', href: '/' },
    { name: 'Gerenciar Documento com Seções', href: '/loop' },
    { name: 'Gerenciar Variáveis', href: '/variables' },    
  ];

  return (
    <nav className="w-64 bg-white shadow-lg h-screen fixed">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-6">Doc Generator</h1>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-4 py-2 rounded-lg ${
                  pathname === item.href 
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}