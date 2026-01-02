'use client';

import { useState, useEffect, useRef } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Icons
import { FilePencilIcon } from '@/components/ui/icons/file-pencil-icon';
import { BulbIcon } from '@/components/ui/icons/bulb-icon';

interface StreamingDraftProps {
  fullText: string;
  onComplete?: () => void;
  onViewReasoning?: () => void;
  streamingSpeed?: number; // characters per second
}

export function StreamingDraft({
  fullText,
  onComplete,
  onViewReasoning,
  streamingSpeed = 500
}: StreamingDraftProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const hasAnimated = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (fullText.length === 0) return;

    // Reset animation state for new text
    hasAnimated.current = false;
    setDisplayedText('');
    setIsComplete(false);

    // Start animation
    hasAnimated.current = true;
    let currentIndex = 0;
    const charsPerInterval = Math.max(1, Math.floor(streamingSpeed / 20)); // Update 20 times per second

    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        const nextIndex = Math.min(currentIndex + charsPerInterval, fullText.length);
        setDisplayedText(fullText.substring(0, nextIndex));
        currentIndex = nextIndex;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    }, 50); // 50ms = 20 updates per second

    return () => clearInterval(interval);
  }, [fullText, streamingSpeed]);

  return (
    <Card className="border-gray-100 bg-gradient-to-br from-white to-[#FFC9BF]">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-black flex items-center gap-2">
              <FilePencilIcon className="w-10 h-10" />
              Draft Email
              {!isComplete && (
                <span className="inline-block w-2 h-4 bg-purple-600 animate-pulse"></span>
              )}
            </h3>
            {isComplete && onViewReasoning && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewReasoning}
                className="text-black border-[#FF2727] hover:bg-gray-200 flex items-center gap-2"
              >
                <BulbIcon className="w-6 h-6" />
                View AI Reasoning →
              </Button>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed font-mono">
              {displayedText}
            </div>
          </div>

          {isComplete && (
            <div className="text-xs text-[#FF2727] font-bold flex items-center gap-2">
              <CheckIcon className="w-4 h-4" />
              <span>Draft complete and ready for review</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
