import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export const Search: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Search query - only enabled when there's a search term
  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['search', searchTerm, page, statusFilter],
    queryFn: () => {
      console.log('useQuery triggered - Searching for:', searchTerm, 'page:', page, 'status:', statusFilter);
      return apiClient.searchRFPs(searchTerm, page, 10, statusFilter || undefined);
    },
    enabled: searchTerm.length > 0,
  });

  // Default RFP list query - enabled when no search term
  const { data: defaultResults, isLoading: defaultLoading, error: defaultError } = useQuery({
    queryKey: ['default-rfps', page, statusFilter, user?.role],
    queryFn: () => {
      console.log('Fetching default RFPs for role:', user?.role, 'page:', page, 'status:', statusFilter);
      if (user?.role === 'supplier') {
        return apiClient.getAvailableRFPsWithOwners(10, (page - 1) * 10);
      } else {
        return apiClient.getRFPs(page, 10);
      }
    },
    enabled: searchTerm.length === 0,
  });

  // Debug logging
  React.useEffect(() => {
    console.log('Search state changed:', { 
      searchTerm, 
      page, 
      statusFilter, 
      searchLoading, 
      defaultLoading, 
      searchError, 
      defaultError, 
      searchResults, 
      defaultResults 
    });
  }, [searchTerm, page, statusFilter, searchLoading, defaultLoading, searchError, defaultError, searchResults, defaultResults]);

  // Log errors when they occur
  React.useEffect(() => {
    if (searchError) {
      console.error('Search error:', searchError);
    }
    if (defaultError) {
      console.error('Default RFP list error:', defaultError);
    }
  }, [searchError, defaultError]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search form submitted with query:', query);
    if (query.trim().length > 0) {
      console.log('Setting search term to:', query.trim());
      setSearchTerm(query.trim());
      setPage(1);
    } else {
      console.log('Query is empty, clearing search');
      setSearchTerm('');
      setPage(1);
    }
  };

  // Clear search when input is empty
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // If input is cleared, immediately clear search results
    if (value.trim().length === 0 && searchTerm.length > 0) {
      console.log('Input cleared, clearing search results');
      setSearchTerm('');
      setPage(1);
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1); // Reset to first page when filter changes
  };

  // Determine which data to use and apply client-side filtering
  const isSearchMode = searchTerm.length > 0;
  const currentData = isSearchMode ? searchResults : defaultResults;
  const isLoading = isSearchMode ? searchLoading : defaultLoading;
  const error = isSearchMode ? searchError : defaultError;
  
  // Type-safe access to results
  const totalResults = (currentData as any)?.total || 0;
  let filteredResults = (currentData as any)?.items || [];
  
  // Apply client-side status filtering for default results (since backend doesn't support it for default lists)
  if (!isSearchMode && statusFilter && filteredResults.length > 0) {
    filteredResults = filteredResults.filter((rfp: any) => rfp.status === statusFilter);
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="mb-8 animate-fade-in-down">
            <h1 className="text-4xl font-bold text-gradient mb-2">Search RFPs</h1>
            <p className="text-secondary-600 text-lg">
              {user?.role === 'supplier' 
                ? 'Find and explore all published opportunities from buyers'
                : 'Search through your submitted RFPs and filter by status'
              }
            </p>
          </div>

          {/* Search Form */}
          <div className="card-elevated p-8 mb-8 animate-fade-in-up">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={handleInputChange}
                      placeholder={user?.role === 'supplier' 
                        ? "Search all published RFPs by title or description..."
                        : "Search your RFPs by title or description..."
                      }
                      className="input-field pl-10 pr-10"
                    />
                    {query.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          setSearchTerm('');
                          setPage(1);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600 transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </button>
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-secondary-700 mr-2">Filter by status:</span>
                <button
                  onClick={() => handleStatusFilter('')}
                  className={`status-badge ${
                    statusFilter === '' 
                      ? 'bg-primary-100 text-primary-800' 
                      : 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleStatusFilter('PUBLISHED')}
                  className={`status-badge ${
                    statusFilter === 'PUBLISHED' 
                      ? 'bg-success-100 text-success-800' 
                      : 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200'
                  }`}
                >
                  Published
                </button>
                <button
                  onClick={() => handleStatusFilter('RESPONSE_SUBMITTED')}
                  className={`status-badge ${
                    statusFilter === 'RESPONSE_SUBMITTED' 
                      ? 'bg-primary-100 text-primary-800' 
                      : 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200'
                  }`}
                >
                  Response Submitted
                </button>
                <button
                  onClick={() => handleStatusFilter('UNDER_REVIEW')}
                  className={`status-badge ${
                    statusFilter === 'UNDER_REVIEW' 
                      ? 'bg-warning-100 text-warning-800' 
                      : 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200'
                  }`}
                >
                  Under Review
                </button>
              </div>
            </form>
          </div>

          {/* Search Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="spinner h-16 w-16 mx-auto mb-4"></div>
                <p className="text-secondary-600 font-medium">
                  {isSearchMode ? 'Searching RFPs...' : 'Loading RFPs...'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="card-elevated animate-fade-in-up">
              <div className="p-12 text-center">
                <div className="h-24 w-24 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="h-12 w-12 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                  Search Error
                </h3>
                <p className="text-secondary-600 text-lg max-w-md mx-auto">
                  There was an error searching for RFPs. Please try again.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary mt-4"
                >
                  Retry Search
                </button>
              </div>
            </div>
          ) : (
            <div className="card-elevated animate-fade-in-up">
              <div className="p-6 border-b border-secondary-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-secondary-900">
                    {isSearchMode 
                      ? `Search Results for "${searchTerm}"`
                      : user?.role === 'supplier' 
                        ? 'Available RFPs' 
                        : 'Your RFPs'
                    }
                  </h2>
                  <span className="text-sm text-secondary-500 bg-secondary-100 px-3 py-1 rounded-full">
                    {filteredResults.length} {isSearchMode ? 'results' : 'RFPs'}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                {filteredResults.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-24 w-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                      {isSearchMode ? 'No results found' : 'No RFPs available'}
                    </h3>
                    <p className="text-secondary-600">
                      {isSearchMode 
                        ? 'Try adjusting your search terms or filters'
                        : user?.role === 'supplier'
                          ? 'No published RFPs are currently available'
                          : 'You haven\'t created any RFPs yet'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredResults.map((rfp: any, index: number) => (
                      <div 
                        key={rfp.id} 
                        className="card p-6 hover:shadow-medium transition-all duration-300 animate-fade-in-up"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <Link
                                to={`/rfp/${rfp.id}`}
                                className="text-xl font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                              >
                                {rfp.title}
                              </Link>
                              <span className={`status-badge ${
                                rfp.status === 'DRAFT' ? 'status-draft' :
                                rfp.status === 'PUBLISHED' ? 'status-published' :
                                rfp.status === 'RESPONSE_SUBMITTED' ? 'status-response-submitted' :
                                rfp.status === 'UNDER_REVIEW' ? 'status-under-review' :
                                rfp.status === 'APPROVED' ? 'status-approved' :
                                'status-rejected'
                              }`}>
                                {rfp.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-secondary-600 mb-4 line-clamp-2">
                              {rfp.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-secondary-500">
                              <span className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Created {new Date(rfp.created_at).toLocaleDateString()}
                              </span>
                              {user?.role === 'supplier' && rfp.owner && (
                                <span className="flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  Owner: {rfp.owner.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-6 flex flex-col space-y-2">
                            <Link
                              to={`/rfp/${rfp.id}`}
                              className="btn-secondary text-sm px-4 py-2 flex items-center space-x-2"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>View Details</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalResults > 10 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="btn-secondary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm text-secondary-700 bg-secondary-50 rounded-lg">
                        Page {page} of {Math.ceil(totalResults / 10)}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(Math.ceil(totalResults / 10), page + 1))}
                        disabled={page >= Math.ceil(totalResults / 10)}
                        className="btn-secondary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};




