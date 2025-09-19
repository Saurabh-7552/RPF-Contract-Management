import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth';

export const RFPDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: rfp, isLoading } = useQuery({
    queryKey: ['rfp', id],
    queryFn: () => apiClient.getRFP(Number(id)),
    enabled: !!id,
  });

  const { data: documents } = useQuery({
    queryKey: ['rfp-documents', id],
    queryFn: () => apiClient.getDocumentVersions(Number(id)),
    enabled: !!id,
  });

  const publishMutation = useMutation({
    mutationFn: () => apiClient.updateRFP(Number(id), { status: 'PUBLISHED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfp', id] });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !id) return;

    setUploading(true);
    try {
      // Get presigned URL
      const presignedData = await apiClient.getPresignedUrl(selectedFile.name, selectedFile.type);
      
      // Upload file to S3
      await fetch(presignedData.presigned_url, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      // Complete upload
      await apiClient.completeUpload(selectedFile.name, Number(id), 'document');
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['rfp-documents', id] });
      setShowUploadForm(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">RFP not found</h1>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'buyer' && rfp.owner_id === user.id;
  const canRespond = user?.role === 'supplier' && rfp.status === 'PUBLISHED';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{rfp.title}</h1>
                  <div className="mt-2 flex items-center space-x-4">
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
                    <span className="text-sm text-gray-500">
                      Created: {new Date(rfp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {canEdit && rfp.status === 'DRAFT' && (
                    <button
                      onClick={() => publishMutation.mutate()}
                      disabled={publishMutation.isPending}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md disabled:opacity-50"
                    >
                      {publishMutation.isPending ? 'Publishing...' : 'Publish'}
                    </button>
                  )}
                  <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded-md"
                  >
                    Back
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{rfp.description}</p>
                </div>

                {rfp.requirements && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Requirements</h2>
                    <p className="text-gray-600 whitespace-pre-wrap">{rfp.requirements}</p>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Documents</h2>
                    {canEdit && (
                      <button
                        onClick={() => setShowUploadForm(true)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                      >
                        Upload Document
                      </button>
                    )}
                  </div>

                  {showUploadForm && (
                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Upload New Document</h3>
                      <div className="space-y-3">
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {selectedFile && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setShowUploadForm(false);
                                setSelectedFile(null);
                              }}
                              className="px-3 py-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded-md"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={uploadFile}
                              disabled={uploading}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md disabled:opacity-50"
                            >
                              {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {documents?.length === 0 ? (
                    <p className="text-gray-500">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {documents?.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                          <div>
                            <span className="font-medium text-gray-900">{doc.filename}</span>
                            <span className="ml-2 text-sm text-gray-500">
                              v{doc.version_number}
                            </span>
                            {doc.notes && (
                              <p className="text-sm text-gray-600 mt-1">{doc.notes}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm">
                              Preview
                            </button>
                            {canEdit && doc.version_number > 1 && (
                              <button className="text-green-600 hover:text-green-800 text-sm">
                                Revert
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {canRespond && (
                  <div className="border-t pt-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Submit Response</h2>
                    <button
                      onClick={() => navigate(`/rfp/${id}/respond`)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      Submit Proposal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




