import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Link } from 'react-router-dom';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search', searchTerm, page],
    queryFn: () => {
      console.log('Searching for:', searchTerm, 'page:', page);
      return apiClient.searchRFPs(searchTerm, page, 10);
    },
    enabled: searchTerm.length > 0,
    onError: (error) => {
      console.error('Search error:', error);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      setSearchTerm(query.trim());
      setPage(1);
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    // In a real app, you'd combine this with the search query
  };

  const filteredResults = searchResults?.items?.filter((rfp: any) => 
    !statusFilter || rfp.status === statusFilter
  ) || [];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="mb-8 animate-fade-in-down">
            <h1 className="text-4xl font-bold text-gradient mb-2">Search RFPs</h1>
            <p className="text-secondary-600 text-lg">
              Find and explore available opportunities
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
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search RFPs by title, description, or requirements..."
                      className="input-field pl-10"
                    />
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
                <p className="text-secondary-600 font-medium">Searching RFPs...</p>
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
          ) : searchTerm ? (
            <div className="card-elevated animate-fade-in-up">
              <div className="p-6 border-b border-secondary-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-secondary-900">
                    Search Results for "{searchTerm}"
                  </h2>
                  <span className="text-sm text-secondary-500 bg-secondary-100 px-3 py-1 rounded-full">
                    {filteredResults.length} results
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
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">No results found</h3>
                    <p className="text-secondary-600">Try adjusting your search terms or filters</p>
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
                            {rfp.requirements && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-secondary-700 mb-1">Requirements:</p>
                                <p className="text-sm text-secondary-600 line-clamp-2">{rfp.requirements}</p>
                              </div>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-secondary-500">
                              <span className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Created {new Date(rfp.created_at).toLocaleDateString()}
                              </span>
                              {rfp.deadline && (
                                <span className="flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Deadline: {new Date(rfp.deadline).toLocaleDateString()}
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
                {searchResults?.total && searchResults.total > 10 && (
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
                        Page {page} of {Math.ceil(searchResults.total / 10)}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(Math.ceil(searchResults.total / 10), page + 1))}
                        disabled={page >= Math.ceil(searchResults.total / 10)}
                        className="btn-secondary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card-elevated animate-fade-in-up">
              <div className="p-12 text-center">
                <div className="h-24 w-24 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                  Start Your Search
                </h3>
                <p className="text-secondary-600 text-lg max-w-md mx-auto">
                  Enter keywords to search through RFP titles, descriptions, and requirements to find the perfect opportunities.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};




