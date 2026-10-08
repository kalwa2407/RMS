import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Eye,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Smartphone,
  CreditCard,
  MessageSquare,
  Users,
  CheckCircle,
  AlertTriangle,
  Server,
  FileText,
  Clock
} from "lucide-react";

const Section = ({ icon: Icon, title, id, children }) => (
  <section id={id} className="mb-10 scroll-mt-24">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center flex-shrink-0 text-[#EAB308]">
        <Icon size={20} />
      </div>
      <h2
        className="text-white text-xl sm:text-2xl font-semibold tracking-wide"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h2>
    </div>
    <div className="text-gray-300 leading-relaxed space-y-3 pl-2 sm:pl-13 text-sm sm:text-base">
      {children}
    </div>
  </section>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#070d14] text-white selection:bg-[#EAB308] selection:text-black">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0f2933] via-[#0a1f28] to-[#070d14] pt-16 pb-12 px-4 border-b border-white/10 text-center">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#EAB308]/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#EAB308]/10 border border-[#EAB308]/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <Shield size={32} className="text-[#EAB308]" />
          </div>

          <h1
            className="text-3xl sm:text-5xl font-extrabold text-white mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Privacy Policy & Data Safety
          </h1>

          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Persian Darbar · Camp Area, Pune, Maharashtra, India
          </p>

          {/* Applicable Apps Badge Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAB308]/10 border border-[#EAB308]/30 text-[#EAB308]">
              <Smartphone size={13} /> Persian Darbar (Customer App: <code className="text-white">in.persiandarbar.customer</code>)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <Users size={13} /> Persian Darbar Staff (Staff App: <code className="text-white">in.persiandarbar.staff</code>)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <CheckCircle size={13} /> persiandarbar.in (Official Website)
            </span>
          </div>

          <p className="text-gray-500 text-xs mt-4">
            Effective Date: October 1, 2026 · Compliant with Google Play Developer Policy & DPDP Act India
          </p>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Quick Summary Notice */}
        <div className="mb-10 p-5 rounded-2xl bg-[#0f2933]/70 border border-[#EAB308]/30 backdrop-blur-md">
          <h3 className="text-sm font-bold text-[#EAB308] uppercase tracking-wider mb-2 flex items-center gap-2">
            <Shield size={16} /> Summary & Scope
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            This Privacy Policy applies to the <strong className="text-white">Persian Darbar</strong> customer mobile application,
            the <strong className="text-white">Persian Darbar Staff</strong> mobile application, and the official website at{" "}
            <strong className="text-white">https://persiandarbar.in</strong>, operated by Persian Darbar ("we", "us", or "our").
            We are committed to protecting your personal information and handling your data transparently in accordance with Google Play's
            User Data policies and applicable privacy laws.
          </p>
        </div>

        {/* Section 1: Information We Collect */}
        <Section icon={Eye} title="1. Information We Collect" id="information-collected">
          <p>
            Depending on whether you use our <strong>Customer Application</strong> or our <strong>Staff Operations Application</strong>,
            we collect only the minimum data required to facilitate dining, orders, reservations, and restaurant operations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2 text-[#EAB308]">
                <Smartphone size={16} /> Customer App (in.persiandarbar.customer)
              </h3>
              <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Identity & Profile:</strong> Full name, email address, profile picture from Google Sign-In (Firebase Auth).</li>
                <li><strong>Contact Details:</strong> Verified mobile phone number for order updates and OTP authentication.</li>
                <li><strong>Delivery Addresses:</strong> Street address, landmark, and pin code saved by you for food delivery.</li>
                <li><strong>Order & Reservation History:</strong> Dishes ordered, billing amounts, order status, booking date/time, and table preferences.</li>
                <li><strong>Location Data (Approximate/Precise):</strong> Temporary GPS coordinates used only when you click "Detect Current Location" to calculate delivery radius.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2 text-cyan-400">
                <Users size={16} /> Staff App (in.persiandarbar.staff)
              </h3>
              <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Staff Credentials:</strong> Role assignments (Admin, Captain, Kitchen, Delivery) and secure login pins/passwords.</li>
                <li><strong>Operational Data:</strong> Table order management, kitchen preparation queues, inventory logs, and delivery status updates.</li>
                <li><strong>Delivery Partner Data:</strong> Assigned delivery order details and fulfillment timestamps.</li>
                <li><strong>Device & Diagnostics:</strong> Device model, OS version, and network connectivity state for stable operational sync.</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Section 2: How We Use Your Information */}
        <Section icon={Lock} title="2. How We Use Your Information" id="how-we-use">
          <p>We process your personal and operational information for legitimate business purposes:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Service Delivery:</strong> Process dine-in table orders, takeaway, home deliveries, and table reservations.</li>
            <li><strong>Authentication:</strong> Securely sign in users via Google Authentication (Firebase Auth) without passwords.</li>
            <li><strong>Order Communications:</strong> Send instant transactional confirmations and real-time updates via WhatsApp Cloud API.</li>
            <li><strong>Customer Support:</strong> Respond to customer queries via human support or our automated dining assistant.</li>
            <li><strong>Loyalty & Rewards:</strong> Accrue and redeem Persian Darbar loyalty coins/points.</li>
            <li><strong>Fraud Prevention & Security:</strong> Protect against unauthorized access, malicious activity, and fake orders.</li>
          </ul>
        </Section>

        {/* Section 3: Third-Party Services & SDKs */}
        <Section icon={Server} title="3. Third-Party Services & SDKs" id="third-party-services">
          <p>
            We do <strong>not sell, rent, or trade</strong> your personal information to third parties or data brokers.
            We share information only with trusted service providers who adhere to strict data security standards:
          </p>
          <div className="space-y-3 mt-3">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">FB</div>
              <div className="text-xs">
                <p className="text-white font-semibold">Google Firebase (Google LLC)</p>
                <p className="text-gray-400">Provides secure user authentication, Cloud Firestore database storage, and push notification infrastructure with encryption at rest.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">GC</div>
              <div className="text-xs">
                <p className="text-white font-semibold">Google Cloud Platform (Asia South 1 - Mumbai, India)</p>
                <p className="text-gray-400">Hosts our backend microservices (Cloud Run) securely within Indian jurisdiction, minimizing latency and enforcing data sovereignty.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare size={16} />
              </div>
              <div className="text-xs">
                <p className="text-white font-semibold">Meta WhatsApp Business Cloud API (Meta Platforms, Inc.)</p>
                <p className="text-gray-400">Dispatches transactional table reservation approvals and delivery tracking links to your registered phone number.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CreditCard size={16} />
              </div>
              <div className="text-xs">
                <p className="text-white font-semibold">Razorpay Software Private Limited</p>
                <p className="text-gray-400">Processes secure online transactions. <strong>Persian Darbar never stores or accesses your debit/credit card numbers, CVVs, or net banking passwords.</strong> All payments are processed on PCI-DSS certified gateways.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Section 4: Device Permissions & Location */}
        <Section icon={MapPin} title="4. Device Permissions & Location Data" id="permissions">
          <p>Our applications declare only essential Android permissions in their manifests:</p>
          <ul className="list-disc list-inside space-y-2 mt-2 text-xs sm:text-sm">
            <li><code className="text-[#EAB308]">android.permission.INTERNET</code>: Required to communicate with our cloud servers, load menu items, and synchronize orders.</li>
            <li><code className="text-[#EAB308]">android.permission.ACCESS_NETWORK_STATE</code>: Required to detect offline/online connectivity and notify you if internet is unavailable.</li>
            <li><strong>Geolocation (Optional, In-App Prompt Only):</strong> When ordering food, you may voluntarily grant access to your current location to automatically check if your address falls within our restaurant's delivery perimeter. We do <strong>not</strong> track your location in the background or when the app is closed.</li>
          </ul>
        </Section>

        {/* Section 5: Data Storage, Retention & Security */}
        <Section icon={Lock} title="5. Data Storage, Security & Retention" id="security">
          <p>
            Your information is stored securely in <strong>Google Firebase / Google Cloud Platform</strong> servers located in India (asia-south1 region).
            We employ industry-standard technical safeguards:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2 text-xs sm:text-sm">
            <li><strong>Encryption in Transit:</strong> All communications between your device and our servers use HTTPS with TLS 1.3 encryption.</li>
            <li><strong>Encryption at Rest:</strong> Database records are encrypted at rest using AES-256 standards.</li>
            <li><strong>Data Retention:</strong> We retain your profile and order data for as long as your account is active. Financial invoices and order records are retained for the statutory period required under Indian taxation and accounting laws, after which they are securely archived or purged.</li>
          </ul>
        </Section>

        {/* Section 6: ACCOUNT & DATA DELETION (CRITICAL GOOGLE PLAY POLICY) */}
        <div id="data-deletion" className="mb-10 scroll-mt-24 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#13222e] to-[#0a1820] border-2 border-[#EAB308]/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#EAB308]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0 text-red-400">
              <Trash2 size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#EAB308] bg-[#EAB308]/10 px-2.5 py-0.5 rounded-full border border-[#EAB308]/20">
                Google Play Policy Compliance
              </span>
              <h2
                className="text-white text-xl sm:text-2xl font-bold mt-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                6. Account & Data Deletion Policy
              </h2>
            </div>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            In compliance with Google Play's User Data policy on Account Deletion, you have the right to request the permanent deletion of your
            Persian Darbar account and all associated personal data at any time, without requiring the app to be installed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#EAB308] text-black text-xs font-bold flex items-center justify-center">1</span>
                Method A: In-App Deletion
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Open the <strong className="text-white">Persian Darbar Customer App</strong> &rarr; Navigate to{" "}
                <strong className="text-white">My Profile</strong> &rarr; Scroll to{" "}
                <strong className="text-white">Account Management</strong> &rarr; Tap{" "}
                <span className="text-red-300 font-semibold">"Delete Account"</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#EAB308] text-black text-xs font-bold flex items-center justify-center">2</span>
                Method B: Direct Email / Web Request
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-2">
                Send an email with the subject <strong>"Account Deletion Request"</strong> to our privacy desk from your registered email address:
              </p>
              <a
                href="mailto:privacy@persiandarbar.in?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20Persian%20Darbar%20account%20and%20associated%20data.%0A%0ARegistered%20Email:%20%0ARegistered%20Phone:%20"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EAB308] hover:underline"
              >
                <Mail size={14} /> privacy@persiandarbar.in
              </a>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-gray-300 space-y-2">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Clock size={14} className="text-[#EAB308]" /> What happens when you delete your account:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Your Firebase Authentication credentials (Google OAuth link) are permanently deleted.</li>
              <li>Your saved delivery addresses, profile name, phone number, and loyalty tokens are wiped within 30 days.</li>
              <li>Past order billing invoices are retained strictly as required by Indian taxation and audit regulations (GST Act) and are anonymized.</li>
            </ul>
          </div>
        </div>

        {/* Section 7: Children's Privacy */}
        <Section icon={AlertTriangle} title="7. Children's Privacy" id="children">
          <p>
            Our applications and services are directed towards adults and dining patrons aged 13 and above (or 18+ for restaurant staff employment).
            We do not knowingly collect personal information from children under the age of 13. If you believe a child under 13 has provided us with
            personal information, please contact us immediately at <strong className="text-[#EAB308]">privacy@persiandarbar.in</strong>, and we will
            promptly delete such information from our databases.
          </p>
        </Section>

        {/* Section 8: Changes to This Policy */}
        <Section icon={FileText} title="8. Policy Updates" id="updates">
          <p>
            We may update our Privacy Policy periodically to reflect changes in our operational practices or legal requirements.
            When updates occur, we will revise the "Effective Date" at the top of this page. Your continued use of the Persian Darbar
            mobile applications or website constitutes your acceptance of the revised policy.
          </p>
        </Section>

        {/* Section 9: Contact Us & Grievance Officer */}
        <div className="border border-[#EAB308]/30 rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white/5 to-transparent mt-8 shadow-xl">
          <h2
            className="text-white text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <Mail className="text-[#EAB308]" size={22} /> Grievance Officer & Contact Information
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            In accordance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act (DPDP), India:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-xs block">Data Protection Officer / Grievance Officer:</span>
                <span className="text-white font-semibold">Persian Darbar Privacy & Legal Cell</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-[#EAB308]" />
                <a href="mailto:privacy@persiandarbar.in" className="text-[#EAB308] hover:underline font-mono text-xs sm:text-sm">
                  privacy@persiandarbar.in
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-[#EAB308]" />
                <a href="mailto:info@persiandarbar.in" className="text-[#EAB308] hover:underline font-mono text-xs sm:text-sm">
                  info@persiandarbar.in
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#EAB308]" />
                <span className="text-gray-300 font-mono text-xs sm:text-sm">+91 91756 23047</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-[#EAB308] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Persian Darbar Restaurant</strong><br />
                  Upper Ground Floor, Renaissance Business,<br />
                  Wellesley Road, Camp Area,<br />
                  Pune, Maharashtra 411001, India
                </span>
              </div>
              <p className="pt-2 text-[11px] text-gray-500">
                Grievance turnaround timeline: Acknowledgment within 48 hours; resolution within 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="text-center mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <Link to="/" className="hover:text-[#EAB308] transition-colors">
            &larr; Back to Home
          </Link>
          <span className="text-gray-600">•</span>
          <Link to="/terms" className="hover:text-[#EAB308] transition-colors">
            Terms & Conditions
          </Link>
          <span className="text-gray-600">•</span>
          <a href="#data-deletion" className="hover:text-red-400 transition-colors">
            Request Data Deletion
          </a>
        </div>
      </div>
    </div>
  );
}
