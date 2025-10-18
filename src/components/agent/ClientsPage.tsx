import React, { useState, memo, useCallback, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, User, Building, Phone, MapPin, Tag } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { clientService } from '../../services/clientService';
import toast from 'react-hot-toast';
import ClientForm from '../forms/ClientForm';
import { useDebounce } from '../../hooks/useDebounce';

const ClientsPage = memo(function ClientsPage() {
  const { clients, loading, error, refreshClients } = useClients();
  
  // Debug: Log des clients reçus
  React.useEffect(() => {
    console.log('👥 ClientsPage - Clients reçus:', clients);
    console.log('👥 ClientsPage - Nombre de clients:', clients.length);
    if (clients.length > 0) {
      console.log('👥 ClientsPage - Premier client:', clients[0]);
      const paulClient = clients.find(c => c.prenom.toLowerCase().includes('paul') || c.nom.toLowerCase().includes('paul'));
      if (paulClient) {
        console.log('👤 ClientsPage - Client Paul trouvé:', paulClient);
      }
    }
  }, [clients]);
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search term pour optimiser les performances
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const handleEdit = useCallback((client: any) => {
    console.log('✏️ Édition du client:', client);
    console.log('🏷️ Shipping marks du client:', client.shipping_marks);
    
    setEditingId(client.id);
    setEditingClient({
      id: client.id,
      nom: client.nom,
      prenom: client.prenom,
      pseudo: client.pseudo,
      entreprise: client.entreprise || '',
      quartier_ville: client.quartier_ville || '',
      telephone: client.telephone || '',
      shipping_marks: client.shipping_marks.map((mark: any) => mark.shipping_mark)
    });
    
    console.log('📝 Données d\'édition préparées:', {
      id: client.id,
      nom: client.nom,
      prenom: client.prenom,
      pseudo: client.pseudo,
      entreprise: client.entreprise || '',
      quartier_ville: client.quartier_ville || '',
      telephone: client.telephone || '',
      shipping_marks: client.shipping_marks.map((mark: any) => mark.shipping_mark)
    });
  }, []);

  const handleFormSuccess = useCallback(() => {
    setEditingId(null);
    setEditingClient(null);
    setIsAddingNew(false);
    setIsSubmitting(false);
    refreshClients();
  }, [refreshClients]);

  const handleFormCancel = useCallback(() => {
    setEditingId(null);
    setEditingClient(null);
    setIsAddingNew(false);
    setIsSubmitting(false);
  }, []);

  const handleDelete = useCallback(async (clientId: number, clientName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${clientName}" ?`)) {
      setIsSubmitting(true);
      try {
        await clientService.delete(clientId);
        toast.success('Client supprimé avec succès !');
        refreshClients();
      } catch (error: any) {
        toast.error(`Erreur lors de la suppression: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [refreshClients]);

  // Memoize filtered clients pour éviter les recalculs inutiles
  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.nom.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      client.prenom.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      client.entreprise?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      client.shipping_marks.some(mark => 
        mark.shipping_mark.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    );
  }, [clients, debouncedSearchTerm]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des clients...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {error}</p>
        <button 
          onClick={() => refreshClients()} 
          className="mt-2 text-red-700 underline hover:text-red-900"
        >
          Réessayer
        </button>
      </div>
    );
  }


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion des Clients</h2>
        <button 
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew || isSubmitting}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, entreprise ou shipping mark..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {isAddingNew && (
        <ClientForm
          isEditing={false}
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Liste des clients */}
      <div className="space-y-4 sm:space-y-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {editingId === client.id ? (
              <div className="p-4 sm:p-6">
                <ClientForm
                  isEditing={true}
                  initialData={editingClient}
                  onCancel={handleFormCancel}
                  onSuccess={handleFormSuccess}
                  isSubmitting={isSubmitting}
                />
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                {/* Header du client */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {client.nom} {client.prenom}
                      </h3>
                      {client.entreprise && (
                        <div className="flex items-center space-x-2 text-gray-600 mt-1">
                          <Building className="w-4 h-4" />
                          <span className="text-sm">{client.entreprise}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleEdit(client)}
                      disabled={isSubmitting}
                      className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => handleDelete(client.id, `${client.nom} ${client.prenom}`)}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>

                {/* Informations du client */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {client.quartier_ville && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{client.quartier_ville}</span>
                    </div>
                  )}
                  {client.telephone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{client.telephone}</span>
                    </div>
                  )}
                </div>

                {/* Shipping marks */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-800">
                      Shipping Marks ({client.shipping_marks.length})
                    </h4>
                  </div>
                  
                  {client.shipping_marks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {client.shipping_marks.map((mark) => (
                        <span
                          key={mark.id}
                          className="inline-flex items-center space-x-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 shadow-sm"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{mark.shipping_mark}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic bg-gray-50 rounded-lg p-3">
                      Aucune shipping mark associée
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Message si aucun client */}
      {filteredClients.length === 0 && !isAddingNew && (
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-500">
            <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-base sm:text-lg font-medium mb-2">
              {searchTerm ? 'Aucun client trouvé' : 'Aucun client'}
            </p>
            <p className="text-sm">
              {searchTerm 
                ? 'Aucun client ne correspond à votre recherche.' 
                : 'Commencez par ajouter votre premier client.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default ClientsPage;