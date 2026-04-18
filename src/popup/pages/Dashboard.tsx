import React from 'react';
import { useStore } from '../store';
import HighlightCard from '../components/HighlightCard';
import { getDomain } from '@/shared/utils';

export default function Dashboard() {
  const { highlights, reviewQueue } = useStore();

  const thisWeek = highlights.filter((h) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(h.createdAt).getTime() > weekAgo;
  });

  const topDomains = Object.entries(
    highlights.reduce<Record<string, number>>((acc, h) => {
      const domain = getDomain(h.url);
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Total" value={highlights.length} />
        <StatCard label="This Week" value={thisWeek.length} />
        <StatCard label="To Review" value={reviewQueue.length} />
      </div>

      {/* Top Domains */}
      {topDomains.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Top Sources</h3>
          <div className="space-y-1">
            {topDomains.map(([domain, count]) => (
              <div key={domain} className="flex justify-between text-xs text-gray-600">
                <span className="truncate">{domain}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Highlights */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent</h3>
        {highlights.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            No highlights yet. Select text on any page and highlight it!
          </p>
        ) : (
          <div className="space-y-2">
            {highlights.slice(0, 10).map((h) => (
              <HighlightCard key={h.id} highlight={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 text-center">
      <div className="text-lg font-bold text-indigo-600">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
    </div>
  );
}
