"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  FileText,
  Activity,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import { PlanComptableDto } from '@/src/lib2/models/PlanComptableDto';
import { CompteDto } from '@/src/lib2/models/CompteDto';
import { CustomPageLoader } from '@/components/ui/custom-page-loader';
import { AccountingPlanComptableService } from '@/src/lib2/services/AccountingPlanComptableService';
import { AccountingComptesService } from '@/src/lib2/services/AccountingComptesService';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';

// Define form-specific defaults that align with PlanComptableDto type
const defaultAccountValues: Partial<PlanComptableDto> = {
  noCompte: '',
  libelle: '',
  notes: '',
  actif: true,
};

interface AccountDetailViewProps {
  account: PlanComptableDto | null;
  onSave: (data: PlanComptableDto) => void;
  onDelete: () => void;
  onBack: () => void;
  onEdit?: () => void;
  forceEdit?: boolean;
}

export const AccountDetailView: React.FC<AccountDetailViewProps> = ({
  account,
  onSave,
  onDelete,
  onBack,
  onEdit,
  forceEdit = false,
}) => {
  const [comptesCrees, setComptesCrees] = useState<CompteDto[]>([]);
  const [isLoadingComptes, setIsLoadingComptes] = useState(false);
  const [isEditing, setIsEditing] = useState(forceEdit || !account);

  const form = useForm<PlanComptableDto>({
    defaultValues: account || defaultAccountValues as PlanComptableDto,
  });

  useEffect(() => {
    setIsEditing(forceEdit || !account);
    if (account) {
      form.reset(account);
      fetchComptesAssocies();
    }
  }, [account, forceEdit]);

  const fetchComptesAssocies = async () => {
    if (!account?.noCompte) return;
    setIsLoadingComptes(true);
    try {
      const res = await AccountingComptesService.getAllComptes();
      if (res && res.data) {
        // Filter accounts that:
        // 1. Start with the parent account number
        // 2. Have exactly 6 digits (CompteDto are 6-bit accounts)
        const filtered = res.data.filter(c =>
          c.noCompte?.startsWith(account.noCompte) &&
          c.noCompte?.length === 6
        );
        setComptesCrees(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch related accounting accounts:", error);
    } finally {
      setIsLoadingComptes(false);
    }
  };

  const onSubmit = (data: PlanComptableDto) => {
    onSave(data);
    if (account) setIsEditing(false);
  };

  if (isLoadingComptes) {
    return <CustomPageLoader message="Chargement des comptes..." />;
  }

  if (!isEditing && account) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header Info */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-blue-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900 uppercase tracking-tight">Détails du Compte</h3>
                  <p className="text-sm text-blue-600/70 font-medium font-mono">N° {account.noCompte}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={account.actif ? "success" : "secondary"} className="px-3 py-1">
                  {account.actif ? "ACTIF" : "INACTIF"}
                </Badge>
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit} className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onDelete} className="h-8 text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Libellé</p>
                <p className="text-sm font-semibold text-blue-900">{account.libelle}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Classe</p>
                <p className="text-sm font-semibold text-blue-900">{account.classe || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Type</p>
                <p className="text-sm font-semibold text-blue-900">{(account as any).type || '-'}</p>
              </div>
            </div>

            {account.notes && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Notes</p>
                <p className="text-sm text-gray-600 italic">"{account.notes}"</p>
              </div>
            )}
          </div>

          {/* Related Created Accounts Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
                <h3 className="text-xl font-bold text-gray-800 tracking-tight">Comptes comptables commençant par {account.noCompte}</h3>
              </div>
              <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                {comptesCrees.length} Compte(s) trouvé(s)
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="font-bold text-gray-700">N° Compte</TableHead>
                    <TableHead className="font-bold text-gray-700">Libellé</TableHead>
                    <TableHead className="font-bold text-gray-700">Type</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">Solde</TableHead>
                    <TableHead className="font-bold text-gray-700">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comptesCrees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Activity className="h-10 w-10 text-gray-200" />
                          <p className="font-medium">Aucun compte créé pour cette classe.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    comptesCrees.map((a) => (
                      <TableRow key={a.id} className="hover:bg-gray-50/80 transition-colors">
                        <TableCell className="font-mono font-bold text-blue-700">{a.noCompte}</TableCell>
                        <TableCell className="text-gray-900 font-medium">{a.libelle}</TableCell>
                        <TableCell className="text-gray-600 text-xs">{a.typeCompte || '-'}</TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${(a.solde || 0) < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {(a.solde || 0).toLocaleString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.actif ? "success" : "secondary"} className="px-2 py-0 text-[10px]">
                            {a.actif ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onBack} className="min-w-[100px] border-gray-300">
            Fermer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-blue-100 pb-4 mb-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white font-bold">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-blue-900 uppercase tracking-tight">
                {account?.id ? "Modifier le Compte" : "Nouveau Compte"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="noCompte"
                rules={{ required: "Le numéro de compte est requis" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-blue-900">N° Compte <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="EX: 4111"
                        className="bg-white border-blue-200 focus:ring-blue-500"
                        onChange={(e) => {
                          field.onChange(e);
                          const firstDigit = e.target.value.charAt(0);
                          if (firstDigit && !isNaN(parseInt(firstDigit))) {
                            form.setValue('classe', parseInt(firstDigit));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="libelle"
                rules={{ required: "Le libellé est requis" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-blue-900">Libellé <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="EX: Clients" className="bg-white border-blue-200 focus:ring-blue-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="classe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-blue-900">Classe</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value || ''} placeholder="Calculé auto" className="bg-gray-50 border-blue-100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actif"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 h-[68px]">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-semibold text-blue-900">Compte Actif</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-blue-900">Notes / Description</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} placeholder="Informations complémentaires..." className="bg-white border-blue-200 focus:ring-blue-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
            <Button variant="outline" type="button" onClick={account ? () => setIsEditing(false) : onBack} className="min-w-[100px]">
              Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-blue-600 hover:bg-blue-700 min-w-[150px]">
              <Save className="mr-2 h-4 w-4" />
              <span>{form.formState.isSubmitting ? "Enregistrement..." : (account?.id ? "Enregistrer les modifications" : "Enregistrer")}</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};