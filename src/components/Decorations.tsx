import { motion } from 'motion/react';

export function LavenderGlow({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none -z-10 blur-3xl rounded-full opacity-35 bg-gradient-to-tr from-lavender-accent to-purple-200 ${className}`} />
  );
}

export function GoldSparkle({ delay = 0, className = "" }: { delay?: number; className?: string }) {
  return (
    <motion.svg
      initial={{ scale: 0.8, opacity: 0.3 }}
      animate={{
        scale: [0.8, 1.25, 0.8],
        opacity: [0.4, 1, 0.4],
        rotate: [0, 45, 90, 45, 0]
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`absolute w-5 h-5 text-gold-accent pointer-events-none ${className}`}
    >
      <path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        fill="currentColor"
      />
    </motion.svg>
  );
}

export function BotanicalStalk({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ rotate: -3 }}
      animate={{
        rotate: [-3, 4, -3],
        y: [-2, 2, -2]
      }}
      transition={{
        duration: 9,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
      className={`absolute pointer-events-none -z-10 opacity-30 select-none ${className}`}
    >
      <svg
        width="120"
        height="280"
        viewBox="0 0 120 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Curved Stem */}
        <path d="M 60 280 Q 45 150, 60 20" stroke="#7048E8" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Soft Leaves */}
        <path d="M 52 210 Q 25 190, 35 175 Q 50 185, 52 205 Z" fill="#b78a62" />
        <path d="M 58 230 Q 85 215, 80 198 Q 65 210, 58 225 Z" fill="#b78a62" />
        <path d="M 50 140 Q 20 125, 28 110 Q 42 120, 50 135 Z" fill="#b78a62" />
        
        {/* Lavender Flower clusters */}
        <ellipse cx="60" cy="20" rx="5" ry="7" fill="#7048E8" />
        <ellipse cx="55" cy="35" rx="6" ry="8" fill="#D0BFFF" />
        <ellipse cx="65" cy="38" rx="5" ry="7" fill="#7048E8" />
        <ellipse cx="58" cy="55" rx="7" ry="9" fill="#E5DBFF" />
        <ellipse cx="63" cy="68" rx="6" ry="8" fill="#7048E8" />
        <ellipse cx="54" cy="72" rx="5" ry="7" fill="#D0BFFF" />
        <ellipse cx="59" cy="95" rx="7" ry="9" fill="#E5DBFF" />
        <ellipse cx="64" cy="108" rx="6" ry="8" fill="#7048E8" />
      </svg>
    </motion.div>
  );
}

export function FloatingPetals() {
  const petals = Array.from({ length: 8 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {petals.map((_, i) => {
        const left = `${10 + i * 12}%`;
        const top = `${15 + (i * 23) % 70}%`;
        const duration = 12 + (i % 3) * 4;
        const delay = i * 1.5;
        
        return (
          <motion.div
            key={i}
            initial={{ y: -50, x: 0, rotate: 0, opacity: 0 }}
            animate={{
              y: ['0vh', '100vh'],
              x: [0, (i % 2 === 0 ? 40 : -40), 0],
              rotate: [0, 180, 360],
              opacity: [0, 0.4, 0.4, 0]
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: "linear",
              delay
            }}
            className="absolute text-purple-300"
            style={{ left, top: '-5vh' }}
          >
            {/* Elegant Petal SVG */}
            <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
              <path
                d="M7 0C7 0 14 7.7 14 12.1C14 16.5 10.9 22 7 22C3.1 22 0 16.5 0 12.1C0 7.7 7 0 7 0Z"
                fill="currentColor"
                opacity="0.6"
              />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}
