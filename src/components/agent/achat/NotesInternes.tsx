import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { useNotesInternes } from '../../../hooks/useNotesInternes';

interface NotesInternesProps {
  demandeAchatId: number;
  currentUserId: string | null;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function NotesInternes({ demandeAchatId, currentUserId }: NotesInternesProps) {
  const { notes, loading, createNote, isSending } = useNotesInternes(demandeAchatId);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    const text = message.trim();
    setMessage('');
    await createNote(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-700">Notes internes</h4>
        {notes.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">{notes.length} message{notes.length > 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '320px' }}>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && notes.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucune note pour l'instant</p>
            <p className="text-xs text-gray-300 mt-1">Soyez le premier à ajouter une note</p>
          </div>
        )}

        {notes.map((note) => {
          const isOwn = note.auteur_id === currentUserId;
          const authorName = note.auteur?.full_name || note.auteur?.email || 'Inconnu';
          const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

          const avatarUrl = note.auteur?.profile_picture_url;

          return (
            <div
              key={note.id}
              className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={authorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center text-xs font-bold ${
                      isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {initials}
                  </div>
                )}
              </div>
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-xs font-medium text-gray-600">
                    {isOwn ? 'Vous' : authorName}
                  </span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(note.created_at)}</span>
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  {note.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire une note interne... (Entrée pour envoyer)"
            rows={2}
            disabled={isSending}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
