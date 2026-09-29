"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Simulate accessible form submission with safety delay
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSubmitted(true);
    } catch {
      setErrorMessage("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream text-espresso">
      <Navbar />

      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-xs uppercase tracking-widest text-caramel font-semibold mb-2">
                Get in Touch
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-espresso tracking-tight mb-4">
                Connect with AI CAFÉ
              </h1>
              <p className="text-sm sm:text-base text-espresso/70 leading-relaxed font-sans">
                Whether you have questions regarding our specialty coffee beans, AI Barista formulations, or catering inquiries, our team is at your service.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
              {/* Column 1: Café Info & Showcase Location */}
              <div className="md:col-span-2 space-y-8 bg-offwhite p-8 rounded-3xl border border-espresso/10 shadow-soft">
                <div>
                  <h2 className="font-serif text-xl font-bold text-espresso mb-4">
                    Artisan Flagship
                  </h2>
                  <div className="space-y-4 text-sm text-espresso/80">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-caramel shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-espresso">AI CAFÉ Flagship Bar</p>
                        <p className="text-xs text-warmgray mt-0.5">
                          142 Artisan Boulevard, Suite 100
                        </p>
                        <p className="text-[11px] text-warmgray/80 italic mt-1">
                          [Configurable Pilot Location Placeholder]
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-caramel shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-espresso">Hours of Craft</p>
                        <p className="text-xs text-warmgray mt-0.5">Daily: 7:00 AM – 8:00 PM</p>
                        <p className="text-xs text-warmgray">AI Concierge: 24/7 Online</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-caramel shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-espresso">Electronic Mail</p>
                        <p className="text-xs text-warmgray mt-0.5">support@aicafe.internal</p>
                        <p className="text-xs text-warmgray">concierge@aicafe.internal</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-espresso/10 text-xs text-espresso/70 leading-relaxed">
                  <p className="font-semibold text-espresso mb-1">Dietary & Allergen Care</p>
                  <p>
                    All milk substitutes (Oat, Almond, Soy) are prepared using dedicated steam wands to prevent cross-contact.
                  </p>
                </div>
              </div>

              {/* Column 2: Contact Form */}
              <div className="md:col-span-3 bg-white p-8 sm:p-10 rounded-3xl border border-espresso/10 shadow-soft">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-espresso">
                      Message Received
                    </h2>
                    <p className="text-sm text-espresso/70 max-w-sm mx-auto leading-relaxed">
                      Thank you for writing to us. Our café concierge team will review your inquiry and reply within 24 hours.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSubmitted(false);
                        setFormState({ name: "", email: "", subject: "General Inquiry", message: "" });
                      }}
                      className="mt-4"
                    >
                      Send Another Note
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="font-serif text-2xl font-bold text-espresso mb-2">
                      Send a Message
                    </h2>

                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contact-name" className="block text-xs font-semibold text-espresso mb-1.5">
                          Your Name *
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          value={formState.name}
                          onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                          placeholder="Aayu Patel"
                          className="w-full px-4 py-2.5 rounded-xl bg-cream/40 border border-espresso/15 text-sm text-espresso placeholder:text-warmgray focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
                        />
                      </div>

                      <div>
                        <label htmlFor="contact-email" className="block text-xs font-semibold text-espresso mb-1.5">
                          Email Address *
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          value={formState.email}
                          onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                          placeholder="aayu@example.com"
                          className="w-full px-4 py-2.5 rounded-xl bg-cream/40 border border-espresso/15 text-sm text-espresso placeholder:text-warmgray focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="block text-xs font-semibold text-espresso mb-1.5">
                        Subject
                      </label>
                      <select
                        id="contact-subject"
                        value={formState.subject}
                        onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-cream/40 border border-espresso/15 text-sm text-espresso focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors"
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Barista / Menu Feedback">Barista / Menu Feedback</option>
                        <option value="Catering & Events">Catering & Events</option>
                        <option value="Press & Partnership">Press & Partnership</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="contact-message" className="block text-xs font-semibold text-espresso mb-1.5">
                        Your Note *
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        rows={4}
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        placeholder="How can we craft a better experience for you?"
                        className="w-full px-4 py-2.5 rounded-xl bg-cream/40 border border-espresso/15 text-sm text-espresso placeholder:text-warmgray focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel transition-colors resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSubmitting}
                      className="w-full justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Sending note...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Dispatch Message</span>
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
