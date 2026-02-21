import React, { useState } from 'react';
import { Bookmark, Plus, X, Check } from 'lucide-react';

const BUILT_IN_VIEWS = [
    { id: 'all', label: 'All' },
    { id: 'unmatched', label: 'Unmatched' },
    { id: 'refunds', label: 'Refunds' },
    { id: 'high_fees', label: 'High Fees' },
];

export default function SavedViews({ activeView, onViewChange, savedViews, onSaveView, onDeleteSavedView, currentFilters }) {
    const [saving, setSaving] = useState(false);
    const [newViewName, setNewViewName] = useState('');

    const allViews = [...BUILT_IN_VIEWS, ...savedViews.map(v => ({ id: v.id, label: v.label, custom: true }))];

    const handleSave = () => {
        const name = newViewName.trim();
        if (!name) return;
        onSaveView({ id: `custom_${Date.now()}`, label: name, filters: currentFilters });
        setNewViewName('');
        setSaving(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') { setSaving(false); setNewViewName(''); }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap" role="tablist" aria-label="Saved views">
            {allViews.map((view) => {
                const isActive = activeView === view.id;
                return (
                    <div key={view.id} className="relative flex items-center group">
                        <button
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onViewChange(view.id)}
                            className={[
                                'h-8 px-3 rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--z-bg-0)]',
                                isActive
                                    ? 'bg-[var(--z-accent)] text-black'
                                    : 'bg-[var(--z-bg-3)] text-[var(--z-text-2)] border border-[var(--z-border-1)] hover:border-[var(--z-border-2)] hover:text-[var(--z-text-1)]',
                                view.custom ? 'pr-7' : '',
                            ].join(' ')}
                        >
                            {view.label}
                        </button>
                        {view.custom && !isActive && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteSavedView(view.id); }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[var(--z-text-3)] hover:text-[var(--z-danger)] transition-all focus-visible:opacity-100 focus-visible:outline-none rounded"
                                aria-label={`Delete saved view ${view.label}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                );
            })}

            {/* Save view control */}
            {saving ? (
                <div className="flex items-center gap-1.5">
                    <input
                        autoFocus
                        type="text"
                        value={newViewName}
                        onChange={(e) => setNewViewName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="View name…"
                        className="h-8 px-3 text-sm rounded-md bg-[var(--z-bg-3)] border border-[var(--z-accent)] text-[var(--z-text-1)] placeholder:text-[var(--z-text-3)] focus:outline-none w-36"
                        aria-label="Enter saved view name"
                        maxLength={32}
                    />
                    <button
                        onClick={handleSave}
                        disabled={!newViewName.trim()}
                        className="h-8 w-8 flex items-center justify-center rounded-md bg-[var(--z-accent)] text-black hover:opacity-90 transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                        aria-label="Confirm save view"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => { setSaving(false); setNewViewName(''); }}
                        className="h-8 w-8 flex items-center justify-center rounded-md bg-[var(--z-bg-3)] border border-[var(--z-border-1)] text-[var(--z-text-3)] hover:text-[var(--z-text-1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                        aria-label="Cancel saving view"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setSaving(true)}
                    className="h-8 px-3 rounded-md text-sm font-medium flex items-center gap-1.5 text-[var(--z-text-3)] border border-dashed border-[var(--z-border-1)] hover:border-[var(--z-border-2)] hover:text-[var(--z-text-2)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
                    aria-label="Save current filters as a view"
                >
                    <Plus className="w-3 h-3" />
                    Save view
                </button>
            )}
        </div>
    );
}
