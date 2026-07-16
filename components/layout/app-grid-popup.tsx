"use client";

// components/layout/app-grid-popup.tsx
// Lanceur d'applications (« gaufre ») du header : ouvre une grille des plateformes
// YowYob/KSM. Porté depuis KSM (src/presentation/components/AppGridPopup.tsx).
// Les liens s'appuient sur `PlatformService.url` (placeholder tant qu'absent).

import { useState, useRef, useEffect } from "react";
import { PLATFORM_SERVICES, PlatformService } from "@/lib/services-registry";

/* ─── Tracés de forme contextuels par icône de service ─── */
const SHAPE_PATHS: Record<PlatformService["iconShape"], string> = {
    box: "M5 8l7-4 7 4v8l-7 4-7-4V8z M12 4v16 M5 8l7 4 19 8",
    car: "M3 17l1.5-6h13l1.5 6M3 17h18M7 17v1m10-1v1M7 11h10",
    graduation: "M12 4L2 9l10 5 10-5-10-5zM2 14l10 5 10-5M7 11.5v5",
    book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z",
    key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3",
    bus: "M8 6v6M16 6v6M2 12h20M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zM6 18v2M18 18v2",
    truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
    flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
    taxi: "M5 17H3v-7l2-4h14l2 4v7h-2M5 17v3m14-3v3M9 9h6M3 14h18M9 17h6",
    card: "M1 4h22v16H1zM1 10h22",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    brush: "M20.84 4.61a5.5 5.5 0 00-7.78 0L3 14.67V21h6.33l10.06-10.06a5.5 5.5 0 000-7.77zM16 7l1 1",
};

function ServiceLogo({ service, size = 38 }: { service: PlatformService; size?: number }) {
    const shape = SHAPE_PATHS[service.iconShape];
    const fontSize = size * 0.28;
    const iconSize = size * 0.38;

    return (
        <div style={{
            width: size, height: size, borderRadius: size * 0.28,
            background: `linear-gradient(135deg, ${service.color}ee, ${service.color}bb)`,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#fff", flexShrink: 0,
            boxShadow: `0 4px 14px ${service.color}55`,
            position: "relative", overflow: "hidden",
            gap: 1,
        }}>
            {/* filigrane de forme discret */}
            <svg
                width={iconSize} height={iconSize}
                viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.35)" strokeWidth={2.2}
                strokeLinecap="round" strokeLinejoin="round"
                style={{ position: "absolute", bottom: 2, right: 2 }}
            >
                <path d={shape} />
            </svg>
            {/* initiales sur 2 lettres */}
            <span style={{
                fontWeight: 900, fontSize, letterSpacing: "-0.04em",
                lineHeight: 1, position: "relative", zIndex: 1,
                fontFamily: "'Roboto', sans-serif",
            }}>{service.initials}</span>
        </div>
    );
}

export function AppGridPopup() {
    const [open, setOpen] = useState(false);
    const [tooltip, setTooltip] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative", zIndex: 1000 }}>
            {/* keyframes locales (ouverture du popup) */}
            <style>{`@keyframes ksmAppGridScaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>

            {/* ── bouton 9 points ── */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-label="Plateformes YowYob"
                title="Plateformes YowYob"
                style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: "none",
                    background: open ? "rgba(26,115,232,0.10)" : "transparent",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 4px)",
                    gridTemplateRows: "repeat(3, 4px)",
                    gap: 3,
                    placeContent: "center",
                    placeItems: "center",
                    transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "rgba(26,115,232,0.10)"; }}
                onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
            >
                {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#5f6368" }} />
                ))}
            </button>

            {/* ── popup ── */}
            {open && (
                <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 262,
                    maxHeight: 480,
                    overflowY: "auto",
                    background: "rgba(255,255,255,0.98)",
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
                    padding: "16px 12px 12px",
                    zIndex: 1001,
                    animation: "ksmAppGridScaleIn 0.18s ease forwards",
                    transformOrigin: "top right",
                }}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 4,
                    }}>
                        {PLATFORM_SERVICES.map((service, index) => (
                            <a
                                key={service.id}
                                href={service.url ?? "#"}
                                target={service.url ? "_blank" : undefined}
                                rel={service.url ? "noopener noreferrer" : undefined}
                                onClick={(e) => { if (!service.url) e.preventDefault(); }}
                                onMouseEnter={() => setTooltip(service.id)}
                                onMouseLeave={() => setTooltip(null)}
                                style={{
                                    display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center",
                                    padding: "10px 4px",
                                    borderRadius: 10,
                                    textDecoration: "none",
                                    transition: "background 0.15s, transform 0.15s",
                                    cursor: "pointer",
                                    position: "relative",
                                    background: tooltip === service.id ? "#f1f5f9" : "transparent",
                                    transform: tooltip === service.id ? "translateY(-2px)" : "translateY(0)",
                                }}
                            >
                                <ServiceLogo service={service} size={38} />
                                {tooltip === service.id && (
                                    <div style={{
                                        position: "absolute",
                                        ...(index < 3
                                            ? { top: "calc(100% + 6px)", bottom: "auto" }
                                            : { bottom: "calc(100% + 6px)", top: "auto" }),
                                        left: "50%", transform: "translateX(-50%)",
                                        background: "#202124",
                                        color: "#fff",
                                        fontSize: 10, fontWeight: 600,
                                        padding: "4px 8px",
                                        borderRadius: 6,
                                        whiteSpace: "nowrap",
                                        pointerEvents: "none",
                                        zIndex: 1100,
                                    }}>
                                        {service.name}
                                    </div>
                                )}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AppGridPopup;
