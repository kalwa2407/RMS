import React from "react";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck, Ban, AlertTriangle, Mail, Smartphone, Users } from "lucide-react";

const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-10">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center flex-shrink-0 text-[#EAB308]">
        <Icon size={20} />
      </div>
      <h2 className="text-white text-xl sm:text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
        {title}
      </h2>
    </div>
    <div className="text-gray-300 leading-relaxed space-y-3 pl-2 sm:pl-13 text-sm sm:text-base">
      {children}
    </div>
  </div>
);

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#070d14] text-white selection:bg-[#EAB308] selection:text-black">
      {/* ─── Hero Header ─── */}
      <div className="bg-gradient-to-b from-[#0f2933] via-[#0a1f28] to-[#070d14] pt-16 pb-12 px-4 text-center border-b border-white/10">
        <div className="w-16 h-16 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
          <FileText size={32} className="text-[#EAB308]" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Terms & Conditions
        </h1>
        <p className="text-gray-400 text-sm">Persian Darbar · Last updated: October 1, 2026</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAB308]/10 border border-[#EAB308]/30 text-[#EAB308]">
            <Smartphone size={13} /> Persian Darbar (Customer App: <code className="text-white">in.persiandarbar.customer</code>)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
            <Users size={13} /> Persian Darbar Staff (Staff App: <code className="text-white">in.persiandarbar.staff</code>)
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-gray-300 mb-10 leading-relaxed border-l-4 border-[#EAB308] pl-5 text-sm sm:text-base">
          By downloading, installing, or accessing either the <strong className="text-white">Persian Darbar</strong> customer application,
          the <strong className="text-white">Persian Darbar Staff</strong> application, or our website at{" "}
          <strong className="text-white">persiandarbar.in</strong>, you agree to be bound by these Terms and Conditions. Please review them carefully.
        </p>

        <Section icon={ShieldCheck} title="1. Eligibility & Permitted Use">
          <p>
            The <strong>Persian Darbar Customer App</strong> is intended for dining patrons aged 13 and above to explore menus, reserve tables, order food, and track deliveries.
          </p>
          <p>
            The <strong>Persian Darbar Staff App</strong> is restricted strictly to authorized employees and contractors (Admins, Captains, Kitchen Staff, and Delivery Partners) aged 18 and above.
          </p>
          <p>You agree to supply truthful, complete contact information when creating an account or placing orders.</p>
        </Section>

        <Section icon={FileText} title="2. Orders, Pricing & Table Reservations">
          <p>All food orders placed through our mobile applications or website are subject to restaurant kitchen availability and acceptance.</p>
          <p>Table reservations are confirmed once approved by restaurant management; confirmation messages are delivered via WhatsApp Cloud API.</p>
          <p>Persian Darbar reserves the right to modify menu prices, delivery charges, or item availability without prior notice.</p>
        </Section>

        <Section icon={Ban} title="3. Prohibited Activities">
          <ul className="list-disc list-inside space-y-2">
            <li>Submitting fraudulent food orders or deceptive table reservations</li>
            <li>Sharing staff login PINs or administrative credentials with unauthorized personnel</li>
            <li>Reverse engineering, decompiling, or attempting to compromise the security of our mobile applications</li>
            <li>Using automated bots, scrapers, or exploits against our Cloud Run API or Firestore database</li>
          </ul>
        </Section>

        <Section icon={ShieldCheck} title="4. Intellectual Property">
          <p>
            All trademarks, logos, menu descriptions, brand names ("Persian Darbar"), and graphic assets belong exclusively to
            Persian Darbar and are protected under Indian copyright and trademark statutes.
          </p>
        </Section>

        <Section icon={AlertTriangle} title="5. Limitation of Liability">
          <p>
            The apps are provided on an "as is" and "as available" basis. While we strive for 100% uptime, Persian Darbar does not warrant
            that cloud network connectivity or third-party gateways (e.g. Razorpay, WhatsApp) will be entirely uninterrupted or error-free.
          </p>
        </Section>

        <Section icon={ShieldCheck} title="6. Governing Law & Jurisdiction">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India.
            Courts situated in Pune, Maharashtra shall have exclusive jurisdiction over all disputes arising hereunder.
          </p>
        </Section>

        <div className="border border-white/10 rounded-2xl p-6 bg-white/5 mt-8">
          <h2 className="text-white text-xl font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Contact Us
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-[#EAB308]" />
              <a href="mailto:info@persiandarbar.in" className="text-[#EAB308] hover:underline">info@persiandarbar.in</a>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-[#EAB308]" />
              <a href="mailto:privacy@persiandarbar.in" className="text-[#EAB308] hover:underline">privacy@persiandarbar.in</a>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-3">Persian Darbar · Renaissance Business, Wellesley Road, Camp Area, Pune 411001, India</p>
        </div>

        <div className="text-center mt-10 flex justify-center gap-6 text-sm">
          <Link to="/privacy-policy" className="text-gray-400 hover:text-[#EAB308] transition-colors">
            Privacy Policy
          </Link>
          <span className="text-gray-600">•</span>
          <Link to="/" className="text-gray-400 hover:text-[#EAB308] transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
