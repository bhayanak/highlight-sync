import React, { useEffect } from 'react';
import { useStore } from './store';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Tags from './pages/Tags';
import Review from './pages/Review';
import Export from './pages/Export';
import Settings from './pages/Settings';

const TABS = [
  { id: 'dashboard', label: '📊', title: 'Dashboard' },
  { id: 'search', label: '🔍', title: 'Search' },
  { id: 'tags', label: '🏷️', title: 'Tags' },
  { id: 'review', label: '🧠', title: 'Review' },
  { id: 'export', label: '📤', title: 'Export' },
  { id: 'settings', label: '⚙️', title: 'Settings' },
] as const;

export default function App() {
  const { activeTab, setActiveTab, loadHighlights, loadTags, loadReviewQueue } = useStore();

  useEffect(() => {
    loadHighlights();
    loadTags();
    loadReviewQueue();
  }, [loadHighlights, loadTags, loadReviewQueue]);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'search':
        return <Search />;
      case 'tags':
        return <Tags />;
      case 'review':
        return <Review />;
      case 'export':
        return <Export />;
      case 'settings':
        return <Settings />;
    }
  };

  return (
    <div className="flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-indigo-50">
        <span className="text-lg">✨</span>
        <h1 className="text-sm font-bold text-indigo-700">Highlight Sync</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">{renderPage()}</div>

      {/* Tab Bar */}
      <nav className="flex border-t border-gray-200 bg-gray-50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.title}
            className={`flex-1 py-2 text-center text-base transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
