import React, { useState } from 'react';
import { useStore } from '../store';
import { calculateSM2 } from '@/lib/sm2';
import { updateHighlight } from '@/background/storage';
import { HIGHLIGHT_COLORS } from '@/shared/constants';
import { truncate, getDomain } from '@/shared/utils';

export default function Review() {
  const { reviewQueue, loadReviewQueue } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const current = reviewQueue[currentIndex];

  if (reviewQueue.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-3xl mb-2">🎉</p>
        <p className="text-sm text-gray-500">No highlights due for review!</p>
        <p className="text-xs text-gray-400 mt-1">Come back tomorrow</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="text-center py-10">
        <p className="text-3xl mb-2">✅</p>
        <p className="text-sm text-gray-600">Review complete!</p>
        <p className="text-xs text-gray-400">
          Reviewed {currentIndex} highlight{currentIndex !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }

  const handleRate = async (quality: number) => {
    const result = calculateSM2(
      quality,
      current.easeFactor,
      current.reviewCount === 0 ? 1 : current.reviewCount === 1 ? 6 : current.easeFactor,
      current.reviewCount,
    );

    await updateHighlight(current.id, {
      easeFactor: result.easeFactor,
      nextReviewAt: result.nextReviewAt,
      reviewCount: current.reviewCount + 1,
    });

    setShowAnswer(false);
    setCurrentIndex((i) => i + 1);
    loadReviewQueue();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-gray-400">
        <span>
          {currentIndex + 1} / {reviewQueue.length}
        </span>
        <span>{getDomain(current.url)}</span>
      </div>

      <div
        className="rounded-lg p-4 min-h-[120px]"
        style={{ backgroundColor: HIGHLIGHT_COLORS[current.color] + '60' }}
      >
        <p className="text-sm leading-relaxed">
          {showAnswer ? current.text : truncate(current.title, 80)}
        </p>
        {showAnswer && current.note && (
          <p className="text-xs text-gray-500 mt-2 italic">Note: {current.note}</p>
        )}
      </div>

      {!showAnswer ? (
        <button
          onClick={() => setShowAnswer(true)}
          className="w-full py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100"
        >
          Show Highlight
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 text-center">How well did you remember?</p>
          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                onClick={() => handleRate(q)}
                className="py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 px-1">
            <span>Forgot</span>
            <span>Perfect</span>
          </div>
        </div>
      )}
    </div>
  );
}
