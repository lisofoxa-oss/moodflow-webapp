import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EmojiRainProps {
  emoji: string | null;
  triggerId: number | null;
}

export function EmojiRain({ emoji, triggerId }: EmojiRainProps) {
  const [drops, setDrops] = useState<{ id: number; left: number; duration: number }[]>([]);

  useEffect(() => {
    if (emoji && triggerId) {
      // Create 15-20 drops
      const count = 15 + Math.floor(Math.random() * 10);
      const newDrops = Array.from({ length: count }).map((_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 100, // random position 0-100%
        duration: 2 + Math.random() * 2, // random duration 2-4s
      }));
      
      setDrops(prev => [...prev, ...newDrops]);
      
      // Cleanup drops after animation
      setTimeout(() => {
        setDrops(prev => prev.filter(d => !newDrops.find(nd => nd.id === d.id)));
      }, 5000);
    }
  }, [emoji, triggerId]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {drops.map((drop) => (
          <motion.div
            key={drop.id}
            initial={{ y: -50, opacity: 1 }}
            animate={{ y: "110vh", opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: drop.duration, ease: "linear" }}
            style={{ 
              left: `${drop.left}%`,
              position: "absolute",
              fontSize: "2rem" 
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
