import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { snippetsApi, entriesApi } from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import { useNavigate } from 'react-router-dom';

// ─── Supported languages (matches backend) ──────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'java',
  'csharp',
  'cpp',
  'c',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'scala',
  'html',
  'css',
  'scss',
  'sql',
  'bash',
  'shell',
  'json',
  'yaml',
  'xml',
  'markdown',
  'plaintext',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Human-readable labels for languages */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  cpp: 'C++',
  c: 'C',
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  scala: 'Scala',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sql: 'SQL',
  bash: 'Bash',
  shell: 'Shell',
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
  markdown: 'Markdown',
  plaintext: 'Plain Text',
};

/** Prism.js language mapping (some names differ) */
export const PRISM_LANGUAGE_MAP: Record<string, string> = {
  csharp: 'csharp',
  cpp: 'cpp',
  shell: 'bash',
  plaintext: 'text',
};

export function getPrismLanguage(lang: string): string {
  return PRISM_LANGUAGE_MAP[lang] ?? lang;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  entryId: string | null;
  createdAt: string;
  updatedAt: string;
  entry?: { id: string; title: string } | null;
  user?: { id: string; username: string } | null;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useMySnippets() {
  return useQuery<Snippet[]>({
    queryKey: [...queryKeys.snippets.lists(), 'my'],
    queryFn: () => snippetsApi.getMy().then((r) => r.data),
  });
}

export function usePublicSnippets(language?: string) {
  return useQuery<Snippet[]>({
    queryKey: [...queryKeys.snippets.lists(), 'public', { language }],
    queryFn: () => snippetsApi.getPublic(language ? { language } : undefined).then((r) => r.data),
  });
}

export function useSnippet(id: string | undefined) {
  return useQuery<Snippet>({
    queryKey: queryKeys.snippets.detail(id || ''),
    queryFn: () => snippetsApi.getOne(id!).then((r) => r.data),
    enabled: !!id,
  });
}

/** Fetch user's entries for the "link to entry" dropdown */
export function useMyEntriesForSelect() {
  return useQuery<{ id: string; title: string }[]>({
    queryKey: [...queryKeys.entries.lists(), 'select'],
    queryFn: () =>
      entriesApi.getMy({ limit: 50 }).then((r) =>
        (r.data.data ?? r.data).map((e: { id: string; title: string }) => ({
          id: e.id,
          title: e.title,
        })),
      ),
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateSnippet() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: {
      title: string;
      code: string;
      language: string;
      description?: string;
      isPublic?: boolean;
      entryId?: string;
    }) => snippetsApi.create(data).then((r) => r.data as Snippet),
    onSuccess: (snippet) => {
      qc.invalidateQueries({ queryKey: queryKeys.snippets.all });
      navigate(`/snippets/${snippet.id}`);
    },
  });
}

export function useUpdateSnippet(id: string) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: {
      title?: string;
      code?: string;
      language?: string;
      description?: string;
      isPublic?: boolean;
      entryId?: string | null;
    }) => snippetsApi.update(id, data).then((r) => r.data as Snippet),
    onSuccess: (snippet) => {
      qc.invalidateQueries({ queryKey: queryKeys.snippets.all });
      qc.setQueryData(queryKeys.snippets.detail(id), snippet);
      navigate(`/snippets/${snippet.id}`);
    },
  });
}

export function useDeleteSnippet() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: string) => snippetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.snippets.all });
      navigate('/snippets');
    },
  });
}
