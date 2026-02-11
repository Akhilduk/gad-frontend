// components/ExecutiveDashboard/FloatingBubbles.jsx
import { motion } from "framer-motion";

const FloatingBubble = ({ size, color, delay, duration, left, top }) => {
  return (
    <motion.div
      className={`absolute rounded-full opacity-20 ${color}`}
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        top: `${top}%`,
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
    />
  );
};

export const FloatingBubbles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <FloatingBubble size={80} color="bg-cyan-300" delay={0} duration={8} left={10} top={20} />
      <FloatingBubble size={60} color="bg-pink-300" delay={2} duration={10} left={80} top={10} />
      <FloatingBubble size={100} color="bg-purple-300" delay={4} duration={12} left={70} top={70} />
      <FloatingBubble size={50} color="bg-indigo-300" delay={1} duration={9} left={20} top={60} />
      <FloatingBubble size={70} color="bg-indigo-300" delay={3} duration={11} left={90} top={40} />
      <FloatingBubble size={40} color="bg-teal-300" delay={5} duration={7} left={5} top={80} />
      <FloatingBubble size={90} color="bg-violet-300" delay={6} duration={13} left={85} top={15} />
      <FloatingBubble size={55} color="bg-sky-300" delay={7} duration={8} left={15} top={30} />
    </div>
  );
};