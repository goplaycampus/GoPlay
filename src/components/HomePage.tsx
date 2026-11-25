import { useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, Globe2, PackageSearch, ShieldCheck, Truck } from 'lucide-react';
import { CATEGORIES, IMG_HERO } from '../data/catalog';
import { TRANSLATIONS } from '../data/i18n';
import type { Language, Product } from '../types';
import type { AppPage } from './Header';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';

interface HomePageProps {
  products: Product[];
  recentlyViewedProducts?: Product[];
  lang: Language;
  wishlistIds: string[];
  comparedIds?: string[];
  onToggleWishlist: (id: string) => void;
  onToggleCompare?: (p: Product) => void;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
  onClearRecentlyViewed?: () => void;
  onNavigate: (page: AppPage, opts?: { category?: string }) => void;
}

type DiscoveryTab = 'ready' | 'preorder' | 'bestsellers' | 'new';

export function HomePage({
  products,
  recentlyViewedProducts = [],
  lang,
  wishlistIds,
  comparedIds = [],
  onToggleWishlist,
  onToggleCompare,
  onSelectProduct,
  onQuickAdd,
  onClearRecentlyViewed,
  onNavigate,
}: HomePageProps) {
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('ready');
  const t = (key: string) => TRANSLATIONS[lang][key] || key;

  const filteredDiscovery = products
    .filter((p) => {
      if (activeTab === 'ready') return p.availabilityStatus === 'In Stock';
      if (activeTab === 'preorder') return p.availabilityStatus === 'Pre-order';
      if (activeTab === 'bestsellers') return Boolean(p.isBestSeller || p.featured);
      if (activeTab === 'new') return Boolean(p.isNewArrival);
      return true;
    })
    .slice(0, 6);

  return (
    <div className="bg-white">
      {/* 1. Hero Section */}
      <section className="relative bg-[#111111] text-white overflow-hidden">
        <div className="relative max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[540px]">
          <div className="lg:col-span-6 px-4 sm:px-6 py-14 lg:py-20 flex flex-col justify-center z-10">
            <p className="text-xs font-semibold tracking-wider text-[#B7F500] mb-4">
              GoPlay Bangladesh · Gear Up. Get Out. Go Play.
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-white max-w-xl [text-wrap:balance]">
              {t('hero.headline')}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/80 max-w-lg leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-[#B7F500] text-[#111111] font-display font-bold text-sm hover:bg-[#a6df00] transition-colors whitespace-nowrap shrink-0"
              >
                <span>{t('hero.ctaPrimary')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('request')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md border border-white/30 text-white font-display font-semibold text-sm hover:border-[#B7F500] hover:text-[#B7F500] transition-colors whitespace-nowrap shrink-0"
              >
                <PackageSearch className="w-4 h-4" />
                <span>{t('hero.ctaSecondary')}</span>
              </button>
            </div>
            <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/75">
              <span>Ready-Stock Retail</span>
              <span>Transparent Pre-Orders</span>
              <span>Custom Gear Sourcing</span>
              <span>Club &amp; Academy Supply</span>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[300px] lg:min-h-full">
            <img
              src={IMG_HERO}
              alt="Athlete training with cricket bat and football inside a modern dark concrete training facility"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center lg:absolute lg:inset-0"
            />
            <div className="hidden lg:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#111111] to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* 2. Featured Sports Categories */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
              {t('home.categoriesTitle')}
            </h2>
            <p className="mt-1.5 text-sm text-[#525252]">{t('home.categoriesSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="text-sm font-semibold text-[#111111] hover:underline decoration-[#B7F500] decoration-2 underline-offset-4 whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            View All Categories →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onNavigate('shop', { category: cat.slug })}
              className="group text-left bg-[#F4F4F4] border border-[#E5E5E5] rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-[#111111]"
            >
              <ProductImage src={cat.image} alt={cat.name} aspectClass="aspect-[4/3]" />
              <div className="p-4 bg-white">
                <h3 className="font-display text-base font-bold text-[#111111] group-hover:underline decoration-[#B7F500] decoration-2 underline-offset-4">
                  {lang === 'bn' ? cat.nameBn : cat.name}
                </h3>
                <p className="mt-1 text-xs text-[#525252] line-clamp-1">{cat.itemFocus}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Curated Product Discovery */}
      <section className="bg-[#F4F4F4] border-y border-[#E5E5E5] py-16">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
                {t('home.discoveryTitle')}
              </h2>
              <p className="mt-1 text-sm text-[#525252]">
                Sample launch catalogue · Every listing states real-time stock or pre-order status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-[#E5E5E5] rounded-lg self-start">
              {(
                [
                  { id: 'ready', label: 'Ready Stock' },
                  { id: 'preorder', label: 'Pre-order' },
                  { id: 'bestsellers', label: 'Featured' },
                  { id: 'new', label: 'New Arrivals' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#111111] text-white'
                      : 'text-[#525252] hover:text-[#111111]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDiscovery.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                wishlisted={wishlistIds.includes(product.id)}
                compared={comparedIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onToggleCompare={onToggleCompare}
                onSelectProduct={onSelectProduct}
                onQuickAdd={onQuickAdd}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#111111] text-white text-sm font-semibold hover:bg-[#292929] transition-colors"
            >
              <span>Browse Full {products.length}-Item Catalogue</span>
              <ArrowRight className="w-4 h-4 text-[#B7F500]" />
            </button>
          </div>
        </div>
      </section>

      {/* 3b. Recently Viewed Products (up to 5, persisted in localStorage) */}
      {recentlyViewedProducts.length > 0 && (
        <section
          aria-label="Recently Viewed"
          data-testid="recently-viewed-section"
          className="border-b border-[#E5E5E5] bg-white py-14"
        >
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#525252] mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#111111]" />
                  <span>History · {recentlyViewedProducts.length} of 5</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
                  {t('home.recentlyViewedTitle')}
                </h2>
                <p className="mt-1 text-sm text-[#525252]">{t('home.recentlyViewedSubtitle')}</p>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-auto">
                {onClearRecentlyViewed && (
                  <button
                    type="button"
                    onClick={onClearRecentlyViewed}
                    className="text-xs font-semibold text-[#525252] hover:text-[#111111] underline underline-offset-4 whitespace-nowrap"
                  >
                    {t('home.clearHistory')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="text-sm font-semibold text-[#111111] hover:underline decoration-[#B7F500] decoration-2 underline-offset-4 whitespace-nowrap"
                >
                  Shop All →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentlyViewedProducts.slice(0, 5).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  wishlisted={wishlistIds.includes(product.id)}
                  compared={comparedIds.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                  onToggleCompare={onToggleCompare}
                  onSelectProduct={onSelectProduct}
                  onQuickAdd={onQuickAdd}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Special Product Sourcing Callout */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-16">
        <div className="bg-[#111111] text-white rounded-xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <p className="text-xs font-semibold text-[#B7F500] mb-2">
              GoPlay Special Product Sourcing
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight [text-wrap:balance]">
              {t('home.sourcingHeadline')}
            </h2>
            <p className="mt-3 text-base text-white/80 max-w-2xl leading-relaxed">
              {t('home.sourcingSubtitle')} Submit a product name, photo, or URL along with your BDT budget. Our team checks supplier authenticity and sends an itemized written quotation before you commit.
            </p>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <button
              type="button"
              onClick={() => onNavigate('request')}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-md bg-[#B7F500] text-[#111111] font-display font-bold text-sm hover:bg-[#a6df00] transition-colors whitespace-nowrap shrink-0"
            >
              <span>{t('home.sourcingCta')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Trust Pillars & Buying Guidance */}
      <section className="border-t border-[#E5E5E5] py-16">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111111]">
              {t('home.trustTitle')}
            </h2>
            <p className="mt-2 text-sm text-[#525252]">
              Designed for athletes, students, coaches, and sports academies across Bangladesh.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-[#E5E5E5] rounded-lg bg-white">
              <CheckCircle2 className="w-6 h-6 text-[#111111] mb-4" />
              <h3 className="font-display text-base font-bold text-[#111111]">{t('trust.1.title')}</h3>
              <p className="mt-2 text-sm text-[#525252] leading-relaxed">{t('trust.1.desc')}</p>
            </div>
            <div className="p-6 border border-[#E5E5E5] rounded-lg bg-white">
              <Globe2 className="w-6 h-6 text-[#111111] mb-4" />
              <h3 className="font-display text-base font-bold text-[#111111]">{t('trust.2.title')}</h3>
              <p className="mt-2 text-sm text-[#525252] leading-relaxed">{t('trust.2.desc')}</p>
            </div>
            <div className="p-6 border border-[#E5E5E5] rounded-lg bg-white">
              <Truck className="w-6 h-6 text-[#111111] mb-4" />
              <h3 className="font-display text-base font-bold text-[#111111]">{t('trust.3.title')}</h3>
              <p className="mt-2 text-sm text-[#525252] leading-relaxed">{t('trust.3.desc')}</p>
            </div>
            <div className="p-6 border border-[#E5E5E5] rounded-lg bg-white">
              <ShieldCheck className="w-6 h-6 text-[#111111] mb-4" />
              <h3 className="font-display text-base font-bold text-[#111111]">{t('trust.4.title')}</h3>
              <p className="mt-2 text-sm text-[#525252] leading-relaxed">{t('trust.4.desc')}</p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-[#E5E5E5] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-[#111111]">
                Supplying a Club, Academy, School, or University?
              </h3>
              <p className="text-sm text-[#525252]">
                Submit bulk equipment lists and receive structured institutional BDT quotations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('help')}
                className="px-4 py-2.5 rounded-md border border-[#D4D4D4] text-sm font-semibold text-[#111111] hover:bg-[#F4F4F4] whitespace-nowrap"
              >
                Read Buying Guides
              </button>
              <button
                type="button"
                onClick={() => onNavigate('b2b')}
                className="px-4 py-2.5 rounded-md bg-[#111111] text-white text-sm font-semibold hover:bg-[#292929] whitespace-nowrap"
              >
                B2B &amp; Club Supply
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
