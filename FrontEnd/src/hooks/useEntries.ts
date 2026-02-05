import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entriesApi } from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import { useNavigate } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
}

export interface Entry {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  isPublic: boolean;
  userId: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEntries {
  data: Entry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useMyEntries(page = 1, limit = 10) {
  return useQuery<PaginatedEntries>({
    queryKey: [...queryKeys.entries.lists(), { page, limit }],
    queryFn: () => entriesApi.getMy({ page, limit }).then((r) => r.data),
  });
}

export function useEntry(id: string | undefined) {
  return useQuery<Entry>({
    queryKey: queryKeys.entries.detail(id || ''),
    queryFn: () => entriesApi.getOne(id!).then((r) => r.data),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateEntry() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: { title: string; content: string; summary?: string; isPublic?: boolean }) =>
      entriesApi.create(data).then((r) => r.data as Entry),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: queryKeys.entries.all });
      navigate(`/entries/${entry.id}`);
    },
  });
}

export function useUpdateEntry(id: string) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: { title?: string; content?: string; summary?: string; isPublic?: boolean }) =>
      entriesApi.update(id, data).then((r) => r.data as Entry),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: queryKeys.entries.all });
      qc.setQueryData(queryKeys.entries.detail(id), entry);
      navigate(`/entries/${entry.id}`);
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: string) => entriesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.entries.all });
      navigate('/entries');
    },
  });
}

export function useSummarizeEntry(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => entriesApi.summarize(id).then((r) => r.data as Entry),
    onSuccess: (entry) => {
      qc.setQueryData(queryKeys.entries.detail(id), entry);
    },
  });
}
