import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function SuccessConfetti({ trigger }) {
  useEffect(() => {
    if (trigger) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#8b5cf6', '#10b981']
      });
    }
  }, [trigger]);

  return null;
}