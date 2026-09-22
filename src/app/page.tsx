import Link from "next/link";
import { ArrowRight, HeartHandshake, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-white pt-24 pb-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="mx-auto max-w-4xl font-display text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
              Empowering change through <span className="text-rose-500">digital impact</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
              Join the movement. Connect with impactful charities, track your contributions, and see the real-world difference you are making.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center rounded-full bg-slate-900 py-3 px-6 text-sm font-semibold text-white hover:bg-slate-700 hover:text-slate-100 transition-all"
              >
                Become a Hero
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/charities"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white py-3 px-6 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Explore Charities
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="bg-slate-50 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-2xl bg-rose-100 p-4 text-rose-600">
                  <HeartHandshake className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Direct Impact</h3>
                <p className="text-slate-600">Connect directly with vetted charities and ensure your contributions matter.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-2xl bg-blue-100 p-4 text-blue-600">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Secure & Transparent</h3>
                <p className="text-slate-600">Every transaction is secured and fully transparent for your peace of mind.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-2xl bg-emerald-100 p-4 text-emerald-600">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Real-time Updates</h3>
                <p className="text-slate-600">See the real-time progress of the campaigns you support.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
