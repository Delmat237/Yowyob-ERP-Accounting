"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Loader2, 
  UserPlus, 
  Trash2, 
  Mail, 
  Building2, 
  ShieldAlert, 
  UserCheck, 
  UserX,
  Search,
  Calendar,
  KeyRound,
  Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomPageLoader } from "@/components/ui/custom-page-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { EmployeesRolesService } from "@/src/lib/services/EmployeesRolesService";
import { AgenciesService } from "@/src/lib/services/AgenciesService";
import { AuthenticationService } from "@/src/lib/services/AuthenticationService";
import { OrganizationMember } from "@/src/lib/models/OrganizationMember";
import { Role } from "@/src/lib/models/Role";
import { Agency } from "@/src/lib/models/Agency";
import { getRoleLabel } from "@/src/lib/auth/roles";

export default function UsersSettingsPage() {
  const { user } = useAuth();
  
  // States
  const [employees, setEmployees] = useState<OrganizationMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog / Form States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    roleId: "",
    agencyId: "none", // "none" represents no agency scope
  });

  const orgId = user?.organizationId || (typeof window !== 'undefined' ? localStorage.getItem('organization_id') : null);

  useEffect(() => {
    if (orgId) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [orgId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!orgId) return;

      // La liste des membres est la donnée critique de la page. Les rôles et
      // les agences ne servent qu'à la modale d'invitation : on les charge en
      // "best-effort" pour qu'un échec (ex. 403 si l'utilisateur n'est pas
      // Owner) ne masque pas la liste des collaborateurs.
      const [membersResult, rolesResult, agenciesResult] = await Promise.allSettled([
        EmployeesRolesService.getEmployees(orgId),
        EmployeesRolesService.getRoles(),
        AgenciesService.getAgencies(orgId)
      ]);

      if (membersResult.status === "fulfilled") {
        setEmployees(membersResult.value || []);
      } else {
        console.error(membersResult.reason);
        toast.error("Impossible de charger les données des collaborateurs.");
      }

      if (rolesResult.status === "fulfilled") {
        setRoles(rolesResult.value || []);
      } else {
        console.warn("Chargement des rôles échoué:", rolesResult.reason);
      }

      if (agenciesResult.status === "fulfilled") {
        setAgencies(agenciesResult.value || []);
      } else {
        console.warn("Chargement des agences échoué:", agenciesResult.reason);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error("ID de l'organisation manquant.");
      return;
    }

    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password || !formData.roleId) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Étape 1 : créer le compte utilisateur dans le Kernel (idempotent : 409 ignoré).
      // L'inscription passe par le proxy /api/kernel/auth/register qui relaie au Kernel.
      try {
        await AuthenticationService.register({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        });
      } catch (err: any) {
        // 409 = l'utilisateur existe déjà dans le Kernel → on peut quand même l'inviter.
        const status = err?.status ?? err?.response?.status;
        if (status !== 409) {
          // Toute autre erreur : on signale et on arrête.
          throw new Error(
            err?.body?.message || err?.message ||
            "Impossible de créer le compte utilisateur. Vérifiez les informations saisies."
          );
        }
      }

      // Étape 2 : rattacher l'utilisateur à l'organisation avec son rôle.
      await EmployeesRolesService.inviteEmployee(orgId, {
        email: formData.email,
        roleId: formData.roleId,
        agencyId: formData.agencyId === "none" ? undefined : formData.agencyId,
        permissions: [],
      });

      toast.success("Collaborateur créé et invité avec succès.");
      setIsInviteOpen(false);

      setFormData({ email: "", firstName: "", lastName: "", password: "", roleId: "", agencyId: "none" });
      loadData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Échec de l'invitation du collaborateur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveEmployee = async (membershipId: string, email: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${email} de l'organisation ?`)) {
      return;
    }

    try {
      await EmployeesRolesService.removeEmployee(membershipId);
      toast.success("Collaborateur retiré avec succès.");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de retirer ce collaborateur.");
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.userFirstName || ""} ${emp.userLastName || ""}`.toLowerCase();
    const email = (emp.userEmail || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  if (isLoading) {
    return <CustomPageLoader message="Chargement des collaborateurs..." />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Gestion des Collaborateurs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Invitez des utilisateurs, attribuez-leur des rôles et configurez leurs agences de rattachement.
          </p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 h-11">
              <UserPlus className="h-4 w-4" />
              Inviter un collaborateur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-xl border-gray-100 shadow-2xl">
            <form onSubmit={handleInviteSubmit}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Inviter un nouveau membre
                </DialogTitle>
                <DialogDescription>
                  Renseignez ses informations d'authentification et ses droits d'accès au sein de l'ERP.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 py-4">
                {/* Identité */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Prénom <span className="text-red-500">*</span></Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Jean"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Nom <span className="text-red-500">*</span></Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Dupont"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Adresse Email <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jean.dupont@ksm.dev"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="pl-9 rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Mot de passe initial */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Mot de Passe Initial <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="pl-9 rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Un compte est créé dans le système pour cet email, puis rattaché à l'organisation.
                  </p>
                </div>

                {/* Rôle + Agence */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rôle ERP <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.roleId}
                      onValueChange={(val) => handleSelectChange("roleId", val)}
                      required
                    >
                      <SelectTrigger className="rounded-lg border-gray-200">
                        <SelectValue placeholder="Choisir un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id || ""}>
                            {getRoleLabel(r.name) || r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agency" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Agence de rattachement</Label>
                    <Select
                      value={formData.agencyId}
                      onValueChange={(val) => handleSelectChange("agencyId", val)}
                    >
                      <SelectTrigger className="rounded-lg border-gray-200">
                        <SelectValue placeholder="Toutes les agences" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Toutes / Aucune spécifique</SelectItem>
                        {agencies.map((a) => (
                          <SelectItem key={a.id} value={a.id || ""}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6 gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsInviteOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-lg"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Inviter le membre
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content Card */}
      <Card className="border-gray-100 shadow-sm overflow-hidden rounded-xl bg-white">
        <CardHeader className="border-b border-gray-50 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Membres Actifs ({filteredEmployees.length})</CardTitle>
              <CardDescription>Consultez la liste des personnes ayant accès à l'ERP.</CardDescription>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Rechercher par nom, email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
              <Shield className="h-12 w-12 text-gray-300" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Aucun collaborateur trouvé</p>
                <p className="text-xs text-muted-foreground mt-0.5">Essayez de reformuler votre recherche ou invitez un nouveau collaborateur.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full border-collapse">
                <TableHeader className="bg-gray-50/70">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-gray-600 text-xs py-3.5 pl-6">Collaborateur</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs py-3.5">Rôle ERP</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs py-3.5">Agence</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs py-3.5">Date de rattachement</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs py-3.5">Statut</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs py-3.5 text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => {
                    const initials = `${emp.userFirstName?.[0] || ""}${emp.userLastName?.[0] || ""}`.toUpperCase() || "?";
                    const fullName = `${emp.userFirstName || ""} ${emp.userLastName || ""}`.trim() || "Inconnu";
                    
                    return (
                      <TableRow key={emp.id} className="hover:bg-gray-50/30 transition-colors border-b border-gray-100">
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-gray-100 shadow-sm">
                              <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-gray-900 truncate max-w-[200px] text-sm">{fullName}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[220px] mt-0.5">{emp.userEmail}</span>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(emp.roleName)}`}>
                            <Shield className="h-3.5 w-3.5 shrink-0" />
                            {getRoleLabel(emp.roleName) || emp.roleName}
                          </span>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{emp.agencyName || "Toutes les agences"}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                            <span>{emp.joinedAt ? new Date(emp.joinedAt).toLocaleDateString("fr-FR") : "N/A"}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            emp.active !== false 
                              ? "bg-green-50 text-green-700 border border-green-200" 
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            {emp.active !== false ? (
                              <>
                                <UserCheck className="h-3 w-3" /> Actif
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3" /> Inactif
                              </>
                            )}
                          </span>
                        </TableCell>
                        
                        <TableCell className="py-4 text-right pr-6">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Retirer le collaborateur"
                            onClick={() => handleRemoveEmployee(emp.id || "", emp.userEmail || "")}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50/50 rounded-lg h-9 w-9 transition-colors"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper styling for roles
function getRoleBadgeClass(roleName?: string) {
  if (!roleName) return "bg-gray-100 text-gray-700";
  const name = roleName.toUpperCase();
  if (name.includes("OWNER")) return "bg-purple-50 text-purple-700 border border-purple-200";
  if (name.includes("ADMIN")) return "bg-indigo-50 text-indigo-700 border border-indigo-200";
  if (name.includes("RESPONSABLE")) return "bg-blue-50 text-blue-700 border border-blue-200";
  if (name.includes("COMPTABLE")) return "bg-sky-50 text-sky-700 border border-sky-200";
  if (name.includes("AIDE")) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  return "bg-gray-50 text-gray-700 border border-gray-200";
}
