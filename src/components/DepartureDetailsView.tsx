import React from 'react';
import { ArrowLeft, Ship, Calendar, Package, Weight, Truck, MapPin, Clock, FileText, Users, Box } from 'lucide-react';
import { DepartItem } from '../types';
import { getDepartureStatusLabel, getDepartureStatusColor, getDepartureProgressPercentage } from '../utils/statusHelpers';
import { useAllInventoryItems } from '../hooks/useInventory';

interface DepartureDetailsViewProps {
  depart: DepartItem;
  onBack: () => void;
}

export default function DepartureDetailsView({ depart, onBack }: DepartureDetailsViewProps) {
  const { data: allInventoryItems = [] } = useAllInventoryItems();

  // Récupérer les colis associés à ce départ
  const associatedPackages = allInventoryItems.filter(item => 
    depart.colisAssocies.includes(item.id)
  );

  // Fonction pour obtenir la couleur de fond et les styles selon le statut
  const getDepartureCardStyle = (statut: string) => {
    switch (statut) {
      case 'preparation_depart':
        return {
          bgGradient: 'from-gray-100 via-gray-50 to-white',
          borderColor: 'border-gray-300',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          progressColor: 'bg-gray-400',
          progressWidth: '10%'
        };
      case 'conteneur_charge':
        return {
          bgGradient: 'from-orange-100 via-orange-50 to-white',
          borderColor: 'border-orange-300',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          progressColor: 'bg-orange-400',
          progressWidth: '25%'
        };
      case 'depart_chine':
        return {
          bgGradient: 'from-blue-100 via-blue-50 to-white',
          borderColor: 'border-blue-300',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          progressColor: 'bg-blue-400',
          progressWidth: '40%'
        };
      case 'arrivee_toamasina':
        return {
          bgGradient: 'from-cyan-100 via-cyan-50 to-white',
          borderColor: 'border-cyan-300',
          iconBg: 'bg-cyan-100',
          iconColor: 'text-cyan-600',
          progressColor: 'bg-cyan-400',
          progressWidth: '60%'
        };
      case 'dedouanement_en_cours':
        return {
          bgGradient: 'from-purple-100 via-purple-50 to-white',
          borderColor: 'border-purple-300',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          progressColor: 'bg-purple-400',
          progressWidth: '75%'
        };
      case 'arrivee_antananarivo':
        return {
          bgGradient: 'from-indigo-100 via-indigo-50 to-white',
          borderColor: 'border-indigo-300',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          progressColor: 'bg-indigo-400',
          progressWidth: '90%'
        };
      case 'decharge_trie':
        return {
          bgGradient: 'from-green-100 via-green-50 to-white',
          borderColor: 'border-green-300',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          progressColor: 'bg-green-400',
          progressWidth: '100%'
        };
      default:
        return {
          bgGradient: 'from-gray-100 via-gray-50 to-white',
          borderColor: 'border-gray-300',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          progressColor: 'bg-gray-400',
          progressWidth: '0%'
        };
    }
  };

  const cardStyle = getDepartureCardStyle(depart.statut);

  return (
    <section className="py-8 sm:py-12 lg:py-20 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 transition-colors duration-200 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Retour à la vue d'ensemble</span>
          </button>
        </div>

        {/* Section principale avec statut et progression */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl flex-shrink-0">
                <Ship className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Départ {depart.id}
                </h3>
                {depart.numTC && (
                  <div className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                    <span className="font-medium">Conteneur: {depart.numTC}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center sm:justify-end">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {getDepartureProgressPercentage(depart.statut)}%
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-3 sm:space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-700 h-3 sm:h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${getDepartureProgressPercentage(depart.statut)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Chronologie des étapes */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-600" />
            <span>Chronologie du transport</span>
          </h3>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[600px] sm:min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider">Étape</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider">Date prévue</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm">Chargement du conteneur</span>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-700 font-medium text-xs sm:text-sm">
                    {depart.dateChargement ? new Date(depart.dateChargement).toLocaleDateString('fr-FR') : 'Non défini'}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    {depart.dateChargement && new Date(depart.dateChargement) <= new Date() ? (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-green-600 font-semibold bg-green-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                        <span>Effectué</span>
                      </span>
                    ) : depart.dateChargement && new Date(depart.dateChargement) > new Date() ? (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-600 font-semibold bg-blue-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></span>
                        <span>Prévision</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-500 bg-gray-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></span>
                        <span>En attente</span>
                      </span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Ship className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm">Départ de Chine</span>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-700 font-medium text-xs sm:text-sm">
                    {depart.dateDepartChine ? new Date(depart.dateDepartChine).toLocaleDateString('fr-FR') : 'Non défini'}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    {depart.dateDepartChine && new Date(depart.dateDepartChine) <= new Date() ? (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-green-600 font-semibold bg-green-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                        <span>Effectué</span>
                      </span>
                    ) : depart.dateDepartChine && new Date(depart.dateDepartChine) > new Date() ? (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-600 font-semibold bg-blue-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></span>
                        <span>Prévision</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-500 bg-gray-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></span>
                        <span>En attente</span>
                      </span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm">Arrivée à Tamatave</span>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-700 font-medium text-xs sm:text-sm">
                    {depart.dateArriveTamatave ? new Date(depart.dateArriveTamatave).toLocaleDateString('fr-FR') : 'Non défini'}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    {depart.dateArriveTamatave && new Date(depart.dateArriveTamatave) <= new Date() ? (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-green-600 font-semibold bg-green-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                        <span>Effectué</span>
                      </span>
                    ) : depart.dateArriveTamatave && new Date(depart.dateArriveTamatave) > new Date() ? (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-600 font-semibold bg-blue-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></span>
                        <span>Prévision</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-500 bg-gray-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></span>
                        <span>En attente</span>
                      </span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm">Arrivée à Antananarivo</span>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-700 font-medium text-xs sm:text-sm">
                    {depart.dateArriveTana ? new Date(depart.dateArriveTana).toLocaleDateString('fr-FR') : 'Non défini'}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    {depart.dateArriveTana && new Date(depart.dateArriveTana) <= new Date() ? (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-green-600 font-semibold bg-green-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                        <span>Effectué</span>
                      </span>
                    ) : depart.dateArriveTana && new Date(depart.dateArriveTana) > new Date() ? (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-600 font-semibold bg-blue-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></span>
                        <span>Prévision</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-500 bg-gray-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></span>
                        <span>En attente</span>
                      </span>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm">Réception des colis</span>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-700 font-medium text-xs sm:text-sm">
                    {depart.dateReceptionColis ? new Date(depart.dateReceptionColis).toLocaleDateString('fr-FR') : 'Non défini'}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    {depart.dateReceptionColis && new Date(depart.dateReceptionColis) <= new Date() ? (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-green-600 font-semibold bg-green-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                        <span>Effectué</span>
                      </span>
                    ) : depart.dateReceptionColis && new Date(depart.dateReceptionColis) > new Date() ? (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-600 font-semibold bg-blue-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></span>
                        <span>Prévision</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-500 bg-gray-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></span>
                        <span>En attente</span>
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}