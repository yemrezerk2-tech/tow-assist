'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Mail, FileText, Settings, Car } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [showAdminButton, setShowAdminButton] = useState(false);

  useEffect(() => {
    if (pathname === '/') {
      const timer = setTimeout(() => setShowAdminButton(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowAdminButton(false);
    }
  }, [pathname]);

  // Don't show header on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-yellow-500 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 road-sign rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-black text-gray-900 hidden sm:inline">
              Road Help
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2 md:gap-4">
            <Link
              href="/partners"
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-xl text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-300"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm md:text-base font-medium">Partner</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-xl text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-300"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm md:text-base font-medium">Kontakt</span>
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-xl text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-300"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm md:text-base font-medium">Blog</span>
            </Link>
            {pathname === '/' && showAdminButton && (
              <Link
                href="/admin/login"
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-xl text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-300"
                title="Admin Panel"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm md:text-base font-medium hidden sm:inline">Admin</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}