"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  return (
    <Suspense>
      <LandingPage />
    </Suspense>
  );
}

function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-emerald-50">
      {/* Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-40 flex h-20 items-center justify-between bg-emerald-900 px-12">
        <Image src="/logo.jpg" alt="JCLB" width={56} height={56} className="rounded-lg" />
        <div className="hidden items-center gap-8 md:flex">
          {["HOW IT WORKS", "CATEGORIES", "WHY US", "REVIEWS"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="text-sm font-medium text-white hover:text-amber-300">
              {item}
            </a>
          ))}
        </div>
        <button onClick={() => setShowLogin(true)} className="rounded-lg bg-amber-300 px-6 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-amber-400">
          LOGIN
        </button>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-emerald-50 px-12 pb-20 pt-32">
        <div className="mx-auto flex max-w-7xl items-center gap-12">
          <div className="flex-1">
            <div className="mb-6 inline-block rounded-full bg-emerald-900 px-5 py-2 text-sm font-semibold text-amber-400">
              TRUSTED BUY BACK SHOP FOR FILIPINO FAMILIES
            </div>
            <h1 className="text-6xl font-bold leading-tight text-emerald-900 lg:text-7xl">
              Sell Your Items.<br />Get Paid Today.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-700">
              JCLB Buy Back Shop provides honest, secure, and compassionate financial solutions that uplift lives and build lasting relationships within our community.
            </p>
            <div className="mt-8 flex gap-4">
              <button onClick={() => setShowLogin(true)} className="rounded-lg bg-emerald-900 px-8 py-4 font-bold text-white transition hover:bg-emerald-800">
                GET STARTED
              </button>
              <a href="#how-it-works" className="rounded-lg border border-emerald-900 px-8 py-4 font-bold text-emerald-900 transition hover:bg-emerald-900 hover:text-white">
                HOW IT WORKS
              </a>
            </div>

            <div className="mt-12 flex gap-12 border-t border-emerald-900/20 pt-8">
              <div>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold text-emerald-900">100</span>
                  <span className="mb-1 text-2xl font-bold text-emerald-900">%</span>
                </div>
                <p className="mt-1 text-sm font-bold text-emerald-900">TRUSTED & LEGIT</p>
              </div>
              <div>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold text-emerald-900">24</span>
                  <span className="mb-1 text-2xl font-bold text-emerald-900">hrs</span>
                </div>
                <p className="mt-1 text-sm font-bold text-emerald-900">QUICK PAYOUT</p>
              </div>
              <div>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold text-emerald-900">500</span>
                  <span className="mb-1 text-2xl text-emerald-900">+</span>
                </div>
                <p className="mt-1 text-sm font-bold text-emerald-900">HAPPY SELLERS</p>
              </div>
            </div>
          </div>
          <div className="hidden flex-1 lg:block">
            <div className="relative h-[500px] w-full rounded-3xl bg-emerald-900/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/logo.jpg" alt="JCLB" width={200} height={200} className="rounded-3xl opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-emerald-50 px-12 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-6xl font-bold text-emerald-900">
            <span className="text-amber-500">3</span> Steps to Get Your Cash
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { step: "01", title: "Send Your Item Details", desc: "Message us on Facebook with photos and details of your item. We accept gadgets, appliances, accessories, and more." },
              { step: "02", title: "Get a Fair Offer", desc: "Our team reviews your submission and gives you a fair, competitive buy-back price — usually within the same day." },
              { step: "03", title: "Get Paid Instantly", desc: "Agree to the offer, drop off or ship your item, and get paid instantly. Cash on hand or digital transfer — your choice." },
            ].map((item) => (
              <div key={item.step} className="rounded-xl bg-emerald-900 p-8 text-white">
                <span className="text-4xl font-bold text-amber-400">{item.step}</span>
                <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="bg-emerald-900 px-12 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold text-amber-400">WHAT WE BUY</p>
          <h2 className="mt-2 text-4xl font-black text-white md:text-5xl">
            We Accept a <span className="text-amber-400">WIDE RANGE</span> of items
          </h2>
          <p className="mt-4 text-xl text-white">
            From the latest smartphones to vintage electronics — if it has value, <span className="text-amber-400">we want it.</span>
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { name: "SMARTPHONES", desc: "iPhone, Samsung and More" },
              { name: "LAPTOP & PCs", desc: "All brands accepted" },
              { name: "APPLIANCES", desc: "Smart and Large Electronics" },
              { name: "GAMING CONSOLES", desc: "PSP, Xbox or Nintendo" },
              { name: "CAMERAS", desc: "DSLR, mirrorless and action cams" },
              { name: "SMARTWATCHES", desc: "Apple Watch or Galaxy Watch" },
              { name: "AUDIO & EARPHONES", desc: "Headphones, TWS or Speakers" },
              { name: "OTHER ITEMS", desc: "Ask us — we might buy it!" },
            ].map((cat) => (
              <div key={cat.name} className="rounded-xl border border-amber-300 bg-emerald-50/75 p-6">
                <h3 className="font-bold text-zinc-900">{cat.name}</h3>
                <p className="mt-1 text-sm text-zinc-600">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="bg-emerald-50 px-12 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-16 lg:flex-row">
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-500">WHY CHOOSE US?</p>
            <h2 className="mt-2 text-4xl font-bold leading-tight text-emerald-900 md:text-5xl">
              Fair Prices. Fast Cash.<br /><span className="text-slate-700">ZERO HASSLE.</span>
            </h2>
            <div className="mt-8 rounded-2xl bg-emerald-900 p-8">
              <p className="text-lg leading-relaxed text-white">
                We believe everyone deserves a fair price for their pre-loved items — no low-balling, no runarounds.
              </p>
              <p className="mt-4 text-xs text-red-300">— JCLB Buy Back Shop Team</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5">
                <span className="text-sm font-bold text-emerald-900">5.0</span>
                <span className="text-[10px] font-bold text-emerald-900">CUSTOMER RATING</span>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-6">
            {[
              { title: "Same-Day Offers", desc: "We respond fast. Submit your item in the morning and have an offer by afternoon — no waiting around." },
              { title: "Honest & Transparent", desc: "Our pricing is based on current market values. We explain every offer so you know exactly what you're getting." },
              { title: "Secure Transactions", desc: "Every deal is handled with full transparency. Your items and your money are always protected." },
              { title: "Trusted by Hundreds", desc: "Hundreds of satisfied sellers trust JCLB for their buy-back needs. Join our growing community today." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-lg bg-amber-400/20 p-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-emerald-900">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="bg-emerald-50 px-12 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold text-amber-500">CUSTOMER REVIEWS</p>
          <h2 className="mt-2 text-4xl font-bold text-emerald-900 md:text-5xl">What Our Sellers Say</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { name: "Manon M.", sold: "Sold an iPhone 12", quote: "Super fast response! I messaged them about my old iPhone and got an offer within a few hours. Payment was smooth and no issues at all." },
              { name: "Carlos R.", sold: "Sold a MacBook Pro", quote: "Best buy-back shop I've tried. They gave me a fair price for my laptop and the whole process took less than a day. Highly recommend!" },
              { name: "Mindy Meeks", sold: "Sold a Samsung Galaxy", quote: "Very professional and trustworthy. They explained everything clearly and I felt comfortable with the whole transaction. Will sell again!" },
            ].map((review) => (
              <div key={review.name} className="overflow-hidden rounded-2xl">
                <div className="bg-white p-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="rounded-t-[40px] bg-emerald-900 px-6 pb-8 pt-6">
                  <p className="text-sm leading-relaxed text-white">&ldquo;{review.quote}&rdquo;</p>
                  <div className="mt-4">
                    <p className="font-semibold text-white">{review.name}</p>
                    <p className="text-sm text-white/70">{review.sold}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red-700 px-12 py-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold text-white md:text-5xl">Ready to Turn Your Items Into Cash?</h2>
            <p className="mt-2 text-4xl font-bold text-white/60 md:text-5xl">It only takes a minute to start.</p>
          </div>
          <button onClick={() => setShowLogin(true)} className="flex-shrink-0 rounded-lg bg-white px-10 py-4 font-bold text-zinc-900 transition hover:bg-zinc-100">
            CONTACT US
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 px-12 py-10 text-center text-sm text-white/50">
        <p>&copy; 2026 JCLB Buy Back Shop. All rights reserved.</p>
      </footer>

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Dark green top */}
        <div className="relative bg-emerald-800 px-8 pb-8 pt-10">
          <div className="absolute right-[-20px] top-[-30px] h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute bottom-[20px] left-[-10px] h-28 w-28 rounded-full bg-white/5" />
          <div className="absolute bottom-[-10px] right-[40px] h-20 w-20 rounded-full bg-white/5" />
          <div className="relative flex flex-col items-center">
            <div className="rounded-2xl bg-emerald-950/50 p-2">
              <div className="overflow-hidden rounded-xl ring-2 ring-amber-400/60">
                <Image src="/logo.jpg" alt="JCLB Logo" width={96} height={96} className="h-24 w-24 object-cover" />
              </div>
            </div>
            <h2 className="mt-3 text-lg font-bold text-white">JCLB Buy Back</h2>
            <p className="text-lg font-bold text-amber-400">Pawnshop</p>
          </div>
        </div>

        {/* Divider */}
        <div className="relative bg-emerald-800">
          <div className="h-2 rounded-t-xl bg-stone-100" />
          <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-full bg-white/30" />
        </div>

        {/* Form */}
        <div className="bg-stone-100 px-8 pb-8 pt-6">
          <h3 className="text-xl font-bold text-emerald-950">Welcome back</h3>
          <p className="mt-1 text-xs text-zinc-500">Sign in to access your branch portal</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-700">USERNAME / EMAIL</label>
              <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center border-r border-zinc-200">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-zinc-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 flex-1 bg-transparent px-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400" placeholder="Enter username or email" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-700">PASSWORD</label>
              <div className="flex items-center overflow-hidden border border-zinc-300 bg-white">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center border-r border-zinc-200">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-zinc-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 flex-1 bg-transparent px-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400" placeholder="Enter password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 flex justify-end gap-1 text-xs">
                <span className="text-zinc-500">Forgot password?</span>
                <button type="button" className="font-bold text-emerald-800 hover:underline">Reset here</button>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-800 py-3 text-base font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="my-4 h-px bg-zinc-200" />
          <p className="text-center text-xs text-zinc-500">
            Don&apos;t have an account?{" "}
            <button className="font-bold text-emerald-800 hover:underline">Sign Up</button>
          </p>
          <div className="mt-4 text-center text-[10px] text-zinc-400">
            <p>JCLB Buy Back Shop &middot; <span className="text-emerald-800">Privacy Policy</span></p>
            <p className="mt-1">&copy; 2026 All rights reserved &middot; <span className="text-emerald-800">Terms of Service</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
