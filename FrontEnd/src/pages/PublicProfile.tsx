import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/axios';

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', 'profile', username],
    queryFn: () => usersApi.getProfile(username!).then((res) => res.data),
    enabled: !!username,
  });

  if (isLoading) return <div>Loading profile...</div>;
  if (error) return <div className="text-red-600">Failed to load profile.</div>;
  if (!data) return <div>Profile not found.</div>;

  return (
    <div className="max-w-lg mx-auto bg-white rounded shadow p-6 mt-8">
      <div className="flex items-center gap-4 mb-4">
        {data.avatarUrl ? (
          <img src={data.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
            {data.username?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-lg font-semibold">{data.username}</div>
        </div>
      </div>
      <div className="mb-2">
        <span className="font-medium">Bio:</span> {data.bio || <span className="text-gray-400">No bio</span>}
      </div>
    </div>
  );
}
