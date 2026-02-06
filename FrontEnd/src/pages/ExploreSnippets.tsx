import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { snippetsApi } from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Prism as SyntaxHighlighterBase } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Fix for TypeScript compatibility
const SyntaxHighlighter = SyntaxHighlighterBase as any;

// ─── Types ───────────────────────────────────────────────────────────────────

interface SnippetUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

interface PublicSnippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  user: SnippetUser;
}

interface PaginatedSnippetsResponse {
  data: PublicSnippet[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Language filter ─────────────────────────────────────────────────────────

function LanguageSidebar({
  languages,
  selectedLanguage,
  onSelect,
}: {
  languages: { name: string; count: number }[];
  selectedLanguage: string | null;
  onSelect: (lang: string | null) => void;
}) {
  return (
    <aside className="w-full lg:w-64 lg:min-w-[16rem] shrink-0">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Filter by Language
        </h2>

        {/* Clear filter */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2 ${
            selectedLanguage === null
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Languages
        </button>

        <div className="border-t border-gray-100 pt-2 space-y-1 max-h-80 overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.name}
              onClick={() => onSelect(lang.name)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                selectedLanguage === lang.name
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="capitalize">{lang.name}</span>
              <span className="text-xs text-gray-400">{lang.count}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── Snippet card ────────────────────────────────────────────────────────────

function SnippetCard({ snippet }: { snippet: PublicSnippet }) {
  const [copied, setCopied] = useState(false);

  const createdDate = new Date(snippet.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-1">{snippet.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <Link
                to={`/${snippet.user.username}`}
                className="flex items-center gap-1.5 hover:text-primary-600 transition-colors"
              >
                {snippet.user.avatar ? (
                  <img
                    src={snippet.user.avatar}
                    alt={snippet.user.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-[10px]">
                      {snippet.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                @{snippet.user.username}
              </Link>
              <span>•</span>
              <span>{createdDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 capitalize">
              {snippet.language}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Copy code"
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {snippet.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{snippet.description}</p>
        )}
      </div>

      {/* Code */}
      <div className="max-h-64 overflow-auto">
        <SyntaxHighlighter
          language={snippet.language}
          style={oneDark}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '0.813rem',
          }}
        >
          {snippet.code}
        </SyntaxHighlighter>
      </div>
    </article>
  );
}

// ─── Explore Snippets page ───────────────────────────────────────────────────

const SNIPPETS_PER_PAGE = 12;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ExploreSnippets() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchInput.trim(), 300);

  // Sync URL with search
  useEffect(() => {
    if (debouncedSearch) {
      setSearchParams({ q: debouncedSearch });
    } else {
      setSearchParams({});
    }
  }, [debouncedSearch, setSearchParams]);

  // Fetch public snippets with search
  const { data: snippetsData, isLoading, error } = useQuery<PaginatedSnippetsResponse>({
    queryKey: ['snippets', 'public', 'explore', debouncedSearch],
    queryFn: () => snippetsApi.getPublic({ search: debouncedSearch || undefined, limit: 50 }).then((r) => r.data),
  });

  const publicSnippets = snippetsData?.data;

  // Build language list with counts
  const languages = useMemo(() => {
    if (!publicSnippets) return [];
    const counts = new Map<string, number>();
    publicSnippets.forEach((snippet) =>
      counts.set(snippet.language, (counts.get(snippet.language) ?? 0) + 1),
    );
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [publicSnippets]);

  // Filter by language and sort by date
  const filteredSnippets = useMemo(() => {
    if (!publicSnippets) return [];
    let filtered = publicSnippets;
    if (selectedLanguage) {
      filtered = filtered.filter((s) => s.language === selectedLanguage);
    }
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [publicSnippets, selectedLanguage]);

  // Pagination
  const totalPages = Math.ceil(filteredSnippets.length / SNIPPETS_PER_PAGE);
  const paginatedSnippets = useMemo(() => {
    const start = (page - 1) * SNIPPETS_PER_PAGE;
    return filteredSnippets.slice(start, start + SNIPPETS_PER_PAGE);
  }, [filteredSnippets, page]);

  // Reset to page 1 when filter changes
  const handleLanguageSelect = (lang: string | null) => {
    setSelectedLanguage(lang);
    setPage(1);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput('');
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
          <span className="text-gray-900 font-medium">Explore Snippets</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Snippets</h1>
        <p className="text-gray-600 mb-6">
          Browse code snippets shared by the developer community
        </p>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search snippets by title, code, or description..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {debouncedSearch && (
            <p className="mt-2 text-sm text-gray-500">
              Showing results for "<span className="font-medium text-gray-700">{debouncedSearch}</span>"
              {snippetsData?.total !== undefined && ` (${snippetsData.total} ${snippetsData.total === 1 ? 'result' : 'results'})`}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600">Failed to load snippets</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <LanguageSidebar
              languages={languages}
              selectedLanguage={selectedLanguage}
              onSelect={handleLanguageSelect}
            />

            {/* Snippet list */}
            <div className="flex-1 min-w-0">
              {/* Active filter indicator */}
              {selectedLanguage && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <span>Showing snippets in</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-medium text-xs capitalize">
                    {selectedLanguage}
                  </span>
                  <button
                    onClick={() => handleLanguageSelect(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear filter"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {paginatedSnippets.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                  <h3 className="mt-4 text-sm font-medium text-gray-900">No snippets found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedLanguage
                      ? `No public snippets in ${selectedLanguage}.`
                      : 'No public code snippets available.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedSnippets.map((snippet) => (
                    <SnippetCard key={snippet.id} snippet={snippet} />
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
              {filteredSnippets.length > 0 && (
                <p className="mt-4 text-center text-xs text-gray-400">
                  Showing {paginatedSnippets.length} of {filteredSnippets.length} public {filteredSnippets.length === 1 ? 'snippet' : 'snippets'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
