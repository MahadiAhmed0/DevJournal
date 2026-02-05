import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.user_metadata?.username || user?.email}!</h1>
      <p className="text-gray-700 mb-2">This is your dashboard. Use the navigation to access your entries, snippets, and profile.</p>
      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Entries</h2>
            <p className="text-gray-600">View and manage your journal entries.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Snippets</h2>
            <p className="text-gray-600">Store and organize your code snippets.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
