import { useQuery } from '@tanstack/react-query';
import { entriesApi } from '@/lib/axios';
import { queryKeys } from '@/lib/queryClient';
import { Link } from 'react-router-dom';

export default function Entries() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.entries.lists(),
    queryFn: () => entriesApi.getAll().then((res) => res.data),
  });

  if (isLoading) {
    return <div>Loading entries...</div>;
  }
  if (error) {
    return <div className="text-red-600">Failed to load entries.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Entries</h1>
      <Link
        to="/entries/new"
        className="inline-block mb-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        + New Entry
      </Link>
      <ul className="space-y-4">
        {data?.map((entry: any) => (
          <li key={entry.id} className="bg-white rounded shadow p-4">
            <Link to={`/entries/${entry.id}`} className="text-lg font-semibold text-primary-700 hover:underline">
              {entry.title}
            </Link>
            <p className="text-gray-600 text-sm mt-1">{entry.createdAt && new Date(entry.createdAt).toLocaleString()}</p>
            <p className="mt-2 text-gray-700 line-clamp-2">{entry.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
