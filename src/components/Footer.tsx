import { useState } from 'react';
import type { StoreSettings } from '../types';
import type { AppPage } from './Header';
import { BrandMark } from './BrandMark';

interface FooterProps {
  onNavigate: (page: AppPage, opts?: { category?: string }) => void;
  settings: StoreSettings;
}

export function Footer({ onNavigate, settings }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#111111] text-white border-t border-[#292929] print:hidden">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <BrandMark variant="dark" size="md" />
          <p className="text-sm text-white/75 leading-relaxed">
            Gear Up. Get Out. Go Play. Bangladesh&apos;s multi-sport retail, pre-order, and custom gear sourcing store.
          </p>
          <p className="text-xs text-white/60">
            Support: {settings.supportEmail} · {settings.supportPhone}
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-white mb-4">Sports &amp; Services</h3>
          <ul className="space-y-2.5 text-sm text-white/75">
            <li>
              <button type="button" onClick={() => onNavigate('shop')} className="hover:text-[#B7F500]">
                Shop All Equipment
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('shop', { category: 'cricket' })}
                className="hover:text-[#B7F500]"
              >
                Cricket &amp; Football
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('shop', { category: 'badminton-tennis' })}
                className="hover:text-[#B7F500]"
              >
                Badminton, Tennis &amp; Fitness
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('request')} className="hover:text-[#B7F500]">
                Special Product Sourcing
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('preorder')} className="hover:text-[#B7F500]">
                Pre-Order Information
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('b2b')} className="hover:text-[#B7F500]">
                Clubs &amp; Institutional B2B
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-white mb-4">Customer Care &amp; Policies</h3>
          <ul className="space-y-2.5 text-sm text-white/75">
            <li>
              <button type="button" onClick={() => onNavigate('track')} className="hover:text-[#B7F500]">
                Order &amp; Request Tracking
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('help')} className="hover:text-[#B7F500]">
                Help Centre &amp; Buying Guides
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('about')} className="hover:text-[#B7F500]">
                About GoPlay
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('contact')} className="hover:text-[#B7F500]">
                Contact Us
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('policies')} className="hover:text-[#B7F500]">
                Shipping, Returns, Privacy &amp; Terms
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('admin')} className="hover:text-[#B7F500]">
                Operations Control Centre
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-white mb-4">Restock &amp; Gear Updates</h3>
          <p className="text-xs text-white/70 mb-3 leading-relaxed">
            Receive restock alerts and buying guides. No spam.
          </p>
          <form onSubmit={handleNewsletter} className="flex gap-2">
            <label htmlFor="footer-newsletter" className="sr-only">
              Email address for GoPlay updates
            </label>
            <input
              id="footer-newsletter"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 min-w-0 bg-[#292929] border border-white/15 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#B7F500]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#B7F500] text-[#111111] text-xs font-bold hover:bg-[#a6df00] whitespace-nowrap shrink-0"
            >
              Join
            </button>
          </form>
          {subscribed && (
            <p className="text-xs text-[#B7F500] mt-2">
              Subscribed for GoPlay updates.
            </p>
          )}
          <p className="text-[11px] text-white/50 mt-4 leading-relaxed">
            Development MVP build: sample catalog listings, demo payment workflow (COD &amp; manual verification), and pending merchant gateway/courier integrations.
          </p>
        </div>
      </div>

      <div className="border-t border-[#292929] px-4 sm:px-6 py-5">
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <p>© {new Date().getFullYear()} GoPlay Bangladesh (Working Brand Selection). All rights reserved.</p>
          <p>Currency: BDT (৳) · Serving Bangladesh Nationwide</p>
        </div>
      </div>
    </footer>
  );
}
