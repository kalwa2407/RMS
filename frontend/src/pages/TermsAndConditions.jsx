import React from "react";
import { FileText, ShieldCheck, Ban, AlertTriangle, Mail } from "lucide-react";

const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-10">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-full bg-[#EAB308]/10 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-[#EAB308]" />
      </div>
      <h2 className="text-white text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
    </div>
    <div className="text-gray-300 leading-relaxed space-y-3 pl-12">{children}</div>
  </div>
);

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#0a1f28] text-white">
      <div className="bg-gradient-to-b from-[#0f2933] to-[#0a1f28] pt-16 pb-10 px-4 text-center border-b border-white/10">
        <div className="w-14 h-14 rounded-full bg-[#EAB308]/10 flex items-center justify-center mx-auto mb-4">
          <FileText size={28} className="text-[#EAB308]" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Terms & Conditions</h1>
        <p className="text-gray-400 text-sm">Persian Darbar · Last updated: October 1, 2026</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-gray-300 mb-10 leading-relaxed border-l-4 border-[#EAB308] pl-5">
          By downloading or using the <strong className="text-white">Persian Darbar Staff</strong> app or visiting <strong className="text-white">persiandarbar.in</strong>, you agree to be bound by these Terms and Conditions. Please read them carefully.
        </p>

        <Section icon={ShieldCheck} title="Use of the App">
          <p>The Persian Darbar Staff app is intended solely for use by authorised restaurant staff members including administrators, captains, kitchen staff, and delivery personnel.</p>
          <p>You must be at least 18 years old to use this application.</p>
          <p>You agree to provide accurate information when creating an account or placing orders.</p>
        </Section>

        <Section icon={FileText} title="Orders & Reservations">
          <p>All food orders placed through the app are subject to availability and confirmation by the restaurant.</p>
          <p>Table reservation requests are confirmed only upon explicit approval by an authorised admin. A WhatsApp confirmation message will be sent upon approval.</p>
          <p>Persian Darbar reserves the right to cancel or modify orders in case of unforeseen circumstances.</p>
        </Section>

        <Section icon={Ban} title="Prohibited Activities">
          <ul className="list-disc list-inside space-y-2">
            <li>Sharing login credentials with unauthorised persons</li>
            <li>Attempting to access admin panels without authorisation</li>
            <li>Submitting false or fraudulent orders or reservations</li>
            <li>Reverse engineering or tampering with the application</li>
            <li>Using the app for any illegal or unauthorised purpose</li>
          </ul>
        </Section>

        <Section icon={ShieldCheck} title="Intellectual Property">
          <p>All content within the app — including the Persian Darbar name, logo, images, and design — is the property of Persian Darbar and may not be reproduced without written permission.</p>
        </Section>

        <Section icon={AlertTriangle} title="Disclaimer of Warranties">
          <p>The app is provided "as is" without warranties of any kind. Persian Darbar does not guarantee uninterrupted or error-free operation of the app.</p>
          <p>We are not liable for any indirect or consequential damages arising from the use of this application.</p>
        </Section>

        <Section icon={ShieldCheck} title="Governing Law">
          <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Pune, Maharashtra.</p>
        </Section>

        <Section icon={FileText} title="Changes to Terms">
          <p>We may update these Terms at any time. Continued use of the app after changes constitutes your acceptance of the new Terms.</p>
        </Section>

        <div className="border border-white/10 rounded-2xl p-6 bg-white/5 mt-8">
          <h2 className="text-white text-xl font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Contact</h2>
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-[#EAB308]" />
            <a href="mailto:info@persiandarbar.in" className="text-[#EAB308] hover:underline">info@persiandarbar.in</a>
          </div>
          <p className="text-gray-500 text-sm mt-3">Persian Darbar · Camp Area, Pune 411001, India</p>
        </div>

        <div className="text-center mt-10 flex justify-center gap-6">
          <a href="/privacy-policy" className="text-gray-400 hover:text-[#EAB308] text-sm transition-colors">Privacy Policy</a>
          <a href="/" className="text-gray-400 hover:text-[#EAB308] text-sm transition-colors">Back to Home</a>
        </div>
      </div>
    </div>
  );
}
