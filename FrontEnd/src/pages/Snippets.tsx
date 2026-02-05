import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMySnippets, useDeleteSnippet, LANGUAGE_LABELS, type Snippet } from '@/hooks/useSnippets';

// ─── Language badge ──────────────────────────────────────────────────────────

function LanguageBadge({ language }: { language: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
      {LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS] ?? language}
    </span>
  );
}

// ─── Snippet card ────────────────────────────────────────────────────────────

function SnippetCard({ snippet, onDelete }: { snippet: Snippet; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <Link
            to={`/snippets/${snippet.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1"
          >
            {snippet.title}
          </Link>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <time>{new Date(snippet.createdAt).toLocaleDateString()}</time>
            <LanguageBadge language={snippet.language} />
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                snippet.isPublic ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {snippet.isPublic ? 'Public' : 'Private'}
            </span>
            {snippet.entry && (
              <Link
                to={`/entries/${snippet.entry.id}`}
                className="text-primary-600 hover:underline truncate max-w-[180px]"
                title={snippet.entry.title}
              >
                📎 {snippet.entry.title}
              </Link>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            to={`/snippets/${snippet.id}/edit`}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </Link>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(snippet.id)}
                className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Code preview */}
      <pre className="mt-3 text-xs text-gray-700 bg-gray-50 rounded-md p-3 overflow-x-auto line-clamp-3 font-mono">
        {snippet.code}
      </pre>

      {/* Description */}
      {snippet.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{snippet.description}</p>
      )}
    </div>
  );
}

// ─── Snippets page ───────────────────────────────────────────────────────────

export default function Snippets() {
  const { data, isLoading, error } = useMySnippets();
  const deleteMutation = useDeleteSnippet();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        Failed to load snippets. Please try again.
      </div>
    );
  }

  const snippets: Snippet[] = data ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Snippets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {snippets.length} code {snippets.length === 1 ? 'snippet' : 'snippets'}
          </p>
        </div>
        <Link
          to="/snippets/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Snippet
        </Link>
      </div>

      {/* Empty state */}
      {snippets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-gray-900">No snippets yet</h3>
          <p className="mt-1 text-sm text-gray-500">Save your first code snippet to get started.</p>
          <Link
            to="/snippets/new"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create snippet
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
