'use client';

// Components
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Icons
import { ArrowIconUp } from '@/components/ui/icons/arrow-up-icon';

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  recipientEmail: string;
  isSending: boolean;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  onConfirm,
  recipientEmail,
  isSending,
}: SendEmailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            This will send the email to <strong>{recipientEmail}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              The email will be sent immediately. Make sure you&apos;ve reviewed the draft and are satisfied with the content.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSending}
            className="bg-[#FF2727] hover:bg-black transition-colors duration-200 ease-linear font-bold"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </span>
            ) : (
              <>
                <ArrowIconUp className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
