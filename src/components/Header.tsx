'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Mail, Phone, Car } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || '+494012345678';

  // not showing on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-yellow-500 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/*Logo here */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 road-sign rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-black text-gray-900 hidden sm:inline">
              Road Help
            </span>
          </Link>

          {/* nav links */}
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
            <a
              href={`tel:${contactPhone}`}
              className="flex items-center gap-1 md:gap-2 road-sign px-3 md:px-5 py-2 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm md:text-base">Notruf</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}