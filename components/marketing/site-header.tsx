"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { LoginModal } from '@/components/landing/login-modal';

// Liens de navigation principaux. Les ancres pointent vers la page d'accueil
// (préfixe "/#...") afin de fonctionner depuis n'importe quelle page marketing.
const navLinks = [
  { label: 'Fonctionnalités', href: '/#features' },
  { label: 'Solutions', href: '/#comparison' },
  { label: 'Tarifs', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

export function SiteHeader() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">KSM</h1>
                <p className="text-xs text-gray-500">Solution Comptable</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Button
                onClick={() => setIsLoginOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Se connecter
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <Button
                  onClick={() => setIsLoginOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white mx-3"
                >
                  Se connecter
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
