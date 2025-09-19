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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Filter only published RFPs for suppliers
  const publishedRFPs = rfps?.items?.filter((rfp: any) => rfp.status === 'PUBLISHED') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
            <div className="text-sm text-gray-600">
              {publishedRFPs.length} published RFPs available
            </div>
          </div>

          {showResponseForm && selectedRFP && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Respond to: {selectedRFP.title}
              </h2>
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900">RFP Description:</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedRFP.description}</p>
                {selectedRFP.requirements && (
                  <>
                    <h3 className="font-medium text-gray-900 mt-3">Requirements:</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedRFP.requirements}</p>
                  </>
                )}
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                    Your Response
                  </label>
                  <textarea
                    {...register('content')}
                    rows={6}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Describe your proposal, pricing, timeline, and any other relevant details..."
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResponseForm(false);
                      setSelectedRFP(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={respondMutation.isPending}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {respondMutation.isPending ? 'Submitting...' : 'Submit Response'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Published RFPs</h2>
              {publishedRFPs.length === 0 ? (
                <p className="text-gray-500">No published RFPs available at the moment.</p>
              ) : (
                <div className="space-y-4">
                  {publishedRFPs.map((rfp: any) => (
                    <div key={rfp.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{rfp.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{rfp.description}</p>
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
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => handleRespond(rfp)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                          >
                            Respond
                          </button>
                          <button className="px-3 py-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded-md">
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




