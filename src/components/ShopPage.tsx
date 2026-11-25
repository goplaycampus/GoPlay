import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, LayoutGrid, List, PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES } from '../data/catalog';
import type { AvailabilityStatus, Language, Product } from '../types';
import {
  computeShopFilterFacets,
  filterAndSortShopProducts,
  formatBDT,
  getCatalogPriceBounds,
  type ShopFilterState,
  type ShopQuickPreset,
  type ShopSortOption,
} from '../utils/commerce';
import type { AppPage } from './Header';
import { ProductCard } from './ProductCard';

interface ShopPageProps {
  products: Product[];
  lang: Language;
  initialCategory: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  wishlistIds: string[];
  comparedIds?: string[];
  onToggleWishlist: (id: string) => void;
  onToggleCompare?: (p: Product) => void;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
  onNavigate: (page: AppPage) => void;
}

const PRICE_BRACKETS = [
  { id: 'under-1000', label: 'Under ৳1,000', min: 0, max: 1000 },
  { id: '1000-2500', label: '৳1,000 – ৳2,500', min: 1000, max: 2500 },
  { id: '2500-5000', label: '৳2,500 – ৳5,000', min: 2500, max: 5000 },
  { id: 'over-5000', label: '৳5,000+', min: 5000, max: null },
] as const;

