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

export default function DraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = parseInt(params.id as string);

  const [editedBody, setEditedBody] = useState('');
  const [hasEdits, setHasEdits] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const { data: draft, isLoading, error } = trpc.draft.getById.useQuery({ draftId });

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

  useEffect(() => {
    if (draft) {
      setEditedBody(draft.final_body || draft.ai_generated_body);
    }
  }, [draft]);

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

          {/* AI Insights */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>How the AI generated this response</CardDescription>
            </CardHeader>
            <CardContent>
              {draft.reasoning && (
                <div className="space-y-4">
                  {draft.reasoning.questionsAddressed && draft.reasoning.questionsAddressed.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Questions Addressed:</h4>
                      <ul className="space-y-1 text-sm text-blue-800">
                        {draft.reasoning.questionsAddressed.map((q: string, i: number) => (
                          <li key={i}>✓ {q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {draft.reasoning.dataUsed && draft.reasoning.dataUsed.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Data Sources Used:</h4>
                      <ul className="space-y-1 text-sm text-blue-800">
                        {draft.reasoning.dataUsed.map((d: string, i: number) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {draft.reasoning.schedulingLogic && draft.reasoning.schedulingLogic.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Scheduling Logic:</h4>
                      <ul className="space-y-1 text-sm text-blue-800">
                        {draft.reasoning.schedulingLogic.map((s: string, i: number) => (
                          <li key={i}>→ {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {draft.metadata && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-xs text-blue-700 flex gap-4">
                    <span>Model: {draft.metadata.model}</span>
                    <span>Tokens: {draft.metadata.tokensUsed}</span>
                    <span>Generated: {new Date(draft.metadata.generatedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
      </div>
    </div>
  );
}
