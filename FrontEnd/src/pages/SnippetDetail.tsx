import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { snippetsApi } from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import { useEffect } from 'react';

export default function SnippetDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.snippets.detail(id || ''),
    queryFn: () => snippetsApi.getOne(id!).then((res) => res.data),
    enabled: !!id,
  });

  useEffect(() => {
    Prism.highlightAll();
  }, [data]);

  if (isLoading) return <div>Loading snippet...</div>;
  if (error) return <div className="text-red-600">Failed to load snippet.</div>;
  if (!data) return <div>Snippet not found.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{data.title}</h1>
      <p className="text-gray-600 text-sm mb-1">{data.language}</p>
      <div className="prose max-w-none">
        <ReactMarkdown>{'```' + data.language + '\n' + data.code + '\n```'}</ReactMarkdown>
      </div>
      <div className="mt-6 flex gap-2">
        <Link to="/snippets" className="text-primary-600 hover:underline">Back to Snippets</Link>
      </div>
    </div>
  );
}
