'use client';

import React, { useState } from 'react';
import {
  Database,
  Key,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Link,
  ShieldCheck,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { MondayBoardConfig } from '../lib/types';

interface MondayConnectorProps {
  config: MondayBoardConfig;
  onSyncSuccess: () => void;
}

export const MondayConnector: React.FC<MondayConnectorProps> = ({ config, onSyncSuccess }) => {
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [dealsBoardId, setDealsBoardId] = useState(config.dealsBoardId || '');
  const [workOrdersBoardId, setWorkOrdersBoardId] = useState(config.workOrdersBoardId || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; user?: any; boards?: any[]; error?: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/monday/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleLiveSync = async () => {
    if (!apiKey || !dealsBoardId || !workOrdersBoardId) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/monday/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, dealsBoardId, workOrdersBoardId }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`Connected: ${data.message}`);
        onSyncSuccess();
      } else {
        setSyncStatus(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setSyncStatus(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetToDemo = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/monday/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useDemoData: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus('✓ Switched to high-fidelity Skylark Drones demo snapshot');
        onSyncSuccess();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl glass-panel space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Monday.com GraphQL API v2 Connector</h2>
            <p className="text-xs text-slate-400">
              Configure read-only GraphQL connections to dynamically pull and clean Deals and Work Orders boards
            </p>
          </div>
        </div>
      </div>

      {/* Quick Demo Mode Switcher Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-white block">Instant Evaluation Snapshot Ready</span>
            <span className="text-[11px] text-slate-300">
              Reviewing without a live Monday account? The agent has pre-imported rich sample datasets with real messy formats.
            </span>
          </div>
        </div>

        <button
          onClick={handleResetToDemo}
          disabled={isSyncing}
          className="text-xs px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium whitespace-nowrap self-start sm:self-auto transition-colors"
        >
          Reset Demo Snapshot
        </button>
      </div>

      {/* Monday Configuration Form */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-slate-400" />
          <span>Monday.com API Configuration</span>
        </h3>

        {/* API Token Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Personal API Token / OAuth Token</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjEy..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono"
            />
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
              <span>Test API Key</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Generate in Monday.com: <strong>Avatar → Developers → Developer → API</strong>
          </span>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
            testResult.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}>
            {testResult.success ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Connected successfully to Monday.com:</span>
                  <span className="block">{testResult.user?.name} ({testResult.user?.email})</span>
                  {testResult.boards && testResult.boards.length > 0 && (
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Found {testResult.boards.length} accessible boards in workspace.
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Connection failed:</span>
                  <span className="block">{testResult.error}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Board ID Mapping Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Deals Board */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Deals / Sales Pipeline Board ID</label>
            <input
              type="text"
              value={dealsBoardId}
              onChange={(e) => setDealsBoardId(e.target.value)}
              placeholder="e.g. 789234190"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 block">Found in Monday board URL: /boards/&lt;BOARD_ID&gt;</span>
          </div>

          {/* Work Orders Board */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Work Orders / Flight Ops Board ID</label>
            <input
              type="text"
              value={workOrdersBoardId}
              onChange={(e) => setWorkOrdersBoardId(e.target.value)}
              placeholder="e.g. 789234191"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 block">Found in Monday board URL: /boards/&lt;BOARD_ID&gt;</span>
          </div>
        </div>

        {/* Sync Trigger Action */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {syncStatus && <span className="font-medium text-emerald-400">{syncStatus}</span>}
          </div>

          <button
            onClick={handleLiveSync}
            disabled={isSyncing || !apiKey || !dealsBoardId || !workOrdersBoardId}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all self-end sm:self-auto"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Sync Live Monday.com Boards</span>
          </button>
        </div>
      </div>

      {/* Auto-Mapping Schema Reference */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Intelligent Schema Auto-Mapping</span>
        </h3>
        <p className="text-xs text-slate-400">
          The agent automatically discovers and maps Monday.com column structures using heuristic fuzzy title recognition.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-emerald-400 font-bold block">Deals Board Column Heuristics</span>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li>• <strong>Client:</strong> Matches <em>Client, Customer, Account, Company</em></li>
              <li>• <strong>Deal Value:</strong> Matches <em>Value, Amount, ACV, Price, Contract</em></li>
              <li>• <strong>Stage:</strong> Matches <em>Stage, Status, Pipeline Stage</em></li>
              <li>• <strong>Close Date:</strong> Matches <em>Close Date, Timeline, Target Date</em></li>
              <li>• <strong>Sector:</strong> Matches <em>Sector, Industry, Vertical</em></li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-blue-400 font-bold block">Work Orders Column Heuristics</span>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li>• <strong>Client / Deal:</strong> Matches <em>Client, Account, Deal Ref</em></li>
              <li>• <strong>Ops Status:</strong> Matches <em>Status, Stage, Flight State</em></li>
              <li>• <strong>Survey Area:</strong> Matches <em>Area, KM, Acreage, Scope</em></li>
              <li>• <strong>Flight / Delivery:</strong> Matches <em>Flight Date, Delivery Date, Due</em></li>
              <li>• <strong>Delays:</strong> Matches <em>Weather, Delays, Standby Days, Issues</em></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
