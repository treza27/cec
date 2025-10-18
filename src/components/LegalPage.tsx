import React from 'react';
import { Scale, FileText, Shield, Lock } from 'lucide-react';

export default function LegalPage() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Mentions Légales
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Informations légales et conditions générales de vente
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 border border-gray-100">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Informations sur l'entreprise</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Raison sociale</p>
                  <p>China Express Cargo Madagascar</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Forme juridique</p>
                  <p>Société de transport et logistique</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Adresse du siège social</p>
                  <p>Lot IVW 4 Bis, Anosizato Est<br />Antananarivo, Madagascar</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Contact</p>
                  <p>Email: cec.sales52@gmail.com<br />Téléphone: +261 34 07 252 92</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 border border-gray-100">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Conditions Générales de Vente</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Objet</h3>
                <p className="leading-relaxed">
                  Les présentes conditions générales de vente régissent les relations entre China Express Cargo Madagascar et ses clients pour tous les services de transport, de logistique et de fret international proposés.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. Services proposés</h3>
                <p className="leading-relaxed mb-3">China Express Cargo Madagascar propose les services suivants :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Transport maritime de marchandises Chine-Madagascar</li>
                  <li>Groupage et consolidation de colis</li>
                  <li>Dédouanement des marchandises</li>
                  <li>Transport terrestre Toamasina-Antananarivo</li>
                  <li>Entreposage et stockage temporaire</li>
                  <li>Service de suivi en temps réel</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Tarifs et paiement</h3>
                <p className="leading-relaxed mb-3">
                  Les tarifs sont établis sur la base du volume, du poids et de la nature des marchandises. Tous les prix sont exprimés en Ariary malgache (MGA) ou en euros selon les accords commerciaux.
                </p>
                <p className="leading-relaxed">
                  Le paiement doit être effectué selon les modalités convenues lors de la commande. Un acompte peut être demandé pour certaines prestations.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. Responsabilité</h3>
                <p className="leading-relaxed mb-3">
                  China Express Cargo Madagascar s'engage à traiter les marchandises avec le plus grand soin. Notre responsabilité est limitée dans les cas suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Marchandises mal emballées par l'expéditeur</li>
                  <li>Vice propre de la marchandise</li>
                  <li>Cas de force majeure (catastrophes naturelles, guerres, grèves, etc.)</li>
                  <li>Retards dus aux formalités douanières</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. Assurance</h3>
                <p className="leading-relaxed">
                  Une assurance transport est recommandée et peut être souscrite via nos services. En l'absence d'assurance, notre responsabilité est limitée selon les conventions internationales en vigueur.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">6. Délais de livraison</h3>
                <p className="leading-relaxed">
                  Les délais de livraison sont donnés à titre indicatif et dépendent de nombreux facteurs (conditions météorologiques, formalités douanières, disponibilité des navires). China Express Cargo ne saurait être tenu responsable des retards indépendants de sa volonté.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">7. Réclamations</h3>
                <p className="leading-relaxed">
                  Toute réclamation doit être formulée par écrit dans un délai de 7 jours suivant la réception des marchandises. Les réclamations pour marchandises manquantes ou endommagées doivent être accompagnées de preuves photographiques.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">8. Marchandises interdites</h3>
                <p className="leading-relaxed mb-3">
                  Le transport des marchandises suivantes est strictement interdit :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Produits dangereux, toxiques ou inflammables</li>
                  <li>Armes et munitions</li>
                  <li>Drogues et substances illicites</li>
                  <li>Contrefaçons et produits piratés</li>
                  <li>Denrées périssables sans accord préalable</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">9. Droit applicable</h3>
                <p className="leading-relaxed">
                  Les présentes conditions générales sont régies par le droit malgache. Tout litige sera soumis à la juridiction compétente d'Antananarivo, Madagascar.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 border border-gray-100">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Protection des données personnelles</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Collecte des données</h3>
                <p className="leading-relaxed">
                  Les informations personnelles collectées (nom, adresse, téléphone, email) sont nécessaires au traitement de vos commandes et à la gestion de notre relation commerciale. Ces données sont conservées de manière sécurisée et confidentielle.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Utilisation des données</h3>
                <p className="leading-relaxed mb-3">Vos données personnelles sont utilisées pour :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Le traitement de vos commandes</li>
                  <li>Le suivi de vos envois</li>
                  <li>La communication relative à vos expéditions</li>
                  <li>L'amélioration de nos services</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Vos droits</h3>
                <p className="leading-relaxed">
                  Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à l'adresse cec.sales52@gmail.com.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Cookies</h3>
                <p className="leading-relaxed">
                  Notre site utilise des cookies techniques nécessaires à son bon fonctionnement. Aucun cookie de suivi publicitaire n'est utilisé sans votre consentement.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question concernant ces mentions légales ou nos conditions générales de vente,
                n'hésitez pas à nous contacter par email à <a href="mailto:cec.sales52@gmail.com" className="text-blue-600 font-semibold hover:underline">cec.sales52@gmail.com</a>
                ou par téléphone au <a href="tel:+261340725292" className="text-blue-600 font-semibold hover:underline">+261 34 07 252 92</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
