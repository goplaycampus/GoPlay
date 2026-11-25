import { useEffect, useState } from 'react';
import { LogOut, MapPin, Package, Shield, UserCheck } from 'lucide-react';
import { BANGLADESH_DIVISIONS } from '../data/bangladesh';
import { api, setAuthToken } from '../services/api';
import type { Language, Order, Product, ProductRequest, UserAccount } from '../types';
import { formatBDT } from '../utils/commerce';
import type { AppPage } from './Header';
import { ProductCard } from './ProductCard';

interface AccountPageProps {
  user: UserAccount | null;
  onUserChange: (u: UserAccount | null) => void;
  onNavigate: (page: AppPage) => void;
  onTrackCode: (code: string) => void;
}

export function AccountPage({
  user,
  onUserChange,
  onNavigate,
  onTrackCode,
}: AccountPageProps) {
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myRequests, setMyRequests] = useState<ProductRequest[]>([]);
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrDiv, setNewAddrDiv] = useState('Dhaka');
  const [newAddrDist, setNewAddrDist] = useState('Dhaka Metro');

  useEffect(() => {
    if (user) {
      api
        .getMe()
        .then((res) => {
          setMyOrders(res.orders);
          setMyRequests(res.requests);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.login(email, password);
      setAuthToken(res.token);
      onUserChange(res.user);
      if (res.user.role === 'admin') {
        onNavigate('admin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.register({ name, email, phone, password });
      setAuthToken(res.token);
      onUserChange(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDemoFill = async (type: 'customer' | 'admin') => {
    setError(null);
    setBusy(true);
    try {
      const creds =
        type === 'admin'
          ? { email: 'admin@goplay.com.bd', password: 'GoPlayAdmin2026!' }
          : { email: 'demo.athlete@example.com', password: 'GoPlayUser2026!' };
      const res = await api.login(creds.email, creds.password);
      setAuthToken(res.token);
      onUserChange(res.user);
      if (res.user.role === 'admin') {
        onNavigate('admin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAddrStreet.trim()) return;
    try {
      const res = await api.addAddress({
        fullName: user.name,
        phone: user.phone,
        email: user.email,
        division: newAddrDiv,
        district: newAddrDist,
        upazila: 'City Area',
        fullAddress: newAddrStreet,
      });
      onUserChange(res.user);
      setNewAddrStreet('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save address');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    onUserChange(null);
    setMyOrders([]);
    setMyRequests([]);
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="border border-[#E5E5E5] rounded-xl p-6 sm:p-8 bg-white space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-extrabold text-[#111111]">
              {authTab === 'login' ? 'Sign In to GoPlay' : 'Create Customer Account'}
            </h1>
            <div className="flex gap-1 p-1 bg-[#F4F4F4] rounded-md">
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className={`px-3 py-1.5 text-xs font-semibold rounded ${
                  authTab === 'login' ? 'bg-[#111111] text-white' : 'text-[#525252]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('register')}
                className={`px-3 py-1.5 text-xs font-semibold rounded ${
                  authTab === 'register' ? 'bg-[#111111] text-white' : 'text-[#525252]'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
              {error}
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-[#111111] mb-1">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="auth-pass" className="block text-xs font-semibold text-[#111111] mb-1">
                  Password
                </label>
                <input
                  id="auth-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-md bg-[#B7F500] text-[#111111] font-display font-bold text-sm hover:bg-[#a6df00]"
              >
                {busy ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold text-[#111111] mb-1">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#111111] mb-1">
                  Bangladesh Phone
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm font-mono-num"
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-[#111111] mb-1">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="reg-pass" className="block text-xs font-semibold text-[#111111] mb-1">
                  Password (6+ characters)
                </label>
                <input
                  id="reg-pass"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-md bg-[#B7F500] text-[#111111] font-display font-bold text-sm hover:bg-[#a6df00]"
              >
                {busy ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#E5E5E5] space-y-2.5">
            <p className="text-xs font-semibold text-[#525252]">
              Development Demo Access (Phase 1–3 Preview):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoFill('customer')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md border border-[#D4D4D4] text-xs font-semibold text-[#111111] hover:bg-[#F4F4F4]"
              >
                <UserCheck className="w-4 h-4" />
                <span>Demo Customer Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md bg-[#111111] text-white text-xs font-semibold hover:bg-[#292929]"
              >
                <Shield className="w-4 h-4 text-[#B7F500]" />
                <span>Admin Control Centre</span>
              </button>
            </div>
            <p className="text-[11px] text-[#737373]">
              Google Sign-In will connect once Firebase Authentication is configured in Phase 2.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <p className="text-xs font-semibold text-[#525252]">
            {user.role === 'admin' ? 'Administrator Account' : 'Customer Account'} · {user.phone}
          </p>
          <h1 className="font-display text-3xl font-extrabold text-[#111111]">{user.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-4 py-2 rounded-md bg-[#B7F500] text-[#111111] text-xs font-bold"
            >
              Open Admin Control Centre
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#D4D4D4] text-xs font-semibold text-[#111111]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-5">
          <div className="border border-[#E5E5E5] rounded-xl p-5 bg-white space-y-4">
            <h2 className="font-display text-base font-bold text-[#111111] flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Saved Bangladesh Addresses
            </h2>
            {user.savedAddresses.length === 0 ? (
              <p className="text-xs text-[#525252]">No saved addresses yet.</p>
            ) : (
              <div className="space-y-3">
                {user.savedAddresses.map((addr, i) => (
                  <div key={i} className="p-3 rounded-md bg-[#F4F4F4] text-xs space-y-0.5">
                    <p className="font-bold text-[#111111]">{addr.fullName}</p>
                    <p className="text-[#292929]">{addr.fullAddress}</p>
                    <p className="text-[#525252]">
                      {addr.district}, {addr.division} · {addr.phone}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="pt-3 border-t border-[#E5E5E5] space-y-2.5">
              <select
                value={newAddrDiv}
                onChange={(e) => {
                  setNewAddrDiv(e.target.value);
                  const d = BANGLADESH_DIVISIONS.find((x) => x.name === e.target.value);
                  if (d) setNewAddrDist(d.districts[0].name);
                }}
                aria-label="Division"
                className="w-full border border-[#D4D4D4] rounded-md px-3 py-2 text-xs bg-white"
              >
                {BANGLADESH_DIVISIONS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={newAddrStreet}
                onChange={(e) => setNewAddrStreet(e.target.value)}
                placeholder="New delivery street address"
                className="w-full border border-[#D4D4D4] rounded-md px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-md bg-[#111111] text-white text-xs font-semibold"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="border border-[#E5E5E5] rounded-xl p-6 bg-white space-y-4">
            <h2 className="font-display text-lg font-bold text-[#111111] flex items-center gap-2">
              <Package className="w-5 h-5" /> Order &amp; Pre-Order History ({myOrders.length})
            </h2>
            {myOrders.length === 0 ? (
              <p className="text-sm text-[#525252]">No orders placed under this account yet.</p>
            ) : (
              <div className="divide-y divide-[#E5E5E5]">
                {myOrders.map((o) => (
                  <div key={o.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-mono-num font-bold text-[#111111]">
                        {o.orderNumber} · {o.orderType}
                      </p>
                      <p className="text-xs text-[#525252]">
                        {o.items.length} item(s) · {o.status}
                        {o.preOrderStatus ? ` (${o.preOrderStatus})` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono-num font-bold">{formatBDT(o.totalAmount)}</span>
                      <button
                        type="button"
                        onClick={() => onTrackCode(o.orderNumber)}
                        className="text-xs font-semibold underline text-[#111111]"
                      >
                        Track
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-[#E5E5E5] rounded-xl p-6 bg-white space-y-4">
            <h2 className="font-display text-lg font-bold text-[#111111]">
              Special Sourcing Request History ({myRequests.length})
            </h2>
            {myRequests.length === 0 ? (
              <p className="text-sm text-[#525252]">No custom product requests found for your account.</p>
            ) : (
              <div className="divide-y divide-[#E5E5E5]">
                {myRequests.map((r) => (
                  <div key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-mono-num font-bold text-[#111111]">{r.requestNumber}</p>
                      <p className="text-xs text-[#525252]">
                        {r.productName} · Status: <strong>{r.status}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTrackCode(r.requestNumber)}
                      className="text-xs font-semibold underline text-[#111111]"
                    >
                      View Quotation &amp; Track
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface WishlistPageProps {
  products: Product[];
  wishlistIds: string[];
  lang: Language;
  onToggleWishlist: (id: string) => void;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
  onNavigate: (page: AppPage) => void;
}

export function WishlistPage({
  products,
  wishlistIds,
  lang,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd,
  onNavigate,
}: WishlistPageProps) {
  const saved = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-[#111111]">
          Saved Gear Wishlist ({saved.length})
        </h1>
        <p className="mt-1 text-sm text-[#525252]">
          Compare specifications and stock availability before adding to your bag.
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="border border-[#E5E5E5] rounded-xl p-12 text-center bg-[#FAFAFA] space-y-3">
          <p className="text-base font-semibold text-[#111111]">No saved products yet</p>
          <p className="text-sm text-[#525252]">Tap the heart icon on any product card to bookmark it here.</p>
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="mt-2 px-5 py-2.5 rounded-md bg-[#111111] text-white text-sm font-semibold"
          >
            Browse Catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              lang={lang}
              wishlisted
              onToggleWishlist={onToggleWishlist}
              onSelectProduct={onSelectProduct}
              onQuickAdd={onQuickAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
