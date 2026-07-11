"use client";

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Trash2, Plus, ChevronsUpDown, FileText, Info, Check, Layers } from 'lucide-react';
import { EcritureComptableDto } from '@/src/lib2/models/EcritureComptableDto';
import { DetailEcritureDto } from '@/src/lib2/models/DetailEcritureDto';
import { PeriodeComptableDto } from '@/src/lib2/models/PeriodeComptableDto';
import { JournalComptableDto } from '@/src/lib2/models/JournalComptableDto';
import { CompteDto } from '@/src/lib2/models/CompteDto';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AccountingJournalManagementService } from '@/src/lib2/services/AccountingJournalManagementService';
import { AccountingPeriodsService } from '@/src/lib2/services/AccountingPeriodsService';
import { AccountingComptesService } from '@/src/lib2/services/AccountingComptesService';
import { fetchWithOfflineCache } from '@/lib/offline/fetch-with-cache';
import { CG_CACHE_KEYS } from '@/lib/offline/cache-keys';
import { toast } from 'sonner';
import { AccountAutocomplete } from './account-autocomplete';
import { FileUpload } from '@/components/ui/file-upload';
import { AccountingAttachmentService } from '@/src/lib2/services/AccountingAttachmentService';
import { AnalyticalImputationDialog } from './analytical-imputation-dialog';

interface EcritureComptableDetailViewProps {
    ecriture: EcritureComptableDto | null;
    onSave: (data: EcritureComptableDto) => void;
    onDelete?: () => void;
    onValidate?: () => void;
    onBack: () => void;
}

type EcritureComptableForm = EcritureComptableDto;

