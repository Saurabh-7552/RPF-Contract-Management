import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

const responseSchema = z.object({
  content: z.string().min(1, 'Response content is required'),
});

type ResponseForm = z.infer<typeof responseSchema>;

export const SupplierDashboard: React.FC = () => {
  const [selectedRFP, setSelectedRFP] = useState<any>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResponseForm>({
    resolver: zodResolver(responseSchema),
  });

  const { data: rfps, isLoading } = useQuery({
    queryKey: ['rfps', 'published'],
    queryFn: () => apiClient.getRFPs(1, 50), // Get more RFPs for suppliers
  });

  const respondMutation = useMutation({
    mutationFn: ({ rfpId, content }: { rfpId: number; content: string }) =>
      apiClient.respondToRFP(rfpId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfps'] });
      setShowResponseForm(false);
      setSelectedRFP(null);
      reset();
    },
  });

  const onSubmit = (data: ResponseForm) => {
    if (selectedRFP) {
      respondMutation.mutate({ rfpId: selectedRFP.id, content: data.content });
    }
  };

  const handleRespond = (rfp: any) => {
    setSelectedRFP(rfp);
    setShowResponseForm(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner h-16 w-16 mx-auto mb-4"></div>
          <p className="text-secondary-600 font-medium">Loading available RFPs...</p>
        </div>
      </div>
    );
  }

  // Filter only published RFPs for suppliers
  const publishedRFPs = rfps?.items?.filter((rfp: any) => rfp.status === 'PUBLISHED') || [];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="mb-8 animate-fade-in-down">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gradient mb-2">
                  Supplier Dashboard
                </h1>
                <p className="text-secondary-600 text-lg">
                  Discover and respond to RFPs from buyers
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="card p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Available RFPs</p>
                      <p className="text-2xl font-bold text-secondary-900">{publishedRFPs.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Response Form */}
          {showResponseForm && selectedRFP && (
            <div className="card-elevated p-8 mb-8 animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900">
                  Respond to RFP
                </h2>
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setSelectedRFP(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6 p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl border border-primary-200">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">{selectedRFP.title}</h3>
                <p className="text-secondary-700 mb-4">{selectedRFP.description}</p>
                {selectedRFP.requirements && (
                  <div>
                    <h4 className="font-semibold text-secondary-800 mb-2">Requirements:</h4>
                    <p className="text-secondary-700">{selectedRFP.requirements}</p>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="content" className="block text-sm font-semibold text-secondary-700 mb-2">
                    Your Proposal
                  </label>
                  <textarea
                    {...register('content')}
                    rows={8}
                    className="input-field resize-none"
                    placeholder="Describe your proposal, pricing, timeline, and any other relevant details..."
                  />
                  {errors.content && (
                    <p className="mt-2 text-sm text-error-600 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.content.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResponseForm(false);
                      setSelectedRFP(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={respondMutation.isPending}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {respondMutation.isPending ? (
                      <>
                        <div className="spinner h-4 w-4"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Submit Response</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* RFPs List */}
          <div className="card-elevated animate-fade-in-up">
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-2xl font-bold text-secondary-900">Published RFPs</h2>
              <p className="text-secondary-600 mt-1">Browse and respond to available opportunities</p>
            </div>
            
            <div className="p-6">
              {publishedRFPs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-24 w-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">No RFPs available</h3>
                  <p className="text-secondary-600">Check back later for new opportunities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedRFPs.map((rfp: any, index: number) => (
                    <div 
                      key={rfp.id} 
                      className="card p-6 hover:shadow-medium transition-all duration-300 animate-fade-in-up"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-semibold text-secondary-900">{rfp.title}</h3>
                            <span className="status-badge status-published">
                              Published
                            </span>
                          </div>
                          <p className="text-secondary-600 mb-4 line-clamp-2">{rfp.description}</p>
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
                              Published {new Date(rfp.created_at).toLocaleDateString()}
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
                        <div className="flex flex-col space-y-2 ml-6">
                          <button
                            onClick={() => handleRespond(rfp)}
                            className="btn-primary text-sm px-4 py-2"
                          >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Respond
                          </button>
                          <button className="btn-secondary text-sm px-4 py-2">
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




