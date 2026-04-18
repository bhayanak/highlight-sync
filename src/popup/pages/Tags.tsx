import React, { useState } from 'react';
import { useStore } from '../store';
import { addTag, deleteTag } from '@/background/storage';
import { HIGHLIGHT_COLORS } from '@/shared/constants';

export default function Tags() {
  const { tags, loadTags } = useStore();
  const [newTag, setNewTag] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');

  const handleAdd = async () => {
    const name = newTag.trim();
    if (!name) return;
    await addTag(name, selectedColor);
    setNewTag('');
    loadTags();
  };

  const handleDelete = async (id: string) => {
    await deleteTag(id);
    loadTags();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="New tag…"
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Add
        </button>
      </div>

      <div className="flex gap-1">
        {Object.values(HIGHLIGHT_COLORS).map((hex) => (
          <button
            key={hex}
            onClick={() => setSelectedColor(hex)}
            className="w-6 h-6 rounded-full border-2 transition-colors"
            style={{
              backgroundColor: hex,
              borderColor: selectedColor === hex ? '#6366f1' : 'transparent',
            }}
          />
        ))}
      </div>

      <div className="space-y-1">
        {tags.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No tags yet</p>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="text-sm">{tag.name}</span>
                <span className="text-xs text-gray-400">({tag.highlightCount})</span>
              </div>
              <button
                onClick={() => handleDelete(tag.id)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
