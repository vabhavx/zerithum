import { cn } from "@/lib/utils";
import {
  Terminal,
  Zap,
  DollarSign,
  Cloud,
  Network,
  HelpCircle,
  Settings,
  Heart,
} from "lucide-react";

export function FeaturesSectionWithHoverEffects({ features: customFeatures }) {
  const defaultFeatures = [
    {
      title: "Unified Dashboard",
      description:
        "All your revenue streams in one place. Connect platforms in seconds.",
      icon: <Terminal className="w-6 h-6" />,
    },
    {
      title: "Automatic Sync",
      description:
        "Revenue data syncs automatically. No manual entry required.",
      icon: <Zap className="w-6 h-6" />,
    },
    {
      title: "Smart Reconciliation",
      description:
        "AI-powered matching between platform revenue and bank deposits.",
      icon: <DollarSign className="w-6 h-6" />,
    },
    {
      title: "Real-time Alerts",
      description: "Get notified instantly about anomalies and discrepancies.",
      icon: <Cloud className="w-6 h-6" />,
    },
    {
      title: "Multi-Platform",
      description: "Connect YouTube, Patreon, Stripe, Gumroad, and more.",
      icon: <Network className="w-6 h-6" />,
    },
    {
      title: "Tax Ready Reports",
      description:
        "Export-ready reports with proper categorization for tax season.",
      icon: <Settings className="w-6 h-6" />,
    },
    {
      title: "Anomaly Detection",
      description:
        "Revenue autopsy engine identifies and analyzes revenue drops.",
      icon: <HelpCircle className="w-6 h-6" />,
    },
    {
      title: "Creator-First Design",
      description: "Built specifically for content creators and digital entrepreneurs.",
      icon: <Heart className="w-6 h-6" />,
    },
  ];

  const features = customFeatures || defaultFeatures;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-white/10",
        (index === 0 || index === 4) && "lg:border-l border-white/10",
        index < 4 && "lg:border-b border-white/10"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-white/40">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-white/10 group-hover/feature:bg-indigo-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-white">
          {title}
        </span>
      </div>
      <p className="text-sm text-white/60 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};