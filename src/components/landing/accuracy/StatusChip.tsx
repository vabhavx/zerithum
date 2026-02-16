import React from 'react';
import { EventStatus } from './types';

interface StatusChipProps {
    status: EventStatus;
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
    const config = {
        matched: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Match' },
        review: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Review' },
        flagged: { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'Flagged' },
    };
    const c = config[status];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold border uppercase tracking-wider ${c.color}`}>
            {c.label}
        </span>
    );
};

export default StatusChip;
