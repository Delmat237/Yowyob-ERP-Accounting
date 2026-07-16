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

    // Vraie icône (image) si fournie : tuile blanche + logo contenu.
    // `badge` superpose une pastille colorée aux initiales pour distinguer les
    // plateformes qui partagent un même logo (accounting / billing / tp).
    if (service.iconUrl) {
        return (
            <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
                <div style={{
                    width: size, height: size, borderRadius: size * 0.28,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={service.iconUrl}
                        alt={service.name}
                        width={Math.round(size * 0.72)}
                        height={Math.round(size * 0.72)}
                        style={{ objectFit: "contain", width: size * 0.72, height: size * 0.72 }}
                    />
                </div>
                {service.badge && (
                    <span style={{
                        position: "absolute", right: -3, bottom: -3,
                        minWidth: size * 0.44, height: size * 0.44,
                        padding: "0 3px",
                        borderRadius: 999,
                        background: service.color,
                        color: "#fff",
                        fontSize: size * 0.24, fontWeight: 800, letterSpacing: "-0.03em",
                        lineHeight: 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "2px solid #fff",
                        fontFamily: "'Roboto', sans-serif",
                    }}>{service.initials}</span>
                )}
            </div>
        );
    }

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
    const [hovered, setHovered] = useState<string | null>(null);
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
            {/* keyframes + scrollbar fine du popup */}
            <style>{`
                @keyframes ksmAppGridScaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
                .ksm-appgrid-scroll{scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent;}
                .ksm-appgrid-scroll::-webkit-scrollbar{width:8px;}
                .ksm-appgrid-scroll::-webkit-scrollbar-track{background:transparent;margin:8px 0;}
                .ksm-appgrid-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px;border:2px solid transparent;background-clip:content-box;}
                .ksm-appgrid-scroll::-webkit-scrollbar-thumb:hover{background:#94a3b8;background-clip:content-box;}
            `}</style>

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

            {/* ── popup façon Google (grille claire, libellés visibles) ── */}
            {open && (
                <div className="ksm-appgrid-scroll" style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: 336,
                    maxHeight: 512,
                    overflowY: "auto",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 20,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)",
                    padding: "18px 8px 14px 12px",
                    zIndex: 1001,
                    animation: "ksmAppGridScaleIn 0.18s ease forwards",
                    transformOrigin: "top right",
                }}>
                    <div style={{
                        padding: "0 12px 12px",
                        color: "#202124",
                        fontSize: 15, fontWeight: 500,
                        fontFamily: "'Roboto', sans-serif",
                    }}>
                        Plateformes KSM
                    </div>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 2,
                    }}>
                        {PLATFORM_SERVICES.map((service) => (
                            <a
                                key={service.id}
                                href={service.url ?? "#"}
                                target={service.url ? "_blank" : undefined}
                                rel={service.url ? "noopener noreferrer" : undefined}
                                onClick={(e) => { if (!service.url) e.preventDefault(); }}
                                onMouseEnter={() => setHovered(service.id)}
                                onMouseLeave={() => setHovered(null)}
                                title={service.description ?? service.name}
                                style={{
                                    display: "flex", flexDirection: "column",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "14px 6px",
                                    borderRadius: 12,
                                    textDecoration: "none",
                                    transition: "background 0.15s",
                                    cursor: "pointer",
                                    background: hovered === service.id ? "#f1f5f9" : "transparent",
                                }}
                            >
                                <ServiceLogo service={service} size={44} />
                                <span style={{
                                    color: "#3c4043",
                                    fontSize: 12, fontWeight: 400,
                                    lineHeight: 1.2, textAlign: "center",
                                    fontFamily: "'Roboto', sans-serif",
                                    maxWidth: 88,
                                    overflow: "hidden", textOverflow: "ellipsis",
                                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                }}>
                                    {service.name}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AppGridPopup;
