import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

const rfpSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  requirements: z.string().optional(),
});

type RFPForm = z.infer<typeof rfpSchema>;

export const BuyerDashboard: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RFPForm>({
    resolver: zodResolver(rfpSchema),
  });

  const { data: rfps, isLoading } = useQuery({
    queryKey: ['rfps'],
    queryFn: () => apiClient.getRFPs(),
  });

  const createRFPMutation = useMutation({
    mutationFn: (data: RFPForm) => apiClient.createRFP(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfps'] });
      setShowCreateForm(false);
      reset();
    },
  });

  const publishRFPMutation = useMutation({
    mutationFn: (rfpId: number) => apiClient.changeRFPStatus(rfpId, 'PUBLISHED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfps'] });
    },
  });

  const onSubmit = (data: RFPForm) => {
    createRFPMutation.mutate(data);
  };

  const handlePublishRFP = (rfpId: number) => {
    publishRFPMutation.mutate(rfpId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner h-16 w-16 mx-auto mb-4"></div>
          <p className="text-secondary-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="mb-8 animate-fade-in-down">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gradient mb-2">
                  Buyer Dashboard
                </h1>
                <p className="text-secondary-600 text-lg">
                  Manage your RFPs and track proposals
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary flex items-center space-x-2 shadow-glow hover:shadow-glow-lg"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create New RFP</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total RFPs</p>
                  <p className="text-2xl font-bold text-secondary-900">{rfps?.items?.length || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-gradient-to-r from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Published</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {rfps?.items?.filter((rfp: any) => rfp.status === 'PUBLISHED').length || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-gradient-to-r from-warning-500 to-warning-600 rounded-xl flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Drafts</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {rfps?.items?.filter((rfp: any) => rfp.status === 'DRAFT').length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Create RFP Form */}
          {showCreateForm && (
            <div className="card-elevated p-8 mb-8 animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900">Create New RFP</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-secondary-700 mb-2">
                    RFP Title
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    className="input-field"
                    placeholder="Enter a descriptive title for your RFP"
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-error-600 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-secondary-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Provide a detailed description of what you're looking for..."
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-error-600 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="requirements" className="block text-sm font-semibold text-secondary-700 mb-2">
                    Requirements <span className="text-secondary-400">(Optional)</span>
                  </label>
                  <textarea
                    {...register('requirements')}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="List any specific requirements, technical specifications, or criteria..."
                  />
                  {errors.requirements && (
                    <p className="mt-2 text-sm text-error-600 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.requirements.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createRFPMutation.isPending}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {createRFPMutation.isPending ? (
                      <>
                        <div className="spinner h-4 w-4"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Create RFP</span>
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
              <h2 className="text-2xl font-bold text-secondary-900">Your RFPs</h2>
              <p className="text-secondary-600 mt-1">Manage and track your request for proposals</p>
            </div>
            
            <div className="p-6">
              {rfps?.items?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-24 w-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">No RFPs yet</h3>
                  <p className="text-secondary-600 mb-6">Create your first RFP to get started</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-primary"
                  >
                    Create Your First RFP
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rfps?.items?.map((rfp: any, index: number) => (
                    <div 
                      key={rfp.id} 
                      className="card p-6 hover:shadow-medium transition-all duration-300 animate-fade-in-up"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-semibold text-secondary-900">{rfp.title}</h3>
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
                        <div className="flex flex-col space-y-2 ml-6">
                          <button 
                            onClick={() => window.open(`/rfp/${rfp.id}`, '_blank')}
                            className="btn-secondary text-sm px-4 py-2"
                          >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                          {rfp.status === 'DRAFT' && (
                            <button 
                              onClick={() => handlePublishRFP(rfp.id)}
                              className="btn-success text-sm px-4 py-2"
                            >
                              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Publish
                            </button>
                          )}
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




