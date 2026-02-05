import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useSnippet,
  useCreateSnippet,
  useUpdateSnippet,
  useMyEntriesForSelect,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  type SupportedLanguage,
} from '@/hooks/useSnippets';

export default function SnippetForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Load existing snippet when editing
  const { data: existing, isLoading: loadingSnippet } = useSnippet(isEditing ? id : undefined);

  // Load entries for "link to entry" dropdown
  const { data: entries } = useMyEntriesForSelect();

  const createMutation = useCreateSnippet();
  const updateMutation = useUpdateSnippet(id || '');

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<string>('typescript');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [entryId, setEntryId] = useState<string>('');
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setCode(existing.code);
      setLanguage(existing.language);
      setDescription(existing.description ?? '');
      setIsPublic(existing.isPublic);
      setEntryId(existing.entryId ?? '');
    }
  }, [existing]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!title.trim()) {
        setError('Title is required');
        return;
      }
      if (!code.trim()) {
        setError('Code is required');
        return;
      }

      const payload = {
        title: title.trim(),
        code,
        language,
        description: description.trim() || undefined,
        isPublic,
        entryId: entryId || undefined,
      };

      try {
        if (isEditing) {
          await updateMutation.mutateAsync({
            ...payload,
            entryId: entryId || null,
          });
        } else {
          await createMutation.mutateAsync(payload);
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              'Something went wrong';
        setError(typeof msg === 'string' ? msg : String(msg));
      }
    },
    [title, code, language, description, isPublic, entryId, isEditing, createMutation, updateMutation],
  );

  if (isEditing && loadingSnippet) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/snippets" className="text-sm text-gray-500 hover:text-gray-700">
            &larr; Back to Snippets
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {isEditing ? 'Edit Snippet' : 'New Snippet'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your snippet..."
            maxLength={200}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>

        {/* Language + Public/Private row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Language select */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang as SupportedLanguage]}
                </option>
              ))}
            </select>
          </div>

          {/* Public / Private toggle */}
          <div className="flex items-end pb-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPublic ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {isPublic ? (
                  <span className="text-green-700 font-medium">Public</span>
                ) : (
                  <span className="text-gray-600">Private</span>
                )}{' '}
                — {isPublic ? 'visible to everyone' : 'only you can see this'}
              </span>
            </div>
          </div>
        </div>

        {/* Link to entry */}
        <div>
          <label htmlFor="entryId" className="block text-sm font-medium text-gray-700 mb-1">
            Link to Entry <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            id="entryId"
            value={entryId}
            onChange={(e) => setEntryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
          >
            <option value="">No linked entry</option>
            {entries?.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this snippet..."
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>

        {/* Code editor */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Code
          </label>
          <textarea
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste or write your code here..."
            required
            className="w-full min-h-[300px] px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono bg-gray-50 resize-y"
            spellCheck={false}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            )}
            {isEditing ? 'Save Changes' : 'Create Snippet'}
          </button>
          <Link
            to={isEditing ? `/snippets/${id}` : '/snippets'}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
