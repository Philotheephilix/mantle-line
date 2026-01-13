'use client';

import Link from "next/link";
import MeshGradients from "@/components/MeshGradients";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0">
        <MeshGradients />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 bg-black/10">
        {/* Hero Section */}
        <section className="flex h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
          <div className="max-w-4xl space-y-2">
            <h1 className="text-6xl font-bold leading-tight tracking-[0.4em] text-white drop-shadow-lg md:text-7xl lg:text-8xl">
              RESOLV
            </h1>
            <p className="text-2xl font-semibold text-white/90 drop-shadow-md md:text-3xl lg:text-4xl">
              Trade your conviction. Draw your futures.
            </p>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
              A trading game where <strong>predictions are expressed as drawings</strong>, not orders.
              Turn your market intuition into entertainment finance.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row">
              <Link
                href="/predict"
                className="group relative overflow-hidden rounded-full bg-white px-8 py-4 text-lg font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <span className="relative z-10">Start Drawing</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-orange-400 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
              </Link>
              <Link
                href="/open-position"
                className="rounded-full border-2 border-white/50 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white/20"
              >
                View Positions
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative  backdrop-blur-3xl shadow-inner py-24 px-4">
          <div className="mx-auto max-w-6xl flex items-center justify-between gap-16">
            <h2 className="text-start text-4xl font-bold text-white md:text-6xl">
              How It Works?
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md transition-transform duration-300 hover:scale-105">
                <div className="mb-4 text-4xl font-bold text-zinc-400">1</div>
                <h3 className="mb-4 text-xl font-semibold text-white">Draw Your Prediction</h3>
                <p className="text-white/80">
                  You&apos;re shown a live market chart. Draw a path or curve representing your expected price trajectory over a fixed future horizon.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md transition-transform duration-300 hover:scale-105">
                <div className="mb-4 text-4xl font-bold text-zinc-400">2</div>
                <h3 className="mb-4 text-xl font-semibold text-white">Continuous Futures Position</h3>
                <p className="text-white/80">
                  Your gesture is captured as a continuous curve, normalized to the chart&apos;s time and price scale, and interpolated using piecewise linear interpolation or cubic splines.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md transition-transform duration-300 hover:scale-105">
                <div className="mb-4 text-4xl font-bold text-zinc-400">3</div>
                <h3 className="mb-4 text-xl font-semibold text-white">Calculate PnL</h3>
                <p className="text-white/80">
                  The curve is interpreted as a continuous futures position where slope and deviation from the start price determine exposure, and PnL is computed via a discrete continuous-time PnL model.
                </p>
              </div>
            </div>
          </div>
        </section>



        {/* CTA Section */}
        <section className="relative bg-black/60 backdrop-blur-3xl shadow-inner py-24 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-8 text-4xl font-bold text-white md:text-5xl">
              Ready to Trade Your Conviction?
            </h2>
            <p className="mb-12 text-xl text-white/80">
              Draw your prediction curve and turn your market intuition into trading decisions.
            </p>
            <Link
              href="/predict"
              className="inline-block rounded-full bg-white px-12 py-5 text-xl font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              Start Drawing Now
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
