import React, { useState, useEffect } from 'react';
import { Globe, Users, Activity, HardDrive, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AnalyticsData {
  summary: {
    totalRequests: number;
    totalPageViews: number;
    uniqueVisitors: number;
    totalBytes: string;
  };
  dailyTrend: Array<{
    date: string;
    requests: number;
    uniques: number;
    pageViews: number;
  }>;
  topCountries: Array<{
    country: string;
    requests: number;
  }>;
  workerStats: {
    totalInvocations: number;
    errors: number;
  };
}

const WebAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('7');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Sesi admin tidak ditemukan. Silakan login kembali.');
      }

      const res = await fetch(`/api/admin/analytics?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || errJson?.error || `HTTP Error ${res.status}`);
      }

      const raw: any = await res.json();

      if (raw?.errors && raw.errors.length > 0) {
        throw new Error(raw.errors[0]?.message || 'GraphQL Error');
      }

      const zoneData = raw?.data?.viewer?.zones?.[0];
      const http1d = zoneData?.httpRequests1dGroups || [];
      const countries = zoneData?.httpRequestsAdaptiveGroups || [];
      const workerInv = raw?.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive || [];

      // Agregasi Ringkasan
      let totalReq = 0;
      let totalBytesRaw = 0;
      let totalViews = 0;
      let totalUniques = 0;

      const trend = http1d.map((g: any) => {
        const req = g.sum?.requests || 0;
        const b = g.sum?.bytes || 0;
        const pv = g.sum?.pageViews || 0;
        const u = g.uniq?.uniques || 0;

        totalReq += req;
        totalBytesRaw += b;
        totalViews += pv;
        totalUniques += u;

        return {
          date: g.dimensions?.date || '',
          requests: req,
          uniques: u,
          pageViews: pv
        };
      });

      // Top Countries
      const topCountries = countries.map((c: any) => ({
        country: c.dimensions?.clientCountryName || 'Unknown',
        requests: c.sum?.requests || c.count || 0
      }));

      // Worker invocations
      let workerTotal = 0;
      let workerErrors = 0;
      workerInv.forEach((w: any) => {
        workerTotal += w.sum?.requests || 0;
        workerErrors += w.sum?.errors || 0;
      });

      // Format Bytes ke MB / GB
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      setData({
        summary: {
          totalRequests: totalReq,
          totalPageViews: totalViews,
          uniqueVisitors: totalUniques,
          totalBytes: formatBytes(totalBytesRaw)
        },
        dailyTrend: trend,
        topCountries,
        workerStats: {
          totalInvocations: workerTotal,
          errors: workerErrors
        }
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data Cloudflare Analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-black gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Cloudflare Web Analytics</h2>
          <p className="text-xs text-gray-500 font-mono mt-1">Domain: subqi.com &amp; Worker: font.subqi.workers.dev</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-black bg-white">
            {(['7', '14', '30'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-bold font-mono transition-colors ${
                  timeRange === range ? 'bg-black text-white' : 'hover:bg-gray-100 text-black'
                }`}
              >
                {range}D
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase border border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-600 bg-red-50 flex items-start gap-3 text-red-900 text-sm">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold uppercase tracking-wider text-xs text-red-700 mb-1">Gagal Sinkronisasi API</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 border border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Unique Visitors</span>
            <Users size={16} className="text-black" />
          </div>
          <div className="text-3xl font-black font-mono">
            {loading ? '...' : (data?.summary.uniqueVisitors.toLocaleString() || '0')}
          </div>
          <div className="text-[10px] text-gray-500 mt-2 font-mono">Zone subqi.com</div>
        </div>

        <div className="p-5 border border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Requests</span>
            <Activity size={16} className="text-black" />
          </div>
          <div className="text-3xl font-black font-mono">
            {loading ? '...' : (data?.summary.totalRequests.toLocaleString() || '0')}
          </div>
          <div className="text-[10px] text-gray-500 mt-2 font-mono">{data?.summary.totalPageViews.toLocaleString() || '0'} Pageviews</div>
        </div>

        <div className="p-5 border border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Bandwidth</span>
            <HardDrive size={16} className="text-black" />
          </div>
          <div className="text-3xl font-black font-mono">
            {loading ? '...' : (data?.summary.totalBytes || '0 B')}
          </div>
          <div className="text-[10px] text-gray-500 mt-2 font-mono">Egress Edge Cloudflare</div>
        </div>

        <div className="p-5 border border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Worker Invocations</span>
            <Globe size={16} className="text-black" />
          </div>
          <div className="text-3xl font-black font-mono">
            {loading ? '...' : (data?.workerStats.totalInvocations.toLocaleString() || '0')}
          </div>
          <div className="text-[10px] text-gray-500 mt-2 font-mono">{data?.workerStats.errors || 0} Error Executions</div>
        </div>
      </div>

      {/* DETAIL BREAKDOWNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DAILY LOG TABLE */}
        <div className="border border-black bg-white p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-black text-sm uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">
            Aktivitas Harian
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-black text-gray-500">
                  <th className="pb-2 font-bold">DATE</th>
                  <th className="pb-2 font-bold text-right">UNIQUES</th>
                  <th className="pb-2 font-bold text-right">REQUESTS</th>
                  <th className="pb-2 font-bold text-right">PAGEVIEWS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">Memuat log aktivitas...</td>
                  </tr>
                ) : data?.dailyTrend.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">Tidak ada data traffic</td>
                  </tr>
                ) : (
                  data?.dailyTrend.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2.5 font-bold">{row.date}</td>
                      <td className="py-2.5 text-right font-medium">{row.uniques.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-medium">{row.requests.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-medium">{row.pageViews.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP COUNTRIES */}
        <div className="border border-black bg-white p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-black text-sm uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">
            Top Visitor Berdasarkan Negara
          </h3>
          <div className="space-y-3">
            {loading ? (
              <div className="py-6 text-center text-gray-400 text-xs font-mono">Memuat sebaran negara...</div>
            ) : data?.topCountries.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-xs font-mono">Belum ada request tercatat</div>
            ) : (
              data?.topCountries.map((c, idx) => {
                const maxVal = data.topCountries[0]?.requests || 1;
                const pct = Math.round((c.requests / maxVal) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="font-bold">{c.country}</span>
                      <span className="text-gray-500">{c.requests.toLocaleString()} req</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 border border-black/20">
                      <div className="bg-black h-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebAnalytics;