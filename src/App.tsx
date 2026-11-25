import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, SEED_PRODUCTS } from './data/catalog';
import { api, getAuthToken, setAuthToken } from './services/api';
import type { CartItem, Language, Product, Review, StoreSettings, UserAccount } from './types';
import {
  RECENTLY_VIEWED_LIMIT,
  parseStoredProductIds,
  recordRecentlyViewedProductId,
  resolveRecentlyViewedProducts,
} from './utils/commerce';
import { AccountPage, WishlistPage } from './components/AccountWishlistPage';
import { AdminDashboard } from './components/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { CompareBar, CompareModal } from './components/CompareModal';
import { Footer } from './components/Footer';
import { Header, type AppPage } from './components/Header';
import { HomePage } from './components/HomePage';
import { InfoPages } from './components/InfoPages';
import { PreOrderB2BPage } from './components/PreOrderB2BPage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductRequestPage } from './components/ProductRequestPage';
import { ShopPage } from './components/ShopPage';
import { TrackingPage } from './components/TrackingPage';

const CART_STORAGE_KEY = 'goplay_cart_v1';
const WISHLIST_STORAGE_KEY = 'goplay_wishlist_v1';
const RECENTLY_VIEWED_STORAGE_KEY = 'goplay_recently_viewed_v1';

export default function App() {
  const [page, setPage] = useState<AppPage>('home');
  const [shopCategory, setShopCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackCode, setTrackCode] = useState<string>('');
  const [lang, setLang] = useState<Language>('en');

  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      return parseStoredProductIds(
        localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY),
        RECENTLY_VIEWED_LIMIT
      );
    } catch {
      return [];
    }
  });

  const [user, setUser] = useState<UserAccount | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    try {
      const data = await api.getCatalog();
      setProducts(data.products);
      setSettings(data.settings);
      setReviews(data.reviews);
    } catch {
      // Fall back to deterministic seed catalog if backend is starting
    }
  }, []);

  useEffect(() => {
    loadCatalog();
    if (getAuthToken()) {
      api
        .getMe()
        .then((res) => setUser(res.user))
        .catch(() => {
          setAuthToken(null);
        });
    }
  }, [loadCatalog]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(recentlyViewedIds));
    } catch {
      // Ignore storage quota / privacy mode write errors
    }
  }, [recentlyViewedIds]);

  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setRecentlyViewedIds((prev) =>
      recordRecentlyViewedProductId(prev, product.id, RECENTLY_VIEWED_LIMIT)
    );
  }, []);

  const handleClearRecentlyViewed = useCallback(() => {
    setRecentlyViewedIds([]);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((current) => (current === msg ? null : current));
    }, 3200);
  };

  const handleNavigate = (target: AppPage, opts?: { category?: string }) => {
    if (target === 'shop') {
      setShopCategory(opts?.category || '');
    } else {
      setShopCategory('');
    }
    setPage(target);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleSearchSubmit = (q: string) => {
    setSearchQuery(q);
    setShopCategory('');
    setPage('shop');
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist');
      return next;
    });
  };

  const handleToggleCompare = (product: Product) => {
    setCompareIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      }
      if (prev.length >= 3) {
        showToast('You can compare up to 3 items at once');
        return prev;
      }
      showToast(`Added ${product.name} to comparison`);
      return [...prev, product.id];
    });
  };

  const handleAddToCart = (
    product: Product,
    size?: string,
    color?: string,
    quantity = 1
  ) => {
    if (product.availabilityStatus === 'Out of Stock' || product.availabilityStatus === 'Coming Soon') {
      showToast(`${product.name} is currently ${product.availabilityStatus}`);
      return;
    }

    const chosenSize = size || product.sizes[0] || 'Standard';
    const chosenColor = color || product.colors[0] || 'Default';
    const unitPrice = product.discountPrice ?? product.sellingPrice;

    setCart((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.productId === product.id &&
          i.selectedSize === chosenSize &&
          i.selectedColor === chosenColor
      );
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          brand: product.brand,
          image: product.images[0] || '',
          unitPrice,
          quantity,
          selectedSize: chosenSize,
          selectedColor: chosenColor,
          availabilityStatus: product.availabilityStatus,
          deliveryEstimate: product.deliveryEstimate,
        },
      ];
    });
    setCartOpen(true);
    showToast(`Added ${product.name} to bag`);
  };

  const handleUpdateCartQty = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const nextQty = copy[index].quantity + delta;
      if (nextQty <= 0) {
        copy.splice(index, 1);
      } else {
        copy[index] = { ...copy[index], quantity: nextQty };
      }
      return copy;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTrackCode = (code: string) => {
    setTrackCode(code);
    handleNavigate('track');
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const compareProducts = products.filter((p) => compareIds.includes(p.id));
  const recentlyViewedProducts = resolveRecentlyViewedProducts(
    products,
    recentlyViewedIds,
    RECENTLY_VIEWED_LIMIT
  );

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111111]">
      <Header
        currentPage={page}
        onNavigate={handleNavigate}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'en' ? 'bn' : 'en'))}
        cartCount={cartCount}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setCartOpen(true)}
        searchQuery={searchQuery}
        onSearchSubmit={handleSearchSubmit}
        announcementText={lang === 'bn' ? settings.announcementTextBn : settings.announcementText}
        user={user}
        products={products}
        onSelectProduct={handleSelectProduct}
      />

      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            products={products}
            recentlyViewedProducts={recentlyViewedProducts}
            lang={lang}
            wishlistIds={wishlistIds}
            comparedIds={compareIds}
            onToggleWishlist={handleToggleWishlist}
            onToggleCompare={handleToggleCompare}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={(p) => handleAddToCart(p)}
            onClearRecentlyViewed={handleClearRecentlyViewed}
            onNavigate={handleNavigate}
          />
        )}

        {page === 'shop' && (
          <ShopPage
            products={products}
            lang={lang}
            initialCategory={shopCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            wishlistIds={wishlistIds}
            comparedIds={compareIds}
            onToggleWishlist={handleToggleWishlist}
            onToggleCompare={handleToggleCompare}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={(p) => handleAddToCart(p)}
            onNavigate={handleNavigate}
          />
        )}

        {(page === 'preorder' || page === 'b2b') && (
          <PreOrderB2BPage
            mode={page}
            products={products}
            lang={lang}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={(p) => handleAddToCart(p)}
          />
        )}

        {page === 'request' && (
          <ProductRequestPage
            user={user}
            onNavigate={handleNavigate}
            onTrackCreatedRequest={handleTrackCode}
          />
        )}

        {page === 'track' && <TrackingPage initialCode={trackCode} />}

        {page === 'checkout' && (
          <CheckoutPage
            items={cart}
            settings={settings}
            user={user}
            onOrderComplete={() => {
              setCart([]);
              loadCatalog();
            }}
            onNavigate={handleNavigate}
            onTrackOrder={handleTrackCode}
          />
        )}

        {page === 'account' && (
          <AccountPage
            user={user}
            onUserChange={setUser}
            onNavigate={handleNavigate}
            onTrackCode={handleTrackCode}
          />
        )}

        {page === 'wishlist' && (
          <WishlistPage
            products={products}
            wishlistIds={wishlistIds}
            lang={lang}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={(p) => handleAddToCart(p)}
            onNavigate={handleNavigate}
          />
        )}

        {(page === 'about' || page === 'contact' || page === 'help' || page === 'policies') && (
          <InfoPages page={page} settings={settings} onNavigate={handleNavigate} />
        )}

        {page === 'admin' && (
          <AdminDashboard
            user={user}
            onNavigate={handleNavigate}
            onCatalogRefresh={loadCatalog}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} settings={settings} />

      <CartDrawer
        open={cartOpen}
        items={cart}
        products={products}
        freeShippingThreshold={settings.freeShippingThreshold}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onQuickAddProduct={(p) => handleAddToCart(p)}
        onCheckout={() => {
          setCartOpen(false);
          handleNavigate('checkout');
        }}
      />

      {page !== 'admin' && page !== 'checkout' && !cartOpen && !compareOpen && !selectedProduct && (
        <CompareBar
          items={compareProducts}
          onOpenCompare={() => setCompareOpen(true)}
          onRemoveItem={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
          onClearAll={() => setCompareIds([])}
        />
      )}

      <CompareModal
        open={compareOpen}
        items={compareProducts}
        lang={lang}
        onClose={() => setCompareOpen(false)}
        onRemoveItem={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
        onQuickAdd={(p) => handleAddToCart(p)}
        onSelectProduct={handleSelectProduct}
      />

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          allProducts={products}
          settings={settings}
          lang={lang}
          wishlisted={wishlistIds.includes(selectedProduct.id)}
          reviews={reviews}
          onClose={() => setSelectedProduct(null)}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
          onSelectProduct={handleSelectProduct}
          onReviewAdded={(rev) => setReviews((prev) => [rev, ...prev])}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-md bg-[#111111] text-white text-xs font-semibold shadow-lg border border-[#292929] print:hidden"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
