import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDateForApi(date: any): string {
    if (!date) return "";
    if (Array.isArray(date)) {
        const [year, month, day] = date;
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    if (date instanceof Date) return date.toISOString().split("T")[0];
    if (typeof date === "string") return date.split("T")[0];
    return String(date);
}

export function formatCurrency(amount: number, currency = "XAF"): string {
    return new Intl.NumberFormat("fr-CM", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
    }).format(amount);
}

export function formatNumber(n: number): string {
    return new Intl.NumberFormat("fr-FR").format(n);
}
