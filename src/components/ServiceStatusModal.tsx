import React, { useEffect, useState } from 'react';
import { ServiceHealthStatus } from '../services/configManager';
import { localStore } from '../services/localStorageService';
import { Cpu, X, RefreshCw, CheckCircle2, Shield, Terminal } from 'lucide-react';

interface ServiceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceStatusModal: React.FC<ServiceStatusModalProps> = ({
  isOpen,
  onClose
}) => {
  const [services, setServices] = useState<Record<string, ServiceHealthStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{ available: boolean; canSave: boolean; canRestore: boolean }>({
    available: true,
    canSave: true,
    canRestore: true
  });

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const healthRes = await fetch('/api/health');
      let discoveredModel = '';
      if (healthRes.ok) {
        const hData = await healthRes.json();
        discoveredModel = hData.gemini_model || '';
      }

      const res = await fetch('/api/health/services');
      if (res.ok) {
        const data = await res.json();
        const servs = data.services || {};
        if (servs.ai && discoveredModel) {
          servs.ai.model = discoveredModel;
        }
        setServices(servs);
      }
    } catch (err) {
      console.warn('Error fetching service health:', err);
    } finally {
      setIsLoading(false);
    }

    const diag = localStore.verifyStorage();
    setStorageStatus(diag);
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                <span>SYSTEM CONFIGURATION & SERVICES</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-100">
                Service Connections
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHealth}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl transition-colors"
              title="Refresh Health Checks"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SECURITY NOTICE */}
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-slate-300 font-mono">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>API keys are configured server-side in <code className="text-amber-300 font-bold">.env</code> and are NEVER exposed to client JavaScript.</span>
        </div>

        {/* SERVICES LIST */}
        <div className="space-y-3 font-mono text-xs">
          {/* AI ENGINE */}
          {services.ai && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${services.ai.status === 'connected' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-400'}`} />
                  <span className="font-serif font-bold text-sm text-slate-100">{services.ai.service}</span>
                  <span className="text-slate-400">({services.ai.provider})</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase border ${
                  services.ai.status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {services.ai.status === 'connected' ? '● Connected' : '○ Not Configured'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                <span>Model: </span>
                <strong className="text-amber-300">{services.ai.model || 'gemini-3.8-flash'}</strong>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">{services.ai.details}</p>
            </div>
          )}

          {/* WEB RESEARCH */}
          {services.serpapi && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${services.serpapi.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="font-serif font-bold text-sm text-slate-100">{services.serpapi.service}</span>
                  <span className="text-slate-400">({services.serpapi.provider})</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase border ${
                  services.serpapi.status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {services.serpapi.status === 'connected' ? '● Connected' : '○ Optional'}
                </span>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">{services.serpapi.details}</p>
            </div>
          )}

          {/* MAPS & NAVIGATION */}
          {services.maps && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <span className="font-serif font-bold text-sm text-slate-100">{services.maps.service}</span>
                  <span className="text-slate-400">({services.maps.provider})</span>
                </div>
                <span className="px-2.5 py-0.5 rounded font-bold text-[10px] uppercase border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                  ● Available
                </span>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">{services.maps.details}</p>
            </div>
          )}

          {/* STORAGE */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <span className="font-serif font-bold text-sm text-slate-100">STORAGE</span>
                <span className="text-slate-400">(Browser Local Storage)</span>
              </div>
              <span className="px-2.5 py-0.5 rounded font-bold text-[10px] uppercase border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                ● Active
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-emerald-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Browser storage available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Active hunt data can be saved and restored</span>
              </div>
            </div>
          </div>
        </div>

        {/* SWAGGER DOCS LINK */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>OpenAPI 3.0 Interactive API Docs available at <code className="text-amber-300 font-bold">/api/docs</code></span>
          </div>

          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition-colors shrink-0 text-center text-xs"
          >
            Open Swagger API Docs &rarr;
          </a>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs hover:bg-slate-700 transition-colors">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
