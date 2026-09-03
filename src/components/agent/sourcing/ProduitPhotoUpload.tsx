import React, { useRef } from 'react';
import { Upload, Trash2, Image } from 'lucide-react';
import { catalogueService } from '../../../services/catalogueService';
import { useAddProduitPhoto, useDeleteProduitPhoto, useCatalogueProduits } from '../../../hooks/useCatalogueProduits';
import toast from 'react-hot-toast';

interface Props {
  produitId: string;
}

export default function ProduitPhotoUpload({ produitId }: Props) {
  const addPhoto = useAddProduitPhoto();
  const deletePhoto = useDeleteProduitPhoto();
  const inputRef = useRef<HTMLInputElement>(null);

  // Read live photos directly from the React Query cache so the list
  // updates immediately after an upload or deletion without needing a
  // stale prop from the parent.
  const { data: produits = [] } = useCatalogueProduits();
  const photos = produits.find(p => p.id === produitId)?.catalogue_produit_photos ?? [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 10 Mo`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast.error(`${file.name} : format non supporté`);
        continue;
      }
      await addPhoto.mutateAsync({ produitId, file, ordre: photos.length });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Glissez des images ou <span className="text-blue-600 font-medium">cliquez pour sélectionner</span></p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF — max 10 Mo</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
              <img
                src={catalogueService.getPhotoUrl(photo.file_path)}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => deletePhoto.mutate(photo)}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Image className="w-4 h-4" />
          <span>Aucune photo ajoutée</span>
        </div>
      )}
    </div>
  );
}
