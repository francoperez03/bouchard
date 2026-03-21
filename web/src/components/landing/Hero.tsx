import { motion } from "motion/react";
import { ArrowUpRight, Github } from "lucide-react";
import { BlurText } from "./BlurText";
import { SectionBadge } from "./SectionBadge";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative h-[1000px] w-full overflow-hidden bg-black"
    >
      {/* Background video */}
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src="/arena-demo.mov"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 z-0 bg-black/40" />

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 z-[1] h-[300px] bg-gradient-to-b from-transparent to-black" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <SectionBadge tag="e-puck" label="Webots + Claude AI" />

        <BlurText
          text="Bouchard"
          className="mt-8 justify-center font-heading text-6xl italic tracking-[-4px] text-white leading-[0.8] md:text-7xl lg:text-[5.5rem]"
          delay={0.15}
        />

        <motion.p
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-4 font-body text-sm font-medium uppercase tracking-[0.3em] text-white/60"
        >
          AI navigates the unknown
        </motion.p>

        <motion.p
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-6 font-body text-lg font-light text-white/80"
        >
          Autonomous robot that learns to navigate terrain with AI.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-4 max-w-xl font-body text-sm font-light leading-relaxed text-white/50"
        >
          An e-puck with 8 sensors, real-time map, and Claude as
          strategic co-pilot. Two layers of intelligence: instant
          reflexes + AI planning.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="mt-8 flex items-center gap-4"
        >
          <a
            href="/status"
            className="liquid-glass-strong flex items-center gap-2 rounded-full px-6 py-3 font-body text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            View Dashboard
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/francoperez03/bouchard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-body text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </motion.div>
      </div>
    </section>
  );
}
