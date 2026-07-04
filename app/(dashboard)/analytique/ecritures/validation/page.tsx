"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    CheckCircle, XCircle, Search, ShieldCheck, Eye, Loader2, FileClock, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useAutoRefresh, type AutoRefreshOptions } from "@/hooks/use-auto-refresh";
import {
    listEcrituresByStatut,
    rejectEcritureAnalytique,
    validateEcritureAnalytique,
} from "@/lib/analytique/ecritures-analytiques-store";
import {
    getJournalAnalytiqueById,
    NATURES_CHARGE,
    type EcritureAnalytique,
} from "@/lib/analytique/ecriture-analytique";
import { formatMontantSigne } from "@/lib/analytique/ecriture-lignes";
import { mockCentres, mockExercicesCG } from "@/lib/analytique/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

export default function ValidationEcrituresAnalytiquesPage() {
    const [brouillons, setBrouillons] = useState<EcritureAnalytique[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<EcritureAnalytique | null>(null);
    const [validatingId, setValidatingId] = useState<string | null>(null);
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; entry: EcritureAnalytique | null }>({
        open: false,
        entry: null,
    });
    const [rejectReason, setRejectReason] = useState("");

    const loadBrouillons = useCallback(async (options?: AutoRefreshOptions) => {
        if (!options?.silent) setIsLoading(true);
        try {
            setBrouillons(listEcrituresByStatut("BROUILLON"));
        } finally {
            if (!options?.silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadBrouillons();
    }, [loadBrouillons]);

    useAutoRefresh(loadBrouillons, [loadBrouillons]);

    const filtered = brouillons.filter(
        (e) =>
            e.numeroPiece.toLowerCase().includes(search.toLowerCase()) ||
            e.libelleOperation.toLowerCase().includes(search.toLowerCase()),
    );

    const handleValidate = async (id: string) => {
        setValidatingId(id);
        try {
            validateEcritureAnalytique(id);
            await loadBrouillons({ silent: true });
            toast.success("Écriture analytique validée");
            setPreview(null);
        } finally {
            setValidatingId(null);
        }
    };

    const handleReject = () => {
        if (!rejectDialog.entry || !rejectReason.trim()) {
            toast.error("Indiquez un motif de rejet.");
            return;
        }
        rejectEcritureAnalytique(rejectDialog.entry.id, rejectReason.trim());
        void loadBrouillons({ silent: true });
        toast.success("Écriture rejetée");
        setRejectDialog({ open: false, entry: null });
        setRejectReason("");
        setPreview(null);
    };

    if (isLoading && brouillons.length === 0) {
        return <CustomPageLoader message="Chargement des écritures en brouillon..." />;
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/analytique/ecritures"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Retour aux écritures
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-7 w-7 text-emerald-600" />
                        Validation des écritures analytiques
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Toutes les écritures sont d&apos;abord en brouillon — validez-les ici avant prise en compte définitive.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                    <FileClock className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-amber-800">{brouillons.length} brouillon(s)</span>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-9"
                    placeholder="Rechercher…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N° Pièce</TableHead>
                                <TableHead>Libellé</TableHead>
                                <TableHead>Origine</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        Aucune écriture en attente de validation.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((e) => (
                                    <TableRow key={e.id}>
                                        <TableCell className="font-mono text-xs font-semibold">{e.numeroPiece}</TableCell>
                                        <TableCell>
                                            <p className="font-medium">{e.libelleOperation}</p>
                                            <p className="text-[10px] text-muted-foreground">{e.dateEffet}</p>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {e.origine === "IMPORT_CG" ? "Import comptabilité générale" : "Manuelle"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(e.montant)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => setPreview(e)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-emerald-600"
                                                    disabled={validatingId === e.id}
                                                    onClick={() => handleValidate(e.id)}
                                                >
                                                    {validatingId === e.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-rose-600"
                                                    onClick={() => setRejectDialog({ open: true, entry: e })}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
            </div>

            <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Détail écriture {preview?.numeroPiece}</DialogTitle>
                        <DialogDescription>{preview?.libelleOperation}</DialogDescription>
                    </DialogHeader>
                    {preview && (
                        <div className="space-y-2 text-sm">
                            <p><span className="text-muted-foreground">Journal :</span> {getJournalAnalytiqueById(preview.journalId)?.libelle}</p>
                            <p><span className="text-muted-foreground">Centre dest. :</span> {mockCentres.find((c) => c.id === preview.centreDestinationId)?.libelle}</p>
                            <p><span className="text-muted-foreground">Nature :</span> {NATURES_CHARGE.find((n) => n.id === preview.natureChargeId)?.libelle}</p>
                            <p><span className="text-muted-foreground">Exercice :</span> {mockExercicesCG.find((x) => x.id === preview.exerciceAnalytiqueId)?.libelle}</p>
                            <p><span className="text-muted-foreground">Montant :</span> {formatCurrency(preview.montant)}</p>
                            {preview.ligneCGRef && (
                                <p><span className="text-muted-foreground">Réf. comptabilité générale :</span> {preview.ligneCGRef}</p>
                            )}
                            {preview.lignes?.length > 0 && (
                                <div className="pt-2 border-t">
                                    <p className="text-xs font-semibold mb-1">Lignes d&apos;imputation</p>
                                    {preview.lignes.map((l, i) => (
                                        <p key={i} className="text-xs font-mono">
                                            {mockCentres.find((c) => c.id === l.centreId)?.libelle} : {formatMontantSigne(l.montant)}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreview(null)}>Fermer</Button>
                        {preview && (
                            <Button onClick={() => handleValidate(preview.id)} className="bg-emerald-600 hover:bg-emerald-700">
                                Valider
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectDialog.open} onOpenChange={(o) => !o && setRejectDialog({ open: false, entry: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeter l&apos;écriture</DialogTitle>
                        <DialogDescription>{rejectDialog.entry?.numeroPiece}</DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Motif du rejet…"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, entry: null })}>
                            Annuler
                        </Button>
                        <Button variant="destructive" onClick={handleReject}>Rejeter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
