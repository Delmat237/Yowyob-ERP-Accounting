// components/accounting/role-assignment-view.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, UserCheck, Building2, AlertTriangle, Loader2, Lock } from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/hooks/use-auth';
import { getRoleLabel } from '@/src/lib/auth/roles';
import { EmployeesRolesService } from '@/src/lib/services/EmployeesRolesService';
import { OrganizationMember } from '@/src/lib/models/OrganizationMember';
import { toast } from 'sonner';

// Rôles comptables pris en charge par le module (pour les statistiques).
const ROLE_OPTIONS = [
    { value: 'AIDE_COMPTABLE', label: 'Aide-comptable' },
    { value: 'COMPTABLE', label: 'Comptable' },
    { value: 'RESPONSABLE_COMPTABLE', label: 'Responsable comptable' },
];

// Un membre est « comptable » si son rôle correspond à l'un des rôles ci-dessus.
const matchesRole = (roleName: string | undefined, target: string) =>
    (roleName || '').toUpperCase().includes(target);

export const RoleAssignmentView: React.FC = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Organisation du responsable connecté.
    const orgId =
        (user as any)?.organizationId ??
        (typeof window !== 'undefined' ? localStorage.getItem('organization_id') : null);
    const currentOrgName = (user as any)?.company ?? null;

    const loadMembers = useCallback(async () => {
        if (!orgId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const result = await EmployeesRolesService.getEmployees(orgId);
            setMembers(result ?? []);
        } catch (error) {
            console.error(error);
            toast.error("Impossible de charger les membres de l'organisation.");
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // Exclure soi-même de la liste (on ne gère pas son propre rôle).
    const otherMembers = members.filter((m) => m.userEmail !== user?.email);

    const roleColor = (role: string | undefined) => {
        const r = (role || '').toUpperCase();
        if (r.includes('RESPONSABLE')) return 'bg-purple-100 text-purple-800';
        if (r.includes('COMPTABLE')) return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-700';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Chargement des membres…
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Bandeau organisation */}
            {orgId && (
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-indigo-800">
                            Organisation : {currentOrgName || orgId}
                        </p>
                        <p className="text-xs text-indigo-500">
                            Membres réels de votre organisation, chargés depuis le Kernel.
                        </p>
                    </div>
                </div>
            )}

            {/* Note : modification de rôle pas encore disponible côté Kernel */}
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">
                    La modification directe du rôle d'un membre n'est pas encore prise en charge par le Kernel.
                    Pour changer un rôle, retirez puis ré-invitez le collaborateur depuis
                    {' '}<span className="font-semibold">Paramètres → Collaborateurs</span>.
                </p>
            </div>

            {/* Stats — répartition des rôles comptables */}
            <div className="flex gap-4 flex-wrap">
                {ROLE_OPTIONS.map((r) => (
                    <div key={r.value} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{r.label}:</span>
                        <strong className="text-sm">
                            {otherMembers.filter((m) => matchesRole(m.roleName, r.value)).length}
                        </strong>
                    </div>
                ))}
            </div>

            {/* Compteur */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    {otherMembers.length} membre(s) dans votre organisation
                </p>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="py-3 px-4">Membre</TableHead>
                            <TableHead className="py-3 px-4">Email</TableHead>
                            <TableHead className="py-3 px-4">Rôle actuel</TableHead>
                            <TableHead className="py-3 px-4">Agence</TableHead>
                            <TableHead className="py-3 px-4 text-right">Statut</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {otherMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-40 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <UserCheck className="h-8 w-8 text-gray-300" />
                                        <p>Aucun autre membre dans votre organisation.</p>
                                        <p className="text-xs text-gray-400">
                                            Invitez des collaborateurs depuis Paramètres → Collaborateurs.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            otherMembers.map((m) => (
                                <TableRow key={m.id} className="hover:bg-gray-50 border-b border-gray-100">
                                    <TableCell className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                                                {m.userFirstName?.[0]}{m.userLastName?.[0]}
                                            </div>
                                            <p className="font-medium text-gray-800">
                                                {`${m.userFirstName || ''} ${m.userLastName || ''}`.trim() || '—'}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-600">{m.userEmail}</TableCell>
                                    <TableCell className="py-3 px-4">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColor(m.roleName)}`}>
                                            {getRoleLabel(m.roleName) || m.roleName || '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-600">
                                        {m.agencyName || 'Toutes les agences'}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-right">
                                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                            <Lock className="h-3 w-3" /> Lecture seule
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
