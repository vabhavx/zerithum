import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function DopamineSuccess({ title, message, children }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>

            <h3 className="text-xl font-serif font-medium text-foreground mb-2">
                {title}
            </h3>

            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                {message}
            </p>

            {children && (
                <div className="w-full">
                    {children}
                </div>
            )}
        </div>
    );
}
