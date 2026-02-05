import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useEntry, useCreateEntry, useUpdateEntry } from '@/hooks/useEntries';

// ─── Markdown editor with live preview ───────────────────────────────────────

export default function EntryForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Load existing entry when editing
  const { data: existing, isLoading: loadingEntry } = useEntry(isEditing ? id : undefined);

  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry(id || '');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [previewMode, setPreviewMode] = useState<'write' | 'preview' | 'split'>('write');
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setContent(existing.content);
      setIsPublic(existing.isPublic);
      setTagInput(existing.tags.map((t) => t.name).join(', '));
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
      if (!content.trim()) {
        setError('Content is required');
        return;
      }

      try {
        const parsedTags = tagInput
          .split(',')
          .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
          .filter(Boolean);

        if (isEditing) {
          await updateMutation.mutateAsync({ title, content, isPublic, tags: parsedTags });
        } else {
          await createMutation.mutateAsync({ title, content, isPublic, tags: parsedTags });
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
    [title, content, isPublic, tagInput, isEditing, createMutation, updateMutation],
  );

  if (isEditing && loadingEntry) {
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
          <Link to="/entries" className="text-sm text-gray-500 hover:text-gray-700">
            &larr; Back to Entries
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {isEditing ? 'Edit Entry' : 'New Entry'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your entry a title..."
            maxLength={200}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>

        {/* Public / Private toggle */}
        <div className="mb-4 flex items-center gap-3">
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

        {/* Tags */}
        <div className="mb-4">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="e.g. react, typescript, devops (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">
            Comma-separated. Only letters, numbers, hyphens, and underscores allowed.
          </p>
        </div>

        {/* Editor toolbar */}
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Content (Markdown)</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs">
            {(['write', 'split', 'preview'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPreviewMode(mode)}
                className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                  previewMode === mode
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Editor / Preview area */}
        <div
          className={`border border-gray-300 rounded-lg overflow-hidden ${
            previewMode === 'split' ? 'grid grid-cols-2 divide-x divide-gray-300' : ''
          }`}
          style={{ minHeight: '400px' }}
        >
          {/* Write pane */}
          {(previewMode === 'write' || previewMode === 'split') && (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your entry in Markdown..."
              className="w-full h-full min-h-[400px] p-4 text-sm font-mono resize-y focus:outline-none bg-white"
            />
          )}

          {/* Preview pane */}
          {(previewMode === 'preview' || previewMode === 'split') && (
            <div className="p-4 overflow-y-auto bg-gray-50 min-h-[400px]">
              {content.trim() ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Nothing to preview yet...</p>
              )}
            </div>
          )}
        </div>

        {/* Markdown tips */}
        <p className="mt-2 text-xs text-gray-400">
          Supports Markdown: **bold**, *italic*, # headings, ```code blocks```, [links](url), and more.
        </p>

        {/* Submit */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            )}
            {isEditing ? 'Save Changes' : 'Create Entry'}
          </button>
          <Link
            to={isEditing ? `/entries/${id}` : '/entries'}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
