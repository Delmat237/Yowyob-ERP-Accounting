"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Minus, Maximize2, Minimize2, GripVertical } from "lucide-react";

export type FloatingModalSize = "default" | "large" | "fullscreen";

interface FloatingModalProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    defaultSize?: FloatingModalSize;
    /** Initial position - defaults to bottom-right */
    initialPosition?: { x: number; y: number };
    accentColor?: string; // Tailwind bg class, e.g. "bg-primary"
}

const SIZE_CONFIG: Record<FloatingModalSize, { width: string; maxHeight: string }> = {
    default: { width: "w-[480px]", maxHeight: "max-h-[600px]" },
    large: { width: "w-[640px]", maxHeight: "max-h-[700px]" },
    fullscreen: { width: "w-[calc(100vw-2rem)]", maxHeight: "max-h-[calc(100vh-2rem)]" },
};

export function FloatingModal({
    title,
    subtitle,
    icon,
    onClose,
    children,
    footer,
    defaultSize = "default",
    initialPosition,
    accentColor = "bg-blue-600",
}: FloatingModalProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [size, setSize] = useState<FloatingModalSize>(defaultSize);
    const [position, setPosition] = useState(() => {
        if (initialPosition) return initialPosition;
        if (typeof window !== "undefined") {
            return {
                x: window.innerWidth - 500,
                y: window.innerHeight - 640,
            };
        }
        return { x: 20, y: 20 };
    });

    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const isFullscreen = size === "fullscreen";

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (isFullscreen) return;
            isDragging.current = true;
            dragStart.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        },
        [position, isFullscreen]
    );

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragStart.current.x));
            const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragStart.current.y));
            setPosition({ x: newX, y: newY });
        };
        const onMouseUp = () => {
            isDragging.current = false;
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    function cycleSize() {
        if (size === "default") setSize("large");
        else if (size === "large") setSize("fullscreen");
        else setSize("default");
    }

    const sizeConfig = SIZE_CONFIG[size];

    let style: React.CSSProperties;
    if (isMinimized) {
        if (isFullscreen) {
            style = { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50 };
        } else {
            style = { position: "fixed", bottom: 0, left: position.x, zIndex: 50 };
        }
    } else if (isFullscreen) {
        style = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 };
    } else {
        style = { position: "fixed", left: position.x, top: position.y, zIndex: 50 };
    }

    let containerClass = "flex flex-col border border-border shadow-2xl overflow-hidden bg-card select-none";
    if (isMinimized) {
        if (isFullscreen) {
            containerClass += " w-full rounded-none bg-transparent";
        } else {
            containerClass += ` ${sizeConfig.width} rounded-t-xl rounded-b-none border-b-0`;
        }
    } else if (isFullscreen) {
        containerClass += " w-full h-full rounded-none";
    } else {
        containerClass += ` ${sizeConfig.width} rounded-2xl`;
    }

    return (
        <div ref={containerRef} style={style} className={containerClass}>
            {/* ── Title bar (draggable) ────────────────────────────────── */}
            <div
                className={`${accentColor} flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing flex-shrink-0`}
                onMouseDown={onMouseDown}
            >
                <GripVertical className="h-4 w-4 text-white/50 flex-shrink-0 cursor-grab" />
                {icon && <div className="text-white/90 flex-shrink-0">{icon}</div>}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate leading-tight">{title}</p>
                    {subtitle && !isMinimized && (
                        <p className="text-[10px] text-white/70 truncate">{subtitle}</p>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                    {/* Minimize */}
                    <button
                        onClick={() => setIsMinimized((p) => !p)}
                        className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                        title={isMinimized ? "Restaurer" : "Réduire"}
                    >
                        <Minus className="h-3.5 w-3.5" />
                    </button>

                    {/* Maximize / restore */}
                    <button
                        onClick={cycleSize}
                        className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                        title={size === "fullscreen" ? "Restaurer la taille" : "Agrandir"}
                    >
                        {size === "fullscreen" ? (
                            <Minimize2 className="h-3.5 w-3.5" />
                        ) : (
                            <Maximize2 className="h-3.5 w-3.5" />
                        )}
                    </button>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                        title="Fermer"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────── */}
            {!isMinimized && (
                <>
                    <div
                        className={`overflow-y-auto flex-1 ${!isFullscreen ? sizeConfig.maxHeight : ""}`}
                        style={{ cursor: "default" }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {children}
                    </div>

                    {/* ── Footer ────────────────────────────────────────── */}
                    {footer && (
                        <div
                            className="flex-shrink-0 border-t border-border"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            {footer}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
