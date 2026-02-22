import React from "react";
import { motion } from "framer-motion";
import { Loader2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { itemVariants } from "@/components/ui/glass-card";

export default function AvailablePlatformCard({ platform, connectingId, onConnect }) {
  const Icon = platform.icon;
  const connecting = connectingId === platform.id;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      className="rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04] hover:border-white/10"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-[#101014]">
          <Icon className="h-4 w-4 text-white/70" />
        </div>
        <p className="text-sm font-medium text-[#F5F5F5]">{platform.name}</p>
      </div>

      <p className="mb-4 text-xs text-white/50 leading-relaxed min-h-[32px]">
        {platform.description}
      </p>

      <Button
        type="button"
        size="sm"
        onClick={() => onConnect(platform)}
        disabled={connecting}
        className="h-8 w-full bg-[#56C5D0]/10 text-xs font-medium text-[#56C5D0] hover:bg-[#56C5D0] hover:text-[#0A0A0A] border border-[#56C5D0]/20 hover:border-[#56C5D0] transition-all"
      >
        {connecting ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Connecting
          </>
        ) : (
          <>
            <Plug className="mr-1.5 h-3.5 w-3.5" />
            Connect
          </>
        )}
      </Button>
    </motion.div>
  );
}
