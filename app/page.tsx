'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ChatAgent } from '../components/ChatAgent';
import { ExecutiveDashboard } from '../components/ExecutiveDashboard';
import { DataExplorer } from '../components/DataExplorer';
import { LeadershipBriefingView } from '../components/LeadershipBriefingView';
import { MondayConnector } from '../components/MondayConnector';
import { CleanDeal, CleanWorkOrder, CrossBoardMatch, DataQualityReport, MondayBoardConfig } from '../lib/types';
import { ExecutiveSummaryStats } from '../lib/agent/analytics';

import { getClientStore } from '../lib/data/client_store';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'explorer' | 'briefing' | 'connector'>('chat');
  const [deals, setDeals] = useState<CleanDeal[]>([]);
  const [workOrders, setWorkOrders] = useState<CleanWorkOrder[]>([]);
  const [crossBoardMatches, setCrossBoardMatches] = useState<CrossBoardMatch[]>([]);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [stats, setStats] = useState<ExecutiveSummaryStats | null>(null);
  const [mondayConfig, setMondayConfig] = useState<MondayBoardConfig>({
    apiKey: '',
    dealsBoardId: '',
    workOrdersBoardId: '',
    isLive: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data/overview');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDeals(data.cleanDeals);
          setWorkOrders(data.cleanWorkOrders);
          setCrossBoardMatches(data.crossBoardMatches);
          setQualityReport(data.qualityReport);
          setStats(data.stats);
          setMondayConfig(data.mondayConfig);
          setIsLoading(false);
          return;
        }
      }
      throw new Error('Fallback to client store');
    } catch {
      // Direct client-side execution fallback for GitHub Pages
      const clientData = getClientStore();
      setDeals(clientData.cleanDealsList);
      setWorkOrders(clientData.cleanWorkOrdersList);
      setCrossBoardMatches(clientData.crossBoardMatches);
      setQualityReport(clientData.qualityReport);
      setStats(clientData.stats);
      setMondayConfig(clientData.mondayConfig);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleAskAgent = (query: string) => {
    setActiveTab('chat');
    // Can emit or trigger query if needed
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLive={mondayConfig.isLive}
        completenessScore={qualityReport?.completenessScore || 94}
        onRefresh={fetchOverview}
        isLoading={isLoading}
      />

      <main className="flex-1 pb-8">
        {activeTab === 'chat' && <ChatAgent />}

        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            stats={stats}
            qualityReport={qualityReport}
            onAskAgent={handleAskAgent}
          />
        )}

        {activeTab === 'explorer' && (
          <DataExplorer
            deals={deals}
            workOrders={workOrders}
            crossBoardMatches={crossBoardMatches}
            qualityReport={qualityReport}
          />
        )}

        {activeTab === 'briefing' && <LeadershipBriefingView />}

        {activeTab === 'connector' && (
          <MondayConnector
            config={mondayConfig}
            onSyncSuccess={fetchOverview}
          />
        )}
      </main>
    </div>
  );
}
