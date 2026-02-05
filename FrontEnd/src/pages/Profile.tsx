import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe().then((res) => res.data),
  });

  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [editMode, setEditMode] = useState(false);

  const mutation = useMutation({
    mutationFn: (update: { bio?: string; avatarUrl?: string }) => usersApi.updateProfile(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      setEditMode(false);
    },
  });

  if (isLoading) return <div>Loading profile...</div>;
  if (error) return <div className="text-red-600">Failed to load profile.</div>;
  if (!data) return <div>Profile not found.</div>;

  const handleEdit = () => {
    setBio(data.bio || '');
    setAvatarUrl(data.avatarUrl || '');
    setEditMode(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ bio, avatarUrl });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="bg-white rounded shadow p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-4">
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
              {data.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-lg font-semibold">{data.username || user?.email}</div>
            <div className="text-gray-600 text-sm">{user?.email}</div>
          </div>
        </div>
        {editMode ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
              <input
                type="url"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={() => setEditMode(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-2">
              <span className="font-medium">Bio:</span> {data.bio || <span className="text-gray-400">No bio</span>}
            </div>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 mt-2"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
