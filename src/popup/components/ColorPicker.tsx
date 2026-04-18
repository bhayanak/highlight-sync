import React from 'react';
import type { HighlightColor } from '@/shared/types';
import { HIGHLIGHT_COLORS } from '@/shared/constants';

interface Props {
  selected: HighlightColor;
  onChange: (color: HighlightColor) => void;
}

export default function ColorPicker({ selected, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          title={color}
          className="w-6 h-6 rounded-full border-2 transition-colors"
          style={{
            backgroundColor: HIGHLIGHT_COLORS[color],
            borderColor: selected === color ? '#6366f1' : 'transparent',
          }}
        />
      ))}
    </div>
  );
}
