import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { entriesApi, tagsApi } from '@/lib/axios';
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

interface PaginatedResponse {
  data: PublicEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Score calculation ───────────────────────────────────────────────────────

function computeScore(entry: PublicEntry): number {
  const now = Date.now();
  const created = new Date(entry.createdAt).getTime();
  const daysSince = (now - created) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.max(0, 7 - daysSince);
  const tagBonus = entry.tags.length;
  const summaryBonus = entry.summary ? 3 : 0;
  return recencyBoost + tagBonus + summaryBonus;
}

// ─── Tag sidebar ─────────────────────────────────────────────────────────────

function TagSidebar({
  tags,
  selectedTag,
  onSelect,
}: {
  tags: { name: string; count: number }[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}) {
  return (
    <aside className="w-full lg:w-64 lg:min-w-[16rem] shrink-0">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Filter by Tag
        </h2>

        {/* Clear filter */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors mb-1 ${
            selectedTag === null
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All tags
        </button>

        <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
          {tags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => onSelect(selectedTag === tag.name ? null : tag.name)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between gap-2 ${
                selectedTag === tag.name
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="truncate">{tag.name}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                  selectedTag === tag.name
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tag.count}
              </span>
            </button>
          ))}
        </div>

        {tags.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">No tags found.</p>
        )}
      </div>
    </aside>
  );
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
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 hover:text-primary-600 transition-colors">
              {entry.title}
            </h3>
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

// ─── Landing page ────────────────────────────────────────────────────────────

export default function Landing() {
  const { user } = useAuth();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Fetch all public entries (large limit to get them all for client-side scoring)
  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ['entries', 'public', 'landing'],
    queryFn: () => entriesApi.getAll({ limit: 50 }).then((r) => r.data),
  });

  // Fetch popular tags
  const { data: popularTags } = useQuery<{ id: string; name: string; entryCount: number }[]>({
    queryKey: ['tags', 'popular'],
    queryFn: () => tagsApi.getPopular(20).then((r) => r.data),
  });

  // Build tag list with counts
  const allTags = useMemo(() => {
    if (!data?.data) return [];
    const counts = new Map<string, number>();
    data.data.forEach((entry) =>
      entry.tags.forEach((tag) => counts.set(tag.name, (counts.get(tag.name) ?? 0) + 1)),
    );
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  // Filter by tag, then sort by score
  const sortedEntries = useMemo(() => {
    if (!data?.data) return [];
    let filtered = data.data;
    if (selectedTag) {
      filtered = filtered.filter((e) => e.tags.some((t) => t.name === selectedTag));
    }
    return [...filtered].sort((a, b) => computeScore(b) - computeScore(a));
  }, [data, selectedTag]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">
            DevJournal
          </Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Developer Journal
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            A community of developers sharing their learnings, code snippets, and insights.
            Read public journal entries or create your own.
          </p>
          {!user && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                to="/register"
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            Failed to load entries. Please try again later.
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Popular tag cloud */}
            {popularTags && popularTags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Popular Topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/tags/${tag.name}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 text-sm font-medium transition-colors"
                    >
                      {tag.name}
                      <span className="text-primary-400 text-xs">({tag.entryCount})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
            {/* Tag sidebar */}
            <TagSidebar tags={allTags} selectedTag={selectedTag} onSelect={setSelectedTag} />

            {/* Entries */}
            <div className="flex-1 min-w-0" style={{ minHeight: '400px' }}>
              {/* Active filter indicator */}
              {selectedTag && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <span>Showing entries tagged</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-medium text-xs">
                    {selectedTag}
                  </span>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear filter"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {sortedEntries.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <h3 className="mt-4 text-sm font-medium text-gray-900">No entries yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedTag
                      ? `No public entries with tag "${selectedTag}".`
                      : 'Be the first to share a public journal entry!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}

              {/* Total count */}
              {sortedEntries.length > 0 && (
                <p className="mt-6 text-center text-xs text-gray-400">
                  Showing {sortedEntries.length} public {sortedEntries.length === 1 ? 'entry' : 'entries'}
                </p>
              )}
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
