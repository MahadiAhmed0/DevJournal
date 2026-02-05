import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { entriesApi } from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import { useEffect } from 'react';

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.entries.detail(id || ''),
    queryFn: () => entriesApi.getOne(id!).then((res) => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    Prism.highlightAll();
  }, [data]);

  if (isLoading) return <div>Loading entry...</div>;
  if (error) return <div className="text-red-600">Failed to load entry.</div>;
  if (!data) return <div>Entry not found.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{data.title}</h1>
      <p className="text-gray-600 text-sm mb-4">{data.createdAt && new Date(data.createdAt).toLocaleString()}</p>
      <div className="prose max-w-none">
        <ReactMarkdown>{data.content}</ReactMarkdown>
      </div>
      <div className="mt-6 flex gap-2">
        <Link to="/entries" className="text-primary-600 hover:underline">Back to Entries</Link>
      </div>
    </div>
  );
}
