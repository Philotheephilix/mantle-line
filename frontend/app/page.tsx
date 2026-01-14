'use client';

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { NoiseEffect } from "@/components/ui/NoiseEffect";
import { Header, Footer } from "@/components/layout";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export default function Home() {
  return (
    <NoiseEffect opacity={0.5} className="min-h-screen flex flex-col">
      <div className="relative flex flex-col min-h-screen">
        {/* Animated background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0014] via-[#1800AD] to-[#0a0014]" />
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              backgroundImage: 'radial-gradient(circle at center, #C1FF72 0%, transparent 50%)',
              backgroundSize: '100% 100%',
            }}
          />
        </div>

        {/* Header */}
        <div className="relative z-20">
          <Header />
        </div>



        {/* Content overlay */}
        <div className="relative z-10 flex-1">
          {/* Hero Section */}
          <section className="flex min-h-[70vh] flex-col md:flex-row items-center justify-center px-4 sm:px-8 md:px-14 py-8 md:py-12 text-start gap-8 md:gap-0">

            <motion.div
              className="w-full md:w-auto flex justify-center md:justify-start"
              animate={{
                y: [-10, 10, -10],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: [0.4, 0, 0.6, 1],
              }}
            >
              <Image
                src="https://i.giphy.com/aTjXudsKhB35df6RFf.webp"
                alt="Hero Image"
                width={256}
                height={161}
                className="w-full max-w-[320px] sm:max-w-[480px] md:w-[620px] h-auto md:h-[202px] object-contain filter hue-rotate-40 brightness-150 contrast-120"
              />
            </motion.div>


            <motion.div
              className="max-w-3xl space-y-4 md:space-y-6 w-full md:w-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >



              {/* Floating Logo */}
              <motion.div
                className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-10 mb-6 md:mb-8"
              >
                <Image
                  src="/logo.png"
                  alt="Resolv Logo"
                  width={80}
                  height={80}
                  className="rounded-xl drop-shadow-[0_0_30px_#C1FF72] w-16 h-16 sm:w-20 sm:h-20 md:w-[80px] md:h-[80px]"
                />
                <motion.h1
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-venite leading-tight tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] text-[#C1FF72] drop-shadow-lg text-center sm:text-left"
                  variants={itemVariants}
                  style={{ textShadow: '4px 4px 0 #1800AD, -2px -2px 0 #0a0014' }}
                >
                  RESOLV
                </motion.h1>
              </motion.div>
              <motion.p
                className="mt-6 md:mt-10 text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-md text-center md:text-left"
                variants={itemVariants}
              >
                We&apos;ve invented a new way to trade futures. <br /> <span className="text-[#C1FF72]">Draw your futures.</span>
              </motion.p>

              <motion.p
                className="text-sm sm:text-base md:text-md leading-relaxed text-white/80 text-center md:text-left"
                variants={itemVariants}
              >
                A trading game where <strong className="text-[#C1FF72]">futures trades are expressed as drawings</strong>, not orders.
                Turn your market intuition into entertainment finance.
              </motion.p>

              <motion.div
                className="flex flex-col items-center justify-center md:justify-start gap-3 sm:gap-4 pt-2 sm:flex-row w-full md:w-auto"
                variants={itemVariants}
              >

                <motion.div
                  whileHover={{ scale: 1.05, x: -2, y: -2 }}
                  whileTap={{ scale: 0.95, x: 2, y: 2 }}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href="/predict"
                    className="inline-block w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-[#C1FF72] bg-[#1800AD] border-4 border-[#C1FF72] rounded-xl shadow-[6px_6px_0_0_#000000] transition-all hover:shadow-[8px_8px_0_0_#000000]"
                  >
                    Play Now
                  </Link>
                </motion.div>


                <motion.div
                  whileHover={{ scale: 1.05, x: -2, y: -2 }}
                  whileTap={{ scale: 0.95, x: 2, y: 2 }}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href="/open-position"
                    className="inline-block w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-[#1800AD] bg-[#C1FF72]/80 border-4 border-[#1800AD] rounded-xl shadow-[6px_6px_0_0_#000000] transition-all hover:shadow-[8px_8px_0_0_#000000]"
                  >
                    View Positions
                  </Link>
                </motion.div>





                <motion.div
                  whileHover={{ scale: 1.05, x: -2, y: -2 }}
                  whileTap={{ scale: 0.95, x: 2, y: 2 }}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href="/leaderboard"
                    className="inline-block w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-[#1800AD] bg-[#C1FF72]/80 border-4 border-[#1800AD] rounded-xl shadow-[6px_6px_0_0_#000000] transition-all hover:shadow-[8px_8px_0_0_#000000]"
                  >
                    🏆 Leaderboard
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </section>

          {/* How It Works Section */}
          <section className="relative bg-[#0a0014]/80 backdrop-blur-xl py-12 sm:py-16 md:py-24 px-4 border-y-4 border-[#C1FF72]">
            <motion.div
              className="mx-auto max-w-6xl"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.h2
                className="text-center font-venite text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-[#C1FF72] mb-8 sm:mb-10 md:mb-12 px-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ textShadow: '3px 3px 0 #1800AD' }}
              >
                How It Works?
              </motion.h2>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    num: "1",
                    title: "Draw Your Prediction",
                    desc: "You're shown a live market chart. Draw a path or curve representing your expected price trajectory over a fixed future horizon.",
                    emoji: "✏️"
                  },
                  {
                    num: "2",
                    title: "Continuous Futures Position",
                    desc: "Your gesture is captured as a continuous curve, normalized to the chart's time and price scale, and interpolated using piecewise linear interpolation or cubic splines.",
                    emoji: "📈"
                  },
                  {
                    num: "3",
                    title: "Calculate PnL",
                    desc: "The curve is interpreted as a continuous futures position where slope and deviation from the start price determine exposure, and PnL is computed via a discrete continuous-time PnL model.",
                    emoji: "💰"
                  }
                ].map((item, i) => (
                  <motion.div
                    key={item.num}
                    className="relative p-6 sm:p-8 bg-[#1800AD]/60 border-4 border-[#C1FF72] rounded-2xl shadow-[6px_6px_0_0_#C1FF72]"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    whileHover={{
                      scale: 1.02,
                      x: -4,
                      y: -4,
                      boxShadow: '10px 10px 0 0 #C1FF72'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-5xl sm:text-6xl md:text-7xl">{item.emoji}</span>
                    </div>
                    <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-[#C1FF72]">{item.title}</h3>
                    <p className="text-sm sm:text-base text-white/80">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* CTA Section */}
          <section className="relative bg-[#1800AD]/60 backdrop-blur-xl py-12 sm:py-16 md:py-24 px-4">
            <motion.div
              className="mx-auto max-w-3xl text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <motion.h2
                className="mb-6 sm:mb-8 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-venite font-bold text-[#C1FF72] px-4"
                style={{ textShadow: '3px 3px 0 #0a0014' }}
              >
                Ready to trade convictions?
              </motion.h2>
              <p className="mb-8 sm:mb-12 text-base sm:text-lg md:text-xl text-white/80 px-4">
                Draw your prediction curve and turn your market intuition into trading decisions.
              </p>
              <motion.div
                whileHover={{ scale: 1.05, x: -3, y: -3 }}
                whileTap={{ scale: 0.95, x: 3, y: 3 }}
                className="px-4"
              >
                <Link
                  href="/predict"
                  className="inline-block px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl font-bold text-[#1800AD] bg-[#C1FF72] border-4 border-[#0a0014] rounded-xl shadow-[8px_8px_0_0_#0a0014] transition-all hover:shadow-[10px_10px_0_0_#0a0014]"
                >
                  Play Now 🚀
                </Link>
              </motion.div>
            </motion.div>
          </section>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </NoiseEffect >
  );
}
