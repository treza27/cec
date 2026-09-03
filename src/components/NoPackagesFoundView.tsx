import React from 'react';
import { ArrowLeft, Package, Clock, Ship, User } from 'lucide-react';

interface NoPackagesFoundViewProps {
  pseudo: string;
  onBack: () => void;
}

export default function NoPackagesFoundView({ pseudo, onBack }: NoPackagesFoundViewProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-200/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6 transition-all duration-200 hover:translate-x-1"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Nouvelle recherche</span>
          </button>
        </div>

        {/* Message principal */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/50 relative overflow-hidden">
          {/* Décoration de fond */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-purple-100/30 to-blue-200/30 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 text-center">
            {/* Icône principale */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <User className="w-12 h-12 text-white" />
            </div>

            {/* Message de bienvenue personnalisé */}
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Bonjour {pseudo} !
            </h1>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <p className="text-xl text-gray-700 leading-relaxed">
                Nous vous reconnaissons en tant que client de Continental Express Cargo.
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Aucun colis en cours</h3>
                    <p className="text-blue-700 leading-relaxed">
                      Vous n'avez actuellement aucun colis en transit ou en préparation. 
                      Vos prochains envois apparaîtront automatiquement ici dès qu'ils seront enregistrés dans notre système.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prochaines étapes */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Ship className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Prochains envois</h3>
                    <p className="text-green-700 leading-relaxed">
                      Dès que vous effectuerez un nouvel envoi depuis la Chine, vous pourrez suivre 
                      son acheminement en temps réel grâce à ce système de suivi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations utiles */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-amber-800 mb-2">Délais de traitement</h3>
                    <p className="text-amber-700 leading-relaxed">
                      Les nouveaux envois apparaissent généralement dans le système sous 24-48h 
                      après leur réception dans nos entrepôts en Chine.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}