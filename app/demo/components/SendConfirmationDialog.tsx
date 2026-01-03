'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Icons
import { SendIcon } from '@/components/ui/icons/icon-send';
import { WarningIcon } from '@/components/ui/icons/warning-icon';

interface SendConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  recipientEmail: string;
  subject: string;
  isLoading?: boolean;
}

export function SendConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  recipientEmail,
  subject,
  isLoading = false,
}: SendConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SendIcon className="w-6 h-6 text-[#FF2727]" />
            Ready to send this email?
          </DialogTitle>
          <DialogDescription>
            This will send immediately to the client. Please review carefully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-600 min-w-[60px]">To:</span>
              <span className="text-sm text-gray-900 font-medium">{recipientEmail}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-600 min-w-[60px]">Subject:</span>
              <span className="text-sm text-gray-900">{subject}</span>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
            <WarningIcon className="w-8 h-8 text-yellow-400" />
            <p className="text-xs text-orange-800">
              Once sent, this email cannot be recalled. Make sure all information is accurate.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-[#FF2727] hover:bg-black"
          >
            {isLoading ? 'Sending...' : 'Send Email →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
