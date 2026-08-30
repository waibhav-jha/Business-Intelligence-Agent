'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Terminal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BIQueryResponse } from '../lib/types';
import { handleClientQuery } from '../lib/data/client_store';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text?: string;
  response?: BIQueryResponse;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "How's our pipeline looking for energy sector this quarter?",
  "Which clients have delayed work orders and open deals in negotiation?",
  "Show revenue, win rates, and pipeline distribution by sector",
  "What are our flight operations metrics and weather delays?",
  "Generate an executive leadership briefing for the board",
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#64748b'];

function getFormattedTime(): string {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${strMinutes} ${ampm}`;
}

export const ChatAgent: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Welcome to Skylark Drones Business Intelligence Agent. I am connected directly to your Monday.com Deals Pipeline and Drone Flight Operations Work Orders. Ask me anything about quarterly pipeline health, sector conversion rates, delivery SLAs, or cross-board risks.",
      timestamp: 'Just now',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: getFormattedTime(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const agentMsg: Message = {
            id: `agent-${Date.now()}`,
            sender: 'agent',
            response: json.data,
            timestamp: getFormattedTime(),
          };
          setMessages(prev => [...prev, agentMsg]);
          setIsLoading(false);
          return;
        }
      }
      throw new Error('API unavailable, running client engine');
    } catch {
      // Direct in-browser query execution for static GitHub Pages hosting
      try {
        const clientResponse = handleClientQuery(q);
        const agentMsg: Message = {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          response: clientResponse,
          timestamp: getFormattedTime(),
        };
        setMessages(prev => [...prev, agentMsg]);
      } catch (err: any) {
        setMessages(prev => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            sender: 'agent',
            text: `Error: ${err.message || 'Unable to process query'}`,
            timestamp: getFormattedTime(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-6xl mx-auto px-2 sm:px-4 py-3">
      {/* Quick Prompts Bar */}
      <div className="mb-3 overflow-x-auto pb-2 flex items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] font-mono uppercase font-semibold text-slate-400 pl-1 shrink-0">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          QUICK QUERIES:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="text-[11px] font-mono bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/40 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 active:scale-95"
          >
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'agent' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-1 shadow-md">
                  <Terminal className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-4xl rounded-2xl p-4 sm:p-5 ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm self-end shadow-md font-mono text-xs'
                    : 'tech-panel rounded-tl-sm text-slate-200 w-full'
                }`}
              >
                {/* Header / Timestamp */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-slate-800/80 text-[10px] font-mono">
                  <span className="font-semibold text-slate-300">
                    {msg.sender === 'user' ? 'FOUNDER // QUERY' : 'SKYLARK BI AGENT // SYNTHESIS'}
                  </span>
                  <span className="text-slate-400" suppressHydrationWarning>{msg.timestamp}</span>
                </div>

                {/* Message Plain Text or Welcome */}
                {!msg.response ? (
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-300">
                    {msg.text}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bottom Line / Executive Summary Banner */}
                    <div className="p-3.5 rounded-xl tech-panel-emerald flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-400 mb-1">
                          EXECUTIVE BOTTOM LINE
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed font-mono">
                          {msg.response.bottomLine}
                        </p>
                      </div>
                    </div>

                    {/* Clarification Mode if Triggered */}
                    {msg.response.isClarificationNeeded && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                        <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono uppercase tracking-wider">
                          <HelpCircle className="w-4 h-4" />
                          <span>Clarification Needed</span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-200">
                          {msg.response.clarificationQuestion}
                        </p>
                        {msg.response.clarificationOptions && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {msg.response.clarificationOptions.map((opt, oIdx) => (
                              <button
                                key={oIdx}
                                onClick={() => handleSend(opt)}
                                className="text-left text-xs p-2.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-200 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-2 active:scale-98 font-mono"
                              >
                                <span>{opt}</span>
                                <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metric Cards Grid */}
                    {msg.response.metrics && msg.response.metrics.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {msg.response.metrics.map((metric, mIdx) => (
                          <div
                            key={mIdx}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-colors"
                          >
                            <span className="text-[10px] text-slate-400 block font-mono uppercase truncate">
                              {metric.label}
                            </span>
                            <div className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5 font-mono">
                              {metric.value}
                            </div>
                            {metric.change && (
                              <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                                {metric.change}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Key Strategic Insights Bullets */}
                    {msg.response.keyInsights && msg.response.keyInsights.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                          <span>Key Intelligence Insights</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {msg.response.keyInsights.map((insight, iIdx) => (
                            <li key={iIdx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold mt-0.5">▪</span>
                              <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Dynamic Visualizations (Recharts) */}
                    {msg.response.chart && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-xs font-semibold text-slate-200 font-mono">
                            {msg.response.chart.title}
                          </h5>
                          <span className="text-[9px] uppercase font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            TELEMETRY VIZ
                          </span>
                        </div>

                        <div className="h-56 w-full">
                          {msg.response.chart.type === 'donut' ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#0a0f1a',
                                    borderColor: '#1e293b',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                  }}
                                />
                                <Pie
                                  data={msg.response.chart.data}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={75}
                                  paddingAngle={4}
                                >
                                  {msg.response.chart.data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontFamily: 'monospace' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={msg.response.chart.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey={msg.response.chart.xAxisKey || 'name'} stroke="#94a3b8" fontSize={10} fontStyle="mono" />
                                <YAxis stroke="#94a3b8" fontSize={10} fontStyle="mono" />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#0a0f1a',
                                    borderColor: '#1e293b',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                  }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontFamily: 'monospace' }} />
                                {msg.response.chart.dataKeys.map((dk, dkIdx) => (
                                  <Bar
                                    key={dkIdx}
                                    dataKey={dk.key}
                                    name={dk.name}
                                    fill={dk.color || COLORS[dkIdx % COLORS.length]}
                                    radius={[3, 3, 0, 0]}
                                  />
                                ))}
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Risks & Red Flags */}
                    {msg.response.risksAndFlags && msg.response.risksAndFlags.length > 0 && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-rose-400 uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Cross-Board Operational & Financial Risks</span>
                        </div>
                        <div className="space-y-1">
                          {msg.response.risksAndFlags.map((risk, rIdx) => (
                            <p key={rIdx} className="text-xs text-rose-200 leading-relaxed font-mono">
                              {risk}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Action Items */}
                    {msg.response.actionItems && msg.response.actionItems.length > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Recommended Leadership Next Steps</span>
                        </div>
                        <div className="space-y-1">
                          {msg.response.actionItems.map((act, aIdx) => (
                            <div key={aIdx} className="text-xs text-emerald-200 flex items-start gap-1.5">
                              <span className="font-bold">→</span>
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data Resilience & Quality Caveats Banner */}
                    {msg.response.dataCaveats && msg.response.dataCaveats.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-medium text-slate-300">Data Resilience:</span>
                          <span>{msg.response.dataCaveats[0]}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400">
                          Completeness: {msg.response.dataCompletenessScore}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Terminal className="w-4 h-4 animate-pulse" />
            </div>
            <div className="tech-panel px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Synthesizing cross-board data from Monday.com...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Query Input Bar */}
      <div className="mt-3 pt-2 border-t border-slate-800/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything (e.g. 'How is pipeline for energy sector?' or 'Which clients have delayed work orders?')"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all font-mono shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 sm:px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-mono text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">QUERY</span>
          </button>
        </form>
      </div>
    </div>
  );
};
