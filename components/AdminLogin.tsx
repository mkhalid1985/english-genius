import React, { useState } from 'react';
import type { View } from '../types';

interface AdminLoginProps {
  onAdminLogin: () => void;
  setView: (view: View) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onAdminLogin, setView }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'JIS123Jis') {
      onAdminLogin();
    } else {
      setError('Incorrect password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Admin Login</h1>
        </div>
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" aria-label="Password" className="text-sm font-bold text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex items-center justify-between">
            <button
                type="button"
                onClick={() => setView('sessionSetup')}
                className="text-sm text-gray-600 hover:text-blue-500"
            >
                Back to Session Setup
            </button>
            <button
              type="submit"
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700"
            >
              Log In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};