import React, { useState, useEffect, useCallback } from 'react';
import { Images, ChevronDown, ChevronRight, Download, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight as ChevronRightIcon, Calendar, ImageOff, Loader2, PackageCheck, ShieldAlert, Container, Filter, Trash2, AlertTriangle, FileSpreadsheet, Pencil } from 'lucide-react';
import JSZip from 'jszip';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabase';
import { useEmployeeProfileContext } from '../../contexts/EmployeeProfileContext';
import type { PhotoTag, PhotoUpload } from '../../types';
import PhotoEditModal from './PhotoEditModal';

interface PhotoRecord extends PhotoUpload {
  signedUrl?: string;
}

interface DayGroup {
  date: string;
  photos: PhotoRecord[];
  collapsed: boolean;
}

type TagFilter = PhotoTag | 'all';

type DeleteConfirmState =
  | { type: 'photo'; photo: PhotoRecord }
  | { type: 'day'; date: string; count: number };

const TAG_META: Record<PhotoTag, { label: string; icon: React.ReactNode; badgeBg: string; badgeText: string; dotColor: string }> = {
  reception_marchandise: {
    label: 'Réception marchandise',
    icon: <PackageCheck className="w-3.5 h-3.5" />,
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  constat_anomalie: {
    label: "Constat d'anomalie",
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    dotColor: 'bg-orange-500',
  },
  chargement_conteneur: {
    label: 'Chargement conteneur',
    icon: <Container className="w-3.5 h-3.5" />,
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  inventaire_depot: {
    label: 'Inventaire du dépôt',
    icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    dotColor: 'bg-teal-500',
  },
};

const ALL_TAGS: PhotoTag[] = ['reception_marchandise', 'constat_anomalie', 'chargement_conteneur', 'inventaire_depot'];

function isExcelFile(photo: PhotoRecord): boolean {
  return (
    photo.tag === 'inventaire_depot' ||
    photo.mime_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    photo.mime_type === 'application/vnd.ms-excel' ||
    photo.original_name.endsWith('.xlsx') ||
    photo.original_name.endsWith('.xls')
  );
}

function TagBadge({ tag }: { tag: PhotoTag | null }) {
  if (!tag) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
        Sans tag
      </span>
    );
  }
  const meta = TAG_META[tag];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.badgeBg} ${meta.badgeText}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function PhotosPage() {
  const { profileData } = useEmployeeProfileContext();
  const isAdmin = profileData?.role === 'administrateur';

  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoRecord | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState<PhotoRecord[]>([]);
  const [zoom, setZoom] = useState(1);
  const [downloadingDates, setDownloadingDates] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deletingDates, setDeletingDates] = useState<Set<string>>(new Set());
  const [editPhoto, setEditPhoto] = useState<PhotoRecord | null>(null);
  const [lightboxLabel, setLightboxLabel] = useState('');
  const [lightboxDescription, setLightboxDescription] = useState('');
  const [lightboxSaving, setLightboxSaving] = useState(false);

  const displayName = (photo: PhotoRecord) => photo.label || photo.original_name;

  const handlePhotoEdited = (updated: PhotoUpload) => {
    setAllPhotos(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    setDayGroups(prev =>
      prev.map(g => ({
        ...g,
        photos: g.photos.map(p => p.id === updated.id ? { ...p, ...updated } : p),
      }))
    );
    if (lightboxPhoto?.id === updated.id) {
      setLightboxPhoto(prev => prev ? { ...prev, ...updated } : prev);
    }
  };

  // Photos visible after applying tag filter
  const filteredPhotos = tagFilter === 'all'
    ? allPhotos
    : allPhotos.filter(p => p.tag === tagFilter);

  const filteredDayGroups: DayGroup[] = dayGroups
    .map(g => ({
      ...g,
      photos: tagFilter === 'all' ? g.photos : g.photos.filter(p => p.tag === tagFilter),
    }))
    .filter(g => g.photos.length > 0);

  // Count per tag for filter pills
  const tagCounts: Record<TagFilter, number> = {
    all: allPhotos.length,
    reception_marchandise: allPhotos.filter(p => p.tag === 'reception_marchandise').length,
    constat_anomalie: allPhotos.filter(p => p.tag === 'constat_anomalie').length,
    chargement_conteneur: allPhotos.filter(p => p.tag === 'chargement_conteneur').length,
    inventaire_depot: allPhotos.filter(p => p.tag === 'inventaire_depot').length,
  };

  const downloadDayZip = async (group: DayGroup) => {
    if (downloadingDates.has(group.date)) return;
    setDownloadingDates(prev => new Set([...prev, group.date]));

    try {
      let photos = group.photos;

      const needsUrl = photos.filter(p => !p.signedUrl);
      if (needsUrl.length > 0) {
        const { data: batchData } = await supabase.storage
          .from('photos')
          .createSignedUrls(needsUrl.map(p => p.storage_path), 3600);

        const urlMap = new Map<string, string>();
        if (batchData) {
          for (const item of batchData) {
            if (item.signedUrl) urlMap.set(item.path, item.signedUrl);
          }
        }

        const updatedAll = allPhotos.map(p => {
          const signedUrl = urlMap.get(p.storage_path);
          if (!signedUrl) return p;
          return { ...p, signedUrl };
        });
        setAllPhotos(updatedAll);
        photos = group.photos.map(p => updatedAll.find(u => u.id === p.id) ?? p);
        setDayGroups(prev =>
          prev.map(g => g.date === group.date ? { ...g, photos } : g)
        );
      }

      const zip = new JSZip();
      await Promise.all(
        photos.map(async (photo) => {
          if (!photo.signedUrl) return;
          const response = await fetch(photo.signedUrl);
          const blob = await response.blob();
          zip.file(photo.original_name, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photos-${group.date}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur lors de la création du ZIP:', err);
    } finally {
      setDownloadingDates(prev => {
        const next = new Set(prev);
        next.delete(group.date);
        return next;
      });
    }
  };

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('photos_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (dbError) throw dbError;
      if (!data || data.length === 0) {
        setDayGroups([]);
        setAllPhotos([]);
        setLoading(false);
        return;
      }

      const photos: PhotoRecord[] = data as PhotoRecord[];

      const grouped = new Map<string, PhotoRecord[]>();
      for (const p of photos) {
        const key = p.folder_date || p.uploaded_at.split('T')[0];
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(p);
      }

      const groups: DayGroup[] = Array.from(grouped.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dayPhotos], idx) => ({
          date,
          photos: dayPhotos,
          collapsed: idx > 0,
        }));

      setDayGroups(groups);
      setAllPhotos(photos);

      if (groups.length > 0) {
        await fetchSignedUrls(groups[0].photos, photos);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSignedUrls = async (photos: PhotoRecord[], allPhotosList: PhotoRecord[]) => {
    const needsUrl = photos.filter(p => !p.signedUrl);
    if (!needsUrl.length) return;

    const ids = new Set(needsUrl.map(p => p.id));
    setLoadingUrls(prev => new Set([...prev, ...ids]));

    // Single batch request instead of N individual calls
    const { data } = await supabase.storage
      .from('photos')
      .createSignedUrls(needsUrl.map(p => p.storage_path), 3600);

    const urlMap = new Map<string, string>();
    if (data) {
      for (const item of data) {
        if (item.signedUrl) urlMap.set(item.path, item.signedUrl);
      }
    }

    const updated = allPhotosList.map(p => {
      const signedUrl = urlMap.get(p.storage_path);
      if (!signedUrl) return p;
      return { ...p, signedUrl };
    });

    setAllPhotos(updated);
    setDayGroups(prev =>
      prev.map(group => ({
        ...group,
        photos: group.photos.map(p => updated.find(u => u.id === p.id) ?? p),
      }))
    );

    setLoadingUrls(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  };

  const toggleGroup = async (date: string) => {
    setDayGroups(prev => {
      const updated = prev.map(g => g.date === date ? { ...g, collapsed: !g.collapsed } : g);
      const group = updated.find(g => g.date === date);
      if (group && !group.collapsed) {
        const needsUrl = group.photos.filter(p => !p.signedUrl);
        if (needsUrl.length > 0) {
          fetchSignedUrls(group.photos, allPhotos);
        }
      }
      return updated;
    });
  };

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const openLightbox = (photo: PhotoRecord) => {
    if (isExcelFile(photo)) return;
    const nonExcelPhotos = filteredPhotos.filter(p => !isExcelFile(p));
    const idx = nonExcelPhotos.findIndex(p => p.id === photo.id);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxPhoto(photo);
    setLightboxLabel(photo.label ?? '');
    setLightboxDescription(photo.description ?? '');
    setZoom(1);
  };

  const closeLightbox = () => {
    setLightboxPhoto(null);
    setLightboxLabel('');
    setLightboxDescription('');
    setZoom(1);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const nonExcelPhotos = filteredPhotos.filter(p => !isExcelFile(p));
    const newIdx = direction === 'prev'
      ? (lightboxIndex - 1 + nonExcelPhotos.length) % nonExcelPhotos.length
      : (lightboxIndex + 1) % nonExcelPhotos.length;
    const newPhoto = nonExcelPhotos[newIdx];
    setLightboxIndex(newIdx);
    setLightboxPhoto(newPhoto);
    setLightboxLabel(newPhoto.label ?? '');
    setLightboxDescription(newPhoto.description ?? '');
    setZoom(1);
  };

  const saveLightboxMeta = async () => {
    if (!lightboxPhoto) return;
    setLightboxSaving(true);
    try {
      const { error } = await supabase
        .from('photos_uploads')
        .update({
          label: lightboxLabel.trim() || null,
          description: lightboxDescription.trim() || null,
        })
        .eq('id', lightboxPhoto.id);
      if (error) throw error;
      const updated = {
        ...lightboxPhoto,
        label: lightboxLabel.trim() || null,
        description: lightboxDescription.trim() || null,
      };
      handlePhotoEdited(updated);
      toast.success('Informations mises à jour');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLightboxSaving(false);
    }
  };

  const downloadPhoto = async (photo: PhotoRecord) => {
    if (!photo.signedUrl) return;
    const a = document.createElement('a');
    a.href = photo.signedUrl;
    a.download = photo.original_name;
    a.click();
  };

  // Delete a single photo
  const handleDeletePhoto = async (photo: PhotoRecord) => {
    setDeletingIds(prev => new Set([...prev, photo.id]));
    setDeleteConfirm(null);
    try {
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photo.storage_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('photos_uploads')
        .delete()
        .eq('id', photo.id);
      if (dbError) throw dbError;

      setAllPhotos(prev => prev.filter(p => p.id !== photo.id));
      setDayGroups(prev =>
        prev
          .map(g => ({ ...g, photos: g.photos.filter(p => p.id !== photo.id) }))
          .filter(g => g.photos.length > 0)
      );

      if (lightboxPhoto?.id === photo.id) {
        closeLightbox();
      }

      toast.success('Photo supprimée');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      console.error(err);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(photo.id);
        return next;
      });
    }
  };

  // Delete all photos of a day
  const handleDeleteDay = async (date: string) => {
    setDeletingDates(prev => new Set([...prev, date]));
    setDeleteConfirm(null);
    try {
      const group = dayGroups.find(g => g.date === date);
      if (!group) return;

      const storagePaths = group.photos.map(p => p.storage_path);
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('photos')
          .remove(storagePaths);
        if (storageError) throw storageError;
      }

      const { error: dbError } = await supabase
        .from('photos_uploads')
        .delete()
        .eq('folder_date', date);
      if (dbError) throw dbError;

      const deletedIds = new Set(group.photos.map(p => p.id));
      setAllPhotos(prev => prev.filter(p => !deletedIds.has(p.id)));
      setDayGroups(prev => prev.filter(g => g.date !== date));

      if (lightboxPhoto && deletedIds.has(lightboxPhoto.id)) {
        closeLightbox();
      }

      toast.success(`${group.photos.length} fichier${group.photos.length > 1 ? 's' : ''} supprimé${group.photos.length > 1 ? 's' : ''}`);
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      console.error(err);
    } finally {
      setDeletingDates(prev => {
        const next = new Set(prev);
        next.delete(date);
        return next;
      });
    }
  };

  const totalPhotos = allPhotos.length;
  const totalSize = allPhotos.reduce((sum, p) => sum + (p.file_size || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ImageOff className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 font-medium mb-2">Erreur de chargement</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button
          onClick={fetchPhotos}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Images className="w-6 h-6 text-blue-600" />
            Photos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalPhotos === 0
              ? 'Aucun fichier uploadé'
              : `${totalPhotos} fichier${totalPhotos > 1 ? 's' : ''} • ${dayGroups.length} dossier${dayGroups.length > 1 ? 's' : ''} • ${formatFileSize(totalSize)}`}
          </p>
        </div>

        {totalPhotos > 0 && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Liste
            </button>
          </div>
        )}
      </div>

      {/* Tag filter bar */}
      {totalPhotos > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filtrer :
          </div>
          <button
            onClick={() => setTagFilter('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              tagFilter === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            Toutes
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${tagFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {tagCounts.all}
            </span>
          </button>
          {ALL_TAGS.map(tag => {
            const meta = TAG_META[tag];
            const isActive = tagFilter === tag;
            return (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isActive
                    ? `${meta.badgeBg} ${meta.badgeText} border-current`
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {meta.icon}
                {meta.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isActive ? 'bg-black/10' : 'bg-gray-100 text-gray-500'}`}>
                  {tagCounts[tag]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {totalPhotos === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
            <Images className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun fichier pour le moment</h3>
          <p className="text-gray-500 text-sm max-w-xs">
            Les photos et fichiers Excel uploadés apparaîtront ici, organisés par date.
          </p>
        </div>
      )}

      {/* No results after filter */}
      {totalPhotos > 0 && filteredDayGroups.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Filter className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm">Aucune photo avec ce tag.</p>
        </div>
      )}

      {/* Day groups */}
      {filteredDayGroups.map(group => (
        <div key={group.date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Group header */}
          <button
            onClick={() => toggleGroup(group.date)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="font-semibold text-gray-900">{formatDate(group.date)}</span>
              <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                {group.photos.length} fichier{group.photos.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); downloadDayZip(group); }}
                disabled={downloadingDates.has(group.date)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Télécharger toutes les photos en ZIP"
              >
                {downloadingDates.has(group.date) ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Préparation...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger ZIP</span>
                  </>
                )}
              </button>

              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ type: 'day', date: group.date, count: group.photos.length });
                  }}
                  disabled={deletingDates.has(group.date)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Supprimer toutes les photos de ce jour"
                >
                  {deletingDates.has(group.date) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Supprimer le jour</span>
                </button>
              )}

              {group.collapsed
                ? <ChevronRight className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />
              }
            </div>
          </button>

          {/* Photos */}
          {!group.collapsed && (
            <div className="border-t border-gray-100 p-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {group.photos.map(photo => {
                    const excel = isExcelFile(photo);
                    return (
                      <div
                        key={photo.id}
                        className={`relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 ${excel ? 'cursor-default' : 'cursor-pointer'}`}
                        onClick={() => !excel && photo.signedUrl && openLightbox(photo)}
                      >
                        {loadingUrls.has(photo.id) || !photo.signedUrl ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                          </div>
                        ) : deletingIds.has(photo.id) ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                            <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                          </div>
                        ) : excel ? (
                          <>
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-teal-50 gap-2 p-2">
                              <FileSpreadsheet className="w-10 h-10 text-teal-500" />
                              <p className="text-[10px] font-medium text-teal-700 text-center leading-tight line-clamp-2 break-all">{displayName(photo)}</p>
                              {photo.description && (
                                <p className="text-[9px] text-teal-500 text-center leading-tight line-clamp-2 px-1">{photo.description}</p>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-teal-900/0 group-hover:bg-teal-900/10 transition-all duration-200" />
                            {/* Download button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadPhoto(photo); }}
                              disabled={!photo.signedUrl}
                              className="absolute bottom-1.5 left-1.5 w-7 h-7 bg-teal-600 hover:bg-teal-700 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-10"
                              title="Télécharger"
                            >
                              <Download className="w-3.5 h-3.5 text-white" />
                            </button>
                            {/* Edit button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditPhoto(photo); }}
                              className="absolute bottom-1.5 right-1.5 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-10"
                              title="Modifier le nom et la description"
                            >
                              <Pencil className="w-3.5 h-3.5 text-white" />
                            </button>
                            {/* Tag badge */}
                            {photo.tag && (
                              <div className="absolute top-1.5 left-1.5">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold shadow-sm ${TAG_META[photo.tag].badgeBg} ${TAG_META[photo.tag].badgeText}`}>
                                  {TAG_META[photo.tag].icon}
                                </span>
                              </div>
                            )}
                            {/* Admin delete */}
                            {isAdmin && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'photo', photo }); }}
                                className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-600 hover:bg-red-700 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-10"
                                title="Supprimer ce fichier"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-white" />
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <img
                              src={photo.signedUrl}
                              alt={photo.original_name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                            </div>
                            {/* Tag badge overlay */}
                            {photo.tag && (
                              <div className="absolute top-1.5 left-1.5">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold shadow-sm ${TAG_META[photo.tag].badgeBg} ${TAG_META[photo.tag].badgeText}`}>
                                  {TAG_META[photo.tag].icon}
                                </span>
                              </div>
                            )}
                            {/* Edit button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditPhoto(photo); }}
                              className="absolute bottom-1.5 right-1.5 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-10"
                              title="Modifier le nom et la description"
                            >
                              <Pencil className="w-3.5 h-3.5 text-white" />
                            </button>
                            {/* Admin delete button */}
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm({ type: 'photo', photo });
                                }}
                                className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-600 hover:bg-red-700 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-10"
                                title="Supprimer cette photo"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-white" />
                              </button>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <p className="text-white text-[10px] font-medium truncate">{displayName(photo)}</p>
                              {photo.description && (
                                <p className="text-white/70 text-[9px] truncate">{photo.description}</p>
                              )}
                              <p className="text-white/60 text-[10px]">{formatTime(photo.uploaded_at)}</p>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {group.photos.map(photo => {
                    const excel = isExcelFile(photo);
                    return (
                    <div key={photo.id} className="flex items-center gap-4 py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                      <div
                        className={`w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 ${excel ? 'cursor-default' : 'cursor-pointer'}`}
                        onClick={() => !excel && photo.signedUrl && openLightbox(photo)}
                      >
                        {loadingUrls.has(photo.id) || !photo.signedUrl ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          </div>
                        ) : excel ? (
                          <div className="w-full h-full flex items-center justify-center bg-teal-50">
                            <FileSpreadsheet className="w-6 h-6 text-teal-500" />
                          </div>
                        ) : (
                          <img
                            src={photo.signedUrl}
                            alt={photo.original_name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{displayName(photo)}</p>
                        {photo.description && (
                          <p className="text-xs text-gray-400 italic truncate mt-0.5">{photo.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatFileSize(photo.file_size)} • {formatTime(photo.uploaded_at)}
                          </p>
                          <TagBadge tag={photo.tag} />
                        </div>
                      </div>
                      <button
                        onClick={() => setEditPhoto(photo)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Modifier le nom et la description"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadPhoto(photo)}
                        disabled={!photo.signedUrl}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteConfirm({ type: 'photo', photo })}
                          disabled={deletingIds.has(photo.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Supprimer"
                        >
                          {deletingIds.has(photo.id)
                            ? <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      )}
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {deleteConfirm.type === 'photo'
                    ? 'Supprimer cette photo ?'
                    : `Supprimer le ${formatDate(deleteConfirm.date)} ?`}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {deleteConfirm.type === 'photo'
                    ? <>La photo <span className="font-medium text-gray-700">{deleteConfirm.photo.original_name}</span> sera définitivement supprimée.</>
                    : <>Les <span className="font-medium text-gray-700">{deleteConfirm.count} photo{deleteConfirm.count > 1 ? 's' : ''}</span> de ce jour seront définitivement supprimées. Cette action est irréversible.</>
                  }
                </p>
              </div>
            </div>

            {deleteConfirm.type === 'photo' && deleteConfirm.photo.signedUrl && !isExcelFile(deleteConfirm.photo) && (
              <div className="mb-5 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-36">
                <img
                  src={deleteConfirm.photo.signedUrl}
                  alt={deleteConfirm.photo.original_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'photo') {
                    handleDeletePhoto(deleteConfirm.photo);
                  } else {
                    handleDeleteDay(deleteConfirm.date);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleteConfirm.type === 'photo' ? 'Supprimer la photo' : 'Supprimer tout le jour'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editPhoto && (
        <PhotoEditModal
          photo={editPhoto}
          onClose={() => setEditPhoto(null)}
          onSaved={(updated) => {
            handlePhotoEdited(updated);
            setEditPhoto(null);
          }}
        />
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col md:flex-row"
          onClick={closeLightbox}
        >
          {/* Image area */}
          <div className="relative flex items-center justify-center overflow-hidden h-[55vh] md:h-auto md:flex-1" onClick={e => e.stopPropagation()}>
            {/* Zoom controls */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5 z-10">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="text-white/80 hover:text-white transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-white text-xs font-medium w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="text-white/80 hover:text-white transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Prev */}
            {filteredPhotos.filter(p => !isExcelFile(p)).length > 1 && (
              <button
                onClick={() => navigateLightbox('prev')}
                className="absolute left-3 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Image */}
            <div className="w-full h-full flex items-center justify-center p-4 md:p-16">
              {lightboxPhoto.signedUrl ? (
                <img
                  src={lightboxPhoto.signedUrl}
                  alt={displayName(lightboxPhoto)}
                  className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
                  style={{ transform: `scale(${zoom})` }}
                  draggable={false}
                />
              ) : (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              )}
            </div>

            {/* Next */}
            {filteredPhotos.filter(p => !isExcelFile(p)).length > 1 && (
              <button
                onClick={() => navigateLightbox('next')}
                className="absolute right-3 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            )}

            {/* Counter */}
            {filteredPhotos.filter(p => !isExcelFile(p)).length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 rounded-full px-3 py-1">
                <p className="text-white/50 text-xs">{lightboxIndex + 1} / {filteredPhotos.filter(p => !isExcelFile(p)).length}</p>
              </div>
            )}
          </div>

          {/* Info panel — full width on mobile, right sidebar on desktop */}
          <div
            className="w-full md:w-72 md:flex-shrink-0 bg-gray-900 border-t border-white/10 md:border-t-0 md:border-l md:border-white/10 flex flex-col max-h-[45vh] md:max-h-none"
            onClick={e => e.stopPropagation()}
          >
            {/* Panel header — action buttons */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
              <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Informations</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => downloadPhoto(lightboxPhoto)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setDeleteConfirm({ type: 'photo', photo: lightboxPhoto })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Supprimer cette photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={closeLightbox}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Tag */}
              {lightboxPhoto.tag && (
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${TAG_META[lightboxPhoto.tag].badgeBg} ${TAG_META[lightboxPhoto.tag].badgeText}`}>
                    {TAG_META[lightboxPhoto.tag].icon}
                    {TAG_META[lightboxPhoto.tag].label}
                  </span>
                </div>
              )}

              {/* File meta */}
              <div className="text-xs text-white/40 space-y-0.5">
                <p className="font-mono break-all text-white/25">{lightboxPhoto.original_name}</p>
                <p>{formatFileSize(lightboxPhoto.file_size)} • {formatDate(lightboxPhoto.folder_date)} {formatTime(lightboxPhoto.uploaded_at)}</p>
              </div>

              <div className="border-t border-white/10" />

              {/* Editable name */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Nom affiché</label>
                <input
                  type="text"
                  value={lightboxLabel}
                  onChange={e => setLightboxLabel(e.target.value)}
                  placeholder={lightboxPhoto.original_name}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Editable description */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Description</label>
                <textarea
                  value={lightboxDescription}
                  onChange={e => setLightboxDescription(e.target.value)}
                  placeholder="Ajouter une description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Save button */}
            <div className="p-4 border-t border-white/10 flex-shrink-0">
              <button
                onClick={saveLightboxMeta}
                disabled={lightboxSaving}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
              >
                {lightboxSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
