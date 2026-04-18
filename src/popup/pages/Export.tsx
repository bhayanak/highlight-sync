import React, { useState } from 'react';
import { useStore } from '../store';
import { exportHighlights } from '@/background/export-engine';
import type { ExportOptions } from '@/shared/types';

const FORMATS = [
  { id: 'markdown', label: 'Markdown' },
  { id: 'obsidian', label: 'Obsidian' },
  { id: 'notion', label: 'Notion' },
  { id: 'json', label: 'JSON' },
  { id: 'csv', label: 'CSV' },
  { id: 'anki', label: 'Anki' },
] as const;

const GROUP_OPTIONS = [
  { id: 'page', label: 'By Page' },
  { id: 'date', label: 'By Date' },
  { id: 'tag', label: 'By Tag' },
] as const;

export default function Export() {
  const { highlights } = useStore();
  const [format, setFormat] = useState<ExportOptions['format']>('markdown');
  const [groupBy, setGroupBy] = useState<ExportOptions['groupBy']>('page');
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const output = exportHighlights(highlights, { format, groupBy });

    const ext =
      format === 'csv' ? 'csv' : format === 'json' ? 'json' : format === 'anki' ? 'txt' : 'md';
    const mime =
      format === 'csv' ? 'text/csv' : format === 'json' ? 'application/json' : 'text/plain';

    const blob = new Blob([output], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `highlight-sync-export.${ext}`;
    a.click();
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Format</label>
        <div className="grid grid-cols-3 gap-1">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`py-1.5 text-xs rounded-lg border transition-colors ${
                format === f.id
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Group By</label>
        <div className="flex gap-1">
          {GROUP_OPTIONS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGroupBy(g.id)}
              className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                groupBy === g.id
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={highlights.length === 0}
        className="w-full py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exported ? '✓ Exported!' : `Export ${highlights.length} highlights`}
      </button>

      {highlights.length === 0 && (
        <p className="text-xs text-gray-400 text-center">No highlights to export</p>
      )}
    </div>
  );
}
