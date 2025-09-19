import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md shadow-soft border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="h-10 w-10 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gradient">
                  RFP Management
                </span>
              </Link>
              <div className="ml-10 flex items-baseline space-x-1">
                <Link
                  to="/"
                  className="text-secondary-600 hover:text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/search"
                  className="text-secondary-600 hover:text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-secondary-50 px-3 py-2 rounded-xl">
                      <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm font-medium text-secondary-900">{user.email}</p>
                        <p className="text-xs text-secondary-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-secondary-600 hover:text-error-600 hover:bg-error-50 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="relative">
        {children}
      </main>
    </div>
  );
};




