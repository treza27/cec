import React, { useState } from 'react';
import { UserCog, Mail, Phone, Shield, CreditCard as Edit2, X, Check, Users } from 'lucide-react';
import { useAllEmployees } from '../../hooks/useEmployeeProfile';
import { employeeService, Employee } from '../../services/employeeService';
import { useQueryClient } from '@tanstack/react-query';
import { employeeKeys } from '../../hooks/useEmployeeProfile';
import toast from 'react-hot-toast';

const ROLES = ['administrateur', 'commercial', 'acheteur', 'logisticien', 'tresorier'] as const;

const ROLE_LABELS: Record<string, string> = {
  administrateur: 'Administrateur',
  commercial: 'Commercial',
  acheteur: 'Acheteur',
  logisticien: 'Logisticien',
  tresorier: 'Trésorier',
};

const ROLE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  administrateur: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  commercial: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  acheteur: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  logisticien: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  tresorier: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
};

interface EditModalProps {
  employee: Employee;
  onClose: () => void;
  onSave: (userId: string, data: Partial<{ full_name: string; email: string; telephone: string; role: string; departement: string }>) => Promise<void>;
  isSaving: boolean;
}

function EditModal({ employee, onClose, onSave, isSaving }: EditModalProps) {
  const [form, setForm] = useState({
    full_name: employee.full_name || '',
    email: employee.email || '',
    telephone: employee.telephone || '',
    role: employee.role || 'acheteur',
    departement: employee.departement || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(employee.user_id, form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <UserCog className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Modifier l'employé</h3>
              <p className="text-sm text-gray-500">{employee.full_name || employee.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Nom et prénom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={form.telephone}
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="+261 XX XX XXX XX"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
              >
                {ROLES.map(role => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Département</label>
            <input
              type="text"
              value={form.departement}
              onChange={e => setForm(f => ({ ...f, departement: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Département ou service"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  const style = ROLE_STYLES[role || ''] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
  const label = (role && ROLE_LABELS[role]) ? ROLE_LABELS[role] : (role || 'Non défini');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

export default function EmployesPage() {
  const { data: employees, isLoading } = useAllEmployees();
  const queryClient = useQueryClient();
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (userId: string, data: Partial<{ full_name: string; email: string; telephone: string; role: string; departement: string }>) => {
    setIsSaving(true);
    try {
      await employeeService.updateEmployeeById(userId, data);
      await queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'all'] });
      toast.success('Employé mis à jour avec succès');
      setEditingEmployee(null);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Chargement des employés...</span>
      </div>
    );
  }

  const employeeList = employees || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <UserCog className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Employés</h2>
            <p className="text-gray-500 text-sm">Gestion des comptes et des accès</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{employeeList.length}</span>
          <span className="text-sm text-gray-500">employé{employeeList.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ROLES.map(role => {
          const count = employeeList.filter(e => e.role === role).length;
          const style = ROLE_STYLES[role];
          return (
            <div key={role} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{ROLE_LABELS[role]}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                </div>
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.bg}`}>
                  <Shield className={`w-5 h-5 ${style.text}`} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {employeeList.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">Aucun employé trouvé</p>
            <p className="text-sm mt-1">Les employés enregistrés apparaitront ici.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-3">Nom</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Téléphone</div>
              <div className="col-span-2">Rôle</div>
              <div className="col-span-1">Département</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            <div className="divide-y divide-gray-50">
              {employeeList.map(emp => (
                <div key={emp.user_id} className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                  <div className="lg:col-span-3 flex items-center space-x-3">
                    {emp.profile_picture_url ? (
                      <img
                        src={emp.profile_picture_url}
                        alt={emp.full_name || ''}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
                        {(emp.full_name || emp.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{emp.full_name || <span className="text-gray-400 italic">Non défini</span>}</p>
                      <p className="text-xs text-gray-400 lg:hidden truncate">{emp.email}</p>
                    </div>
                  </div>

                  <div className="hidden lg:flex lg:col-span-3 items-center">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">{emp.email || <span className="text-gray-400 italic">Non défini</span>}</span>
                    </div>
                  </div>

                  <div className="hidden lg:flex lg:col-span-2 items-center">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{emp.telephone || <span className="text-gray-400 italic">—</span>}</span>
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex items-center">
                    <RoleBadge role={emp.role} />
                  </div>

                  <div className="hidden lg:flex lg:col-span-1 items-center">
                    <span className="text-sm text-gray-500 truncate">{emp.departement || <span className="text-gray-400 italic">—</span>}</span>
                  </div>

                  <div className="lg:col-span-1 flex items-center lg:justify-end">
                    <button
                      onClick={() => setEditingEmployee(emp)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="font-medium">Modifier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {editingEmployee && (
        <EditModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
