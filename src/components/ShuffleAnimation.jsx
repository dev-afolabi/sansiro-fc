import { motion } from "framer-motion";

export default function ShuffleAnimation() {
  return (
    <div className="grid place-items-center py-20 bg-surface">
      <motion.div
        className="h-20 w-20 rounded-xl bg-ink"
        animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5 }}
      />
      <p className="mt-3 text-sm text-ink-secondary">Shuffling teams...</p>
    </div>
  );
}
