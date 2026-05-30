import React, { useState } from 'react';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';

function SuspendedScreen() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    // Mimic a realistic connection attempt of 2.5 seconds before failing again
    setTimeout(() => {
      setIsRetrying(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans text-slate-300">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Connection Failure Status Icon */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
          <div className="p-2.5 bg-red-950/50 border border-red-900/40 rounded-lg text-red-500">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-md font-bold text-slate-100 tracking-wide font-mono">
              [FIREBASE_ERR_CONN]
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Timestamp: {new Date().toISOString().split('T')[0]}
            </p>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 text-amber-500/90 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-mono">Warning:</span> Firestore connection lost. Failed to establish connection with server endpoint.
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
            Error: [firestore/unavailable] The service is currently unavailable. This is most likely a transient condition and may be corrected by retrying the connection.
          </p>
        </div>

        {/* Technical Diagnostics Logs (Looks 100% Real) */}
        <div className="mt-5 pt-4 border-t border-slate-800/60">
          <h3 className="text-xs font-bold text-slate-400 font-mono mb-2 tracking-wider">
            DIAGNOSTICS_REPORT:
          </h3>
          <div className="space-y-1 text-[11px] font-mono text-slate-500 leading-normal bg-slate-950/50 p-3 rounded border border-slate-900">
            <div>&gt; CLIENT_VERSION: 10.13.0</div>
            <div>&gt; ENDPOINT: firestore.googleapis.com</div>
            <div>&gt; STATUS: offline (ERR_CONNECTION_REFUSED)</div>
            <div>&gt; SYNC_STREAM: [TERMINATED]</div>
            <div>&gt; OFFLINE_CACHE: [EXPIRED_NO_PERSISTENCE]</div>
          </div>
        </div>

        {/* Realistic Interactive Retry Button */}
        <div className="mt-6">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm border transition-all duration-200 cursor-pointer ${
              isRetrying
                ? 'bg-slate-900 border-slate-800 text-slate-500'
                : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-200 active:scale-98'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Re-establishing Connection...' : 'Retry Connection'}
          </button>
        </div>

      </div>

      {/* Very subtle standard browser-like error sub-text at bottom */}
      <div className="mt-6 text-center text-[11px] font-mono text-slate-600 max-w-xs leading-normal select-none">
        If this issue persists, please check your network connection or verify the database endpoint availability status.
      </div>
    </div>
  );
}

export default SuspendedScreen;
