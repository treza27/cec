import React from 'react';
import { Package as PackageType } from '../types';
import { Package, MapPin, Calendar, Weight, ArrowLeft, CheckCircle, Clock, Circle, FileText, Download } from 'lucide-react';

// Fonction pour obtenir le libellé client du statut
const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    'enregistre_chine': 'Enregistré en Chine',
    'charge_expedition': 'Chargé pour l\'expédition',
    'en_route_madagascar': 'En route vers Madagascar',
    'arrive_toamasina': 'Arrivé au port de Toamasina',
    'dedouanement_cours': 'En cours de dédouanement',
    'arrive_antananarivo': 'Arrivé à Antananarivo',
    'pret_livraison_enlevement': 'Prêt pour livraison/enlèvement',
    'en_cours_livraison': 'En cours de livraison',
    'livre': 'Livré'
  };
  return statusLabels[status] || status;
};

// Fonction pour obtenir la couleur du statut
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'livre':
      return 'text-green-700';
    case 'en_cours_livraison':
    case 'pret_livraison_enlevement':
    case 'arrive_antananarivo':
      return 'text-blue-700';
    case 'en_attente_confirmation':
    case 'enregistre_chine':
    case 'charge_expedition':
    case 'en_route_madagascar':
    case 'arrive_toamasina':
    case 'dedouanement_cours':
      return 'text-orange-700';
    default:
      return 'text-gray-700';
  }
};

interface TrackingResultProps {
  packageData: PackageType;
  onBack: () => void;
}

export default function TrackingResult({ packageData, onBack }: TrackingResultProps) {
  const getStepIcon = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'pending':
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getProgressPercentage = () => {
    // Si le colis est archivé, la progression est à 100%
    if (packageData.currentStatus === 'archive') {
      return 100;
    }
    
    const completedSteps = packageData.steps.filter(step => step.status === 'completed').length;
    const currentStep = packageData.steps.find(step => step.status === 'current') ? 1 : 0;
    return ((completedSteps + currentStep * 0.5) / packageData.steps.length) * 100;
  };

  return (
    <section className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Nouvelle recherche</span>
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Suivi du départ {packageData.trackingCode}
                </h1>
                <p className="text-gray-600">Client: {packageData.clientName}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Progression</div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(getProgressPercentage())}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-700 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>

            {/* Package Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-500">Description</div>
                  <div className="font-medium">{packageData.description}</div>
                </div>
              </div>
              {packageData.numTC && (
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500">Conteneur</div>
                    <div className="font-medium">{packageData.numTC}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Weight className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-500">Poids</div>
                  <div className="font-medium">{packageData.weight} kg</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-500">Enregistré le</div>
                  <div className="font-medium">{new Date(packageData.registrationDate).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-500">Arrivée prévue</div>
                  <div className="font-medium">{new Date(packageData.estimatedArrival).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Suivi détaillé</h2>
          
          <div className="space-y-8">
            {packageData.steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {index < packageData.steps.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                )}
                
                <div className="flex items-start space-x-6">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Step Info */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-lg font-semibold ${getStatusColor(packageData.currentStatus)}`}>
                            {step.title}
                          </h3>
                          {step.status === 'current' && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              En cours
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{step.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(step.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{step.location}</span>
                          </div>
                        </div>

                        {/* Documents */}
                        {step.documents && step.documents.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Documents disponibles:</h4>
                            <div className="flex flex-wrap gap-2">
                              {step.documents.map((doc) => (
                                <button
                                  key={doc.id}
                                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                                >
                                  <FileText className="w-4 h-4 text-gray-600" />
                                  <span>{doc.name}</span>
                                  <Download className="w-4 h-4 text-gray-600" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Image */}
                      {step.image && (
                        <div className="lg:col-span-1">
                          <img
                            src={step.image}
                            alt={step.title}
                            className="w-full h-48 object-cover rounded-lg shadow-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}