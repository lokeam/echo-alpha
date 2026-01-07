'use client';

import { useEffect, useState } from 'react';

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Icons
import { CheckIcon } from '@/components/ui/icons/check-icon';
import { TrashIcon } from '@/components/ui/icons/trash-icon';
import { PaperClipIcon } from '@/components/ui/icons/paper-clip-icon';

// Utils
import { cn } from '@/lib/utils';

interface EditableDraftProps {
  draftBody: string;
  confidence: number;
  status: 'pending' | 'approved' | 'sent';
  isSaving: boolean;
  lastSaved: Date | null;
  onBodyChange: (body: string) => void;
  onArchiveClick?: () => void;
  onAttachFilesClick?: () => void;
  className?: string;
}

export function EditableDraft({
  draftBody,
  confidence,
  status,
  isSaving,
  lastSaved,
  onBodyChange,
  onArchiveClick,
  onAttachFilesClick,
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

          {/* Auto-save indicator and action buttons */}
          {!isReadOnly && (
            <div className="space-y-3">
              {/* Auto-save status */}
              <div className="flex items-center gap-2 text-xs">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand"></div>
                    <span className="text-brand">Saving...</span>
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

              {/* Character counter and action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  {localBody.length} characters
                </span>
                <div className="flex gap-2 cursor-pointer">
                  {onAttachFilesClick && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAttachFilesClick}
                      className="text-gray-700 hover:text-gray-900 cursor-pointer"
                    >
                      <PaperClipIcon className="w-4 h-4 mr-2" />
                      Attach Files
                    </Button>
                  )}
                  {onArchiveClick && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onArchiveClick}
                      className="cursor-pointer text-gray-700 hover:text-red-600 hover:border-red-300"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
