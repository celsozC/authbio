'use client';
import { startRegistration } from "@simplewebauthn/browser";
import { useState } from "react";
import axios from 'axios';

export default function Register() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Registering...');

    try {
      // Get registration options from server
      const { data: options } = await axios.post('/api/auth/register', { 
        username 
      });

      // Start registration process
      const regResult = await startRegistration(options);

      // Verify with server
      const verifyResp = await axios.post('/api/auth/verify-registration', { 
        regResult, 
        username 
      });

      if (verifyResp.status === 200) {
        setStatus('Registration successful! You can now login.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setStatus('Registration failed');
      }
    } catch (error) {
      console.error(error);
      setStatus('Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold">Register</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Register with WebAuthn
            </button>
          </div>
          {status && (
            <p className="mt-2 text-center text-sm text-gray-600">{status}</p>
          )}
        </form>
      </div>
    </div>
  );
}