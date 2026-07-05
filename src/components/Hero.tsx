import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, Droplets, Leaf } from 'lucide-react';
import AestheticIllustration from './AestheticIllustration';
import { GoldSparkle, LavenderGlow } from './Decorations';
import { WebInfo } from '../utils/database';

interface HeroProps {
  onOpenBooking: () => void;
  webInfo?: WebInfo;
}

export default function Hero({ onOpenBooking, webInfo }: HeroProps) {
  const promoText = webInfo && webInfo.promoText ? webInfo.promoText : 'Laundry berkualitas dengan harga terjangkau. Hasil cucian bersih, wangi, dan rapi, tersedia layanan Express 1 Hari, serta layanan antar-jemput gratis dalam radius 2 km. Praktis, cepat, dan terpercaya untuk kebutuhan laundry Anda.';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 18 },
    },
  };

  const handleScrollToPricing = () => {
    const el = document.getElementById('harga');
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-[95vh] pt-24 md:pt-32 pb-16 flex items-center justify-center overflow-hidden bg-gradient-to-tr from-purple-50/70 via-indigo-50/30 to-white"
    >
      {/* Decorative Blur Glows */}
      <LavenderGlow className="top-10 left-[10%] w-[400px] h-[400px] bg-purple-200/40" />
      <LavenderGlow className="bottom-20 right-[5%] w-[450px] h-[450px] bg-lavender-accent/30" />

      {/* Decorative Floating Sparkles */}
      <GoldSparkle className="top-[18%] left-[8%] md:left-[15%]" delay={0.2} />
      <GoldSparkle className="top-[45%] right-[10%] md:right-[48%] !w-4 !h-4" delay={1.4} />
      <GoldSparkle className="bottom-[15%] left-[20%] md:left-[45%] !w-6 !h-6" delay={2.3} />

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
        {/* Left side text blocks */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 flex flex-col items-start text-left"
        >
          {/* Tagline / Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-purple-100/80 shadow-sm mb-6"
          >
            <span className="flex h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
            <span className="font-sans text-xs font-semibold tracking-wider uppercase text-purple-700">
              # SOLUSI LAUNDRY RAPI & WANGI
            </span>
          </motion.div>

          {/* Title - Playfair Display with luxurious look and purple gradient */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.121] text-slate-aesthetic font-bold mb-6"
          >
            Laundry Wangi &amp; Rapi 
            <br />
            <span className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-500 bg-clip-text text-transparent">
              | Tanpa Ribet
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="font-sans text-base md:text-lg text-slate-500/90 leading-relaxed max-w-xl mb-10"
          >
            {promoText}
          </motion.p>

          {/* Action buttons (Gold CTA and Ghost secondary) */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10"
          >
            {/* CTA Pesan Sekarang */}
            <button
              onClick={() => {
                const el = document.getElementById('pesan-form');
                if (el) {
                  const offset = 80;
                  const bodyRect = document.body.getBoundingClientRect().top;
                  const elementRect = el.getBoundingClientRect().top;
                  window.scrollTo({
                    top: elementRect - bodyRect - offset,
                    behavior: 'smooth',
                  });
                }
              }}
              className="group cursor-pointer text-center px-8 py-4 bg-[#B78A62] hover:bg-[#A3754C] text-white rounded-2xl font-serif text-base tracking-wide shadow-[0_4px_20px_-4px_rgba(183,138,98,0.4)] hover:shadow-[0_8px_30px_-4px_rgba(183,138,98,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="flex items-center justify-center gap-2 font-medium">
                Pesan Sekarang
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            {/* Ghost secondary Button */}
            <button
              onClick={handleScrollToPricing}
              className="text-center px-8 py-4 bg-white/40 hover:bg-white/90 border border-purple-100 text-slate-aesthetic rounded-2xl font-sans text-sm font-medium tracking-wide shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              Lihat Daftar Harga
            </button>
          </motion.div>

          {/* Key Value Propositions */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-6 pt-6 border-t border-purple-100/70 w-full"
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base select-none">🧼</span>
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-purple-950">
                  BERSIH
                </span>
              </div>
              <span className="font-sans text-xs text-slate-500 leading-relaxed">Cucian bersih & segar</span>
            </div>

            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base select-none">👔</span>
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-purple-950">
                  RAPI
                </span>
              </div>
              <span className="font-sans text-xs text-slate-500 leading-relaxed">Setrika rapi & licin</span>
            </div>

            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base select-none">🌸</span>
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-purple-950">
                  WANGI
                </span>
              </div>
              <span className="font-sans text-xs text-slate-500 leading-relaxed">Wangi tahan lama</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right side illustration columns */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
          className="lg:col-span-5 flex items-center justify-center py-2 relative"
        >
          <AestheticIllustration />
        </motion.div>
      </div>
    </section>
  );
}
