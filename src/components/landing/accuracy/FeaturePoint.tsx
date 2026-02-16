import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeaturePointProps {
    icon: LucideIcon;
    title: string;
    desc: string;
}

const FeaturePoint: React.FC<FeaturePointProps> = ({ icon: Icon, title, desc }) => (
    <div className="flex gap-4 group">
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all duration-300">
            <Icon className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
            <h3 className="text-white font-medium mb-1 text-base group-hover:text-emerald-400 transition-colors">{title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
        </div>
    </div>
);

export default FeaturePoint;
