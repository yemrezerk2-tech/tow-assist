'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Mail, FileText, Settings, Car } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
export default function Header() {
  const pathname = usePathname();
  const [showAdminButton, setShowAdminButton] = useState(false);
  const { t } = useLanguage();  
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
            <div className="w-8 h-8 md:w-10 md:h-10 road-sign rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
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
              className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-xl text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-300"
              title={t('nav.partners')}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm md:text-base font-medium">{t('nav.partners')}</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-xl text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-300"
            title={t('nav.contact')}
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm md:text-base font-medium">{t('nav.contact')}</span>
            </Link>
            <Link
              href="/blog"
              className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-xl text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-300"
            title={t('nav.blog')}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm md:text-base font-medium">{t('nav.blog')}</span>
            </Link>
            {pathname === '/' && showAdminButton && (
              <Link
                href="/admin/login"
                className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-2 rounded-xl text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-300"
                title="Admin Panel"
              
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm md:text-base font-medium hidden sm:inline">{t('nav.admin')}</span>
              </Link>
           
            )}
            <div className="ml-1 md:ml-2">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}