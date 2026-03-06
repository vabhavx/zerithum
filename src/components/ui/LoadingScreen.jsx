import React from 'react';
import { cn } from '@/lib/utils';
import './loading-screen.css';

const LoadingScreen = ({ fullScreen = false, text = 'Loading', className }) => {
    return (
        <div
            className={cn(
                "bg-[#FDFDFD] relative overflow-hidden flex flex-col items-center justify-center",
                fullScreen ? "fixed inset-0 z-50 min-h-screen" : "w-full min-h-[40vh]",
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
            <div className="relative w-full max-w-md h-[180px] flex items-center justify-center transform scale-[0.6]">
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
            <div className="z-20 text-center mt-[-40px] space-y-3">
                <h1 className="font-mono text-lg font-bold tracking-[0.2em] text-[#111827] uppercase animate-pulse">
                    {text}
                </h1>

                {/* Progress Bar Mockup */}
                <div className="w-40 h-[2px] bg-gray-200 mx-auto mt-4 overflow-hidden relative">
                    <div className="h-full bg-[#111827] w-1/3 animate-[loader-progress_2s_ease-in-out_infinite]"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
