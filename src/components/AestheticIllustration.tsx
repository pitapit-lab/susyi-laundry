import { motion } from 'motion/react';

export default function AestheticIllustration() {
  return (
    <div className="relative w-full aspect-square max-w-[450px] mx-auto flex items-center justify-center">
      {/* Background Soft Abstract Shapes */}
      <motion.div
        animate={{
          scale: [1, 1.05, 0.98, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-4/5 h-4/5 rounded-[40%_60%_70%_30%_/_40%_50%_60%_5%_50%] bg-purple-100/50 filter blur-xl"
      />
      
      <motion.div
        animate={{
          scale: [1, 0.95, 1.03, 1],
          rotate: [0, -4, 4, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute w-3/4 h-3/4 rounded-[50%_40%_30%_70%_/_50%_60%_40%_60%] bg-indigo-50/60 filter blur-lg"
      />

      {/* Main Illustration Canvas */}
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-md select-none"
      >
        {/* Detergent Bubble 1 */}
        <motion.circle
          cx="80"
          cy="120"
          r="16"
          stroke="rgba(112, 72, 232, 0.2)"
          strokeWidth="1.5"
          fill="rgba(243, 240, 255, 0.3)"
          animate={{
            y: [-15, 15, -15],
            x: [-5, 5, -5],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Detergent Bubble 2 */}
        <motion.circle
          cx="320"
          cy="260"
          r="22"
          stroke="rgba(112, 72, 232, 0.15)"
          strokeWidth="1.5"
          fill="rgba(243, 240, 255, 0.2)"
          animate={{
            y: [10, -20, 10],
            x: [5, -5, 5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Detergent Bubble 3 (Sparkly small) */}
        <motion.circle
          cx="280"
          cy="90"
          r="10"
          stroke="rgba(212, 175, 55, 0.3)"
          strokeWidth="1"
          fill="white"
          fillOpacity="0.4"
          animate={{
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />

        {/* Floating Clothes Rack Pole - Gold Metallic Style */}
        <line x1="60" y1="80" x2="340" y2="80" stroke="#B78A62" strokeWidth="4" strokeLinecap="round" />
        <circle cx="60" cy="80" r="5" fill="#D4AF37" />
        <circle cx="340" cy="80" r="5" fill="#D4AF37" />

        {/* Hanging Clothes 1: Linen Dress (Lilac/Mauve shade) */}
        <motion.g
          animate={{
            rotate: [-1.5, 1.5, -1.5],
            y: [-1, 1, -1]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "150px 80px" }}
        >
          {/* Wire Hanger 1 */}
          <path d="M 150 80 Q 150 95 142 102" stroke="#B78A62" strokeWidth="2.5" fill="none" />
          <path d="M 150 82 Q 150 72 153 72 Q 158 72 155 80" stroke="#B78A62" strokeWidth="2.5" fill="none" />
          <path d="M 125 110 L 150 102 L 175 110" stroke="#B78A62" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Elegant Summer Dress (Doodle Style) */}
          {/* Dress straps */}
          <line x1="130" y1="110" x2="131" y2="125" stroke="#7048E8" strokeWidth="2" />
          <line x1="170" y1="110" x2="169" y2="125" stroke="#7048E8" strokeWidth="2" />
          {/* Dress Fill with lilac gradient */}
          <path
            d="M 128 125 C 132 124, 168 124, 172 125 C 170 160, 185 240, 192 280 C 160 290, 140 290, 108 280 C 115 240, 130 160, 128 125 Z"
            fill="#E5DBFF"
            stroke="#7048E8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Elegant grid/folds on dress */}
          <path d="M 138 125 L 138 275" stroke="#D0BFFF" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 162 125 L 162 275" stroke="#D0BFFF" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 150 125 L 150 282" stroke="#7048E8" strokeWidth="1.2" strokeOpacity="0.5" />
          
          {/* Dress Waist bow / Sash (Rose Gold / Gold Soft Mauve) */}
          <path d="M 129 175 Q 150 178 171 175" stroke="#B78A62" strokeWidth="2.5" fill="none" />
          <path d="M 150 176 L 140 195 L 147 193 Z" fill="#B78A62" />
          <path d="M 150 176 L 160 195 L 153 193 Z" fill="#B78A62" />
        </motion.g>

        {/* Hanging Clothes 2: Relaxed Knit Tee (Soft Lavender/White shade) */}
        <motion.g
          animate={{
            rotate: [2, -2, 2],
            y: [1, -1, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          style={{ transformOrigin: "250px 80px" }}
        >
          {/* Wire Hanger 2 */}
          <path d="M 250 80 Q 250 95 242 102" stroke="#B78A62" strokeWidth="2.5" fill="none" />
          <path d="M 250 82 Q 250 72 253 72 Q 258 72 255 80" stroke="#B78A62" strokeWidth="2.5" fill="none" />
          <path d="M 222 110 L 250 102 L 278 110" stroke="#B78A62" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Minimal Tee Outline */}
          <path
            d="M 226 110 C 228 110, 237 114, 240 115 C 242 116, 258 116, 260 115 C 263 114, 272 110, 274 110 C 286 122, 287 132, 287 134 C 281 138, 275 140, 271 134 C 271 145, 272 195, 272 205 C 272 208, 265 210, 250 210 C 235 210, 228 208, 228 205 C 228 195, 229 145, 229 134 C 225 140, 219 138, 213 134 C 213 132, 214 122, 226 110 Z"
            fill="#FFFFFF"
            stroke="#7048E8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Clean stripes on Tee (Lavender Stripes) */}
          <path d="M 229 150 Q 250 152 271 150" stroke="#D0BFFF" strokeWidth="2" />
          <path d="M 229 166 Q 250 168 271 166" stroke="#D0BFFF" strokeWidth="2" />
          <path d="M 229 182 Q 250 184 271 182" stroke="#D0BFFF" strokeWidth="2" />
        </motion.g>

        {/* Botanical Lavender Stems - Elegant botanical ornaments */}
        <motion.g
          animate={{
            rotate: [2, -3, 2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "50px 350px" }}
        >
          {/* Lavender Stem Left */}
          <path d="M 50 350 Q 40 280, 50 200" stroke="#7048E8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Lavender Flowers Left */}
          <circle cx="50" cy="200" r="5" fill="#D0BFFF" />
          <circle cx="46" cy="195" r="4.5" fill="#7048E8" />
          <circle cx="54" cy="193" r="4" fill="#E5DBFF" />
          <circle cx="49" cy="186" r="5.5" fill="#7048E8" />
          <circle cx="44" cy="181" r="4" fill="#D0BFFF" />
          <circle cx="53" cy="178" r="4.5" fill="#E5DBFF" />
          <circle cx="48" cy="170" r="5" fill="#7048E8" />
          {/* Small leaves on stem */}
          <path d="M 44 260 Q 30 250, 34 240 Q 44 250, 45 258 Z" fill="#B78A62" fillOpacity="0.7" />
          <path d="M 47 285 Q 60 280, 56 270 Q 48 278, 47 283 Z" fill="#B78A62" fillOpacity="0.7" />
        </motion.g>

        <motion.g
          animate={{
            rotate: [-3, 3, -3],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          style={{ transformOrigin: "350px 360px" }}
        >
          {/* Lavender Stem Right */}
          <path d="M 350 360 Q 365 290, 345 220" stroke="#7048E8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Lavender Flowers Right */}
          <circle cx="345" cy="220" r="5" fill="#7048E8" />
          <circle cx="349" cy="214" r="4.5" fill="#E5DBFF" />
          <circle cx="341" cy="212" r="4" fill="#D0BFFF" />
          <circle cx="346" cy="205" r="5.5" fill="#7048E8" />
          <circle cx="351" cy="199" r="4" fill="#E5DBFF" />
          <circle cx="342" cy="196" r="4.5" fill="#D0BFFF" />
          <circle cx="346" cy="188" r="5" fill="#7048E8" />
          {/* Small leaves on stem */}
          <path d="M 358 290 Q 375 285, 372 275 Q 360 280, 357 286 Z" fill="#B78A62" fillOpacity="0.7" />
          <path d="M 355 315 Q 340 310, 342 300 Q 352 305, 355 312 Z" fill="#B78A62" fillOpacity="0.7" />
        </motion.g>

        {/* Premium Gold Sparkles (Star-like SVG shapes) */}
        <motion.g
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Gold Sparkle 1 */}
          <path d="M 100 160 L 103 167 L 110 170 L 103 173 L 100 180 L 197 173 L 190 170 L 197 167 Z" fill="#D4AF37" transform="translate(-90, -10)" />
          {/* Gold Sparkle 2 */}
          <path d="M 300 130 L 302 135 L 307 137 L 302 139 L 300 144 L 298 139 L 293 137 L 298 135 Z" fill="#D4AF37" />
        </motion.g>

        <motion.g
          animate={{
            scale: [1.2, 0.7, 1.2],
            opacity: [1, 0.4, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
        >
          {/* Gold Sparkle 3 */}
          <path d="M 180 290 L 182 294 L 186 295 L 182 296 L 180 300 L 178 296 L 174 295 L 178 294 Z" fill="#B78A62" />
        </motion.g>
      </svg>
    </div>
  );
}
