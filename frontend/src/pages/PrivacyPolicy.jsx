import React from "react";
import { Shield, Lock, Eye, Trash2, Mail, Phone } from "lucide-react";

const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-10">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-full bg-[#EAB308]/10 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-[#EAB308]" />
      </div>
      <h2 className="text-white text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
        {title}
      </h2>
    </div>
    <div className="text-gray-300 leading-relaxed space-y-3 pl-12">{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a1f28] text-white">
      <div className="bg-gradient-to-b from-[#0f2933] to-[#0a1f28] pt-16 pb-10 px-4 text-center border-b border-white/10">
        <div className="w-14 h-14 rounded-full bg-[#EAB308]/10 flex items-center justify-center mx-auto mb-4">
          <Shield size={28} className="text-[#EAB308]" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Privacy Policy
        </h1>
        <p className="text-gray-400 text-sm">Persian Darbar · Last updated: October 1, 2026</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-gray-300 mb-10 leading-relaxed border-l-4 border-[#EAB308] pl-5">
          Persian Darbar ("we", "us", or "our") operates the <strong className="text-white">Persian Darbar Staff</strong> mobile
          application and the <strong className="text-white">persiandarbar.in</strong> website. This Privacy Policy explains what
          information we collect, why we collect it, and how we protect it.
        </p>

        <Section icon={Eye} title="Information We Collect">
          <p><strong className="text-white">Account Information:</strong> Name, email address, and phone number when you register or log in via OTP.</p>
          <p><strong className="text-white">Order Data:</strong> Food items ordered, table number, delivery address, and order history.</p>
          <p><strong className="text-white">Reservation Data:</strong> Date, time, number of guests, and special requests for table reservations.</p>
          <p><strong className="text-white">Location Data:</strong> Approximate location for delivery tracking (only when delivery feature is used).</p>
          <p><strong className="text-white">Usage Data:</strong> App interactions collected to improve service quality.</p>
          <p><strong className="text-white">Device Information:</strong> Device type and OS version for compatibility purposes.</p>
        </Section>

        <Section icon={Lock} title="How We Use Your Information">
          <ul className="list-disc list-inside space-y-2">
            <li>Authenticate your identity via one-time passwords (OTP)</li>
            <li>Process and manage your food orders and table reservations</li>
            <li>Send WhatsApp notifications for reservation confirmations</li>
            <li>Provide delivery tracking and order status updates</li>
            <li>Improve our app and service quality</li>
            <li>Manage loyalty points and rewards</li>
          </ul>
        </Section>

        <Section icon={Shield} title="Third-Party Services">
          <p>We use the following trusted third-party services:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong className="text-white">Google Firebase</strong> — Secure data storage and authentication</li>
            <li><strong className="text-white">Google Cloud Run</strong> — Backend API hosting</li>
            <li><strong className="text-white">Meta WhatsApp Cloud API</strong> — Reservation confirmation messages</li>
            <li><strong className="text-white">OpenAI</strong> — AI-powered customer support chatbot</li>
          </ul>
        </Section>

        <Section icon={Lock} title="Data Storage & Security">
          <p>Your data is stored securely on <strong className="text-white">Google Firebase (Firestore)</strong> with industry-standard encryption at rest and in transit (TLS/HTTPS).</p>
          <p>We do <strong className="text-white">not</strong> store payment card details. We do <strong className="text-white">not</strong> sell your data to third parties.</p>
        </Section>

        <Section icon={Trash2} title="Your Rights">
          <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-white">Access:</strong> Request a copy of the data we hold about you.</li>
            <li><strong className="text-white">Correction:</strong> Update incorrect information via your profile settings.</li>
            <li><strong className="text-white">Deletion:</strong> Request deletion of your account and associated data.</li>
            <li><strong className="text-white">Opt-out:</strong> Disable WhatsApp notifications by contacting us.</li>
          </ul>
          <p className="mt-3">To exercise any of these rights, contact us at <strong className="text-[#EAB308]">info@persiandarbar.in</strong>.</p>
        </Section>

        <Section icon={Eye} title="Children Privacy">
          <p>Our app is intended for restaurant staff and adult customers. We do not knowingly collect personal information from children under the age of 13.</p>
        </Section>

        <Section icon={Shield} title="Changes to This Policy">
          <p>We may update this Privacy Policy periodically. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
        </Section>

        <div className="border border-white/10 rounded-2xl p-6 bg-white/5 mt-8">
          <h2 className="text-white text-xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Contact Us</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-[#EAB308]" />
              <a href="mailto:info@persiandarbar.in" className="text-[#EAB308] hover:underline">info@persiandarbar.in</a>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-[#EAB308]" />
              <span className="text-gray-300">+91 91756 23047</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">Persian Darbar · Upper Ground Floor, Renaissance Business Wellesley Road, Camp Area, Pune 411001, India</p>
        </div>

        <div className="text-center mt-10">
          <a href="/" className="text-gray-400 hover:text-[#EAB308] text-sm transition-colors">Back to Home</a>
        </div>
      </div>
    </div>
  );
}
