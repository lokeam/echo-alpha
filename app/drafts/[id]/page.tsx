'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '../../../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Separator } from '../../../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { DraftVersionHistory } from './components/DraftVersionHistory';
import { RegenerateDraftModal } from './components/RegenerateDraftModal';
import { EnhancedAIInsights } from './components/EnhancedAIInsights';

export default function DraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = parseInt(params.id as string);

  const [editedBody, setEditedBody] = useState('');
  const [hasEdits, setHasEdits] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const utils = trpc.useUtils();
  const { data: draft, isLoading, error, refetch } = trpc.draft.getById.useQuery(
    { draftId },
    {
      refetchOnWindowFocus: false,
      staleTime: 0,
    }
  );

  const updateMutation = trpc.draft.update.useMutation({
    onSuccess: () => {
      toast.success('Draft saved with your edits');
      setHasEdits(false);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const approveMutation = trpc.draft.approve.useMutation({
    onSuccess: () => {
      toast.success('Draft approved!');
      router.push('/drafts');
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  const sendMutation = trpc.draft.send.useMutation({
    onSuccess: () => {
      toast.success('Email sent successfully!');
      router.push('/drafts');
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  const rejectMutation = trpc.draft.reject.useMutation({
    onSuccess: () => {
      toast.success('Draft rejected');
      router.push('/drafts');
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  const regenerateMutation = trpc.draft.regenerate.useMutation({
    onSuccess: async (result) => {
      toast.success(`Draft regenerated! (${result.versionsRemaining} refinements remaining)`);
      // Force complete cache reset
      await utils.draft.invalidate();
      // Refetch with fresh data
      await refetch();
      // Close modal only after data is updated
      setShowRegenerateModal(false);
    },
    onError: (error) => {
      toast.error(`Failed to regenerate: ${error.message}`);
    },
  });

  const switchVersionMutation = trpc.draft.switchVersion.useMutation({
    onSuccess: () => {
      toast.success('Switched to selected version');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to switch version: ${error.message}`);
    },
  });

  useEffect(() => {
    if (draft) {
      const currentBody = draft.final_body || draft.ai_generated_body;
      setEditedBody(currentBody);
    }
  }, [draft?.final_body, draft?.ai_generated_body, draft?.id]);

  useEffect(() => {
    if (draft && editedBody !== (draft.final_body || draft.ai_generated_body)) {
      setHasEdits(true);
    } else {
      setHasEdits(false);
    }
  }, [editedBody, draft]);

  const handleSave = () => {
    updateMutation.mutate({
      draftId,
      editedBody,
    });
  };

  const handleApprove = () => {
    approveMutation.mutate({
      draftId,
      finalBody: hasEdits ? editedBody : undefined,
    });
  };

  const handleApproveAndSend = () => {
    if (hasEdits) {
      updateMutation.mutate(
        { draftId, editedBody },
        {
          onSuccess: () => {
            sendMutation.mutate({ draftId });
          },
        }
      );
    } else {
      sendMutation.mutate({ draftId });
    }
  };

  const handleReject = () => {
    rejectMutation.mutate({ draftId });
  };

  const handleRegenerate = (instruction: string) => {
    regenerateMutation.mutate({
      draftId,
      userInstruction: instruction,
    });
  };

  const handleSwitchVersion = (targetVersion: number) => {
    switchVersionMutation.mutate({
      draftId,
      targetVersion,
    });
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-600">High Confidence: {score}%</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-600">Medium Confidence: {score}%</Badge>;
    return <Badge className="bg-red-600">Low Confidence: {score}%</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading draft...</p>
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">Error: {error?.message || 'Draft not found'}</p>
              <Link href="/drafts">
                <Button className="mt-4">Back to Drafts</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/drafts">
            <Button variant="outline">← Back to Queue</Button>
          </Link>
          <div className="flex gap-2">
            {getConfidenceBadge(draft.confidence_score)}
            <Badge variant="outline">{draft.status}</Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Inbound Email */}
          <Card>
            <CardHeader>
              <CardTitle>Inbound Email</CardTitle>
              <CardDescription>Original email that needs a response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>From:</strong> {draft.inbound_from}</div>
                <div><strong>To:</strong> {draft.inbound_to}</div>
                <div><strong>Subject:</strong> {draft.inbound_subject}</div>
                <div><strong>Received:</strong> {new Date(draft.inbound_sent_at).toLocaleString()}</div>
              </div>
              <Separator className="my-4" />
              <div className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
                {draft.inbound_body}
              </div>
            </CardContent>
          </Card>

          {/* AI Generated Draft */}
          <Card>
            <CardHeader>
              <CardTitle>AI Generated Response</CardTitle>
              <CardDescription>
                {hasEdits ? 'You have unsaved edits' : 'Edit the draft below before approving'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                disabled={draft.status === 'sent' || draft.status === 'rejected'}
              />
              {hasEdits && (draft.status === 'pending' || draft.status === 'approved') && (
                <div className="mt-4">
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Edits'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version History */}
          {draft.draftVersions && draft.draftVersions.length > 0 && (
            <DraftVersionHistory
              versions={draft.draftVersions}
              currentVersion={draft.currentVersion || 0}
              regenerationCount={draft.regenerationCount || 0}
              onSwitchVersion={handleSwitchVersion}
              isLoading={switchVersionMutation.isPending}
            />
          )}

          {/* Enhanced AI Insights */}
          {draft.reasoning && (
            <EnhancedAIInsights
              reasoning={draft.reasoning}
              version={draft.currentVersion || 0}
              confidence={draft.confidenceScore}
            />
          )}

          {/* Regenerate Button */}
          {draft.status !== 'sent' && draft.status !== 'rejected' && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-1">
                      ✨ Refine with AI
                    </h3>
                    <p className="text-sm text-purple-700">
                      Guide the AI to improve this draft with specific instructions
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowRegenerateModal(true)}
                    disabled={draft.regenerationCount >= 3 || regenerateMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {(draft.regenerationCount || 0) >= 3 ? (
                      'Max Refinements Reached'
                    ) : (
                      `✨ Refine Draft (${3 - (draft.regenerationCount || 0)} left)`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {draft.status === 'pending' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={rejectMutation.isPending}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowApproveDialog(true)}
                    disabled={approveMutation.isPending}
                  >
                    Approve Only
                  </Button>
                  <Button
                    onClick={() => setShowSendDialog(true)}
                    disabled={sendMutation.isPending}
                  >
                    Approve & Send →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {draft.status === 'approved' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <p className="text-yellow-800 mb-4">
                    ✓ This draft has been approved. You can make last-minute edits before sending.
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={rejectMutation.isPending}
                  >
                    Unapprove
                  </Button>
                  <Button
                    onClick={() => setShowSendDialog(true)}
                    disabled={sendMutation.isPending}
                  >
                    Send Email →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {draft.status === 'sent' && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <p className="text-green-800">
                  ✓ This email was sent on {new Date(draft.sent_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Approve Only Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Draft</DialogTitle>
              <DialogDescription>
                Mark this draft as approved. You can send it later from the drafts queue.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                handleApprove();
                setShowApproveDialog(false);
              }}>
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Confirmation Dialog */}
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email</DialogTitle>
              <DialogDescription>
                This will send the email to <strong>lokeahnming@gmail.com</strong> (test recipient).
                {hasEdits && ' Your edits will be saved automatically.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                handleApproveAndSend();
                setShowSendDialog(false);
              }}>
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Regenerate Draft Modal */}
        <RegenerateDraftModal
          open={showRegenerateModal}
          onOpenChange={setShowRegenerateModal}
          onRegenerate={handleRegenerate}
          versionsRemaining={3 - (draft.regenerationCount || 0)}
          isLoading={regenerateMutation.isPending}
        />
      </div>
    </div>
  );
}
