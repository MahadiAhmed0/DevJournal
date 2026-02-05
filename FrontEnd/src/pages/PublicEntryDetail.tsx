import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entriesApi } from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import { useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tag {
  id: string;
  name: string;
}

interface EntryUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

interface PublicEntry {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  user?: EntryUser;
}

// ─── Public entry detail page ────────────────────────────────────────────────

export default function PublicEntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: entry, isLoading, error } = useQuery<PublicEntry>({
    queryKey: queryKeys.entries.detail(id || ''),
    queryFn: () => entriesApi.getOne(id!).then((r) => r.data),
    enabled: !!id,
  });

  const summarizeMutation = useMutation({
    mutationFn: () => entriesApi.summarize(id!).then((r) => r.data as PublicEntry),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.entries.detail(id || ''), updated);
    },
  });

  useEffect(() => {
    if (entry) Prism.highlightAll();
  }, [entry]);

  const isOwner = user && entry && user.id === entry.userId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">
            DevJournal
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              &larr; Back
            </button>
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            Entry not found or is private.
          </div>
        )}

        {/* Entry */}
        {!isLoading && !error && entry && (
          <>
            {/* Author info */}
            {entry.user && (
              <div className="flex items-center gap-3 mb-6">
                <Link to={`/${entry.user.username}`} className="shrink-0">
                  {entry.user.avatar ? (
                    <img
                      src={entry.user.avatar}
                      alt={entry.user.name}
                      className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-primary-300 transition-shadow"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg font-bold text-white hover:ring-2 hover:ring-primary-300 transition-shadow">
                      {entry.user.name[0]?.toUpperCase()}
                    </div>
                  )}
                </Link>
                <div>
                  <Link
                    to={`/${entry.user.username}`}
                    className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {entry.user.name}
                  </Link>
                  <p className="text-sm text-gray-500">@{entry.user.username}</p>
                </div>
              </div>
            )}

            {/* Title + meta */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{entry.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
                <time>
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                {entry.updatedAt !== entry.createdAt && (
                  <span className="text-gray-400">
                    (edited {new Date(entry.updatedAt).toLocaleDateString()})
                  </span>
                )}
              </div>

              {/* Tags */}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {entry.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/tags/${tag.name}`}
                      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* AI Summary */}
            <div className="mb-6 bg-violet-50 border border-violet-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-violet-800 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  AI Summary
                </h2>
                {isOwner && (
                  <button
                    onClick={() => summarizeMutation.mutate()}
                    disabled={summarizeMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-white border border-violet-300 rounded-md hover:bg-violet-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {summarizeMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-violet-600 border-t-transparent" />
                        Generating...
                      </>
                    ) : entry.summary ? (
                      'Regenerate'
                    ) : (
                      'Generate Summary'
                    )}
                  </button>
                )}
              </div>
              {summarizeMutation.isError && (
                <p className="text-xs text-red-600 mb-2">Failed to generate summary. Please try again.</p>
              )}
              {entry.summary ? (
                <p className="text-sm text-violet-900 leading-relaxed">{entry.summary}</p>
              ) : (
                <p className="text-sm text-violet-600 italic">
                  {isOwner
                    ? 'No summary yet. Click "Generate Summary" to create an AI-powered summary.'
                    : 'No AI summary available for this entry yet.'}
                </p>
              )}
            </div>

            {/* Entry content */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <div className="prose prose-sm sm:prose max-w-none">
                <ReactMarkdown>{entry.content}</ReactMarkdown>
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="mt-6 flex items-center gap-3">
                <Link
                  to={`/entries/${entry.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Edit Entry
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
