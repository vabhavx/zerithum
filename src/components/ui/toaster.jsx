import { AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Toast } from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const visible = toasts.filter((t) => t.open);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 items-end"
      style={{ pointerEvents: visible.length ? "auto" : "none" }}
    >
      <AnimatePresence mode="sync" initial={false}>
        {visible.map(({ id, title, description, variant, duration }) => (
          <Toast
            key={id}
            title={title}
            description={description}
            variant={variant}
            duration={duration}
            onClose={() => dismiss(id)}
            open
          />
        ))}
      </AnimatePresence>
    </div>
  );
}