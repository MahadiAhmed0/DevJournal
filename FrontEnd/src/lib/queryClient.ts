import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query keys for type-safe query invalidation
export const queryKeys = {
  entries: {
    all: ['entries'] as const,
    lists: () => [...queryKeys.entries.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.entries.lists(), filters] as const,
    details: () => [...queryKeys.entries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.entries.details(), id] as const,
  },
  snippets: {
    all: ['snippets'] as const,
    lists: () => [...queryKeys.snippets.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.snippets.lists(), filters] as const,
    details: () => [...queryKeys.snippets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.snippets.details(), id] as const,
  },
  tags: {
    all: ['tags'] as const,
    lists: () => [...queryKeys.tags.all, 'list'] as const,
    list: () => [...queryKeys.tags.lists()] as const,
    popular: (limit?: number) => [...queryKeys.tags.all, 'popular', limit] as const,
    byName: (name: string) => [...queryKeys.tags.all, 'byName', name] as const,
    entries: (name: string, page?: number) => [...queryKeys.tags.all, 'entries', name, page] as const,
  },
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    profile: (username: string) => [...queryKeys.users.all, 'profile', username] as const,
  },
};
