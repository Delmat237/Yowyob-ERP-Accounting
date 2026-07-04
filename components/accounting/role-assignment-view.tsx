// components/accounting/role-assignment-view.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, UserCheck, Building2, AlertTriangle } from 'lucide-react';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/hooks/use-auth';
import { getRoleLabel } from '@/src/lib/auth/roles';
import { toast } from 'sonner';

interface MockUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    organizationId?: string;
    company?: string;
}

const ROLE_OPTIONS = [
    { value: 'AIDE_COMPTABLE', label: 'Aide-comptable' },
    { value: 'COMPTABLE', label: 'Comptable' },
    { value: 'RESPONSABLE_COMPTABLE', label: 'Responsable comptable' },
];

export const RoleAssignmentView: React.FC = () => {
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState<MockUser[]>([]);
    const [saving, setSaving] = useState<string | null>(null);

    // Organisation du responsable connecté
    const currentOrgId = (user as any)?.organizationId ?? null;
    const currentOrgName = (user as any)?.company ?? null;

    const loadUsers = useCallback(() => {
        const stored = localStorage.getItem('mock_users');
        if (stored) {
            try {
                setAllUsers(JSON.parse(stored));
            } catch {
                setAllUsers([]);
            }
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    useAutoRefresh(loadUsers, [loadUsers]);

    // Filtrer : uniquement les utilisateurs de la même organisation, sauf soi-même
    const sameOrgUsers = allUsers.filter((u) => {
        if (u.email === user?.email) return false; // exclure soi-même
        if (!currentOrgId) return true; // si pas d'org définie, afficher tout (fallback)
        return u.organizationId === currentOrgId;
    });

    const otherOrgCount = allUsers.filter(
        (u) => u.email !== user?.email && u.organizationId !== currentOrgId && currentOrgId
    ).length;

    const handleRoleChange = (userId: string, email: string, newRole: string) => {
        if (user?.email === email) {
            toast.warning('Impossible de modifier votre propre rôle.', {
                description: 'Contactez un autre responsable pour modifier votre rôle.',
            });
            return;
        }

        setSaving(userId);
        const updated = allUsers.map((u) =>
            u.id === userId ? { ...u, role: newRole } : u
        );
        setAllUsers(updated);
        localStorage.setItem('mock_users', JSON.stringify(updated));
        setSaving(null);

        toast.success('Rôle mis à jour', {
            description: `Le rôle de ${email} a été modifié en "${getRoleLabel(newRole)}".`,
            className: "bg-green-50 border-green-200 text-green-800",
        });
    };

    const roleColor = (role: string) => {
        switch (role) {
            case 'RESPONSABLE_COMPTABLE': return 'bg-purple-100 text-purple-800';
            case 'COMPTABLE': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">

            {/* Bandeau organisation */}
            {currentOrgId && (
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-indigo-800">
                            Organisation : {currentOrgName || currentOrgId}
                        </p>
                        <p className="text-xs text-indigo-500">
                            Vous ne pouvez modifier que les rôles des utilisateurs de votre organisation.
                        </p>
                    </div>
                </div>
            )}

            {/* Avertissement si des utilisateurs d'autres orgs existent */}
            {otherOrgCount > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700">
                        {otherOrgCount} utilisateur(s) d'autres organisations sont masqués.
                    </p>
                </div>
            )}

            {/* Stats — uniquement sur les utilisateurs de la même org */}
            <div className="flex gap-4 flex-wrap">
                {ROLE_OPTIONS.map((r) => (
                    <div key={r.value} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{r.label}:</span>
                        <strong className="text-sm">{sameOrgUsers.filter(u => u.role === r.value).length}</strong>
                    </div>
                ))}
            </div>

            {/* Utilisateurs */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    {sameOrgUsers.length} utilisateur(s) dans votre organisation
                </p>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="py-3 px-4">Utilisateur</TableHead>
                            <TableHead className="py-3 px-4">Email</TableHead>
                            <TableHead className="py-3 px-4">Rôle actuel</TableHead>
                            <TableHead className="py-3 px-4">Changer le rôle</TableHead>
                            <TableHead className="py-3 px-4 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sameOrgUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-40 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <UserCheck className="h-8 w-8 text-gray-300" />
                                        <p>Aucun autre utilisateur dans votre organisation.</p>
                                        <p className="text-xs text-gray-400">
                                            Les utilisateurs apparaissent ici après inscription avec la même entreprise.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sameOrgUsers.map((u) => (
                                <TableRow key={u.id} className="hover:bg-gray-50 border-b border-gray-100">
                                    <TableCell className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                                                {u.firstName?.[0]}{u.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                                                {u.company && (
                                                    <p className="text-[10px] text-gray-400">{u.company}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-600">{u.email}</TableCell>
                                    <TableCell className="py-3 px-4">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColor(u.role)}`}>
                                            {getRoleLabel(u.role)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        <select
                                            disabled={saving === u.id}
                                            defaultValue={u.role}
                                            onChange={(e) => handleRoleChange(u.id, u.email, e.target.value)}
                                            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {ROLE_OPTIONS.map((r) => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-right">
                                        <span className="text-xs text-green-600">Modifiable</span>
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
