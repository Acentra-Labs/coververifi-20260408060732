import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

export default function AgentVerification() {
  const { token } = useParams();
  const { success: toastSuccess } = useToast();
  const [response, setResponse] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Simulated token data
  const tokenData = {
    subName: 'Precision Electric LLC',
    gcName: 'Treasure Valley Builders',
    policyType: 'General Liability',
    agentName: 'Kevin Brewer',
    requestType: 'verification',
  };

  const handleConfirm = (answer) => {
    setResponse(answer);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toastSuccess('Your response has been recorded. Thank you!');
  };

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setResponse('uploaded');
      toastSuccess('Certificate uploaded successfully');
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Response Recorded</h1>
          <p className="text-slate-500">
            Thank you, {tokenData.agentName}. Your response regarding {tokenData.subName} has been submitted.
          </p>
          <p className="text-sm text-slate-400 mt-4">You can close this window.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-800">CoverVerifi</span>
          </div>
          <p className="text-sm text-slate-500">Insurance Verification Request</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Request info */}
          <div className="bg-slate-900 text-white p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Verification For</p>
            <h2 className="text-lg font-semibold">{tokenData.subName}</h2>
            <p className="text-sm text-slate-300 mt-1">
              Requested by {tokenData.gcName}
            </p>
            <div className="mt-3 inline-block px-3 py-1 bg-teal-500/20 text-teal-400 text-xs font-medium rounded-full">
              {tokenData.policyType}
            </div>
          </div>

          <div className="p-5 space-y-5">
            <p className="text-sm text-slate-600">
              Hi {tokenData.agentName}, please confirm the current status of the <strong>{tokenData.policyType}</strong> policy for <strong>{tokenData.subName}</strong>.
            </p>

            {/* Confirmation buttons */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Policy Status</p>
              <button
                onClick={() => handleConfirm('active')}
                className={`w-full p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                  response === 'active'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    response === 'active' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                  }`}>
                    {response === 'active' && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  Yes, policy is active and current
                </div>
              </button>
              <button
                onClick={() => handleConfirm('lapsed')}
                className={`w-full p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                  response === 'lapsed'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    response === 'lapsed' ? 'border-red-500 bg-red-500' : 'border-slate-300'
                  }`}>
                    {response === 'lapsed' && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  No, policy has lapsed or been cancelled
                </div>
              </button>
              <button
                onClick={() => handleConfirm('not_agent')}
                className={`w-full p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                  response === 'not_agent'
                    ? 'border-slate-500 bg-slate-50 text-slate-700'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    response === 'not_agent' ? 'border-slate-500 bg-slate-500' : 'border-slate-300'
                  }`}>
                    {response === 'not_agent' && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                      </svg>
                    )}
                  </div>
                  I am no longer this sub&apos;s agent
                </div>
              </button>
            </div>

            {/* Certificate upload */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Upload New Certificate</p>
              <div
                onClick={handleUpload}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  response === 'uploaded'
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-teal-600">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm font-medium">Uploading...</span>
                  </div>
                ) : response === 'uploaded' ? (
                  <div className="text-emerald-600">
                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-medium">Certificate uploaded</p>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-slate-600 font-medium">Click to upload ACORD certificate</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, PNG, or JPG up to 10MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!response}
              className="w-full py-3 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Response
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              This link expires in 7 days. Token: {token || 'demo-token'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
