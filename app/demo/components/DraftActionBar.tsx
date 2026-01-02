'use client';

// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Icons
import { BulbIcon } from '@/components/ui/icons/bulb-icon';
import { SparklesIcon } from '@/components/ui/icons/sparkles-icon';
import { FilesIcon } from '@/components/ui/icons/files-icon';
import { ArrowIconUp } from '@/components/ui/icons/arrow-up-icon';

interface DraftActionBarProps {
  onViewReasoning: () => void;
  onRefine: () => void;
  onViewVersions: () => void;
  onSend: () => void;
  refinementsRemaining: number;
  status: 'pending' | 'approved' | 'sent';
  isSaving: boolean;
  hasVersions: boolean;
}

export function DraftActionBar({
  onViewReasoning,
  onRefine,
  onViewVersions,
  onSend,
  refinementsRemaining,
  status,
  isSaving,
  hasVersions,
}: DraftActionBarProps) {
  const isSent = status === 'sent';
  const canRefine = refinementsRemaining > 0 && !isSent;

  return (
    <div className="flex flex-wrap gap-3">
      {/* View AI Reasoning */}
      <Button
        onClick={onViewReasoning}
        variant="outline"
        className="flex-1 min-w-[200px]"
      >
        <BulbIcon className="w-4 h-4 mr-2" />
        View AI Reasoning
      </Button>

      {/* Refine Draft */}
      <Button
        onClick={onRefine}
        disabled={!canRefine || isSaving}
        variant="outline"
        className="flex-1 min-w-[200px] relative"
      >
        <SparklesIcon className="w-4 h-4 mr-2" />
        Refine Draft
        {canRefine && (
          <Badge className="font-bold ml-2 bg-[#FF2727] text-white">
            {refinementsRemaining} left
          </Badge>
        )}
        {!canRefine && refinementsRemaining === 0 && (
          <Badge className="ml-2 bg-gray-400 text-white">
            Max reached
          </Badge>
        )}
      </Button>

      {/* View Versions */}
      {hasVersions && (
        <Button
          onClick={onViewVersions}
          variant="outline"
          className="flex-1 min-w-[200px]"
        >
          <FilesIcon className="w-4 h-4 mr-2" />
          View Versions
        </Button>
      )}

      {/* Send Email */}
      {!isSent && (
        <Button
          onClick={onSend}
          disabled={isSaving}
          className="flex-1 min-w-[200px] bg-[#FF2727] hover:bg-black transition-colors duration-200 ease-linear font-bold"
        >
          <ArrowIconUp className="w-4 h-4 mr-2" />
          Send Email
        </Button>
      )}
    </div>
  );
}
