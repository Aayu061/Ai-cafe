import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { ShieldCheck, Lock, Eye, Server, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how AI CAFÉ safeguards your personal profile, taste preferences, and authentication data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream text-espresso">
      <Navbar />

      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28">
        <Container>
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage/10 text-sage text-xs font-semibold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-caramel" />
                <span>Trust & Transparency</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-espresso tracking-tight mb-4">
                Privacy Policy
              </h1>
              <p className="text-sm text-warmgray font-mono">
                Effective Date: September 2026 • AI CAFÉ Production V7.3
              </p>
            </div>

            <div className="prose prose-stone max-w-none space-y-10 text-espresso/80 leading-relaxed font-sans text-sm sm:text-base">
              {/* Section 1: Overview */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-espresso mb-3 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-caramel" />
                  1. Our Core Privacy Philosophy
                </h2>
                <p>
                  At <strong>AI CAFÉ</strong> (“Your Drink. Your Way.”), we treat your personal taste and identity with the highest level of care. We believe exceptional coffee should never come at the cost of your digital privacy. This policy outlines how we handle customer authentication, personalized beverage recipes, and AI concierge interactions.
                </p>
              </div>

              {/* Section 2: Data We Collect */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-espresso mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-caramel" />
                  2. Information We Collect
                </h2>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li>
                    <strong>Authentication Data:</strong> When you register as a customer, we securely process your email address, display name, and avatar via Google Firebase Authentication. Passwords are encrypted directly by Firebase and are never stored or accessible by AI CAFÉ servers.
                  </li>
                  <li>
                    <strong>Beverage DNA & Taste Profiles:</strong> Your customized recipes (base, milk, sweetness, ice, boldness, toppings) and saved favorite drinks are stored in Google Cloud Firestore under strict ownership rules.
                  </li>
                  <li>
                    <strong>Concierge Conversations:</strong> Questions you ask the AI Barista are processed server-side to detect sensory preferences and recommend real menu items. We do not use your conversations to build invasive ad-tracking profiles.
                  </li>
                </ul>
              </div>

              {/* Section 3: AI Safety & Grounding */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-espresso mb-3 flex items-center gap-2">
                  <Server className="w-5 h-5 text-caramel" />
                  3. AI Safety & Controlled Tool Architecture
                </h2>
                <p>
                  Our AI Barista utilizes Google Gemini with controlled server-side tools. The artificial intelligence engine is <em>not</em> the source of truth for pricing or inventory. All product inquiries, availability checks, and price calculations run through server-authoritative backend catalog services.
                </p>
                <p className="mt-2">
                  We never transmit payment card details, authentication credentials, or private system keys to the large language model.
                </p>
              </div>

              {/* Section 4: Cookies & Local Storage */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-espresso mb-3 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-caramel" />
                  4. Browser Storage & Cookies
                </h2>
                <p>
                  We utilize essential browser local storage strictly to preserve your authenticated session and temporary drink builder calibration. We do not employ third-party advertising cookies, cross-site trackers, or data-broker trackers.
                </p>
              </div>

              {/* Section 5: Your Rights */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-espresso mb-3">
                  5. Your Rights & Account Deletion
                </h2>
                <p>
                  You have the right to view, update, or clear your taste preferences at any time via your Customer Profile page. To request complete deletion of your customer account and associated recipes, please contact our privacy desk at <code>privacy@aicafe.internal</code>.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
