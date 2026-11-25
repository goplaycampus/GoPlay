import { useMemo, useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import type { Language, Product, UserAccount } from '../types';
import { TRANSLATIONS } from '../data/i18n';
import { formatBDT } from '../utils/commerce';
import { BrandMark } from './BrandMark';

export type AppPage =
  | 'home'
  | 'shop'
  | 'preorder'
  | 'request'
  | 'b2b'
  | 'track'
  | 'account'
  | 'wishlist'
  | 'checkout'
  | 'about'
  | 'contact'
  | 'help'
  | 'policies'
  | 'admin';

interface HeaderProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage, opts?: { category?: string }) => void;
  lang: Language;
  onToggleLang: () => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchSubmit: (q: string) => void;
  announcementText: string;
  user: UserAccount | null;
  products?: Product[];
  onSelectProduct?: (p: Product) => void;
}

export function Header({
  currentPage,
  onNavigate,
  lang,
  onToggleLang,
  cartCount,
  wishlistCount,
  onOpenCart,
  searchQuery,
  onSearchSubmit,
  announcementText,
  user,
  products = [],
  onSelectProduct,
}: HeaderProps) {
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const instantMatches = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    if (!q || products.length === 0) return [];
    return products
      .filter((p) =>
        `${p.name} ${p.nameBn} ${p.brand} ${p.model} ${p.sku} ${p.categoryLabel}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 5);
  }, [localSearch, products]);

  const t = (key: string) => TRANSLATIONS[lang][key] || key;

  const navItems: { page: AppPage; label: string }[] = [
    { page: 'shop', label: t('nav.shop') },
    { page: 'preorder', label: t('nav.preorder') },
    { page: 'request', label: t('nav.request') },
    { page: 'b2b', label: t('nav.b2b') },
    { page: 'track', label: t('nav.track') },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(localSearch);
    setShowSearch(false);
    setMobileMenuOpen(false);
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-[#E5E5E5] print:hidden">
      {showAnnouncement && (
        <div className="bg-[#111111] text-white text-xs px-4 py-1.5 flex items-center justify-between gap-4">
          <div className="flex-1 text-center truncate">{announcementText}</div>
          <button
            type="button"
            onClick={() => setShowAnnouncement(false)}
            aria-label="Dismiss announcement"
            className="text-white/70 hover:text-white p-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="max-w-[1320px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 -ml-1 text-[#111111] rounded-md hover:bg-[#F4F4F4]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            aria-label="GoPlay Home"
            className="focus-visible:outline-2 focus-visible:outline-[#111111] rounded"
          >
            <BrandMark variant="light" size="sm" />
          </a>
        </div>

        {/* Zone 2: 5 concise single-line links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const active = currentPage === item.page;
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => onNavigate(item.page)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  active
                    ? 'border-[#111111] text-[#111111] font-semibold'
                    : 'border-transparent text-[#292929] hover:text-[#111111] hover:border-[#B7F500]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Compact utility cluster + primary Cart action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowSearch((v) => !v)}
            aria-label="Search products"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-md text-[#111111] hover:bg-[#F4F4F4] transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleLang}
            aria-label={`Switch language to ${lang === 'en' ? 'Bangla' : 'English'}`}
            className="hidden sm:inline-flex items-center px-2.5 h-10 text-xs font-semibold rounded-md border border-[#E5E5E5] text-[#111111] hover:bg-[#F4F4F4] whitespace-nowrap shrink-0"
          >
            {lang === 'en' ? 'EN / বাং' : 'বাং / EN'}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('wishlist')}
            aria-label={`Wishlist (${wishlistCount})`}
            className="hidden sm:inline-flex relative w-10 h-10 items-center justify-center rounded-md text-[#111111] hover:bg-[#F4F4F4] transition-colors"
          >
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#111111] text-white text-[10px] font-mono-num flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate(user?.role === 'admin' ? 'admin' : 'account')}
            aria-label={user ? `Account: ${user.name}` : 'Sign in or Account'}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 h-10 rounded-md text-xs font-semibold text-[#111111] hover:bg-[#F4F4F4] whitespace-nowrap shrink-0"
          >
            <User className="w-4 h-4" />
            <span>{user?.role === 'admin' ? 'Admin' : user ? user.name.split(' ')[0] : t('nav.account')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open shopping cart (${cartCount} items)`}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-9 sm:h-10 rounded-md bg-[#111111] text-white hover:bg-[#292929] text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-[#B7F500]" />
            <span className="hidden sm:inline">{t('nav.cart')}</span>
            <span className="font-mono-num px-1.5 py-0.5 rounded bg-[#B7F500] text-[#111111] text-[11px] font-bold">
              {cartCount}
            </span>
          </button>
        </div>
      </header>

      {showSearch && (
        <div className="border-t border-[#E5E5E5] bg-[#F4F4F4] px-4 py-3">
          <div className="max-w-[720px] mx-auto space-y-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <label htmlFor="header-search-input" className="sr-only">
                Search sports equipment by name, brand, model, or SKU
              </label>
              <input
                id="header-search-input"
                type="search"
                autoFocus
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by product name, brand, model, or SKU (e.g. GPL-CRI-BAT-001)..."
                className="flex-1 bg-white border border-[#D4D4D4] rounded-md px-3.5 py-2 text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-[#111111] text-white text-sm font-semibold hover:bg-[#292929] whitespace-nowrap shrink-0"
              >
                Search
              </button>
            </form>

            {instantMatches.length > 0 && (
              <div className="bg-white border border-[#E5E5E5] rounded-md divide-y divide-[#F4F4F4] shadow-sm">
                {instantMatches.map((item) => {
                  const price = item.discountPrice ?? item.sellingPrice;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setShowSearch(false);
                        if (onSelectProduct) {
                          onSelectProduct(item);
                        } else {
                          onSearchSubmit(item.sku);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#FAFAFA]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-8 rounded object-cover bg-[#F4F4F4] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#111111] truncate">{item.name}</p>
                          <p className="text-[11px] text-[#525252] truncate">
                            {item.categoryLabel} · {item.availabilityStatus} · {item.sku}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono-num text-xs font-bold text-[#111111] shrink-0">
                        {formatBDT(price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E5E5] bg-white px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => {
                onNavigate(item.page);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-semibold text-[#111111] hover:bg-[#F4F4F4]"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-[#E5E5E5] grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onToggleLang();
                setMobileMenuOpen(false);
              }}
              className="py-2.5 px-2 rounded-md border border-[#E5E5E5] text-xs font-semibold text-[#111111]"
            >
              {lang === 'en' ? 'EN / বাং' : 'বাং / EN'}
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('wishlist');
                setMobileMenuOpen(false);
              }}
              className="py-2.5 px-2 rounded-md border border-[#E5E5E5] text-xs font-semibold text-[#111111]"
            >
              Wishlist ({wishlistCount})
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate(user?.role === 'admin' ? 'admin' : 'account');
                setMobileMenuOpen(false);
              }}
              className="py-2.5 px-2 rounded-md bg-[#F4F4F4] text-xs font-semibold text-[#111111]"
            >
              {user?.role === 'admin' ? 'Admin' : t('nav.account')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
