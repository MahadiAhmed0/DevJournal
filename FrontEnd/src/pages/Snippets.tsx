import { useQuery } from '@tanstack/react-query';
import { snippetsApi } from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import { Link } from 'react-router-dom';

export default function Snippets() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.snippets.lists(),
    queryFn: () => snippetsApi.getAll().then((res) => res.data),
  });

  if (isLoading) {
    return <div>Loading snippets...</div>;
  }
  if (error) {
    return <div className="text-red-600">Failed to load snippets.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Snippets</h1>
      <Link
        to="/snippets/new"
        className="inline-block mb-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        + New Snippet
      </Link>
      <ul className="space-y-4">
        {data?.map((snippet: any) => (
          <li key={snippet.id} className="bg-white rounded shadow p-4">
            <Link to={`/snippets/${snippet.id}`} className="text-lg font-semibold text-primary-700 hover:underline">
              {snippet.title}
            </Link>
            <p className="text-gray-600 text-sm mt-1">{snippet.language}</p>
            <p className="mt-2 text-gray-700 line-clamp-2">{snippet.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
