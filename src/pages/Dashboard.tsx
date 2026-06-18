import React, { useEffect, useState } from 'react';
import { getSummary, getLeadsPipeline, getRevenueAttribution, getFollowups, setAIControl } from '../api';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);

  // Control State
  const [strategy, setStrategy] = useState('hybrid');
  const [markup, setMarkup] = useState('0');
  const [followupsEnabled, setFollowupsEnabled] = useState(true);

  useEffect(() => {
    getSummary().then(setData).catch(console.error);
    getLeadsPipeline().then(setLeads).catch(console.error);
    getRevenueAttribution().then(setRevenue).catch(console.error);
    getFollowups().then(setFollowups).catch(console.error);
  }, []);

  const handleApplyControl = async () => {
    await setAIControl({ strategy, markup: parseInt(markup), followups: followupsEnabled });
    alert('AI Settings applied!');
  };

  const handleOneClickClose = async () => {
    setStrategy('aggressive');
    setFollowupsEnabled(true);
    await setAIControl({ strategy: 'aggressive', markup: 0, followups: true });
    alert('Aggressive closing mode activated!');
  };

  if (!data) return <div className="p-4 text-gray-500">Loading metrics...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">SaaS Control Center</h2>
        <button 
          onClick={handleOneClickClose}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
            🔥 1-Click Aggressive Close
        </button>
      </div>
      
      {/* 📊 ТОП Метрики */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">AI Replies</h3>
            <p className="text-3xl font-bold mt-2 text-gray-900">{data.replies || 0}</p>
        </div>
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Hot Leads</h3>
            <p className="text-3xl font-bold mt-2 text-gray-900">{data.leads || 0}</p>
        </div>
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Deals Closed</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">{data.deals || 0}</p>
        </div>
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-3xl font-bold mt-2 text-blue-600">{data.revenue || 0} ₽</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 🧠 AI Control */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">🤖 AI Behavior Control</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Strategy</label>
              <select 
                value={strategy} onChange={e => setStrategy(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500">
                <option value="soft">Soft (Consultative)</option>
                <option value="hybrid">Hybrid (Balanced)</option>
                <option value="aggressive">Aggressive (Hard close)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Markup (%)</label>
              <input 
                type="number" value={markup} onChange={e => setMarkup(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" 
              />
            </div>

            <div className="flex items-center mt-4">
              <input 
                type="checkbox" checked={followupsEnabled} onChange={e => setFollowupsEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
              />
              <label className="ml-2 block text-sm text-gray-900">Enable Smart Follow-ups</label>
            </div>

            <button 
              onClick={handleApplyControl}
              className="w-full mt-4 bg-gray-900 text-white rounded-lg px-4 py-2 font-medium hover:bg-gray-800 transition-colors">
              Apply Live Settings
            </button>
          </div>
        </div>

        {/* 💰 Revenue Attribution */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
           <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">💰 Revenue Attribution</h3>
           <table className="w-full text-left text-sm">
             <thead>
               <tr className="text-gray-500 border-b">
                 <th className="pb-2">Strategy</th>
                 <th className="pb-2">Deals</th>
                 <th className="pb-2">Avg Rev</th>
                 <th className="pb-2">Total</th>
               </tr>
             </thead>
             <tbody>
               {revenue.map((r, i) => (
                 <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 font-medium">{r.strategy || 'organic'}</td>
                    <td className="py-2">{r.deals}</td>
                    <td className="py-2">{Math.round(r.avg_revenue)} ₽</td>
                    <td className="py-2 text-green-600 font-medium">{r.total_revenue} ₽</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>

        {/* ⏳ Follow-ups */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-80 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">⏳ Pending Follow-ups</h3>
          <div className="space-y-3">
             {followups.length === 0 ? <p className="text-sm text-gray-500">No scheduled followups</p> : null}
             {followups.map((f, i) => (
               <div key={i} className="flex justify-between items-center text-sm p-3 bg-blue-50 rounded-lg border border-blue-100">
                 <div>
                   <span className="font-semibold text-blue-900">Lead #{f.lead_id}</span>
                   <p className="text-xs text-blue-700">Step {f.step + 1}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-blue-900">
                     {new Date(f.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </p>
                 </div>
               </div>
             ))}
          </div>
        </div>

      </div>

      {/* 🔥 Ranked Leads */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">🔥 Priority Ranked Leads</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b">
                <th className="p-3">Rank</th>
                <th className="p-3">User ID</th>
                <th className="p-3">Score</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${i < 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{l.user_id} {l.needs_human && <span className="ml-1 text-red-500" title="Needs Human">✋</span>}</td>
                  <td className="p-3">{Math.round(l.priority)}</td>
                  <td className="p-3 text-gray-600">{l.stage}</td>
                  <td className="p-3">
                     <button className="text-blue-600 hover:underline">View Chat</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
