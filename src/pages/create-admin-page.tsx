// src/pages/create-admin-page.tsx
import { useState } from 'react';

export default function CreateAdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const createAdmin = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@fugajipro.com',
          password: 'admin123!',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Admin user created successfully!');
      } else {
        setError(data.error || 'Failed to create admin user');
      }
    } catch (err) {
      setError('An error occurred while creating admin user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Create Admin User</h1>
        
        <button
          onClick={createAdmin}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Creating Admin...' : 'Create Admin User'}
        </button>

        {message && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
