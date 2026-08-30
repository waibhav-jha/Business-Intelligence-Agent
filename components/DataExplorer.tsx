'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { CleanDeal, CleanWorkOrder, CrossBoardMatch, DataQualityReport } from '../lib/types';

interface DataExplorerProps {
  deals: CleanDeal[];
  workOrders: CleanWorkOrder[];
  crossBoardMatches: CrossBoardMatch[];
  qualityReport: DataQualityReport | null;
}

export const DataExplorer: React.FC<DataExplorerProps> = ({
  deals,
  workOrders,
  crossBoardMatches,
  qualityReport,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'deals' | 'workOrders' | 'matches' | 'quality'>('deals');
  const [search, setSearch] = useState('');

  const filteredDeals = deals.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.client.toLowerCase().includes(search.toLowerCase()) ||
    d.sector.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = workOrders.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.client.toLowerCase().includes(search.toLowerCase()) ||
    w.sector.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMatches = crossBoardMatches.filter(m =>
    m.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header & Resilience Score Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Cross-Board Data Resilience & Integrity</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time normalization, fuzzy entity resolution, and audit trail across Monday.com boards
          </p>
        </div>

        {qualityReport && (
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Completeness Score</span>
                <span className="text-base font-bold text-emerald-400">{qualityReport.completenessScore}%</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Records Cleaned</span>
                <span className="text-base font-bold text-white">{deals.length + workOrders.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub Tab Controls & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('deals')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'deals' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Deals Board ({deals.length})
          </button>
          <button
            onClick={() => setActiveSubTab('workOrders')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'workOrders' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Work Orders ({workOrders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('matches')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'matches' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cross-Board Joins ({crossBoardMatches.length})
          </button>
          <button
            onClick={() => setActiveSubTab('quality')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'quality' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Data Quality Audit
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter records..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* 1. Deals Board View */}
      {activeSubTab === 'deals' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Deal / Project</th>
                  <th className="p-3.5">Client (Normalized)</th>
                  <th className="p-3.5">Sector</th>
                  <th className="p-3.5">Stage</th>
                  <th className="p-3.5">Raw Value</th>
                  <th className="p-3.5">Normalized (INR)</th>
                  <th className="p-3.5">Close Date</th>
                  <th className="p-3.5">Resilience Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-medium text-white max-w-xs truncate">{deal.name}</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-200">{deal.client}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">[{deal.normalizedClient}]</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {deal.sector}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          deal.stage === 'Closed Won'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : deal.stage === 'Closed Lost'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : deal.stage === 'Negotiation'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {deal.stage}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{String(deal.raw.value)}</td>
                    <td className="p-3.5 font-bold text-white font-mono">{deal.formattedValue}</td>
                    <td className="p-3.5 text-slate-400">
                      {deal.expectedCloseDate || <span className="text-amber-400 italic">Inferred Q4</span>}
                      {deal.quarter && <span className="text-[10px] text-slate-400 block font-mono">({deal.quarter})</span>}
                    </td>
                    <td className="p-3.5">
                      {deal.dataQualityIssues.length > 0 ? (
                        <div className="space-y-0.5">
                          {deal.dataQualityIssues.map((iss, iIdx) => (
                            <span key={iIdx} className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded block truncate">
                              ✓ {iss}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Clean
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Work Orders Board View */}
      {activeSubTab === 'workOrders' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">WO ID / Name</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Ops Status</th>
                  <th className="p-3.5">Survey Area</th>
                  <th className="p-3.5">Flight Date</th>
                  <th className="p-3.5">Expected Delivery</th>
                  <th className="p-3.5">Billing</th>
                  <th className="p-3.5">Delays / Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono text-emerald-400 font-bold block">{order.id}</span>
                      <span className="text-white font-medium truncate block max-w-xs">{order.name}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">{order.client}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : order.status === 'Cancelled'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : order.status === 'On Hold'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{order.surveyAreaKm2} km²</td>
                    <td className="p-3.5 text-slate-400">{order.flightDate || 'Pending Schedule'}</td>
                    <td className="p-3.5 text-slate-400">{order.expectedDeliveryDate || 'N/A'}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {order.billingStatus}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      {order.isDelayed || order.weatherDelayDays > 0 ? (
                        <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>{order.weatherDelayDays > 0 ? `${order.weatherDelayDays}d Weather Standby` : 'Delayed'} - {order.issuesLog || 'Delay in delivery'}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-mono">On Track</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Cross-Board Entity Resolution Joins */}
      {activeSubTab === 'matches' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map((match, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl glass-panel space-y-3 ${
                  match.isAtRisk ? 'border-rose-500/30' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{match.client}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Fuzzy Key: [{match.normalizedClient}]
                    </span>
                  </div>
                  {match.isAtRisk ? (
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-semibold font-mono">
                      At Risk
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold font-mono">
                      Healthy Join
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Deals Funnel</span>
                    <span className="font-bold text-white font-mono">{match.deals.length} Deals</span>
                    <span className="text-[10px] text-emerald-400 block font-mono">
                      Won: ₹{(match.wonDealTotalValue / 100000).toFixed(0)}L | Pipe: ₹{(match.pipelineTotalValue / 100000).toFixed(0)}L
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Work Orders</span>
                    <span className="font-bold text-white font-mono">{match.workOrders.length} Orders</span>
                    <span className="text-[10px] text-blue-400 block font-mono">
                      {match.hasActiveWorkOrders ? 'Active Flights' : 'No Active Ops'}
                    </span>
                  </div>
                </div>

                {match.riskReason && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{match.riskReason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Data Quality Audit */}
      {activeSubTab === 'quality' && qualityReport && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Data Resilience & Transformation Log</h3>
            <p className="text-xs text-slate-400">
              Audit log of missing values handled, currency conversions, date standardizations, and cross-board caveats.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Resilience Caveats</h4>
            {qualityReport.caveats.map((cav, cIdx) => (
              <div key={cIdx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{cav}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Detailed Transformation Issues ({qualityReport.issuesList.length})</h4>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {qualityReport.issuesList.map((iss, iIdx) => (
                <div key={iIdx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {iss.board}
                    </span>
                    <span className="font-semibold text-white">{iss.itemTitle}</span>
                    <span className="text-slate-400">→ {iss.description}</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    iss.severity === 'high' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {iss.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
