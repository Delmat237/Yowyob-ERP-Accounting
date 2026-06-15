// components/accounting/settings/taxes-form.tsx
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { TaxeDto } from '@/src/lib2/models/TaxeDto';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface TaxeFormProps {
  initialData: Partial<TaxeDto> | null;
  onSave: (data: TaxeDto) => void;
  onCancel: () => void;
}

export const TaxeForm: React.FC<TaxeFormProps> = ({ initialData, onSave, onCancel }) => {
  const form = useForm<TaxeDto>({
    mode: 'onChange',
    defaultValues: initialData || {
      code: '',
      libelle: '',
      taux: 0,
      compte_collecte: '',
      compte_deductible: '',
      actif: true,
      pays: '',
    },
  });

  const onSubmit = (data: TaxeDto) => {
    onSave({
      ...data,
      taux: parseFloat(data.taux as any),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col rounded-lg shadow-lg bg-white overflow-hidden text-gray-700">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto rounded-none p-0 mb-8 border-b">
              <TabsTrigger
                value="general"
                className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-blue-500 py-3 font-semibold text-gray-500 data-[state=active]:text-blue-600"
              >
                GÉNÉRAL
              </TabsTrigger>
              <TabsTrigger
                value="comptabilite"
                className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-blue-500 py-3 font-semibold text-gray-500 data-[state=active]:text-blue-600"
              >
                COMPTABILITÉ ET ADV.
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  rules={{ required: "Le code est requis" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Code de la taxe <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ex: TVA18" className="font-mono uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taux"
                  rules={{
                    required: "Le taux est requis",
                    min: { value: 0, message: "Le taux doit être positif" },
                    max: { value: 100, message: "Le taux ne peut pas dépasser 100 %" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Taux (en %) <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" step="0.01" min={0} max={100} {...field} placeholder="18.00" className="pr-8" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="libelle"
                rules={{ required: "Le libellé est requis" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Désignation complète <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ex: Taxe sur la Valeur Ajoutée (Taux Normal)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="pays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Pays / Région</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ex: Cameroun (CEMAC)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="actif"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 h-[68px] bg-gray-50/50">
                      <div className="space-y-0.5">
                        <FormLabel className="font-semibold">Taxe active</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="comptabilite" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="compte_collecte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-red-600">Compte TVA Collectée</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ex: 443100" className="font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="compte_deductible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-green-600">Compte TVA Déductible</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ex: 445100" className="font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date_debut_validite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Début de validité</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_fin_validite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-400 italic font-normal">Fin de validité (Optionnel)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 border-t flex justify-end bg-gray-50 rounded-b-lg gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="font-semibold">
            ANNULER
          </Button>
          <Button
            type="submit"
            className={`${form.formState.isValid ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"} shadow-sm font-semibold px-6 text-white`}
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            <Save size={16} className="mr-2" />
            {form.formState.isSubmitting ? "Enregistrement..." : (initialData?.id ? "Enregistrer les modifications" : "Enregistrer")}
          </Button>
        </div>
      </form>
    </Form>
  );
};