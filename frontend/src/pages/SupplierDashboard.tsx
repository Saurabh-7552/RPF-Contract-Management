import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';

const responseSchema = z.object({
  content: z.string().min(1, 'Response content is required'),
});

type ResponseForm = z.infer<typeof responseSchema>;

export const SupplierDashboard: React.FC = () => {
  const [selectedRFP, setSelectedRFP] = useState<any>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'opportunities' | 'proposals'>('opportunities');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [editingResponse, setEditingResponse] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ResponseForm>({
    resolver: zodResolver(responseSchema),
  });

  // Fetch available RFPs (published and response submitted) with owner information
  const { data: publishedRFPs, isLoading: rfpsLoading } = useQuery({
    queryKey: ['available-rfps'],
    queryFn: () => apiClient.getAvailableRFPsWithOwners(50, 0),
  });

  // Fetch supplier's submitted responses
  const { data: supplierResponses, isLoading: responsesLoading } = useQuery({
    queryKey: ['supplier-responses'],
    queryFn: () => apiClient.getSupplierResponses(),
  });

  const respondMutation = useMutation({
    mutationFn: ({ rfpId, content }: { rfpId: number; content: string }) =>
      apiClient.respondToRFP(rfpId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-rfps'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-responses'] });
      setShowSuccessMessage(true);
      // Add a small delay before closing the form for better UX
      setTimeout(() => {
        setShowResponseForm(false);
        setSelectedRFP(null);
        setShowSuccessMessage(false);
        reset();
      }, 2000); // 2 second delay to show success message
    },
  });

  const updateResponseMutation = useMutation({
    mutationFn: ({ rfpId, responseId, content }: { rfpId: number; responseId: number; content: string }) =>
      apiClient.updateRFPResponse(rfpId, responseId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-rfps'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-responses'] });
      setShowEditForm(false);
      setEditingResponse(null);
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
    setShowSuccessMessage(false);
  };

  const handleEditResponse = (response: any) => {
    setEditingResponse(response);
    setShowEditForm(true);
    setValue('content', response.content);
  };

  const onEditSubmit = (data: ResponseForm) => {
    if (editingResponse) {
      updateResponseMutation.mutate({ 
        rfpId: editingResponse.rfp_id, 
        responseId: editingResponse.id, 
        content: data.content 
      });
    }
  };

  if (rfpsLoading || responsesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner h-16 w-16 mx-auto mb-4"></div>
          <p className="text-secondary-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const publishedRFPsList = publishedRFPs?.items || [];
  const responsesList = supplierResponses?.responses || [];

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
                  Discover opportunities and manage your proposals
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-4">
                <div className="card p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-600">Available RFPs</p>
                      <p className="text-2xl font-bold text-secondary-900">{publishedRFPsList.length}</p>
                    </div>
                  </div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-600">My Proposals</p>
                      <p className="text-2xl font-bold text-secondary-900">{responsesList.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8 animate-fade-in-up">
            <div className="border-b border-secondary-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('opportunities')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'opportunities'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Available Opportunities</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('proposals')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'proposals'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>My Proposals</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Response Form */}
          {showResponseForm && selectedRFP && (
            <div className={`card-elevated p-8 mb-8 transition-all duration-500 ${showSuccessMessage ? 'animate-fade-out' : 'animate-scale-in'}`}>
              {showSuccessMessage ? (
                // Success Message
                <div className="text-center py-8">
                  <div className="h-20 w-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="h-10 w-10 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-success-600 mb-2">Proposal Submitted Successfully!</h3>
                  <p className="text-secondary-600 text-lg">Your proposal has been sent to the buyer. You can track its status in the "My Proposals" tab.</p>
                </div>
              ) : (
                // Form Content
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-secondary-900">
                      Submit Proposal
                    </h2>
                    <button
                      onClick={() => {
                        setShowResponseForm(false);
                        setSelectedRFP(null);
                        setShowSuccessMessage(false);
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
                <div className="mt-4 flex items-center space-x-4 text-sm text-secondary-600">
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Buyer: {selectedRFP.owner?.email}
                  </span>
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Posted: {new Date(selectedRFP.created_at).toLocaleDateString()}
                  </span>
                </div>
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
                        <span>Submit Proposal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
                </>
              )}
            </div>
          )}

          {/* Edit Response Form */}
          {showEditForm && editingResponse && (
            <div className="card-elevated p-8 mb-8 animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900">
                  Edit Proposal
                </h2>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingResponse(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* RFP Preview */}
              <div className="bg-secondary-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">{editingResponse.rfp_title}</h3>
                <p className="text-secondary-600 text-sm">Buyer: {editingResponse.owner_email}</p>
              </div>

              <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="edit-content" className="block text-sm font-medium text-secondary-700 mb-2">
                    Your Proposal
                  </label>
                  <textarea
                    id="edit-content"
                    {...register('content')}
                    rows={6}
                    className="input-field"
                    placeholder="Describe your proposal, pricing, timeline, and any other relevant details..."
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-error-600">{errors.content.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingResponse(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateResponseMutation.isPending}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {updateResponseMutation.isPending ? (
                      <>
                        <div className="spinner h-4 w-4"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Update Proposal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'opportunities' ? (
            <div className="card-elevated animate-fade-in-up">
              <div className="p-6 border-b border-secondary-200">
                <h2 className="text-2xl font-bold text-secondary-900">Available Opportunities</h2>
                <p className="text-secondary-600 mt-1">Browse and respond to published RFPs from buyers</p>
              </div>
              
              <div className="p-6">
                {publishedRFPsList.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-24 w-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">No opportunities available</h3>
                    <p className="text-secondary-600">Check back later for new RFPs from buyers</p>
                  </div>
              ) : (
                <div className="space-y-4">
                    {publishedRFPsList.map((rfp: any, index: number) => (
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
                            <div className="flex items-center space-x-4 text-sm text-secondary-500">
                              <span className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Buyer: {rfp.owner?.email}
                              </span>
                              <span className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Posted: {new Date(rfp.created_at).toLocaleDateString()}
                              </span>
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
                              Submit Proposal
                          </button>
                            <button 
                              onClick={() => navigate(`/rfp/${rfp.id}`)}
                              className="btn-secondary text-sm px-4 py-2"
                            >
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
          ) : (
            <div className="card-elevated animate-fade-in-up">
              <div className="p-6 border-b border-secondary-200">
                <h2 className="text-2xl font-bold text-secondary-900">My Proposals</h2>
                <p className="text-secondary-600 mt-1">Track your submitted proposals and their status</p>
              </div>
              
              <div className="p-6">
                {responsesList.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-24 w-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">No proposals submitted yet</h3>
                    <p className="text-secondary-600 mb-6">Start by browsing available opportunities and submitting your first proposal</p>
                    <button
                      onClick={() => setActiveTab('opportunities')}
                      className="btn-primary"
                    >
                      Browse Opportunities
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {responsesList.map((response: any, index: number) => (
                      <div 
                        key={response.id} 
                        className="card p-6 hover:shadow-medium transition-all duration-300 animate-fade-in-up"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-xl font-semibold text-secondary-900">{response.rfp_title}</h3>
                              <span className={`status-badge ${
                                response.rfp_status === 'DRAFT' ? 'status-draft' :
                                response.rfp_status === 'PUBLISHED' ? 'status-published' :
                                response.rfp_status === 'RESPONSE_SUBMITTED' ? 'status-response-submitted' :
                                response.rfp_status === 'UNDER_REVIEW' ? 'status-under-review' :
                                response.rfp_status === 'APPROVED' ? 'status-approved' :
                                'status-rejected'
                              }`}>
                                {response.rfp_status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-secondary-600 mb-4 line-clamp-3">{response.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-secondary-500">
                              <span className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Buyer: {response.owner_email}
                              </span>
                              <span className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Submitted: {new Date(response.submitted_at).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                RFP Posted: {new Date(response.rfp_created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-6">
                            <button 
                              onClick={() => navigate(`/rfp/${response.rfp_id}`)}
                              className="btn-secondary text-sm px-4 py-2"
                            >
                              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                            {response.rfp_status === 'RESPONSE_SUBMITTED' && (
                              <button 
                                onClick={() => handleEditResponse(response)}
                                className="btn-primary text-sm px-4 py-2"
                              >
                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Proposal
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
          )}
        </div>
      </div>
    </div>
  );
};