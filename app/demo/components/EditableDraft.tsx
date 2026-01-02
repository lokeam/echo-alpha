'use client';

import { useEffect, useState } from 'react';

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// Icons
import { CheckIcon } from '@/components/ui/icons/check-icon';

// Utils
import { cn } from '@/lib/utils';

interface EditableDraftProps {
  draftBody: string;
  confidence: number;
  status: 'pending' | 'approved' | 'sent';
  isSaving: boolean;
  lastSaved: Date | null;
  onBodyChange: (body: string) => void;
  className?: string;
}

export function EditableDraft({
  draftBody,
  confidence,
  status,
  isSaving,
  lastSaved,
  onBodyChange,
  className,
}: EditableDraftProps) {
  const [localBody, setLocalBody] = useState(draftBody);

  useEffect(() => {
    setLocalBody(draftBody);
  }, [draftBody]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newBody = e.target.value;
    setLocalBody(newBody);
    onBodyChange(newBody);
  };

  const getConfidenceBadge = () => {
    if (confidence >= 90) {
      return <Badge className="bg-green-600">High Confidence: {confidence}%</Badge>;
    }
    if (confidence >= 70) {
      return <Badge className="bg-yellow-600">Medium Confidence: {confidence}%</Badge>;
    }
    return <Badge className="bg-red-600">Low Confidence: {confidence}%</Badge>;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isReadOnly = status === 'sent';

  return (
    <Card className={cn("animated-border-wrapper bg-white", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-900">
              {isReadOnly ? 'Sent Email' : 'AI Generated Response'}
            </CardTitle>
            <CardDescription>
              {isReadOnly
                ? 'This email has been sent'
                : 'Edit the draft below before sending'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getConfidenceBadge()}
            {status === 'sent' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Sent
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Textarea
            value={localBody}
            onChange={handleChange}
            className={cn(
              "min-h-[400px] font-mono text-sm resize-none",
              isReadOnly && "bg-gray-50 cursor-not-allowed"
            )}
            disabled={isReadOnly}
            placeholder="AI-generated email draft will appear here..."
          />

          {/* Auto-save indicator */}
          {!isReadOnly && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                    <span className="text-purple-600">Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">
                      Saved at {formatTime(lastSaved)}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Not saved yet</span>
                )}
              </div>
              <span className="text-gray-500">
                {localBody.length} characters
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
