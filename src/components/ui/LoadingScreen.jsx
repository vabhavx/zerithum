import React from 'react';
import { cn } from '@/lib/utils';
import './loading-screen.css';

const LoadingScreen = ({ fullScreen = false, text = 'Loading', className }) => {
    return (
        <div
            className={cn(
                "bg-background relative overflow-hidden flex flex-col items-center justify-center",
                fullScreen ? "fixed inset-0 z-50 min-h-screen" : "w-full min-h-[50vh]",
                className
            )}
        >
            {/* Background Texture */}
            <div className="absolute inset-0 noise-bg pointer-events-none"></div>

            {/* Long Fazers Background */}
            <div className="longfazers">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>

            {/* Loader Component Container */}
            <div className="relative w-full max-w-2xl h-[400px] flex items-center justify-center">
                <div className="z-loader">
                    <span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                    <div className="z-base">
                        <span></span>
                        <div className="z-face"></div>
                    </div>
                </div>
            </div>

            {/* Content Overlay */}
            <div className="z-20 text-center mt-[-100px] space-y-4">
                <h1 className="font-mono text-2xl font-bold tracking-widest text-foreground uppercase animate-pulse">
                    {text}
                </h1>

                {/* Progress Bar Mockup */}
                <div className="w-64 h-1 bg-muted rounded-full mx-auto mt-8 overflow-hidden relative">
                    <div className="h-full bg-foreground w-1/3 animate-[loader-progress_2s_ease-in-out_infinite]"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
