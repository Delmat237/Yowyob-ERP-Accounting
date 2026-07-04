"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Client } from "@/types/core";
import { Search, Plus, User, FileText, Banknote, ShoppingBasket } from "lucide-react";
import { CustomerForm } from "./customer-form";
import { getClients, createClient, updateClient, deleteClient } from "@/lib/api";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";

type ActiveView = 'profile' | 'main' | 'accounting' | 'products';

const MainInfoView = ({ client }: { client: Client }) => (
    <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Informations Principales</h3>
        <div className="space-y-4">
            <div><label className="text-sm font-medium text-gray-600">Raison sociale</label><p className="text-gray-900">{client.companyName}</p></div>
            <div><label className="text-sm font-medium text-gray-600">Code client</label><p className="text-gray-900">{client.code}</p></div>
            <div><label className="text-sm font-medium text-gray-600">Contact</label><p className="text-gray-900">{client.contactPerson || 'N/A'}</p></div>
        </div>
    </div>
);
const AccountingInfoView = ({ client }: { client: Client }) => (
    <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Informations Comptables</h3>
        <div className="space-y-4">
            <div><label className="text-sm font-medium text-gray-600">Solde actuel</label><p className={`text-lg font-semibold ${client.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{client.balance.toLocaleString('fr-FR')} FCFA</p></div>
            <div><label className="text-sm font-medium text-gray-600">Assujeti TVA</label><p className="text-gray-900">{client.isTaxable ? 'Oui' : 'Non'}</p></div>
        </div>
    </div>
);
const ProductHistoryView = ({ client }: { client: Client }) => (
    <div className="p-6"><h3 className="text-lg font-semibold mb-4 text-gray-900">Historique Produits</h3><p className="text-gray-600">Historique des achats pour {client.companyName}</p></div>
);

export function CustomerManagementView() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeView, setActiveView] = useState<ActiveView>('profile');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAndSetClients = async () => {
        setIsLoading(true);
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            console.error("Failed to fetch clients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAndSetClients();
    }, []);

    const filteredClients = useMemo(() =>
        clients.filter(client =>
            client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.code.toLowerCase().includes(searchTerm.toLowerCase())
        ), [clients, searchTerm]
    );

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setIsCreating(false);
        setActiveView('profile');
    };

    const handleAddNew = () => {
        setIsCreating(true);
        setSelectedClient(null);
        setActiveView('profile');
    };

    const handleCancelCreation = () => {
        setIsCreating(false);
        if (clients.length > 0) {
            setSelectedClient(clients[0]);
        }
    };

    const handleSaveClient = async (data: Client) => {
        try {
            if (data.id) {
                await updateClient(data.id, data);
            } else {
                await createClient(data);
            }
            await fetchAndSetClients();
            setIsCreating(false);
        } catch (error) {
            console.error("Failed to save client:", error);
        }
    };

    const handleDeleteClient = async (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
            try {
                await deleteClient(id);
                await fetchAndSetClients();
                setSelectedClient(null);
            } catch (error) {
                console.error("Failed to delete client:", error);
            }
        }
    };

    const menuItems = [
        { id: 'profile', label: 'Profil Client', icon: User },
        { id: 'main', label: 'Infos Principales', icon: FileText },
        { id: 'accounting', label: 'Infos Comptables', icon: Banknote },
        { id: 'products', label: 'Historique Produits', icon: ShoppingBasket },
    ];

    const currentView = () => {
        if (isCreating) return <CustomerForm initialData={null} onSave={handleSaveClient} onCancel={handleCancelCreation} />;
        if (selectedClient) {
            switch (activeView) {
                case 'profile': return <CustomerForm initialData={selectedClient} onSave={handleSaveClient} onDelete={handleDeleteClient} onCancel={() => { }} />;
                case 'main': return <MainInfoView client={selectedClient} />;
                case 'accounting': return <AccountingInfoView client={selectedClient} />;
                case 'products': return <ProductHistoryView client={selectedClient} />;
                default: return null;
            }
        }
        return (
            <div className="h-full flex items-center justify-center"><div className="text-center">
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client sélectionné</h3>
                <p className="text-gray-600">Sélectionnez un client dans la liste pour voir ses détails</p>
            </div></div>
        );
    };

    if (isLoading) return <CustomPageLoader message="Chargement des clients..." />;

    return (
        <div className="h-screen bg-gray-50 flex">
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <button onClick={handleAddNew} className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium">
                        <Plus size={18} /><span>Nouveau Client</span>
                    </button>
                </div>
                <nav className="flex-1 p-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        const isDisabled = !selectedClient && !isCreating;
                        return (
                            <button key={item.id} onClick={() => !isDisabled && setActiveView(item.id as ActiveView)} disabled={isDisabled} className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center space-x-3 transition-colors mb-1 ${isActive ? 'bg-blue-50 text-blue-700 border border-blue-200' : isDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}>
                                <Icon size={18} /><span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Rechercher un client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredClients.map((client) => (
                            <div key={client.id} onClick={() => handleSelectClient(client)} className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedClient?.id === client.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-medium text-gray-900 truncate pr-2">{client.companyName}</h3>
                                    {!client.isActive && (<span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">Inactif</span>)}
                                </div>
                                <p className="text-sm text-gray-600">{client.code}</p>
                                <p className="text-xs text-gray-500 mt-1">{client.contactPerson}</p>
                            </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-white">
                {currentView()}
            </div>
        </div>
    );
}