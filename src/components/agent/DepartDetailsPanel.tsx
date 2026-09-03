import React from 'react';
import { Ship, Truck, Package, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { DepartItem } from '../../types';
import DepartImageUpload from './DepartImageUpload';

interface DepartDetailsPanelProps {
  depart: DepartItem;
  isOpen: boolean;
  onToggle: () => void;
  isReadOnly?: boolean;
}

export default function DepartDetailsPanel({ depart, isOpen, onToggle, isReadOnly = false }: DepartDetailsPanelProps) {
  if (isReadOnly || depart.statut === 'archive') {
    return null;
  }

  return (
    <div className="relative z-10">
      <button
        onClick={onToggle}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
      >
        <Image className="w-4 h-4" />
        <span>Documents</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-[60] bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-[480px]">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
              <h5 className="text-[10px] font-bold text-gray-700 mb-1.5 flex items-center space-x-1">
                <Truck className="w-3 h-3 text-blue-600" />
                <span>Chargement</span>
              </h5>
              <DepartImageUpload
                departId={depart.id}
                imageType="chargement"
                maxImages={3}
                className="compact-mode"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
              <h5 className="text-[10px] font-bold text-gray-700 mb-1.5 flex items-center space-x-1">
                <Ship className="w-3 h-3 text-cyan-600" />
                <span>Suivi maritime</span>
              </h5>
              <DepartImageUpload
                departId={depart.id}
                imageType="suivi_maritime"
                maxImages={5}
                className="compact-mode"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
              <h5 className="text-[10px] font-bold text-gray-700 mb-1.5 flex items-center space-x-1">
                <Package className="w-3 h-3 text-green-600" />
                <span>Reception</span>
              </h5>
              <DepartImageUpload
                departId={depart.id}
                imageType="reception"
                maxImages={5}
                className="compact-mode"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
