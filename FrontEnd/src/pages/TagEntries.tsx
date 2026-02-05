import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tagsApi } from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';

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
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  user: EntryUser;
}

interface TagEntriesResponse {
  tag: { id: string; name: string };
  data: PublicEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Entry card ──────────────────────────────────────────────────────────────

function EntryCard({ entry }: { entry: PublicEntry }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Author avatar */}
        <Link to={`/${entry.user.username}`} className="shrink-0">
          {entry.user.avatar ? (
            <img
              src={entry.user.avatar}
              alt={entry.user.name}
              className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-primary-300 transition-shadow"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-bold text-white hover:ring-2 hover:ring-primary-300 transition-shadow">
              {entry.user.name[0]?.toUpperCase()}
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          {/* Title */}
          <Link to={`/entry/${entry.id}`} className="block">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 hover:text-primary-600 transition-colors">{entry.title}</h3>
          </Link>

          {/* Author + date */}
          <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
            <Link
              to={`/${entry.user.username}`}
              className="font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              @{entry.user.username}
            </Link>
            <span className="text-gray-300">&middot;</span>
            <time>
              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>

          {/* Summary or content preview */}
          {entry.summary ? (
            <div className="mt-2 flex items-start gap-2">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-xs font-medium shrink-0 mt-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI
              </span>
              <p className="text-sm text-gray-600 line-clamp-2">{entry.summary}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{entry.content}</p>
          )}

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/tags/${tag.name}`}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tag entries page ────────────────────────────────────────────────────────

export default function TagEntries() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<TagEntriesResponse>({
    queryKey: queryKeys.tags.entries(slug || '', page),
    queryFn: () => tagsApi.getEntries(slug!, { page, limit: 10 }).then((r) => r.data),
    enabled: !!slug,
  });

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
        {/* Tag heading */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-100 text-primary-800 text-lg font-semibold">
              #{slug}
            </span>
          </div>
          {data && (
            <p className="text-sm text-gray-500 mt-2">
              {data.total} public {data.total === 1 ? 'entry' : 'entries'} tagged with &ldquo;{data.tag.name}&rdquo;
            </p>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            Tag not found or failed to load entries.
          </div>
        )}

        {/* Entries */}
        {!isLoading && !error && data && (
          <>
            {data.data.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                <h3 className="mt-4 text-sm font-medium text-gray-900">No entries yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No public entries with this tag.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.data.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
