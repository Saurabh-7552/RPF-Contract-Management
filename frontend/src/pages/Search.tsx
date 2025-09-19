import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Link } from 'react-router-dom';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchTerm, page],
    queryFn: () => apiClient.searchRFPs(searchTerm, page, 10),
    enabled: searchTerm.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
    setPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    // In a real app, you'd combine this with the search query
  };

  const filteredResults = searchResults?.items?.filter((rfp: any) => 
    !statusFilter || rfp.status === statusFilter
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Search RFPs</h1>
            
            <form onSubmit={handleSearch} className="flex space-x-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search RFPs by title, description, or requirements..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Search
              </button>
            </form>

            <div className="flex space-x-2">
              <button
                onClick={() => handleStatusFilter('')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === '' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleStatusFilter('PUBLISHED')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'PUBLISHED' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => handleStatusFilter('RESPONSE_SUBMITTED')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'RESPONSE_SUBMITTED' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Response Submitted
              </button>
              <button
                onClick={() => handleStatusFilter('UNDER_REVIEW')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'UNDER_REVIEW' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Under Review
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
          ) : searchTerm ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Search Results for "{searchTerm}"
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredResults.length} results
                  </span>
                </div>

                {filteredResults.length === 0 ? (
                  <p className="text-gray-500">No RFPs found matching your search criteria.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredResults.map((rfp: any) => (
                      <div key={rfp.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Link
                              to={`/rfp/${rfp.id}`}
                              className="text-lg font-medium text-blue-600 hover:text-blue-800"
                            >
                              {rfp.title}
                            </Link>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {rfp.description}
                            </p>
                            {rfp.requirements && (
                              <p className="text-sm text-gray-500 mt-2">
                                <span className="font-medium">Requirements:</span> {rfp.requirements}
                              </p>
                            )}
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span>Created: {new Date(rfp.created_at).toLocaleDateString()}</span>
                              <span>Deadline: {rfp.deadline ? new Date(rfp.deadline).toLocaleDateString() : 'Not specified'}</span>
                            </div>
                          </div>
                          <div className="ml-4 flex flex-col items-end space-y-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rfp.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                              rfp.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                              rfp.status === 'RESPONSE_SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                              rfp.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                              rfp.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {rfp.status}
                            </span>
                            <Link
                              to={`/rfp/${rfp.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults?.total_pages && searchResults.total_pages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <nav className="flex space-x-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {page} of {searchResults.total_pages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(searchResults.total_pages, page + 1))}
                        disabled={page === searchResults.total_pages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Start your search
                  </h3>
                  <p className="text-gray-500">
                    Enter keywords to search through RFP titles, descriptions, and requirements.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};




