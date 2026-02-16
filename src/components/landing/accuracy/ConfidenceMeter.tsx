import React from 'react';
import { motion } from 'framer-motion';

interface ConfidenceMeterProps {
    value: number;
}

const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ value }) => {
    // Determine color based on value
    const colorClass = value > 90 ? 'bg-emerald-500' : value > 50 ? 'bg-amber-500' : 'bg-rose-500';

    return (
        <div className="flex items-center gap-2 w-24 group/meter cursor-help" title={`Confidence Score: ${value}%`}>
            <div className="flex-1 h-1 bg-zinc-800 rounded-sm overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${value}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full ${colorClass}`}
                />
            </div>
            <span className="text-[9px] text-zinc-500 font-mono w-6 text-right opacity-70 group-hover/meter:opacity-100 transition-opacity">{value}%</span>
        </div>
    );
};

export default ConfidenceMeter;
