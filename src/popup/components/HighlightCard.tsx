import React, { useState } from 'react';
import type { Highlight } from '@/shared/types';
import { HIGHLIGHT_COLORS } from '@/shared/constants';
import { formatDate, truncate, getDomain } from '@/shared/utils';
import { useStore } from '../store';

interface Props {
  highlight: Highlight;
}

export default function HighlightCard({ highlight }: Props) {
  const { tags, deleteHighlight, updateHighlightTags } = useStore();
  const [showActions, setShowActions] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteHighlight(highlight.id);
  };

  const toggleTag = (tagName: string) => {
    const current = highlight.tags;
    const updated = current.includes(tagName)
      ? current.filter((t) => t !== tagName)
      : [...current, tagName];
    updateHighlightTags(highlight.id, updated);
  };

  return (
    <div
      className="rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors group relative"
      style={{ borderLeftWidth: 3, borderLeftColor: HIGHLIGHT_COLORS[highlight.color] }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setConfirmDelete(false);
        setShowTagPicker(false);
      }}
    >
      <p className="text-sm leading-relaxed">{truncate(highlight.text, 120)}</p>
      {highlight.note && (
        <p className="text-xs text-gray-500 mt-1 italic">{truncate(highlight.note, 60)}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400">{getDomain(highlight.url)}</span>
        <span className="text-[10px] text-gray-400">{formatDate(highlight.createdAt)}</span>
      </div>
      {highlight.tags.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {highlight.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons — visible on hover */}
      {showActions && (
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => setShowTagPicker(!showTagPicker)}
            className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            🏷️ Tag
          </button>
          <button
            onClick={handleDelete}
            className={`text-[10px] px-2 py-0.5 rounded ${
              confirmDelete ? 'bg-red-500 text-white' : 'bg-gray-100 text-red-500 hover:bg-red-50'
            }`}
          >
            {confirmDelete ? 'Confirm?' : '🗑️ Delete'}
          </button>
        </div>
      )}

      {/* Tag picker dropdown */}
      {showTagPicker && (
        <div className="mt-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
          {tags.length === 0 ? (
            <p className="text-[10px] text-gray-400">Create tags in the Tags tab first</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => {
                const active = highlight.tags.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.name)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      active
                        ? 'border-indigo-400 bg-indigo-100 text-indigo-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
