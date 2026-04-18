import React from 'react';
import { useStore } from '../store';
import type { SyncConfig } from '@/shared/types';

export default function Settings() {
  const { syncConfig, setSyncConfig } = useStore();

  const update = (patch: Partial<SyncConfig>) => {
    setSyncConfig({ ...syncConfig, ...patch });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase">Sync Provider</h3>
      <div className="space-y-1">
        {(['none', 'gist', 'self-hosted'] as const).map((provider) => (
          <label
            key={provider}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              syncConfig.provider === provider
                ? 'bg-indigo-50 border border-indigo-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="provider"
              value={provider}
              checked={syncConfig.provider === provider}
              onChange={() => update({ provider })}
              className="accent-indigo-600"
            />
            <span className="text-sm capitalize">{provider === 'none' ? 'Off' : provider}</span>
          </label>
        ))}
      </div>

      {syncConfig.provider === 'gist' && (
        <div className="space-y-2">
          <label className="block">
            <span className="text-xs text-gray-500">GitHub PAT (gist scope)</span>
            <input
              type="password"
              value={syncConfig.gistToken || ''}
              onChange={(e) => update({ gistToken: e.target.value })}
              placeholder="ghp_…"
              className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">Gist ID (leave blank for new)</span>
            <input
              type="text"
              value={syncConfig.gistId || ''}
              onChange={(e) => update({ gistId: e.target.value })}
              placeholder="optional"
              className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>
        </div>
      )}

      {syncConfig.provider === 'self-hosted' && (
        <label className="block">
          <span className="text-xs text-gray-500">Endpoint URL (HTTPS required)</span>
          <input
            type="url"
            value={syncConfig.selfHostedUrl || ''}
            onChange={(e) => update({ selfHostedUrl: e.target.value })}
            placeholder="https://…"
            className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </label>
      )}

      {syncConfig.provider !== 'none' && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={syncConfig.autoSync}
              onChange={(e) => update({ autoSync: e.target.checked })}
              className="accent-indigo-600"
            />
            Auto-sync
          </label>

          {syncConfig.autoSync && (
            <label className="block">
              <span className="text-xs text-gray-500">Interval (minutes)</span>
              <input
                type="number"
                min={5}
                max={1440}
                value={syncConfig.syncIntervalMinutes}
                onChange={(e) =>
                  update({ syncIntervalMinutes: Math.max(5, Number(e.target.value)) })
                }
                className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </label>
          )}

          <button
            onClick={() => chrome.runtime.sendMessage({ type: 'SYNC' })}
            className="w-full py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100"
          >
            Sync Now
          </button>
        </div>
      )}

      <div className="pt-2 border-t border-gray-200">
        <p className="text-[10px] text-gray-400 text-center">Highlight Sync v1.0.0 — MIT License</p>
      </div>
    </div>
  );
}
