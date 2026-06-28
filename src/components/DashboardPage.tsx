/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { WasteLog, WasteCategory } from '../types';
import DashboardMap from './DashboardMap';
import { 
  Leaf, 
  Cpu, 
  Layers, 
  HelpCircle, 
  Trash2, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Scale, 
  Wrench,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardPageProps {
  updateTrigger: number; // to handle manual re-fetches if any
}

const CATEGORY_META: Record<WasteCategory, { label: string; icon: React.ReactNode; color: string; border: string; bg: string; text: string }> = {
  Plastic: { 
    label: 'Plastic', 
    icon: <Layers className="w-4 h-4" />, 
    color: 'bg-sky-500', 
    border: 'border-sky-100',
    bg: 'bg-sky-50/60',
    text: 'text-sky-700'
  },
  'E-Waste': { 
    label: 'E-Waste', 
    icon: <Cpu className="w-4 h-4" />, 
    color: 'bg-indigo-500', 
    border: 'border-indigo-100',
    bg: 'bg-indigo-50/60',
    text: 'text-indigo-700'
  },
  Organic: { 
    label: 'Organic', 
    icon: <Leaf className="w-4 h-4" />, 
    color: 'bg-emerald-500', 
    border: 'border-emerald-100',
    bg: 'bg-emerald-50/60',
    text: 'text-emerald-700'
  },
  Metal: { 
    label: 'Metal', 
    icon: <Wrench className="w-4 h-4" />, 
    color: 'bg-slate-500', 
    border: 'border-slate-200',
    bg: 'bg-slate-100/60',
    text: 'text-slate-700'
  },
  Other: { 
    label: 'Other', 
    icon: <HelpCircle className="w-4 h-4" />, 
    color: 'bg-amber-500', 
    border: 'border-amber-100',
    bg: 'bg-amber-50/60',
    text: 'text-amber-700'
  }
};

export default function DashboardPage({ updateTrigger }: DashboardPageProps) {
  const [logs, setLogs] = useState<WasteLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayUnit, setDisplayUnit] = useState<'kg' | 'lbs'>('kg');

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Live query listening to firestore
    const logsQuery = query(
      collection(db, 'waste_logs'), 
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      logsQuery, 
      (querySnapshot) => {
        const tempLogs: WasteLog[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const isPending = doc.metadata.hasPendingWrites;

          // Legacy data calculation: if weightInKg wasn't stored, compute it based on stored weight/unit
          let calculatedWeightInKg = data.weightInKg;
          if (typeof calculatedWeightInKg !== 'number') {
            const u = data.unit || 'kg';
            if (u === 'g') {
              calculatedWeightInKg = data.weight / 1000;
            } else if (u === 'lbs') {
              calculatedWeightInKg = data.weight * 0.45359237;
            } else {
              calculatedWeightInKg = data.weight;
            }
          }

          tempLogs.push({
            id: doc.id,
            category: data.category,
            weight: data.weight,
            unit: data.unit || 'kg',
            weightInKg: calculatedWeightInKg,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: data.timestamp,
            userId: data.userId,
            userEmail: data.userEmail,
            imageUrl: data.imageUrl,
            isPending: isPending
          } as WasteLog);
        });
        setLogs(tempLogs);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Listener Error:", err);
        setError("Unable to establish a real-time connection to the database. If this is a new Firestore setup, please make sure rules allow read access.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [updateTrigger]);

  // Calculate live totals per category in kilograms (base representation)
  const totals: Record<WasteCategory, number> = {
    Plastic: 0,
    'E-Waste': 0,
    Organic: 0,
    Metal: 0,
    Other: 0
  };

  let grandTotalWeight = 0;

  logs.forEach(log => {
    if (totals[log.category] !== undefined) {
      // Use standard weightInKg if available, fallback to legacy weight property
      const logWeightInKg = typeof log.weightInKg === 'number' ? log.weightInKg : log.weight;
      totals[log.category] += logWeightInKg;
      grandTotalWeight += logWeightInKg;
    }
  });

  // Convert aggregates to the user-selected display unit (kg or lbs)
  const displayTotals = { ...totals };
  let displayGrandTotal = grandTotalWeight;

  if (displayUnit === 'lbs') {
    (Object.keys(displayTotals) as WasteCategory[]).forEach(cat => {
      displayTotals[cat] = totals[cat] * 2.20462262;
    });
    displayGrandTotal = grandTotalWeight * 2.20462262;
  }

  // Helper to format date
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    if (timestamp.toDate) {
      const date = timestamp.toDate();
      return date.toLocaleString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    if (typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return 'Pending Sync';
  };

  return (
    <div className="space-y-8" id="dashboard-page-container">
      
      {/* Dashboard Unit Control & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs" id="dashboard-unit-header">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Community Environmental Ledger</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Aggregates and live analytics from localized environmental compliance audits.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Display Unit:</span>
          <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200/60" id="dashboard-unit-toggle">
            <button
              onClick={() => setDisplayUnit('kg')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                displayUnit === 'kg'
                  ? 'bg-white text-emerald-700 shadow-xs border border-stone-200/40'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Kilograms (kg)
            </button>
            <button
              onClick={() => setDisplayUnit('lbs')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                displayUnit === 'lbs'
                  ? 'bg-white text-emerald-700 shadow-xs border border-stone-200/40'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Pounds (lbs)
            </button>
          </div>
        </div>
      </div>

      {/* Top statistics summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="totals-bento-grid">
        {(Object.keys(CATEGORY_META) as WasteCategory[]).map((cat) => {
          const catTotal = displayTotals[cat];
          const meta = CATEGORY_META[cat];
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-white border border-stone-200 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden shadow-xs"
              id={`total-card-${cat.toLowerCase()}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat}</span>
                <div className={`p-1.5 rounded-lg border border-stone-100 ${meta.bg} ${meta.text}`}>
                  {meta.icon}
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold font-display text-slate-900 block tracking-tight">
                  {catTotal.toFixed(1)} <span className="text-xs text-slate-400 font-normal">{displayUnit}</span>
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Live Aggregate</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-50">
                <div 
                  className={`h-full ${meta.color} transition-all duration-500`}
                  style={{ width: `${grandTotalWeight > 0 ? (totals[cat] / grandTotalWeight) * 100 : 0}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Grand Total Indicator */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-md flex flex-col sm:flex-row items-center justify-between gap-4" id="dashboard-banner">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -top-10 w-44 h-44 bg-slate-800/30 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-emerald-600/90 rounded-xl text-white">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Total Community Footprint</h3>
            <p className="text-slate-400 text-xs">Accumulated weight across all localized ecological audits</p>
          </div>
        </div>
        <div className="relative z-10 text-center sm:text-right">
          <span className="text-3xl font-extrabold font-display tracking-tight text-white">
            {displayGrandTotal.toFixed(2)} <span className="text-sm font-normal text-slate-400">{displayUnit}</span>
          </span>
          <span className="block text-[10px] text-emerald-400 font-bold tracking-widest uppercase mt-1">
            Across {logs.length} Logged Entries
          </span>
        </div>
      </div>

      {/* Main Database Table Container */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden" id="logs-table-card">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-display font-bold text-slate-900">Community Waste Ledger</h3>
            <p className="text-slate-400 text-xs mt-0.5">Real-time synchronized data logs</p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-stone-50 px-2.5 py-1 rounded-full border border-stone-200/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Fetching updates...</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-5 bg-amber-50 border-b border-amber-100 text-amber-800 text-xs flex items-center gap-3" id="dashboard-error-banner">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">Database Synced Notice</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="waste-logs-table">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6 text-right">Weight</th>
                <th className="py-4 px-6 text-center">Proof of Disposal</th>
                <th className="py-4 px-6">Logger</th>
                <th className="py-4 px-6">Latitude</th>
                <th className="py-4 px-6">Longitude</th>
                <th className="py-4 px-6">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-slate-500">Loading real-time ledger records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400" id="empty-table-state">
                    <div className="max-w-xs mx-auto">
                      <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-stone-100">
                        <Trash2 className="w-5 h-5 text-slate-400" />
                      </div>
                      <span className="text-slate-800 font-bold block text-sm mb-1">No Entries Logged Yet</span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Go to the Form View tab to log your very first eco audit entry for this community.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const meta = CATEGORY_META[log.category];
                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-stone-50/60 transition-colors"
                      id={`log-row-${log.id}`}
                    >
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-md border border-stone-100/30 ${meta.bg} ${meta.text}`}>
                            {meta.icon}
                          </div>
                          <span>{log.category}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-900 font-mono">
                        <div>{log.weight.toFixed(2)} {log.unit || 'kg'}</div>
                        {log.unit && log.unit !== 'kg' && log.weightInKg && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({log.weightInKg.toFixed(2)} kg eq.)
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center">
                          {log.imageUrl ? (
                            <div className="relative group w-10 h-10 rounded-lg overflow-hidden border border-stone-200 shadow-xs hover:border-emerald-500 transition-all cursor-zoom-in">
                              <img 
                                src={log.imageUrl} 
                                alt="Disposal proof thumbnail" 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-125" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/45 transition-colors flex items-center justify-center">
                                <span className="text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-wider">
                                  View Pin
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-stone-300 text-[10px] italic">No Image</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium max-w-[130px] truncate">
                        {log.userEmail || 'Guest'}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-mono">
                        {log.latitude.toFixed(6)}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-mono">
                        {log.longitude.toFixed(6)}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {log.isPending ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5 w-fit animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            <span className="text-[10px] uppercase tracking-wider font-bold">Syncing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                            <span>{formatTimestamp(log.timestamp)}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stunning Global Interactive Map */}
      <DashboardMap logs={logs} />
    </div>
  );
}