const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const EcritureComptableDetailView: React.FC<EcritureComptableDetailViewProps> = ({
    ecriture,
    onSave,
    onDelete,
    onValidate,
    onBack,
}) => {
    const [journals, setJournals] = useState<{ id: string; libelle: string }[]>([]);
    const [periodes, setPeriodes] = useState<PeriodeComptableDto[]>([]);
    const [accounts, setAccounts] = useState<CompteDto[]>([]);
    const [openPeriodePopover, setOpenPeriodePopover] = useState(false);
    const [isLoadingJournals, setIsLoadingJournals] = useState(true);
    const [isLoadingPeriodes, setIsLoadingPeriodes] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<{ id: string, name: string }[]>([]);
    const [selectedLineForAnalytic, setSelectedLineForAnalytic] = useState<number | null>(null);

    useEffect(() => {
        // Populate existing attachments on load if any
        if (ecriture?.attachmentIds) {
            try {
                const parsed = typeof ecriture.attachmentIds === 'string' ? JSON.parse(ecriture.attachmentIds) : ecriture.attachmentIds;
                if (Array.isArray(parsed)) {
                    setUploadedFiles(parsed);
                }
            } catch (e) {
                console.error("Failed to parse attachmentIds", e);
            }
        } else {
            setUploadedFiles([]);
        }
    }, [ecriture?.attachmentIds]);

    const getAccountNumber = (accountId: string) => {
        const account = accounts.find(acc => acc.id === accountId || acc.noCompte === accountId);
        return account ? account.noCompte : accountId;
    };

    const getAccountId = (accountNo: string) => {
        const account = accounts.find(acc => acc.noCompte === accountNo || acc.id === accountNo);
        return account ? account.id : accountNo;
    };

    const getDefaultValues = (): EcritureComptableForm => {
        if (ecriture) {
            return {
                ...ecriture,
                detailsEcriture: ecriture.detailsEcriture?.map(d => ({
                    ...d,
                    compteComptableId: getAccountNumber(d.compteComptableId),
                    montantDebit: d.montantDebit || 0,
                    montantCredit: d.montantCredit || 0
                })) || []
            };
        }

        return {
            libelle: '',
            dateEcriture: formatDateForInput(new Date()),
            journalComptableId: '',
            periodeComptableId: '',
            montantTotalDebit: 0,
            montantTotalCredit: 0,
            validee: false,
            referenceExterne: '',
            notes: '',
            detailsEcriture: [
                {
                    compteComptableId: '',
                    libelle: '',
                    montantDebit: 0,
                    montantCredit: 0,
                    sens: 'DEBIT',
                    ecritureComptableId: ''
                } as DetailEcritureDto
            ],
        } as EcritureComptableForm;
    };

    const form = useForm<EcritureComptableForm>({
        defaultValues: getDefaultValues(),
        mode: "onChange"
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "detailsEcriture"
    });

    const detailsEcriture = form.watch('detailsEcriture');
    const liveTotalDebit = detailsEcriture?.reduce((sum, d) => sum + (Number(d.montantDebit) || 0), 0) || 0;
    const liveTotalCredit = detailsEcriture?.reduce((sum, d) => sum + (Number(d.montantCredit) || 0), 0) || 0;

    useEffect(() => {
        if (accounts.length > 0) {
            form.reset(getDefaultValues());
        }
    }, [ecriture, form, accounts]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [journalsResult, periodsResult, accountsResult] = await Promise.all([
                    fetchWithOfflineCache({
                        cacheKey: CG_CACHE_KEYS.JOURNAUX,
                        fetcher: () => AccountingJournalManagementService.getAllJournals(),
                        emptyValue: [] as JournalComptableDto[],
                    }),
                    fetchWithOfflineCache({
                        cacheKey: CG_CACHE_KEYS.PERIODES,
                        fetcher: () => AccountingPeriodsService.getAllPeriodeComptables(),
                        emptyValue: [] as PeriodeComptableDto[],
                    }),
                    fetchWithOfflineCache({
                        cacheKey: CG_CACHE_KEYS.COMPTES,
                        fetcher: () => AccountingComptesService.getAllComptes(),
                        emptyValue: [] as CompteDto[],
                    }),
                ]);

                setJournals(
                    journalsResult.data
                        .filter((j) => j.id)
                        .map((j) => ({ id: j.id!, libelle: j.libelle ?? j.id! })),
                );
                setPeriodes(periodsResult.data.filter((p) => !p.cloturee));
                setAccounts(accountsResult.data);
            } catch (error) {
                console.error("Failed to fetch dependencies:", error);
            } finally {
                setIsLoadingJournals(false);
                setIsLoadingPeriodes(false);
            }
        };
        fetchData();
    }, []);

    const onSubmit = (data: EcritureComptableForm) => {
        if (ecriture?.validee) return;

        if (liveTotalDebit !== liveTotalCredit) {
            form.setError('root', {
                type: 'manual',
                message: 'Les montants de débit et de crédit doivent être égaux.'
            });
            return;
        }

        // Validation for account existence
        const invalidAccounts = data.detailsEcriture.filter(detail => {
            if (!detail.compteComptableId) return false;
            return !accounts.some(acc => acc.noCompte === detail.compteComptableId || acc.id === detail.compteComptableId);
        });

        if (invalidAccounts.length > 0) {
            const nums = invalidAccounts.map(d => d.compteComptableId).join(', ');
            toast.error(`Le(s) compte(s) suivant(s) n'existe(nt) pas : ${nums}`);
            return;
        }

        // Convert numbers back to IDs before saving and include calculated totals
        const processedData = {
            ...data,
            attachmentIds: uploadedFiles.length > 0 ? (uploadedFiles as unknown as Record<string, any>) : undefined,
            montantTotalDebit: liveTotalDebit,
            montantTotalCredit: liveTotalCredit,
            detailsEcriture: data.detailsEcriture.map(d => ({
                ...d,
                compteComptableId: getAccountId(d.compteComptableId)!
            }))
        };

        onSave(processedData);
    };

    const handleUpload = async (files: File[]) => {
        setIsUploading(true);
        try {
            const newFiles: { id: string, name: string }[] = [];
            for (const file of files) {
                const res = await AccountingAttachmentService.uploadAttachment({ file });
                if (res.success && res.data) {
                    newFiles.push({ id: res.data.id, name: res.data.originalFilename });
                } else {
                    toast.error(`Échec du téléversement de ${file.name}`);
                }
            }
            if (newFiles.length > 0) {
                setUploadedFiles(prev => [...prev, ...newFiles]);
                toast.success(`${newFiles.length} fichier(s) ajouté(s)`);
            }
        } catch (err: any) {
            toast.error("Erreur lors du téléversement : " + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
    };

    const addDetailLine = () => {
        append({
            compteComptableId: '',
            libelle: '',
            montantDebit: 0,
            montantCredit: 0,
            sens: 'DEBIT',
            ecritureComptableId: ecriture?.id || ''
        } as DetailEcritureDto);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            <div className="flex justify-end items-center p-6 border-b">
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
                        {/* General Info */}
                        <div className="bg-blue-50/40 p-6 rounded-2xl border border-blue-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-blue-100 pb-4">
                                <div className="bg-blue-600 p-2 rounded-lg text-white">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-blue-900 uppercase tracking-tight">Informations Générales</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <FormField
                                    control={form.control}
                                    name="libelle"
                                    rules={{ required: "Le libellé est obligatoire" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-blue-900">Libellé de l'Écriture <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ex: Achat de fournitures" className="bg-white border-blue-200 focus:ring-blue-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dateEcriture"
                                    rules={{ required: "La date est obligatoire" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-blue-900">Date de l'Écriture <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="bg-white border-blue-200 focus:ring-blue-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="journalComptableId"
                                    rules={{ required: "Veuillez sélectionner un journal" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-blue-900">Journal <span className="text-red-500">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={isLoadingJournals}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
                                                        <SelectValue placeholder={isLoadingJournals ? "Chargement..." : "Choisir un journal"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {journals.map((journal) => (
                                                        <SelectItem key={journal.id} value={journal.id}>{journal.libelle}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="periodeComptableId"
                                    rules={{ required: "Veuillez sélectionner une période" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-blue-900">Période <span className="text-red-500">*</span></FormLabel>
                                            <Popover open={openPeriodePopover} onOpenChange={setOpenPeriodePopover}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn("w-full justify-between bg-white border-blue-200", !field.value && "text-muted-foreground")}
                                                            disabled={isLoadingPeriodes}
                                                        >
                                                            {field.value ? periodes.find(p => p.id === field.value)?.code : isLoadingPeriodes ? "Chargement..." : "Sélectionner une période"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Chercher une période..." className="border-none focus:ring-0" />
                                                        <CommandList>
                                                            <CommandEmpty>Aucune période.</CommandEmpty>
                                                            <CommandGroup>
                                                                {periodes.map((p) => (
                                                                    <CommandItem
                                                                        key={p.id!}
                                                                        value={p.code}
                                                                        onSelect={() => { form.setValue("periodeComptableId", p.id!); setOpenPeriodePopover(false); }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", p.id === field.value ? "opacity-100" : "opacity-0")} />
                                                                        {p.code}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Detail Entries Section */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
                                    <h3 className="text-xl font-bold text-gray-800">Détails de l'Écriture</h3>
                                </div>
                                {!ecriture?.validee && (
                                    <Button variant="outline" size="sm" onClick={addDetailLine} type="button" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-semibold">
                                        <Plus className="mr-2 h-4 w-4" /> Ajouter une ligne
                                    </Button>
                                )}
                            </div>

                            <div className="bg-gray-100/80 rounded-2xl border border-gray-200 p-1 shadow-sm">
                                <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-4 text-[11px] font-black text-blue-900 uppercase tracking-widest border-b border-gray-200 bg-white/50 rounded-t-xl">
                                    <div className="col-span-3">N° Compte</div>
                                    <div className="col-span-5">Libellé de la ligne</div>
                                    <div className="col-span-2 text-right">Débit</div>
                                    <div className="col-span-2 text-right">Crédit</div>
                                </div>

                                <div className="space-y-2 p-2">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 md:p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                                            <div className="col-span-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`detailsEcriture.${index}.compteComptableId`}
                                                    rules={{ required: "Requis" }}
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-0">
                                                            <FormLabel className="md:hidden font-semibold">Compte</FormLabel>
                                                            <FormControl>
                                                                <AccountAutocomplete
                                                                    value={field.value}
                                                                    onChange={(val) => {
                                                                        field.onChange(val);
                                                                        const selectedAccount = accounts.find(a => a.id === val || a.noCompte === val);
                                                                        if (selectedAccount && selectedAccount.libelle) {
                                                                            form.setValue(`detailsEcriture.${index}.libelle`, selectedAccount.libelle, {
                                                                                shouldValidate: true,
                                                                                shouldDirty: true,
                                                                            });
                                                                        }
                                                                    }}
                                                                    accounts={accounts}
                                                                    placeholder="N° Compte"
                                                                    disabled={ecriture?.validee}
                                                                    className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-mono font-semibold"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-5">
                                                <FormField
                                                    control={form.control}
                                                    name={`detailsEcriture.${index}.libelle`}
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-0">
                                                            <FormLabel className="md:hidden font-semibold">Libellé</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="Description de l'opération"
                                                                    disabled={ecriture?.validee}
                                                                    className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`detailsEcriture.${index}.montantDebit`}
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-0">
                                                            <FormLabel className="md:hidden font-semibold text-emerald-600">Débit</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    disabled={ecriture?.validee}
                                                                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                                                    className="text-right bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-mono text-emerald-700 font-bold"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-2 relative">
                                                <FormField
                                                    control={form.control}
                                                    name={`detailsEcriture.${index}.montantCredit`}
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-0">
                                                            <FormLabel className="md:hidden font-semibold text-rose-600">Crédit</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    disabled={ecriture?.validee}
                                                                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                                                    className="text-right bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-mono text-rose-700 font-bold"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Action Row */}
                                            {!ecriture?.validee && (
                                                <div className="col-span-12 flex justify-end gap-3 pt-2 mt-2 border-t border-dashed border-gray-100">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() => setSelectedLineForAnalytic(index)}
                                                        className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 font-medium transition-colors"
                                                    >
                                                        <Layers className="h-4 w-4 mr-2" /> Ventilation Analytique
                                                    </Button>

                                                    {fields.length > 1 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            type="button"
                                                            onClick={() => remove(index)}
                                                            className="text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <FormMessage>{form.formState.errors.root?.message}</FormMessage>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 text-gray-800 mb-2">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                    <h3 className="font-bold">Informations Complémentaires</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="referenceExterne"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-blue-900 font-medium">Référence Externe</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Ex: FACT-2026-001" className="bg-gray-50 border-gray-200 focus:bg-white" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-blue-900 font-medium">Notes Internes</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Remarques éventuelles..." className="bg-gray-50 border-gray-200 focus:bg-white" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* File Upload Section */}
                                <div className="pt-4 border-t border-gray-100">
                                    <FormLabel className="text-blue-900 font-medium block mb-3">Pièces Jointes (Factures, Reçus, etc.)</FormLabel>
                                    <FileUpload
                                        onUpload={handleUpload}
                                        isUploading={isUploading}
                                        uploadedFiles={uploadedFiles}
                                        onRemoveFile={!ecriture?.validee ? handleRemoveFile : undefined}
                                    />
                                </div>
                            </div>

                            {/* Totals Footer */}
                            <div className="bg-gray-900 text-white rounded-xl p-6 shadow-xl space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <Info className="text-gray-400 h-5 w-5" />
                                        <span className="text-gray-300 text-sm font-medium">L'écriture doit être équilibrée (Total Débit = Total Crédit).</span>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Débit</p>
                                            <p className={cn("text-2xl font-mono font-bold", liveTotalDebit === liveTotalCredit && liveTotalDebit > 0 ? "text-emerald-400" : "text-white")}>
                                                {liveTotalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="h-10 w-px bg-gray-700"></div>
                                        <div className="text-right">
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Crédit</p>
                                            <p className={cn("text-2xl font-mono font-bold", liveTotalDebit === liveTotalCredit && liveTotalDebit > 0 ? "text-emerald-400" : "text-white")}>
                                                {liveTotalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {liveTotalDebit !== liveTotalCredit && (
                                    <div className="text-center p-2 bg-rose-950/30 border border-rose-900/50 rounded text-rose-300 text-xs font-medium animate-pulse">
                                        Déséquilibre de {(Math.abs(liveTotalDebit - liveTotalCredit)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                        <Button variant="outline" onClick={onBack} type="button">
                            Fermer
                        </Button>
                        {!ecriture?.validee && (
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting || liveTotalDebit !== liveTotalCredit || liveTotalDebit === 0}
                                className={cn(
                                    "text-white min-w-[150px] transition-all duration-300",
                                    (liveTotalDebit === liveTotalCredit && liveTotalDebit > 0)
                                        ? "bg-blue-600 hover:bg-blue-700 shadow-md"
                                        : "bg-gray-400 cursor-not-allowed grayscale"
                                )}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Enregistrer
                            </Button>
                        )}
                    </div>
                </form>
            </Form>

            {/* Analytical Imputation Dialog Hook */}
            {selectedLineForAnalytic !== null && (
                <AnalyticalImputationDialog
                    isOpen={selectedLineForAnalytic !== null}
                    onClose={() => setSelectedLineForAnalytic(null)}
                    onConfirm={(imputations) => {
                        toast.success("Ventilation analytique enregistrée localement.");
                        setSelectedLineForAnalytic(null);
                    }}
                    totalAmount={detailsEcriture[selectedLineForAnalytic]?.montantDebit || detailsEcriture[selectedLineForAnalytic]?.montantCredit || 0}
                />
            )}
        </div>
    );
};
