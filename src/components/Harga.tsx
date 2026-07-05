import { motion } from 'motion/react';
import { Check, Sparkles, ArrowRight, Star, ShoppingBag } from 'lucide-react';
import { GoldSparkle } from './Decorations';
import { AdminService, AdminCategory, WebInfo } from '../utils/database';

interface HargaProps {
  onSelectPricing: (serviceName: string) => void;
  services?: AdminService[];
  categories?: AdminCategory[];
  webInfo?: WebInfo;
}

export default function Harga({ onSelectPricing, services, categories, webInfo }: HargaProps) {
  // Use database services if provided, else fall back to default list
  const activeServices = services ? services.filter(s => s.isActive) : [];
  
  const pricingCards = activeServices.length > 0 ? activeServices.map(service => {
    let icon = '👕';
    if (service.name.toLowerCase().includes('kering')) icon = '🧺';
    else if (service.name.toLowerCase().includes('setrika')) icon = '✨';
    
    // Parse description into bullet points
    const features = service.description
      ? service.description.split(/[,;\n]+/).map(f => f.trim()).filter(Boolean)
      : ['Hasil bersih & wangi', 'Steril & higienis', 'Setrika uap rapi', 'Wangi botani mewah'];

    const popular = service.category?.toLowerCase().includes('populer') || service.category?.toLowerCase().includes('laku') || service.name.toLowerCase().includes('komplit');

    return {
      title: service.name,
      price: '', // Dynamic services use interactive unit pricing
      period: 'Satuan',
      icon,
      features,
      popular,
      badgeText: service.category || 'Paling Laku',
      ctaText: `Pilih ${service.name}`
    };
  }) : [
    {
      title: 'Cuci Komplit',
      price: '',
      period: 'Satuan',
      icon: '👕',
      features: [
        'Cuci Bersih Maksimal',
        'Setrika Rapi & Licin',
        'Disetrika',
        'Wangi Tahan Lama',
        'Siap Pakai Langsung'
      ],
      popular: true,
      badgeText: 'Paling Laku',
      ctaText: 'Pilih Cuci Komplit'
    },
    {
      title: 'Cuci Kering',
      price: '',
      period: 'Satuan',
      icon: '🧺',
      features: [
        'Cuci Bersih & Higienis',
        'Pengeringan Sempurna',
        'Wangi & Lembut',
        'Bebas Kusut',
        'Siap Disetrika'
      ],
      popular: false,
      badgeText: 'Hemat',
      ctaText: 'Pilih Cuci Kering'
    },
    {
      title: 'Setrika Saja',
      price: '',
      period: 'Satuan',
      icon: '✨',
      features: [
        'Setrika Presisi',
        'Anti Kusut',
        'Rapi & Licin',
        'Aman Semua Kain',
        'Siap Pakai'
      ],
      popular: false,
      badgeText: 'Cepat',
      ctaText: 'Pilih Setrika'
    }
  ];

  // Always append Express delivery as a service card option since it's a popular add-on!
  const hasExpressCard = pricingCards.some(card => card.title.toLowerCase().includes('ekspres'));
  if (!hasExpressCard) {
    pricingCards.push({
      title: 'Laundry Ekspres 1 Hari',
      price: 'Rp 10.000',
      period: 'Biaya Tambahan',
      icon: '⚡',
      features: [
        'Selesai dalam 24 Jam',
        'Prioritas Antrean Khusus',
        'Tetap Bersih & Super Wangi',
        'Setrika Presisi & Rapih',
        'Tambahan Rp 10.000'
      ],
      popular: false,
      badgeText: 'Express',
      ctaText: 'Pilih Ekspres'
    });
  }

  const handleChoosePrice = (title: string) => {
    onSelectPricing(title);
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
  };

  return (
    <section id="layanan-harga" className="relative py-24 md:py-32 bg-gradient-to-b from-white via-purple-50/20 to-[#fdfbf7] overflow-hidden">
      <GoldSparkle className="top-[10%] right-[15%]" delay={0.5} />
      <GoldSparkle className="bottom-[8%] left-[10%] !w-4 !h-4" delay={2.1} />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
          <p className="font-sans text-xs font-semibold tracking-[0.2em] uppercase text-gold-rose mb-3">
            PILIH LAYANAN & TARIF TRANSPARAN
          </p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight text-slate-aesthetic font-bold mb-6">
            Layanan & Harga Premium
          </h2>
          <p className="font-sans text-sm md:text-base text-slate-400">
            Daftar layanan dengan tarif transparan tanpa biaya tersembunyi.
          </p>
        </div>

        {/* Pricing Cards Grid (4 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 100, damping: 15 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className={`relative flex flex-col justify-between p-7 rounded-3xl bg-white/75 backdrop-blur-md border transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_20px_40px_rgba(112,72,232,0.055)] ${
                card.popular 
                  ? 'border-purple-300 bg-gradient-to-b from-purple-50/35 via-white to-white' 
                  : 'border-purple-100/50'
              }`}
            >
              {/* Popular Badge Indicator */}
              {card.popular && (
                <span className="absolute -top-3.5 right-6 px-3.5 py-1 text-[9px] uppercase font-bold tracking-widest bg-purple-600 text-white rounded-full flex items-center gap-1 shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  {card.badgeText}
                </span>
              )}

              <div>
                {/* Micro Icon / Emoji and Title */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl shrink-0 filter drop-shadow-sm">{card.icon}</span>
                  <ShoppingBag className="w-5 h-5 text-purple-300" />
                </div>

                <h3 className="font-display text-lg font-bold text-slate-aesthetic mb-3">
                  {card.title}
                </h3>

                {/* Price Label */}
                {card.price ? (
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="font-display text-2xl md:text-3xl font-extrabold text-slate-aesthetic tracking-tight">
                      {card.price}
                    </span>
                    <span className="font-sans text-[10px] text-slate-400 capitalize">
                      {card.period}
                    </span>
                  </div>
                ) : (
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="font-sans text-[11px] font-extrabold text-[#B78A62] bg-[#B78A62]/10 px-3 py-1 rounded-lg">
                      Tarif Satuan Interaktif
                    </span>
                  </div>
                )}

                {/* Feature Bullet points */}
                <ul className="space-y-3 mb-8 border-t border-purple-50 pt-5">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-xs text-slate-500 font-sans">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card button triggers select and scrolls parent down */}
              <button
                type="button"
                onClick={() => handleChoosePrice(card.title)}
                className={`w-full py-3.5 rounded-2xl font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  card.popular
                    ? 'bg-[#B78A62] hover:bg-[#92663F] text-white shadow-sm'
                    : 'bg-purple-100/45 hover:bg-purple-100/80 text-purple-700'
                }`}
              >
                {card.ctaText}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Lower Info Disclaimer Banner */}
        <div className="mt-12 p-4.5 rounded-2xl bg-purple-50/50 border border-purple-100/50 flex items-start gap-3 max-w-3xl mx-auto">
          <div className="p-1 rounded-lg bg-white border border-purple-150 text-purple-700 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="font-sans text-xs text-slate-500 leading-relaxed">
            <strong>Catatan:</strong> Layanan antar-jemput gratis hanya berlaku untuk area dalam radius 2 km dari lokasi laundry. Untuk pelanggan di luar radius tersebut, silakan menghubungi admin guna mengetahui ketersediaan layanan serta biaya tambahan yang berlaku.
          </p>
        </div>

      </div>
    </section>
  );
}
