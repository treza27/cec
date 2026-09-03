import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ImagePlus, X, Upload, ArrowLeft, CheckCircle2, AlertCircle, Lock, PackageCheck, ShieldAlert, Container, FileSpreadsheet, FileText, Images } from 'lucide-react';
import { supabase } from '../utils/supabase';
import UploadGallery from './UploadGallery';

interface UploadPageProps {
  onNavigate?: (page: string) => void;
}

interface PreviewFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface ExcelFile {
  id: string;
  file: File;
}

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';
type Lang = 'fr' | 'zh';
type PhotoTag = 'reception_marchandise' | 'constat_anomalie' | 'chargement_conteneur' | 'inventaire_depot';

const T = {
  fr: {
    back: "Retour à l'accueil",
    title: 'Envoyer des fichiers',
    company: 'Continental Express Cargo',
    lockTitle: 'Accès protégé',
    lockSubtitle: "Saisissez le code pour accéder à l'upload.",
    codeLabel: 'CODE :',
    codePlaceholder: "Votre code d'accès",
    validate: 'Valider',
    codeError: 'Code incorrect, veuillez réessayer.',
    tagTitle: 'Catégorie',
    tagSubtitle: 'Sélectionnez le type de fichiers que vous souhaitez envoyer.',
    tagRequired: 'Veuillez sélectionner une catégorie avant de continuer.',
    tags: {
      reception_marchandise: { label: 'Réception marchandise', desc: "Photos lors de la réception des colis à l'entrepôt" },
      constat_anomalie: { label: "Constat d'anomalie", desc: 'Photos documentant un dommage ou une anomalie' },
      chargement_conteneur: { label: 'Chargement conteneur', desc: 'Photos du chargement avant un départ' },
      inventaire_depot: { label: 'Inventaire du dépôt', desc: 'Fichiers Excel (.xlsx / .xls) d\'inventaire du dépôt' },
    },
    dropTitle: 'Glissez vos photos ici',
    dropExcelTitle: 'Glissez votre fichier Excel ici',
    dropRelease: 'Relâchez pour ajouter',
    dropOr: 'ou',
    dropClick: 'cliquez pour sélectionner',
    dropFormats: 'JPG, PNG, WEBP, HEIC — plusieurs fichiers acceptés',
    dropExcelFormats: 'Fichiers .xlsx et .xls acceptés',
    selectedSingle: (n: number) => `${n} photo sélectionnée`,
    selectedPlural: (n: number) => `${n} photos sélectionnées`,
    selectedExcelSingle: (n: number) => `${n} fichier sélectionné`,
    selectedExcelPlural: (n: number) => `${n} fichiers sélectionnés`,
    deleteAll: 'Tout supprimer',
    add: 'Ajouter',
    uploading: 'Envoi en cours…',
    processing: 'Traitement des fichiers, veuillez patienter…',
    sendBtn: (n: number) => `Envoyer ${n} photo${n > 1 ? 's' : ''}`,
    sendExcelBtn: (n: number) => `Envoyer ${n} fichier${n > 1 ? 's' : ''}`,
    successTitle: 'Fichiers envoyés',
    successDesc: (n: number) => `${n} fichier${n > 1 ? 's ont été envoyés' : ' a été envoyé'} avec succès.`,
    sendMore: "Envoyer d'autres fichiers",
    errorTitle: "Échec de l'envoi",
    errorDesc: "Une erreur est survenue lors de l'envoi des fichiers.",
    retry: 'Réessayer',
    tabUpload: 'Envoyer des fichiers',
    tabGallery: 'Voir les envois',
  },
  zh: {
    back: '返回首页',
    title: '上传文件',
    company: 'Continental Express Cargo',
    lockTitle: '访问受保护',
    lockSubtitle: '请输入访问码以上传文件。',
    codeLabel: '访问码：',
    codePlaceholder: '请输入访问码',
    validate: '确认',
    codeError: '访问码错误，请重试。',
    tagTitle: '文件分类',
    tagSubtitle: '请选择您要发送的文件类型。',
    tagRequired: '请先选择一个分类再继续。',
    tags: {
      reception_marchandise: { label: '货物收货', desc: '在仓库收到货物时拍摄的照片' },
      constat_anomalie: { label: '异常情况', desc: '记录损坏或异常情况的照片' },
      chargement_conteneur: { label: '集装箱装载', desc: '发货前装载货物的照片' },
      inventaire_depot: { label: '仓库盘点', desc: '仓库盘点 Excel 文件（.xlsx / .xls）' },
    },
    dropTitle: '将照片拖放到此处',
    dropExcelTitle: '将 Excel 文件拖放到此处',
    dropRelease: '松开以添加',
    dropOr: '或',
    dropClick: '点击选择文件',
    dropFormats: 'JPG、PNG、WEBP、HEIC — 支持多文件',
    dropExcelFormats: '支持 .xlsx 和 .xls 文件',
    selectedSingle: (n: number) => `已选择 ${n} 张照片`,
    selectedPlural: (n: number) => `已选择 ${n} 张照片`,
    selectedExcelSingle: (n: number) => `已选择 ${n} 个文件`,
    selectedExcelPlural: (n: number) => `已选择 ${n} 个文件`,
    deleteAll: '全部删除',
    add: '添加',
    uploading: '上传中…',
    processing: '正在处理文件，请稍候…',
    sendBtn: (n: number) => `发送 ${n} 张照片`,
    sendExcelBtn: (n: number) => `发送 ${n} 个文件`,
    successTitle: '文件已发送',
    successDesc: (n: number) => `${n} 个文件已成功上传。`,
    sendMore: '发送更多文件',
    errorTitle: '发送失败',
    errorDesc: '上传文件时发生错误。',
    retry: '重试',
    tabUpload: '上传文件',
    tabGallery: '查看已发送',
  },
};

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

