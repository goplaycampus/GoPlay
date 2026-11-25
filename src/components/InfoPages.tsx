import { useState } from 'react';
import { BookOpen, CheckCircle2, Mail, Phone } from 'lucide-react';
import type { StoreSettings } from '../types';
import type { AppPage } from './Header';

interface InfoPagesProps {
  page: 'about' | 'contact' | 'help' | 'policies';
  settings: StoreSettings;
  onNavigate: (page: AppPage) => void;
}

export function InfoPages({ page, settings, onNavigate }: InfoPagesProps) {
  const [contactSent, setContactSent] = useState(false);

  if (page === 'about') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div>
          <p className="text-xs font-semibold text-[#525252] mb-2">About GoPlay</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111111]">
            Gear Up. Get Out. Go Play.
          </h1>
          <p className="mt-4 text-base text-[#292929] leading-relaxed">
            GoPlay is a multi-sport e-commerce platform built for athletes, students, recreational players, coaches, and sports institutions across Bangladesh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA] space-y-2">
            <h2 className="font-display text-lg font-bold text-[#111111]">Our Mission</h2>
            <p className="text-sm text-[#525252] leading-relaxed">
              To make it easier for athletes, sports organizations, and enthusiasts across Bangladesh to discover, verify, and purchase authentic sports equipment they need.
            </p>
          </div>
          <div className="p-6 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA] space-y-2">
            <h2 className="font-display text-lg font-bold text-[#111111]">Our Three-Model Storefront</h2>
            <p className="text-sm text-[#525252] leading-relaxed">
              We combine ready-stock essentials, transparent pre-orders, and dedicated special product sourcing so players are never stuck with unverified listings or opaque pricing.
            </p>
          </div>
        </div>

        <div className="p-6 border border-[#E5E5E5] rounded-lg bg-white space-y-3 text-sm text-[#292929]">
          <h2 className="font-display text-lg font-bold text-[#111111]">
            Transparency &amp; Brand Notice
          </h2>
          <p>
            GoPlay operates directly as a curated single-store retailer—not an unmoderated multi-vendor marketplace. Every supplier relationship is vetted, and we never claim authorized distributor status unless documented.
          </p>
          <p className="text-xs text-[#525252]">
            Note: GoPlay is currently a working brand name selection in MVP development; legal registrations, domain/trademark checks, and merchant gateway approvals are completed prior to commercial launch.
          </p>
        </div>
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-4">
          <h1 className="font-display text-3xl font-extrabold text-[#111111]">Contact GoPlay</h1>
          <p className="text-sm text-[#525252] leading-relaxed">
            Questions about sizing, ready stock, pre-order timelines, or club quotations? Reach out directly.
          </p>
          <div className="space-y-3 pt-2 text-sm text-[#111111]">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4" />
              <span>{settings.supportEmail}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4" />
              <span className="font-mono-num">{settings.supportPhone}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 border border-[#E5E5E5] rounded-xl p-6 bg-white">
          {contactSent ? (
            <div className="space-y-3 py-6">
              <CheckCircle2 className="w-8 h-8 text-[#166534]" />
              <h2 className="font-display text-xl font-bold text-[#111111]">Message Received</h2>
              <p className="text-sm text-[#525252]">
                Thank you for contacting GoPlay. For specific item sourcing, please use the Product Request page so you receive a tracked Request ID.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setContactSent(true);
              }}
              className="space-y-4"
            >
              <h2 className="font-display text-lg font-bold text-[#111111]">Send a Support Message</h2>
              <input
                type="text"
                required
                placeholder="Your Name"
                className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
              />
              <input
                type="tel"
                required
                placeholder="Bangladesh Phone (01XXXXXXXXX)"
                className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm font-mono-num"
              />
              <textarea
                rows={4}
                required
                placeholder="How can we help?"
                className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-md bg-[#B7F500] text-[#111111] font-bold text-sm"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (page === 'help') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-[#111111]">
            Help Centre, Buying Guides &amp; FAQs
          </h1>
          <p className="mt-2 text-sm text-[#525252]">
            Practical gear selection guidance and answers on ordering across Bangladesh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA] space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-[#111111]">
              <BookOpen className="w-4 h-4" />
              <span>Cricket Bat Weight &amp; Handle Guide</span>
            </div>
            <p className="text-xs text-[#525252] leading-relaxed">
              Short Handle (SH) suits players 5&apos;6&quot;–6&apos;1&quot;. Choose 1,150g–1,190g for faster stroke play or 1,200g+ for boundary power. Kashmir willow offers durability for practice and club tape/leather play; English willow offers superior rebound.
            </p>
          </div>
          <div className="p-6 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA] space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-[#111111]">
              <BookOpen className="w-4 h-4" />
              <span>Badminton Racket Weight &amp; Tension</span>
            </div>
            <p className="text-xs text-[#525252] leading-relaxed">
              4U (80–84g) balances quick net defense with solid smashes for most club players. Beginners should keep string tension between 22–24 lbs; intermediate players typically use 24–26 lbs.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[#111111]">Frequently Asked Questions</h2>
          <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded-lg bg-white">
            {[
              {
                q: 'What is the difference between Ready Stock and Pre-order?',
                a: 'Ready Stock items are physically held in GoPlay inventory and dispatch immediately. Pre-order items are sourced from verified suppliers only after you confirm an order, typically arriving within 10–16 business days.',
              },
              {
                q: 'How does Special Product Sourcing work?',
                a: 'Submit a Product Request with the item name, image or URL, and target BDT budget. We verify availability and send a written quotation showing item cost, shipping, duties, and service fee before you approve.',
              },
              {
                q: 'Which payment methods are currently active?',
                a: 'Cash on Delivery (COD) and Manual Payment Verification are active in this release. Automated bKash, Nagad, and SSLCommerz payment gateways are architected for Phase 4 pending merchant approval.',
              },
              {
                q: 'How do returns and refunds work?',
                a: 'Unused ready-stock items in original packaging are eligible for 7-day return/exchange. Pre-orders cancelled due to supplier unavailability or missed confirmed windows qualify for full refund.',
              },
            ].map((item) => (
              <div key={item.q} className="p-5">
                <h3 className="font-display text-sm font-bold text-[#111111]">{item.q}</h3>
                <p className="mt-1.5 text-sm text-[#525252] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('policies')}
          className="text-sm font-semibold underline text-[#111111]"
        >
          Read Full Shipping, Return, Privacy &amp; Pre-Order Policies →
        </button>
      </div>
    );
  }

  // Policies
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <h1 className="font-display text-3xl font-extrabold text-[#111111]">
        GoPlay Store Policies (Bangladesh)
      </h1>

      <div className="space-y-6 text-sm text-[#292929] leading-relaxed">
        <section className="p-6 border border-[#E5E5E5] rounded-lg bg-white space-y-2">
          <h2 className="font-display text-lg font-bold text-[#111111]">1. Shipping Policy</h2>
          <p>
            Ready-stock orders ship within 24–48 business hours. Estimated delivery is 2–3 business days in Dhaka Metro (৳{settings.dhakaMetroShipping}), 2–4 days in Dhaka Suburbs (৳{settings.dhakaSuburbShipping}), and 3–5 days nationwide (৳{settings.nationwideShipping}), subject to courier coverage. Ready-stock orders of ৳{settings.freeShippingThreshold.toLocaleString()}+ qualify for free delivery.
          </p>
        </section>

        <section className="p-6 border border-[#E5E5E5] rounded-lg bg-white space-y-2">
          <h2 className="font-display text-lg font-bold text-[#111111]">2. Return &amp; Refund Policy</h2>
          <p>
            Ready-stock items may be returned or exchanged within 7 days of delivery if unused, unwashed, and in original packaging with tags intact. Defective or incorrect items delivered are replaced or refunded without additional delivery charge. Refunds are recorded and processed within 7–10 working days in compliance with Bangladesh Digital Commerce guidelines.
          </p>
        </section>

        <section className="p-6 border border-[#E5E5E5] rounded-lg bg-white space-y-2">
          <h2 className="font-display text-lg font-bold text-[#111111]">3. Pre-Order &amp; Sourcing Terms</h2>
          <p>
            Quotations state validity dates and separate item, freight, tax/duty, and service fee costs. Delivery timelines are supplier-dependent estimates and are never promised as guaranteed unless confirmed. Customer advances are tracked per order and never used to fulfill other orders.
          </p>
        </section>

        <section className="p-6 border border-[#E5E5E5] rounded-lg bg-white space-y-2">
          <h2 className="font-display text-lg font-bold text-[#111111]">4. Privacy Policy &amp; Terms</h2>
          <p>
            Customer contact details, addresses, and private product requests are collected strictly for order fulfillment, sourcing quotations, and customer support. GoPlay does not sell customer data or expose private requests to other shoppers.
          </p>
        </section>
      </div>
    </div>
  );
}
