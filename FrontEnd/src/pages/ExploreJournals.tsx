import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { entriesApi } from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description: string | null;
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
  snippets?: Snippet[];
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
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2 ${
            selectedTag === null
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Entries
        </button>

        <div className="border-t border-gray-100 pt-2 space-y-1 max-h-80 overflow-y-auto">
          {tags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => onSelect(tag.name)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                selectedTag === tag.name
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{tag.name}</span>
              <span className="text-xs text-gray-400">{tag.count}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── Entry card ──────────────────────────────────────────────────────────────

function EntryCard({ entry }: { entry: PublicEntry }) {
  const [expanded, setExpanded] = useState(false);

  const createdDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const preview = entry.content.slice(0, 200);
  const hasMore = entry.content.length > 200;

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Link to={`/${entry.user.username}`} className="shrink-0">
          {entry.user.avatar ? (
            <img
              src={entry.user.avatar}
              alt={entry.user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-sm">
                {entry.user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={`/entry/${entry.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1"
          >
            {entry.title}
          </Link>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link to={`/${entry.user.username}`} className="hover:text-primary-600">
              @{entry.user.username}
            </Link>
            <span>•</span>
            <span>{createdDate}</span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {entry.summary && (
        <div className="mb-3 px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="flex items-center gap-1.5 text-xs text-purple-600 font-medium mb-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            AI Summary
          </div>
          <p className="text-sm text-gray-700">{entry.summary}</p>
        </div>
      )}

      {/* Content preview */}
      <div className="prose prose-sm prose-gray max-w-none mb-3">
        {expanded ? (
          <ReactMarkdown
            components={{
              code(props) {
                const { children, className, ...rest } = props;
                const match = /language-(\w+)/.exec(className || '');
                const inline = !match;
                return inline ? (
                  <code className={className} {...rest}>
                    {children}
                  </code>
                ) : (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                );
              },
            }}
          >
            {entry.content}
          </ReactMarkdown>
        ) : (
          <p className="text-gray-600 text-sm">
            {preview}
            {hasMore && '...'}
          </p>
        )}
      </div>

      {/* Expand/collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-3"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {entry.tags.map((tag) => (
            <Link
              key={tag.id}
              to={`/tags/${tag.name}`}
              className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Snippets count */}
      {entry.snippets && entry.snippets.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {entry.snippets.length} code snippet{entry.snippets.length !== 1 ? 's' : ''} attached
          </span>
        </div>
      )}
    </article>
  );
}

// ─── Explore Journals page ───────────────────────────────────────────────────

const ENTRIES_PER_PAGE = 10;

export default function ExploreJournals() {
  const { user } = useAuth();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Fetch all public entries
  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ['entries', 'public', 'explore'],
    queryFn: () => entriesApi.getAll({ limit: 50 }).then((r) => r.data),
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

  // Pagination
  const totalPages = Math.ceil(sortedEntries.length / ENTRIES_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * ENTRIES_PER_PAGE;
    return sortedEntries.slice(start, start + ENTRIES_PER_PAGE);
  }, [sortedEntries, page]);

  // Reset to page 1 when tag filter changes
  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setPage(1);
  };

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
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-900 font-medium">Explore Journals</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Journals</h1>
        <p className="text-gray-600 mb-8">
          Discover learning journeys and insights from the developer community
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600">Failed to load entries</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <TagSidebar
              tags={allTags}
              selectedTag={selectedTag}
              onSelect={handleTagSelect}
            />

            {/* Entry list */}
            <div className="flex-1 min-w-0">
              {/* Active filter indicator */}
              {selectedTag && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <span>Showing entries tagged</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-medium text-xs">
                    {selectedTag}
                  </span>
                  <button
                    onClick={() => handleTagSelect(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear filter"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {paginatedEntries.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <h3 className="mt-4 text-sm font-medium text-gray-900">No entries found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedTag
                      ? `No public entries with tag "${selectedTag}".`
                      : 'No public journal entries available.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Total count */}
              {sortedEntries.length > 0 && (
                <p className="mt-4 text-center text-xs text-gray-400">
                  Showing {paginatedEntries.length} of {sortedEntries.length} public {sortedEntries.length === 1 ? 'entry' : 'entries'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