function compressImage(file: File, maxDimension = 1920, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        resolve(file);
        return;
      }
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: file.lastModified }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

const TAG_CONFIG: Record<PhotoTag, { icon: React.ReactNode; color: string; border: string; bg: string; activeBorder: string; activeBg: string; iconColor: string }> = {
  reception_marchandise: {
    icon: <PackageCheck className="w-6 h-6" />,
    color: 'text-emerald-700',
    border: 'border-gray-200',
    bg: 'bg-white',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  constat_anomalie: {
    icon: <ShieldAlert className="w-6 h-6" />,
    color: 'text-orange-700',
    border: 'border-gray-200',
    bg: 'bg-white',
    activeBorder: 'border-orange-500',
    activeBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  chargement_conteneur: {
    icon: <Container className="w-6 h-6" />,
    color: 'text-blue-700',
    border: 'border-gray-200',
    bg: 'bg-white',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  inventaire_depot: {
    icon: <FileSpreadsheet className="w-6 h-6" />,
    color: 'text-teal-700',
    border: 'border-gray-200',
    bg: 'bg-white',
    activeBorder: 'border-teal-500',
    activeBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
};

const ALL_TAGS: PhotoTag[] = ['reception_marchandise', 'constat_anomalie', 'chargement_conteneur', 'inventaire_depot'];

export default function UploadPage({ onNavigate }: UploadPageProps) {
  const [lang, setLang] = useState<Lang>('fr');
  const [unlocked, setUnlocked] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [expectedCode, setExpectedCode] = useState('');
  const [selectedTag, setSelectedTag] = useState<PhotoTag | null>(null);
  const [showTagError, setShowTagError] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');

  // Photo state
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Excel state
  const [excelFiles, setExcelFiles] = useState<ExcelFile[]>([]);
  const [isExcelDragging, setIsExcelDragging] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const t = T[lang];
  const isExcelMode = selectedTag === 'inventaire_depot';

  useEffect(() => {
    supabase
      .from('company_settings')
      .select('upload_code')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.upload_code) setExpectedCode(data.upload_code);
      });
  }, []);

  const handleCodeValidate = () => {
    if (codeInput === expectedCode) {
      setUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const addFiles = useCallback(async (incoming: FileList | File[]) => {
    const imageFiles = Array.from(incoming).filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    const compressed = await Promise.all(imageFiles.map(f => compressImage(f)));
    const newPreviews: PreviewFile[] = compressed.map(f => ({
      id: `${f.name}-${f.lastModified}-${Math.random()}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setFiles(prev => [...prev, ...newPreviews]);
    setUploadStatus('idle');
    setProgress(0);
  }, []);

  const addExcelFiles = useCallback((incoming: FileList | File[]) => {
    const xlsFiles = Array.from(incoming).filter(f =>
      EXCEL_MIME_TYPES.includes(f.type) ||
      f.name.endsWith('.xlsx') ||
      f.name.endsWith('.xls')
    );
    if (!xlsFiles.length) return;
    const newFiles: ExcelFile[] = xlsFiles.map(f => ({
      id: `${f.name}-${f.lastModified}-${Math.random()}`,
      file: f,
    }));
    setExcelFiles(prev => [...prev, ...newFiles]);
    setUploadStatus('idle');
    setProgress(0);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const removeExcelFile = useCallback((id: string) => {
    setExcelFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleExcelDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsExcelDragging(true);
  };

  const handleExcelDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsExcelDragging(false);
    }
  };

  const handleExcelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsExcelDragging(false);
    addExcelFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleExcelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addExcelFiles(e.target.files);
    e.target.value = '';
  };

  const handleUpload = async () => {
    const activeFiles = isExcelMode ? excelFiles.map(f => f.file) : files.map(f => f.file);
    if (!activeFiles.length) return;
    if (!selectedTag) {
      setShowTagError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowTagError(false);
    setUploadStatus('uploading');
    setProgress(0);

    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
      simulatedProgress = Math.min(simulatedProgress + Math.random() * 8 + 2, 90);
      setProgress(Math.round(simulatedProgress));
    }, 400);

    try {
      const formData = new FormData();
      for (const file of activeFiles) {
        formData.append('files', file);
      }
      formData.append('tag', selectedTag);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/upload-photos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(err.error ?? "Erreur lors de l'envoi");
      }

      setProgress(100);
      setTimeout(() => setUploadStatus('done'), 300);
    } catch (err) {
      clearInterval(progressInterval);
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setErrorMessage(msg);
      setUploadStatus('error');
      setProgress(0);
      console.error('Upload error:', err);
    }
  };

  const reset = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setExcelFiles([]);
    setUploadStatus('idle');
    setProgress(0);
    setErrorMessage(null);
    setSelectedTag(null);
    setShowTagError(false);
  };

  const handleTagSelect = (tag: PhotoTag) => {
    if (tag !== selectedTag) {
      // Clear files when switching tag type
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
      setFiles([]);
      setExcelFiles([]);
      setUploadStatus('idle');
      setProgress(0);
    }
    setSelectedTag(tag);
    setShowTagError(false);
  };

  const isUploading = uploadStatus === 'uploading';
  const isDone = uploadStatus === 'done';
  const isError = uploadStatus === 'error';
  const activeFileCount = isExcelMode ? excelFiles.length : files.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <button
            onClick={() => onNavigate?.('home')}
            className="inline-flex items-center space-x-2 text-gray-500 hover:text-gray-800 transition-colors duration-200 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Language toggle */}
            <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
              <button
                onClick={() => setLang('fr')}
                className={`px-3 py-1.5 transition-colors duration-150 ${
                  lang === 'fr' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                FR
              </button>
              <button
                onClick={() => setLang('zh')}
                className={`px-3 py-1.5 transition-colors duration-150 ${
                  lang === 'zh' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                中文
              </button>
            </div>

            <div className="text-right">
              <h1 className="text-lg font-bold text-gray-900">{t.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{t.company}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Code gate */}
        {!unlocked && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{t.lockTitle}</h2>
            <p className="text-sm text-gray-400 mb-8">{t.lockSubtitle}</p>
            <div className="w-full max-w-sm space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">{t.codeLabel}</label>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => { setCodeInput(e.target.value); setCodeError(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCodeValidate()}
                  className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono tracking-widest transition-colors ${codeError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder={t.codePlaceholder}
                  autoFocus
                />
                <button
                  onClick={handleCodeValidate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  {t.validate}
                </button>
              </div>
              {codeError && (
                <p className="text-xs text-red-500 pl-[72px]">{t.codeError}</p>
              )}
            </div>
          </div>
        )}

        {/* Upload content */}
        {unlocked && (
        <>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            {t.tabUpload}
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'gallery'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Images className="w-4 h-4" />
            {t.tabGallery}
          </button>
        </div>

        {/* Gallery tab */}
        {activeTab === 'gallery' && <UploadGallery lang={lang} />}

        {/* Upload tab */}
        {activeTab === 'upload' && (<>

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.errorTitle}</h2>
            <p className="text-gray-500 mb-4 max-w-sm">{t.errorDesc}</p>
            {errorMessage && (
              <div className="mb-6 max-w-md bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-xs font-mono text-red-700 break-all">{errorMessage}</p>
              </div>
            )}
            <button
              onClick={() => { setUploadStatus('idle'); setProgress(0); setErrorMessage(null); }}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
            >
              <Upload className="w-4 h-4" />
              <span>{t.retry}</span>
            </button>
          </div>
        )}

        {/* Success state */}
        {!isError && isDone ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.successTitle}</h2>
            <p className="text-gray-500 mb-8 max-w-sm">{t.successDesc(activeFileCount || 1)}</p>
            <button
              onClick={reset}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
            >
              <Upload className="w-4 h-4" />
              <span>{t.sendMore}</span>
            </button>
          </div>
        ) : !isError && (
          <>
            {/* Tag selection */}
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">{t.tagTitle}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{t.tagSubtitle}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ALL_TAGS.map((tag) => {
                  const cfg = TAG_CONFIG[tag];
                  const isActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagSelect(tag)}
                      disabled={isUploading}
                      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 focus:outline-none
                        ${isActive
                          ? `${cfg.activeBorder} ${cfg.activeBg} shadow-sm`
                          : `${cfg.border} ${cfg.bg} hover:border-gray-300 hover:bg-gray-50`
                        }
                        ${isUploading ? 'opacity-60 pointer-events-none' : ''}
                      `}
                    >
                      <div className={`mt-0.5 flex-shrink-0 ${isActive ? cfg.iconColor : 'text-gray-400'} transition-colors duration-200`}>
                        {cfg.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold transition-colors duration-200 ${isActive ? cfg.color : 'text-gray-700'}`}>
                          {t.tags[tag].label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{t.tags[tag].desc}</p>
                      </div>
                      {isActive && (
                        <div className={`absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center ${cfg.activeBorder.replace('border-', 'bg-')}`}>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {showTagError && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {t.tagRequired}
                </p>
              )}
            </div>

            {/* Photo drop zone */}
            {!isExcelMode && (
              <>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && inputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 select-none
                    ${isUploading ? 'pointer-events-none opacity-60' : ''}
                    ${isDragging
                      ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                      : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'
                    }
                    ${files.length > 0 ? 'py-10' : 'py-20'}
                  `}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleInputChange}
                  />
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-200 ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <ImagePlus className={`w-8 h-8 transition-colors duration-200 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-1">
                    {isDragging ? t.dropRelease : t.dropTitle}
                  </p>
                  <p className="text-sm text-gray-400">
                    {t.dropOr} <span className="text-blue-500 font-medium">{t.dropClick}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-3">{t.dropFormats}</p>
                </div>

                {/* Photo preview grid */}
                {files.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-gray-700">
                        {files.length > 1 ? t.selectedPlural(files.length) : t.selectedSingle(files.length)}
                      </p>
                      {!isUploading && (
                        <button
                          onClick={reset}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors duration-200"
                        >
                          {t.deleteAll}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {files.map(({ id, file, previewUrl }) => (
                        <div key={id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />
                          {!isUploading && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeFile(id); }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-red-50"
                            >
                              <X className="w-3.5 h-3.5 text-gray-600 hover:text-red-500" />
                            </button>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <p className="text-white text-[10px] font-medium truncate">{file.name}</p>
                            <p className="text-white/70 text-[10px]">{(file.size / 1024).toFixed(0)} Ko</p>
                          </div>
                        </div>
                      ))}
                      {!isUploading && (
                        <button
                          onClick={() => inputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 flex flex-col items-center justify-center transition-all duration-200 text-gray-400 hover:text-blue-500"
                        >
                          <ImagePlus className="w-6 h-6 mb-1" />
                          <span className="text-[11px] font-medium">{t.add}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Excel drop zone */}
            {isExcelMode && (
              <>
                <div
                  onDragOver={handleExcelDragOver}
                  onDragLeave={handleExcelDragLeave}
                  onDrop={handleExcelDrop}
                  onClick={() => !isUploading && excelInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 select-none
                    ${isUploading ? 'pointer-events-none opacity-60' : ''}
                    ${isExcelDragging
                      ? 'border-teal-500 bg-teal-50 scale-[1.01]'
                      : 'border-gray-300 bg-white hover:border-teal-400 hover:bg-teal-50/40'
                    }
                    ${excelFiles.length > 0 ? 'py-10' : 'py-20'}
                  `}
                >
                  <input
                    ref={excelInputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    className="hidden"
                    onChange={handleExcelInputChange}
                  />
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-200 ${isExcelDragging ? 'bg-teal-100' : 'bg-gray-100'}`}>
                    <FileSpreadsheet className={`w-8 h-8 transition-colors duration-200 ${isExcelDragging ? 'text-teal-500' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-1">
                    {isExcelDragging ? t.dropRelease : t.dropExcelTitle}
                  </p>
                  <p className="text-sm text-gray-400">
                    {t.dropOr} <span className="text-teal-500 font-medium">{t.dropClick}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-3">{t.dropExcelFormats}</p>
                </div>

                {/* Excel file list */}
                {excelFiles.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-gray-700">
                        {excelFiles.length > 1 ? t.selectedExcelPlural(excelFiles.length) : t.selectedExcelSingle(excelFiles.length)}
                      </p>
                      {!isUploading && (
                        <button
                          onClick={() => setExcelFiles([])}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors duration-200"
                        >
                          {t.deleteAll}
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {excelFiles.map(({ id, file }) => (
                        <div key={id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} Ko</p>
                          </div>
                          {!isUploading && (
                            <button
                              onClick={() => removeExcelFile(id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!isUploading && (
                        <button
                          onClick={() => excelInputRef.current?.click()}
                          className="w-full flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-teal-400 hover:bg-teal-50/40 rounded-xl px-4 py-3 transition-all duration-200 text-gray-400 hover:text-teal-600"
                        >
                          <FileSpreadsheet className="w-5 h-5" />
                          <span className="text-sm font-medium">{t.add}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Progress bar */}
            {isUploading && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">{t.uploading}</p>
                  <p className="text-sm font-semibold text-blue-600">{progress}%</p>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center space-x-2 text-xs text-gray-400">
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>{t.processing}</span>
                </div>
              </div>
            )}

            {/* Submit button */}
            {activeFileCount > 0 && !isUploading && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleUpload}
                  className={`inline-flex items-center space-x-2 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-md
                    ${selectedTag
                      ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                >
                  <Upload className="w-5 h-5" />
                  <span>{isExcelMode ? t.sendExcelBtn(activeFileCount) : t.sendBtn(activeFileCount)}</span>
                </button>
              </div>
            )}
          </>
        )}

        </>)} {/* end activeTab === 'upload' */}

        </>
        )}
      </div>
    </div>
  );
}
