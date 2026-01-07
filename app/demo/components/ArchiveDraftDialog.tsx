'use client';

import { useState } from 'react';

// Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// Icons
import { BulbIcon } from '@/components/ui/icons/bulb-icon';

interface ArchiveDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
}

export function ArchiveDraftDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ArchiveDraftDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Archive this draft?</DialogTitle>
          <DialogDescription>
            This draft will be moved to Archives. You can restore it later if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm text-gray-600 block">
              Reason (optional)
            </label>
            <Textarea
              id="reason"
              placeholder="e.g., Client no longer interested, Deal fell through..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
              disabled={isLoading}
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 flex items-center gap-2">
              <BulbIcon className="w-8 h-8 text-yellow-400" /> Archived drafts are kept for compliance and can be restored by your admin.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant="destructive"
            className="cursor-pointer"
          >
            {isLoading ? 'Archiving...' : 'Archive Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
