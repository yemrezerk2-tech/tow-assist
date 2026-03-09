'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400">
              {t('footer.copyright', { year })}
            </p>
          </div>
          <div className="flex space-x-6">
            <Link href="/impressum" className="text-gray-400 hover:text-white transition-colors">
              {t('footer.imprint')}
            </Link>
            <Link href="/datenschutz" className="text-gray-400 hover:text-white transition-colors">
              {t('footer.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}