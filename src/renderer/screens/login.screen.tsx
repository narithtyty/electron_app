import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/button';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password');
      setUsername('');
      setPassword('');
    }
  };

  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('1234');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="max-w-md w-full mx-4">
        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {/* Demo Credentials Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">Demo Credentials</h3>
                <p className="text-xs text-blue-600">Click to use demo login</p>
              </div>
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                {showCredentials ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showCredentials && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="text-sm font-medium">Admin Account</p>
                    <p className="text-xs text-gray-500">Username: admin | Password: 1234</p>
                  </div>
                  <Button size="sm" onClick={fillDemoCredentials}>
                    Use
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="text-sm font-medium">User Account</p>
                    <p className="text-xs text-gray-500">Username: user | Password: password</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {
                      setUsername('user');
                      setPassword('password');
                      setError('');
                    }}
                  >
                    Use
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Electron Router DOM Example App
            </p>
          </div>
        </div>

        {/* Quick Access */}
        <div className="mt-4 text-center">
          <p className="text-white text-sm opacity-80 mb-2">Quick Access:</p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={fillDemoCredentials}
              className="px-3 py-1 bg-white bg-opacity-20 text-white rounded text-sm hover:bg-opacity-30 transition-colors"
            >
              Admin Login
            </button>
            <button
              onClick={() => {
                setUsername('user');
                setPassword('password');
                setError('');
              }}
              className="px-3 py-1 bg-white bg-opacity-20 text-white rounded text-sm hover:bg-opacity-30 transition-colors"
            >
              User Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
