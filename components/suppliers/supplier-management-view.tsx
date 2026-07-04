"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Supplier } from "@/types/core";
import { Search, Plus, User, FileText, Banknote, ShoppingBasket } from "lucide-react";
import { SupplierForm } from "./supplier-form";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/lib/api";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export function SupplierManagementView({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(initialSuppliers[0] || null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const refreshSuppliers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.error("Failed to fetch suppliers:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const filteredSuppliers = useMemo(() => 
        suppliers.filter(supplier =>
            supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.code.toLowerCase().includes(searchTerm.toLowerCase())
        ), [suppliers, searchTerm]
    );

    const handleSelectSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsCreating(false);
    };
    
    const handleAddNew = () => {
        setIsCreating(true);
        setSelectedSupplier(null);
    };

    const handleCancelCreation = () => {
        setIsCreating(false);
        if (suppliers.length > 0) {
            setSelectedSupplier(suppliers[0]);
        }
    };

    const handleSaveSupplier = async (data: Supplier) => {
        try {
            if(data.id) {
                await updateSupplier(data.id, data);
            } else {
                await createSupplier(data);
            }
            await refreshSuppliers();
            setIsCreating(false);
        } catch(error) {
            console.error("Failed to save supplier:", error);
        }
    };

    const handleDeleteSupplier = async (id: string) => {
        if(window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
            try {
                await deleteSupplier(id);
                await refreshSuppliers();
                setSelectedSupplier(null);
            } catch(error) {
                console.error("Failed to delete supplier:", error);
            }
        }
    };

    if (isLoading) return <CustomPageLoader message="Chargement des fournisseurs..." />;

    return (
        <div className="h-full flex gap-4">
            <div className="w-1/3 flex flex-col gap-4">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Liste des Fournisseurs</CardTitle>
                            <Button size="sm" onClick={handleAddNew}><Plus className="h-4 w-4 mr-2" />Nouveau</Button>
                        </div>
                        <div className="relative pt-2">
                             <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <Input placeholder="Rechercher par nom ou code..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8"/>
                        </div>
                    </CardHeader>
                    <CardContent className="p-2 flex-grow overflow-y-auto">
                        {filteredSuppliers.map((supplier) => (
                                <div key={supplier.id} onClick={() => handleSelectSupplier(supplier)} 
                                className={`p-3 border-b cursor-pointer hover:bg-accent ${selectedSupplier?.id === supplier.id ? 'bg-primary/10' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold">{supplier.companyName}</p>
                                        {!supplier.isActive && <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Inactif</span>}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{supplier.code}</p>
                                </div>
                            ))}
                    </CardContent>
                </Card>
            </div>
            <div className="w-2/3">
                {isCreating ? (
                    <SupplierForm initialData={null} onSave={handleSaveSupplier} onCancel={handleCancelCreation} />
                ) : selectedSupplier ? (
                    <SupplierForm 
                        key={selectedSupplier.id}
                        initialData={selectedSupplier} 
                        onSave={handleSaveSupplier} 
                        onDelete={handleDeleteSupplier} 
                        onCancel={() => {}} 
                    />
                ) : (
                    <Card className="h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <p>Sélectionnez un fournisseur pour voir ses détails</p>
                            <p className="text-sm">ou créez-en un nouveau.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
