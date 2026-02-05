import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/axios';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe().then((res) => res.data),
  });

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    avatar: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
  });
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);

  // Populate form when data loads or edit mode opens
  useEffect(() => {
    if (data && editMode) {
      setForm({
        name: data.name || '',
        username: data.username || '',
        avatar: data.avatar || '',
        bio: data.bio || '',
        githubUrl: data.githubUrl || '',
        linkedinUrl: data.linkedinUrl || '',
      });
      setAvatarPreviewError(false);
    }
  }, [data, editMode]);

  const mutation = useMutation({
    mutationFn: (update: {
      name?: string;
      username?: string;
      avatar?: string;
      bio?: string;
      githubUrl?: string;
      linkedinUrl?: string;
    }) => usersApi.updateProfile(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      setEditMode(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) return <div className="text-red-600">Failed to load profile.</div>;
  if (!data) return <div>Profile not found.</div>;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Only send changed / non-empty fields
    const update: Record<string, string> = {};
    if (form.name && form.name !== data.name) update.name = form.name;
    if (form.username && form.username !== data.username) update.username = form.username;
    if (form.bio !== (data.bio || '')) update.bio = form.bio;
    if (form.avatar !== (data.avatar || '')) update.avatar = form.avatar;
    if (form.githubUrl !== (data.githubUrl || '')) update.githubUrl = form.githubUrl;
    if (form.linkedinUrl !== (data.linkedinUrl || '')) update.linkedinUrl = form.linkedinUrl;

    mutation.mutate(update);
  };

  const memberSince = new Date(data.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* ── View mode ──────────────────────────────────────────────────── */}
      {!editMode && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-2xl">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            {data.avatar ? (
              <img
                src={data.avatar}
                alt={data.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl font-bold text-white shrink-0">
                {data.name[0]?.toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-900">{data.name}</h2>
              <p className="text-gray-500">@{data.username}</p>
              <p className="text-sm text-gray-400 mt-0.5">{data.email}</p>

              {data.bio && (
                <p className="mt-3 text-gray-700 leading-relaxed">{data.bio}</p>
              )}

              {/* Social links */}
              {(data.githubUrl || data.linkedinUrl) && (
                <div className="flex items-center gap-3 mt-4">
                  {data.githubUrl && (
                    <a
                      href={data.githubUrl}
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
                  {data.linkedinUrl && (
                    <a
                      href={data.linkedinUrl}
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

              {/* Meta */}
              <p className="mt-4 text-xs text-gray-400">Member since {memberSince}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit Profile
            </button>
            <Link
              to={`/${data.username}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Public Profile
            </Link>
          </div>
        </div>
      )}

      {/* ── Edit mode ──────────────────────────────────────────────────── */}
      {editMode && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-2xl space-y-6">
          {/* Avatar preview + URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              {form.avatar && !avatarPreviewError ? (
                <img
                  src={form.avatar}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shrink-0"
                  onError={() => setAvatarPreviewError(true)}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400 shrink-0">
                  {form.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1">
                <input
                  type="url"
                  value={form.avatar}
                  onChange={(e) => {
                    setForm({ ...form, avatar: e.target.value });
                    setAvatarPreviewError(false);
                  }}
                  placeholder="https://example.com/your-photo.jpg"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-400">Paste any public image URL from the web</p>
              </div>
            </div>
          </div>

          {/* Name + Username row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })
                  }
                  minLength={3}
                  maxLength={30}
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="Tell people about yourself..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <p className="mt-1 text-xs text-gray-400 text-right">{form.bio.length}/500</p>
          </div>

          {/* Social links */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Social Links</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </span>
                </label>
                <input
                  type="url"
                  value={form.githubUrl}
                  onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                  placeholder="https://github.com/yourusername"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </span>
                </label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourusername"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {(mutation.error as any)?.response?.data?.message || 'Failed to update profile. Please try again.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setEditMode(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
