'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { Badge } from '../../../../components/ui/badge';
import { useState } from 'react';

interface RegenerateDraftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (instruction: string) => void;
  versionsRemaining: number;
  isLoading?: boolean;
}

export function RegenerateDraftModal({
  open,
  onOpenChange,
  onRegenerate,
  versionsRemaining,
  isLoading = false,
}: RegenerateDraftModalProps) {
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState('');

  const handleRegenerate = () => {
    if (instruction.length < 10) {
      setError('Please provide at least 10 characters of guidance');
      return;
    }
    if (instruction.length > 500) {
      setError('Instruction is too long (max 500 characters)');
      return;
    }

    setError('');
    onRegenerate(instruction);
    setInstruction('');
  };

  const handleClose = () => {
    setInstruction('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ✨ Refine Draft with AI
            <Badge className="bg-purple-600">{versionsRemaining} remaining</Badge>
          </DialogTitle>
          <DialogDescription>
            Provide specific guidance on how the AI should improve the draft.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Textarea
              value={instruction}
              onChange={(e) => {
                setInstruction(e.target.value);
                setError('');
              }}
              placeholder='E.g., "Emphasize that parking is free for the first month" or "Make the tone more enthusiastic"'
              className="min-h-[120px]"
              disabled={isLoading}
            />
            <div className="flex justify-between mt-2">
              <span className={`text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
                {error || `${instruction.length}/500 characters`}
              </span>
              {instruction.length >= 10 && instruction.length <= 500 && (
                <span className="text-xs text-green-600">✓ Ready to regenerate</span>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 Tips for best results:</h4>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>• Be specific about what to change or add</li>
              <li>• The AI will preserve original answers to questions</li>
              <li>• You can undo if you don't like the result</li>
              <li>• Focus on one improvement at a time</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={instruction.length < 10 || instruction.length > 500 || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Regenerating...
              </span>
            ) : (
              `✨ Regenerate (${versionsRemaining} remaining)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
