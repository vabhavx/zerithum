import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
  exit: {
    y: -10,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

export function PageTransition({ children, className }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ children, className, delay = 0 }) {
  return (
    <motion.div
      variants={itemVariants}
      className={className}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
