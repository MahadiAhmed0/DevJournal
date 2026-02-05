import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import { LANGUAGE_LABELS, getPrismLanguage } from '@/hooks/useSnippets';
import Prism from 'prismjs';
import { useEffect, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tag {
  id: string;
  name: string;
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
}

interface PublicSnippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PublicProfile {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  createdAt: string;
  entries: PublicEntry[];
  snippets: PublicSnippet[];
}

// ─── Tag cloud ───────────────────────────────────────────────────────────────

function TagCloud({ entries }: { entries: PublicEntry[] }) {
  const tagCounts = new Map<string, number>();
  entries.forEach((entry) =>
    entry.tags.forEach((tag) => tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1)),
  );

  if (tagCounts.size === 0) return null;

  const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0]?.[1] ?? 1;

  function sizeClass(count: number) {
    const ratio = count / maxCount;
    if (ratio > 0.75) return 'text-lg font-bold';
    if (ratio > 0.5) return 'text-base font-semibold';
    if (ratio > 0.25) return 'text-sm font-medium';
    return 'text-xs font-medium';
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map(([name, count]) => (
        <span
          key={name}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 ${sizeClass(count)}`}
          title={`${count} ${count === 1 ? 'entry' : 'entries'}`}
        >
          {name}
          <span className="text-primary-400 text-xs font-normal">({count})</span>
        </span>
      ))}
    </div>
  );
}

// ─── Snippet preview with Prism highlighting ─────────────────────────────────

function SnippetPreview({ snippet }: { snippet: PublicSnippet }) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [snippet]);

  const prismLang = getPrismLanguage(snippet.language);
  const langLabel = LANGUAGE_LABELS[snippet.language as keyof typeof LANGUAGE_LABELS] ?? snippet.language;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{snippet.title}</h3>
          {snippet.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{snippet.description}</p>
          )}
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 shrink-0 ml-3">
          {langLabel}
        </span>
      </div>
      {/* Code */}
      <pre className="p-3 overflow-x-auto bg-[#1d1f21] text-sm max-h-48 !m-0 !rounded-none">
        <code ref={codeRef} className={`language-${prismLang}`}>
          {snippet.code}
        </code>
      </pre>
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
        <time>{new Date(snippet.createdAt).toLocaleDateString()}</time>
      </div>
    </div>
  );
}

// ─── Main public profile page ────────────────────────────────────────────────

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<'entries' | 'snippets'>('entries');

  const { data: profile, isLoading, error } = useQuery<PublicProfile>({
    queryKey: queryKeys.users.profile(username || ''),
    queryFn: () => usersApi.getProfile(username!).then((res) => res.data),
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-300 mb-2">404</h1>
          <p className="text-gray-600 mb-4">Developer not found</p>
          <Link to="/login" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
            &larr; Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Profile not found.</p>
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-primary-600">
            DevJournal
          </Link>
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Profile header ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-4xl font-bold text-white shrink-0">
                {profile.name[0]?.toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-500 mt-0.5">@{profile.username}</p>

              {profile.bio && (
                <p className="mt-3 text-gray-700 leading-relaxed">{profile.bio}</p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-gray-500">
                {/* Member since */}
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Member since {memberSince}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  {profile.entries.length} {profile.entries.length === 1 ? 'entry' : 'entries'}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                  {profile.snippets.length} {profile.snippets.length === 1 ? 'snippet' : 'snippets'}
                </span>
              </div>

              {/* Social links */}
              {(profile.githubUrl || profile.linkedinUrl) && (
                <div className="flex items-center gap-3 mt-4">
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tag cloud ──────────────────────────────────────────────── */}
        {profile.entries.some((e) => e.tags.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Topics</h2>
            <TagCloud entries={profile.entries} />
          </div>
        )}

        {/* ── Tabs: Entries | Snippets ────────────────────────────────── */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('entries')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'entries'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Entries ({profile.entries.length})
            </button>
            <button
              onClick={() => setActiveTab('snippets')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'snippets'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Snippets ({profile.snippets.length})
            </button>
          </nav>
        </div>

        {/* ── Tab content ─────────────────────────────────────────────── */}
        {activeTab === 'entries' && (
          <>
            {profile.entries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                <p className="text-sm">No public entries yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {entry.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <time>{new Date(entry.createdAt).toLocaleDateString()}</time>
                      {entry.summary && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">
                          AI Summary
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">{entry.content}</p>
                    {entry.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'snippets' && (
          <>
            {profile.snippets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
                <p className="text-sm">No public snippets yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.snippets.map((snippet) => (
                  <SnippetPreview key={snippet.id} snippet={snippet} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