export function ShopPage({
  products,
  lang,
  initialCategory,
  searchQuery,
  onSearchChange,
  wishlistIds,
  comparedIds = [],
  onToggleWishlist,
  onToggleCompare,
  onSelectProduct,
  onQuickAdd,
  onNavigate,
}: ShopPageProps) {
  const priceBounds = useMemo(() => getCatalogPriceBounds(products), [products]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory && initialCategory !== 'all' ? [initialCategory] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityStatus | 'all'>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number>(priceBounds.min);
  const [maxPrice, setMaxPrice] = useState<number>(priceBounds.max);
  const [quickPreset, setQuickPreset] = useState<ShopQuickPreset>('all');
  const [sortBy, setSortBy] = useState<ShopSortOption>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [brandFilterQuery, setBrandFilterQuery] = useState('');

  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    brands: true,
    more: true,
  });

  useEffect(() => {
    setSelectedCategories(initialCategory && initialCategory !== 'all' ? [initialCategory] : []);
  }, [initialCategory]);

  useEffect(() => {
    setMaxPrice((prev) => (prev > priceBounds.max || prev === 25000 ? priceBounds.max : prev));
  }, [priceBounds.max]);

  const filterState: ShopFilterState = useMemo(
    () => ({
      categories: selectedCategories,
      brands: selectedBrands,
      availability: selectedAvailability,
      size: selectedSize,
      minPrice,
      maxPrice,
      quickPreset,
      searchQuery,
      sortBy,
    }),
    [
      selectedCategories,
      selectedBrands,
      selectedAvailability,
      selectedSize,
      minPrice,
      maxPrice,
      quickPreset,
      searchQuery,
      sortBy,
    ]
  );

  const filtered = useMemo(
    () => filterAndSortShopProducts(products, filterState),
    [products, filterState]
  );

  const facets = useMemo(
    () => computeShopFilterFacets(products, filterState),
    [products, filterState]
  );

  const visibleBrands = useMemo(() => {
    const q = brandFilterQuery.trim().toLowerCase();
    if (!q) return facets.brands;
    return facets.brands.filter((b) => b.toLowerCase().includes(q));
  }, [facets.brands, brandFilterQuery]);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand]
    );
  };

  const resetAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedAvailability('all');
    setSelectedSize('all');
    setMinPrice(priceBounds.min);
    setMaxPrice(priceBounds.max);
    setQuickPreset('all');
    setBrandFilterQuery('');
    onSearchChange('');
  };

  const isPriceFiltered = minPrice > priceBounds.min || maxPrice < priceBounds.max;

  const activeFilterCount =
    selectedCategories.length +
    selectedBrands.length +
    (selectedAvailability !== 'all' ? 1 : 0) +
    (selectedSize !== 'all' ? 1 : 0) +
    (isPriceFiltered ? 1 : 0) +
    (quickPreset !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const singleCategorySlug = selectedCategories.length === 1 ? selectedCategories[0] : null;
  const activeCategoryObj = singleCategorySlug
    ? CATEGORIES.find((c) => c.slug === singleCategorySlug)
    : undefined;

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10">
      {/* Page Title */}
      <div className="pb-6 border-b border-[#E5E5E5] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#525252] mb-1">
            GoPlay Catalogue · Sample Development Inventory
          </p>
          <h1 className="font-display text-3xl font-extrabold text-[#111111] tracking-tight">
            {activeCategoryObj
              ? lang === 'bn'
                ? activeCategoryObj.nameBn
                : activeCategoryObj.name
              : selectedCategories.length > 1
              ? `Filtered Equipment (${selectedCategories.length} Categories)`
              : 'Shop All Sports Equipment'}
          </h1>
          <p className="mt-1 text-sm text-[#525252]">
            {activeCategoryObj
              ? activeCategoryObj.description
              : 'Browse ready-stock items and transparent pre-order gear across 8 sports categories.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <label htmlFor="shop-search-input" className="sr-only">
              Search products by name, brand, model, or SKU
            </label>
            <input
              id="shop-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, brand, model, SKU..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#D4D4D4] rounded-md bg-white focus:outline-none focus:border-[#111111]"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            aria-expanded={mobileFiltersOpen}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 border border-[#D4D4D4] rounded-md text-xs font-semibold text-[#111111] bg-white hover:bg-[#F4F4F4] whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Category Quick Tabs */}
      <div className="py-4 border-b border-[#E5E5E5] flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setSelectedCategories([]);
            if (initialCategory) onNavigate('shop');
          }}
          className={`px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
            selectedCategories.length === 0
              ? 'bg-[#111111] text-white'
              : 'bg-[#F4F4F4] text-[#292929] hover:bg-[#E5E5E5]'
          }`}
        >
          All Sports ({products.length})
        </button>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategories.includes(cat.slug);
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                setSelectedCategories((prev) =>
                  prev.length === 1 && prev[0] === cat.slug ? [] : [cat.slug]
                );
              }}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#B7F500] text-[#111111] font-bold'
                  : 'bg-[#F4F4F4] text-[#292929] hover:bg-[#E5E5E5]'
              }`}
            >
              {lang === 'bn' ? cat.nameBn : cat.name}
            </button>
          );
        })}
      </div>

      {/* Main Content Layout: Filter Sidebar + Product List */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside
          id="shop-filter-sidebar"
          className={`lg:col-span-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto border border-[#E5E5E5] rounded-lg bg-[#FAFAFA] divide-y divide-[#E5E5E5] ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
          aria-label="Product Filters"
        >
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#111111]" />
              <h2 className="font-display text-sm font-bold text-[#111111]">
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </h2>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-semibold text-[#525252] hover:text-[#111111] underline"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Categories Filter Group */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('categories')}
              aria-expanded={openSections.categories}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Categories
              </span>
              {openSections.categories ? (
                <ChevronUp className="w-4 h-4 text-[#525252]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#525252]" />
              )}
            </button>
            {openSections.categories && (
              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const checked = selectedCategories.includes(cat.slug);
                  const count = facets.categoryCounts[cat.slug] ?? 0;
                  return (
                    <label
                      key={cat.slug}
                      className={`flex items-center justify-between gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                        checked ? 'bg-white border border-[#111111] font-semibold' : 'hover:bg-white'
                      } ${count === 0 && !checked ? 'opacity-55' : ''}`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(cat.slug)}
                          className="w-3.5 h-3.5 accent-[#111111] rounded-sm shrink-0"
                        />
                        <span className="truncate text-[#111111]">
                          {lang === 'bn' ? cat.nameBn : cat.name}
                        </span>
                      </span>
                      <span className="font-mono-num text-[11px] text-[#525252] shrink-0">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Price Range Filter Group */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('price')}
              aria-expanded={openSections.price}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Price Range (BDT)
              </span>
              {openSections.price ? (
                <ChevronUp className="w-4 h-4 text-[#525252]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#525252]" />
              )}
            </button>
            {openSections.price && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-num text-[#111111] bg-white border border-[#E5E5E5] rounded px-2.5 py-1.5">
                  <span>{formatBDT(minPrice)}</span>
                  <span className="text-[#737373]">to</span>
                  <span>{formatBDT(maxPrice)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="filter-min-price"
                      className="block text-[11px] font-semibold text-[#525252] mb-1"
                    >
                      Min (৳)
                    </label>
                    <input
                      id="filter-min-price"
                      type="number"
                      min={priceBounds.min}
                      max={maxPrice}
                      step={100}
                      value={minPrice}
                      onChange={(e) => {
                        const val = Math.max(priceBounds.min, Number(e.target.value) || 0);
                        setMinPrice(Math.min(val, maxPrice));
                      }}
                      className="w-full bg-white border border-[#D4D4D4] rounded px-2.5 py-1.5 text-xs font-mono-num text-[#111111]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="filter-max-price"
                      className="block text-[11px] font-semibold text-[#525252] mb-1"
                    >
                      Max (৳)
                    </label>
                    <input
                      id="filter-max-price"
                      type="number"
                      min={minPrice}
                      max={priceBounds.max}
                      step={100}
                      value={maxPrice}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const val = Number.isFinite(raw)
                          ? Math.min(priceBounds.max, Math.max(minPrice, raw))
                          : priceBounds.max;
                        setMaxPrice(val);
                      }}
                      className="w-full bg-white border border-[#D4D4D4] rounded px-2.5 py-1.5 text-xs font-mono-num text-[#111111]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="filter-price-range" className="sr-only">
                    Maximum price slider
                  </label>
                  <input
                    id="filter-price-range"
                    type="range"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={250}
                    value={maxPrice}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setMaxPrice(Math.max(minPrice, next));
                    }}
                    className="w-full accent-[#111111]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {PRICE_BRACKETS.map((bracket) => {
                    const targetMax = bracket.max ?? priceBounds.max;
                    const active = minPrice === bracket.min && maxPrice === targetMax;
                    return (
                      <button
                        key={bracket.id}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setMinPrice(priceBounds.min);
                            setMaxPrice(priceBounds.max);
                          } else {
                            setMinPrice(bracket.min);
                            setMaxPrice(targetMax);
                          }
                        }}
                        className={`px-2 py-1.5 rounded text-[11px] font-semibold border transition-colors text-center ${
                          active
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white text-[#292929] border-[#D4D4D4] hover:border-[#111111]'
                        }`}
                      >
                        {bracket.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Brand Filter Group */}
          <div className="p-4 space-y-3" data-testid="filter-group-brand">
            <button
              type="button"
              onClick={() => toggleSection('brands')}
              aria-expanded={openSections.brands}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Brand
              </span>
              {openSections.brands ? (
                <ChevronUp className="w-4 h-4 text-[#525252]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#525252]" />
              )}
            </button>
            {openSections.brands && (
              <div className="space-y-2">
                {facets.brands.length > 6 && (
                  <div>
                    <label htmlFor="brand-filter-search" className="sr-only">
                      Filter brands
                    </label>
                    <input
                      id="brand-filter-search"
                      type="search"
                      value={brandFilterQuery}
                      onChange={(e) => setBrandFilterQuery(e.target.value)}
                      placeholder="Find brand..."
                      className="w-full bg-white border border-[#D4D4D4] rounded px-2.5 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                )}

                <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
                  {visibleBrands.map((brand) => {
                    const checked = selectedBrands.includes(brand);
                    const count = facets.brandCounts[brand] ?? 0;
                    return (
                      <label
                        key={brand}
                        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-white border border-[#111111] font-semibold'
                            : 'hover:bg-white'
                        } ${count === 0 && !checked ? 'opacity-55' : ''}`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleBrand(brand)}
                            className="w-3.5 h-3.5 accent-[#111111] rounded-sm shrink-0"
                          />
                          <span className="truncate text-[#111111]">{brand}</span>
                        </span>
                        <span className="font-mono-num text-[11px] text-[#525252] shrink-0">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                  {visibleBrands.length === 0 && (
                    <p className="text-xs text-[#525252] py-1">No brands match "{brandFilterQuery}".</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Availability & Size Controls */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleSection('more')}
              aria-expanded={openSections.more}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Availability &amp; Size
              </span>
              {openSections.more ? (
                <ChevronUp className="w-4 h-4 text-[#525252]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#525252]" />
              )}
            </button>
            {openSections.more && (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="filter-availability"
                    className="block text-xs font-semibold text-[#292929] mb-1.5"
                  >
                    Availability Status
                  </label>
                  <select
                    id="filter-availability"
                    value={selectedAvailability}
                    onChange={(e) =>
                      setSelectedAvailability(e.target.value as AvailabilityStatus | 'all')
                    }
                    className="w-full bg-white border border-[#D4D4D4] rounded-md px-3 py-2 text-xs font-medium text-[#111111]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="In Stock">In Stock (Ready Stock)</option>
                    <option value="Pre-order">Pre-order</option>
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-size"
                    className="block text-xs font-semibold text-[#292929] mb-1.5"
                  >
                    Size / Spec
                  </label>
                  <select
                    id="filter-size"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full bg-white border border-[#D4D4D4] rounded-md px-3 py-2 text-xs font-medium text-[#111111]"
                  >
                    <option value="all">All Sizes</option>
                    {facets.sizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Sourcing CTA */}
          <div className="p-4">
            <p className="text-xs text-[#525252] leading-relaxed mb-3">
              Looking for a specific international model or size not listed here?
            </p>
            <button
              type="button"
              onClick={() => onNavigate('request')}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md bg-[#111111] text-white text-xs font-semibold hover:bg-[#292929]"
            >
              <PackageSearch className="w-3.5 h-3.5 text-[#B7F500]" />
              <span>Request Special Sourcing</span>
            </button>
          </div>
        </aside>

        {/* Product List Column */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Quick filters">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'ready', label: 'Ready Stock' },
                  { id: 'preorder', label: 'Pre-order' },
                  { id: 'sale', label: 'On Sale' },
                  { id: 'under-1500', label: 'Under ৳1,500' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setQuickPreset(preset.id)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                    quickPreset === preset.id
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#F4F4F4] text-[#525252] hover:text-[#111111]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <p className="text-xs text-[#525252] font-mono-num" data-testid="shop-results-count">
                Showing {filtered.length} of {products.length} product{products.length === 1 ? '' : 's'}
              </p>

              <div className="inline-flex rounded-md border border-[#D4D4D4] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={`p-1.5 ${viewMode === 'grid' ? 'bg-[#111111] text-white' : 'bg-white text-[#525252]'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`p-1.5 ${viewMode === 'list' ? 'bg-[#111111] text-white' : 'bg-white text-[#525252]'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <select
                id="shop-sort"
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ShopSortOption)}
                className="bg-white border border-[#D4D4D4] rounded-md px-3 py-1.5 text-xs font-semibold text-[#111111]"
              >
                <option value="featured">Featured &amp; Popular</option>
                <option value="newest">Newest Updated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Active Filter Tags Strip */}
          {activeFilterCount > 0 && (
            <div
              className="flex flex-wrap items-center gap-2 py-2.5 px-3 rounded-md bg-[#FAFAFA] border border-[#E5E5E5]"
              aria-label="Active filters"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#525252] mr-1">
                Active:
              </span>
              {selectedCategories.map((slug) => {
                const cat = CATEGORIES.find((c) => c.slug === slug);
                const label = cat ? (lang === 'bn' ? cat.nameBn : cat.name) : slug;
                return (
                  <button
                    key={`cat-${slug}`}
                    type="button"
                    onClick={() => toggleCategory(slug)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#D4D4D4] bg-white text-xs font-semibold text-[#111111] hover:border-[#111111]"
                  >
                    <span>Category: {label}</span>
                    <X className="w-3 h-3 text-[#525252]" />
                  </button>
                );
              })}
              {isPriceFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice(priceBounds.min);
                    setMaxPrice(priceBounds.max);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#D4D4D4] bg-white text-xs font-semibold text-[#111111] hover:border-[#111111]"
                >
                  <span className="font-mono-num">
                    Price: {formatBDT(minPrice)} – {formatBDT(maxPrice)}
                  </span>
                  <X className="w-3 h-3 text-[#525252]" />
                </button>
              )}
              {selectedBrands.map((brand) => (
                <button
                  key={`brand-${brand}`}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#D4D4D4] bg-white text-xs font-semibold text-[#111111] hover:border-[#111111]"
                >
                  <span>Brand: {brand}</span>
                  <X className="w-3 h-3 text-[#525252]" />
                </button>
              ))}
              {selectedAvailability !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedAvailability('all')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#D4D4D4] bg-white text-xs font-semibold text-[#111111] hover:border-[#111111]"
                >
                  <span>Status: {selectedAvailability}</span>
                  <X className="w-3 h-3 text-[#525252]" />
                </button>
              )}
              {selectedSize !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedSize('all')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#D4D4D4] bg-white text-xs font-semibold text-[#111111] hover:border-[#111111]"
                >
                  <span>Size: {selectedSize}</span>
                  <X className="w-3 h-3 text-[#525252]" />
                </button>
              )}
              {quickPreset !== 'all' && (
                <button
                  type="button"
                  onClick={() => setQuickPreset('all')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#D4D4D4] bg-white text-xs font-semibold text-[#111111] hover:border-[#111111]"
                >
                  <span>Preset: {quickPreset}</span>
                  <X className="w-3 h-3 text-[#525252]" />
                </button>
              )}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#D4D4D4] bg-white text-xs font-semibold text-[#111111] hover:border-[#111111]"
                >
                  <span>Search: {searchQuery.trim()}</span>
                  <X className="w-3 h-3 text-[#525252]" />
                </button>
              )}
              <button
                type="button"
                onClick={resetAllFilters}
                className="ml-auto text-xs font-semibold text-[#111111] underline decoration-[#B7F500] decoration-2 underline-offset-4"
              >
                Clear all
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="border border-[#E5E5E5] rounded-lg p-10 text-center bg-[#FAFAFA]">
              <X className="w-8 h-8 text-[#737373] mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-[#111111]">
                No matching products found
              </h3>
              <p className="mt-1 text-sm text-[#525252] max-w-md mx-auto">
                Try clearing filters, or use GoPlay&apos;s Special Product Sourcing form to request the exact item you need.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2 rounded-md border border-[#D4D4D4] text-sm font-semibold text-[#111111] bg-white hover:bg-[#F4F4F4]"
                >
                  Clear All Filters
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('request')}
                  className="px-4 py-2 rounded-md bg-[#B7F500] text-[#111111] text-sm font-bold hover:bg-[#a6df00]"
                >
                  Request This Product
                </button>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded-lg bg-white">
              {filtered.map((product) => {
                const title = lang === 'bn' && product.nameBn ? product.nameBn : product.name;
                const activePrice = product.discountPrice ?? product.sellingPrice;
                const canOrder =
                  product.availabilityStatus === 'In Stock' ||
                  product.availabilityStatus === 'Pre-order';
                return (
                  <div
                    key={product.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFAFA]"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="w-20 h-16 rounded overflow-hidden shrink-0 border border-[#E5E5E5]"
                      >
                        <img
                          src={product.images[0]}
                          alt={title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs text-[#525252]">
                          {product.categoryLabel} · {product.brand} · {product.availabilityStatus} · {product.sku}
                        </p>
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="font-display text-sm font-bold text-[#111111] hover:underline decoration-[#B7F500] decoration-2 text-left"
                        >
                          {title}
                        </button>
                        <p className="text-xs text-[#525252] mt-0.5">{product.deliveryEstimate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono-num text-base font-bold text-[#111111]">
                        {formatBDT(activePrice)}
                      </span>
                      {onToggleCompare && (
                        <button
                          type="button"
                          onClick={() => onToggleCompare(product)}
                          className="px-2.5 py-1.5 rounded border border-[#D4D4D4] text-xs font-semibold text-[#111111] hover:bg-[#F4F4F4]"
                        >
                          {comparedIds.includes(product.id) ? 'Comparing' : 'Compare'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!canOrder}
                        onClick={() => onQuickAdd(product)}
                        className="px-3.5 py-2 rounded bg-[#B7F500] text-[#111111] text-xs font-bold hover:bg-[#a6df00] disabled:bg-[#F4F4F4] disabled:text-[#737373]"
                      >
                        {product.availabilityStatus === 'Pre-order' ? 'Pre-order' : 'Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((product) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
