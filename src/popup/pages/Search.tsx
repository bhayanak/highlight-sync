import React, { useState } from 'react';
import { useStore } from '../store';
import HighlightCard from '../components/HighlightCard';

export default function Search() {
  const { highlights, search } = useStore();
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    search(value);
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search highlights…"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      <div className="space-y-2">
        {highlights.length === 0 && query ? (
          <p className="text-xs text-gray-400 text-center py-6">No results found</p>
        ) : (
          highlights.map((h) => <HighlightCard key={h.id} highlight={h} />)
        )}
      </div>
    </div>
  );
}
