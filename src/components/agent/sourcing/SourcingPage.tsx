import React, { useState } from 'react';
import { Tag, Package, Building2, Settings } from 'lucide-react';
import CategoriesManager from './CategoriesManager';
import ProduitsManager from './ProduitsManager';
import FournisseursManager from './FournisseursManager';
import SourcingParametresTab from './SourcingParametresTab';
import { useEmployeeProfileContext } from '../../../contexts/EmployeeProfileContext';

type Tab = 'produits' | 'categories' | 'fournisseurs' | 'parametres';

export default function SourcingPage() {
  const [tab, setTab] = useState<Tab>('produits');
  const { profileData } = useEmployeeProfileContext();
  const isAdmin = profileData?.role === 'administrateur';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sourcing — Catalogue</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez les catégories et les fiches produit visibles dans le catalogue public.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('produits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'produits' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          Produits
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'categories' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          Catégories
        </button>
        <button
          onClick={() => setTab('fournisseurs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'fournisseurs' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Fournisseurs
        </button>
        {isAdmin && (
          <button
            onClick={() => setTab('parametres')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'parametres' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </button>
        )}
      </div>

      {tab === 'produits' && <ProduitsManager />}
      {tab === 'categories' && <CategoriesManager />}
      {tab === 'fournisseurs' && <FournisseursManager />}
      {tab === 'parametres' && isAdmin && <SourcingParametresTab />}
    </div>
  );
}
