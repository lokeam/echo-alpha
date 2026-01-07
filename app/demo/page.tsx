'use client';

import { useState, useEffect, useCallback } from 'react';

// TRPC
import { trpc } from '@/lib/trpc';

// Next
import Link from 'next/link';

// Components
import { EmailThreadItem } from '@/app/demo/components/EmailThreadItem';
import { AIStatusIndicator, AIStatus } from '@/app/demo/components/AIStatusIndicator';
import { StreamingDraft } from '@/app/demo/components/StreamingDraft';
import { EditableDraft } from '@/app/demo/components/EditableDraft';
import { DraftActionBar } from '@/app/demo/components/DraftActionBar';
import { ArchiveDraftDialog } from '@/app/demo/components/ArchiveDraftDialog';
import { SendConfirmationDialog } from '@/app/demo/components/SendConfirmationDialog';
import { VersionHistoryDrawer } from '@/app/demo/components/VersionHistoryDrawer';
import { AIInsightsDrawer } from '@/app/demo/components/AIInsightsDrawer';
import { RegenerateDraftModal } from '@/app/drafts/[id]/components/RegenerateDraftModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

// Icons
import { SparklesIcon } from '@/components/ui/icons/sparkles-icon';

type DemoState = 'idle' | 'generating' | 'streaming' | 'editing' | 'refining' | 'sent';

export default function DemoPage() {
  // Email thread state
  const [expandedEmailIds, setExpandedEmailIds] = useState<Set<number>>(new Set());
  const [latestEmailId, setLatestEmailId] = useState<number | null>(null);

  // Demo flow state
  const [demoState, setDemoState] = useState<DemoState>('idle');
  const [currentStatus, setCurrentStatus] = useState<AIStatus>('reading_thread');

  // Draft data
  const [draftId, setDraftId] = useState<number | null>(null);
  const [draftBody, setDraftBody] = useState<string>('');
  const [editedBody, setEditedBody] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [status, setStatus] = useState<'pending' | 'approved' | 'sent'>('pending');

  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Version history
  interface DraftVersion {
    version: number;
    body: string;
    prompt: string | null;
    confidence: number;
    reasoning: unknown;
    metadata: {
      model: string;
      tokensUsed: number;
      generatedAt: Date;
    };
    createdAt: Date;
  }

  interface DataSource {
    sourceType: 'space' | 'deal' | 'email';
    sourceId: number;
    sourceName: string;
    sourceTitle: string;
    sourceSubtitle?: string;
    details: {
      address?: string;
      monthlyRate?: number;
      hostCompany?: string;
      from?: string;
      to?: string;
      sentAt?: Date;
      subject?: string;
    };
    dataPointsUsed?: string[];
  }

  interface Question {
    question: string;
    answer: string;
    sourceEmailId?: number;
    sourceText?: string;
  }

  interface Reasoning {
    questionsAddressed: Question[];
    dataUsed: DataSource[];
    schedulingLogic?: string[];
    calendarChecks?: Array<{
      day: string;
      time: string;
      spaces: Array<{
        spaceName: string;
        available: boolean;
        note?: string;
      }>;
    }>;
    tourRoute?: {
      recommended: string;
      route: string;
      driveTimes: string;
      totalTime: string;
    };
  }

  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [regenerationCount, setRegenerationCount] = useState<number>(0);

  // Reasoning data
  const [reasoning, setReasoning] = useState<Reasoning | null>(null);

  // UI state
  const [reasoningDrawerOpen, setReasoningDrawerOpen] = useState(false);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [refineModalOpen, setRefineModalOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [sendConfirmDialogOpen, setSendConfirmDialogOpen] = useState(false);

  // Queries
  const { data: emailThread, isLoading, error } = trpc.deal.getEmailThread.useQuery({ dealId: 1 });

  // Mutations
  const utils = trpc.useUtils();

  const updateDraftMutation = trpc.draft.update.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      setLastSaved(new Date());
      setDraftBody(editedBody);
    },
    onError: (error) => {
      setIsSaving(false);
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const regenerateMutation = trpc.draft.regenerate.useMutation({
    onSuccess: async (result) => {
      toast.success(`Draft refined! (${result.versionsRemaining} refinements remaining)`);
      await utils.draft.invalidate();
      // Drizzle returns camelCase fields
      const draft = result.draft;

      setVersions((draft.draftVersions || []) as unknown as DraftVersion[]);
      setCurrentVersion(draft.currentVersion ?? 0);
      setRegenerationCount(draft.regenerationCount ?? 0);
      setDraftBody(draft.finalBody || '');
      setEditedBody(draft.finalBody || '');
      setConfidence(draft.confidenceScore ?? 0);
      setReasoning(draft.reasoning as unknown as Reasoning);
      setDemoState('editing');
      setRefineModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to refine: ${error.message}`);
      setDemoState('editing');
    },
  });

  const switchVersionMutation = trpc.draft.switchVersion.useMutation({
    onSuccess: (result) => {
      // Drizzle returns camelCase fields
      toast.success(`Switched to v${result.currentVersion}`);
      setCurrentVersion(result.currentVersion ?? 0);
      setDraftBody(result.finalBody || '');
      setEditedBody(result.finalBody || '');
      setConfidence(result.confidenceScore ?? 0);
      setReasoning(result.reasoning as unknown as Reasoning);
    },
    onError: (error) => {
      toast.error(`Failed to switch version: ${error.message}`);
    },
  });

  const archiveMutation = trpc.draft.archive.useMutation({
    onSuccess: () => {
      toast.success('Draft archived successfully');
      setArchiveDialogOpen(false);
      setDemoState('idle');
      setDraftId(null);
      setDraftBody('');
      setEditedBody('');
    },
    onError: (error) => {
      toast.error(`Failed to archive: ${error.message}`);
    },
  });

  const sendMutation = trpc.draft.send.useMutation({
    onSuccess: () => {
      toast.success('Email sent successfully!');
      setStatus('sent');
      setDemoState('sent');
      setSendConfirmDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  // Initialize email thread - expand latest and set as locked
  useEffect(() => {
    if (emailThread && emailThread.length > 0) {
      const mostRecentEmail = emailThread.reduce((latest, email) => {
        return new Date(email.sent_at) > new Date(latest.sent_at) ? email : latest;
      });
      setLatestEmailId(mostRecentEmail.id);
      if (expandedEmailIds.size === 0) {
        setExpandedEmailIds(new Set([mostRecentEmail.id]));
      }
    }
  }, [emailThread, expandedEmailIds.size]);

  const createDraftMutation = trpc.draft.create.useMutation({
    onSuccess: (draft) => {
      setDraftId(draft.id);
      setDraftBody(draft.aiGeneratedBody);
      setEditedBody(draft.aiGeneratedBody);
      setConfidence(draft.confidenceScore);
      setReasoning(draft.reasoning as unknown as Reasoning);
      setVersions((draft.draftVersions || []) as unknown as DraftVersion[]);
      setCurrentVersion(draft.currentVersion || 0);
      setRegenerationCount(draft.regenerationCount || 0);
      setDemoState('streaming');
    },
    onError: (error) => {
      toast.error(`Failed to generate draft: ${error.message}`);
      setDemoState('idle');
    },
  });

  const latestInboundEmail = emailThread
    ?.filter(email => email.from === 'sarah@acme-ai.com')
    .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0];

  const handleGenerateDraft = () => {
    if (!latestInboundEmail) {
      toast.error('No inbound email found');
      return;
    }

    setDemoState('generating');
    simulateStatusProgress();

    createDraftMutation.mutate({
      dealId: 1,
      inboundEmailId: latestInboundEmail.id,
    });
  };

  const simulateStatusProgress = () => {
    const statuses: AIStatus[] = [
      'reading_thread',
      'identifying_questions',
      'querying_crm_fidi',
      'querying_crm_soma',
      'querying_crm_mission',
      'checking_availability',
      'calculating_route',
      'drafting',
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < statuses.length) {
        setCurrentStatus(statuses[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);
  };

  // Auto-save logic
  const handleAutoSave = useCallback(async () => {
    if (!draftId || editedBody === draftBody) return;

    setIsSaving(true);
    await updateDraftMutation.mutateAsync({
      draftId,
      editedBody,
    });
  }, [draftId, editedBody, draftBody, updateDraftMutation]);

  // Debounced auto-save on edit
  useEffect(() => {
    if (demoState !== 'editing') return;
    if (editedBody === draftBody) return;

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    setAutoSaveTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [editedBody, demoState, draftBody, handleAutoSave, autoSaveTimer]);

  // Handlers
  const handleStreamingComplete = () => {
    setDemoState('editing');
  };

  const handleBodyChange = (newBody: string) => {
    setEditedBody(newBody);
  };

  const handleViewReasoning = () => {
    setReasoningDrawerOpen(true);
  };

  const handleViewVersions = () => {
    setVersionDrawerOpen(true);
  };

  const handleRefine = () => {
    setRefineModalOpen(true);
  };

  const handleRegenerate = async (instruction: string) => {
    if (!draftId) return;

    // Auto-save current version first
    if (editedBody !== draftBody) {
      toast.info('Saving current version...');
      await handleAutoSave();
    }

    setDemoState('refining');
    regenerateMutation.mutate({
      draftId,
      userInstruction: instruction,
    });
  };

  const handleSwitchVersion = async (targetVersion: number) => {
    if (!draftId) return;

    // Auto-save current version first
    if (editedBody !== draftBody) {
      toast.info('Saving current version...');
      await handleAutoSave();
    }

    switchVersionMutation.mutate({
      draftId,
      targetVersion,
    });
  };

  const handleArchiveClick = () => {
    setArchiveDialogOpen(true);
  };

  const handleConfirmArchive = async (reason?: string) => {
    if (!draftId) return;

    // Auto-save before archiving
    if (editedBody !== draftBody) {
      await handleAutoSave();
    }

    archiveMutation.mutate({ draftId, reason });
  };

  const handleSendEmail = () => {
    setSendConfirmDialogOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!draftId) return;

    // Auto-save before sending
    if (editedBody !== draftBody) {
      await handleAutoSave();
    }

    sendMutation.mutate({ draftId, confirmed: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/overview">
                <Button variant="outline" size="sm">
                  ← Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Acme AI - Office Space Inquiry</h1>
                <p className="text-sm text-gray-600">8-person team, $5k budget, dog-friendly required</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Thread Container */}
        <div className="px-6 py-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="ml-4 text-gray-600">Loading email thread...</p>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800"><strong>Error:</strong> {error.message}</p>
              </CardContent>
            </Card>
          )}

          {emailThread && emailThread.length > 0 && (
            <div className="space-y-3">
              {emailThread.map((email) => (
                <EmailThreadItem
                  key={email.id}
                  email={email}
                  senderType={email.from === 'sarah@acme-ai.com' ? 'client' : 'agent'}
                  isExpanded={expandedEmailIds.has(email.id)}
                  isLatest={email.id === latestEmailId}
                  onToggle={() => {
                    setExpandedEmailIds(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(email.id)) {
                        newSet.delete(email.id);
                      } else {
                        newSet.add(email.id);
                      }
                      return newSet;
                    });
                  }}
                />
              ))}
            </div>
          )}

          {/* Draft Generation Section */}
          {emailThread && emailThread.length > 0 && demoState === 'idle' && (
            <div className="animated-border-wrapper mt-6">
              <Card className="border-0 bg-white">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-black mb-2 flex items-center text-xl">
                        <SparklesIcon className="w-6 h-6 mr-2"/> AI Draft Generator
                      </h3>
                      <p className="text-sm text-black">
                        Generate an AI-powered response to the latest email in this thread.
                        The AI will analyze the conversation, deal requirements, and available spaces.
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateDraft}
                      disabled={createDraftMutation.isPending}
                      className="font-bold w-full bg-[#FF2727] hover:bg-black transition-colors duration-200 ease-linear cursor-pointer"
                      size="lg"
                    >
                      <SparklesIcon className="w-6 h-6 mr-2"/> Generate AI Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Status Indicator */}
          {(demoState === 'generating' || demoState === 'refining') && (
            <div className="mt-6">
              <AIStatusIndicator currentStatus={currentStatus} />
            </div>
          )}

          {/* Streaming Draft */}
          {demoState === 'streaming' && (
            <div className="mt-6">
              <StreamingDraft
                fullText={draftBody}
                onComplete={handleStreamingComplete}
                onViewReasoning={handleViewReasoning}
              />
            </div>
          )}

          {/* Editable Draft + Actions */}
          {(demoState === 'editing' || demoState === 'sent') && (
            <div className="mt-6 space-y-4">
              <EditableDraft
                draftBody={editedBody}
                confidence={confidence}
                status={status}
                isSaving={isSaving}
                lastSaved={lastSaved}
                onBodyChange={handleBodyChange}
                onAttachFilesClick={status !== 'sent' ? () => toast.info('Attach files feature coming soon') : undefined}
                onArchiveClick={status !== 'sent' ? handleArchiveClick : undefined}
              />
              <DraftActionBar
                onViewReasoning={handleViewReasoning}
                onRefine={handleRefine}
                onViewVersions={handleViewVersions}
                onSend={handleSendEmail}
                refinementsRemaining={3 - regenerationCount}
                status={status}
                isSaving={isSaving}
                hasVersions={versions.length > 0}
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Drawer */}
      {reasoning && (
        <AIInsightsDrawer
          open={reasoningDrawerOpen}
          onOpenChange={setReasoningDrawerOpen}
          reasoning={reasoning}
          version={currentVersion}
          confidence={confidence}
        />
      )}

      {/* Version History Drawer */}
      {versions.length > 0 && (
        <VersionHistoryDrawer
          open={versionDrawerOpen}
          onOpenChange={setVersionDrawerOpen}
          versions={versions}
          currentVersion={currentVersion}
          regenerationCount={regenerationCount}
          onSwitchVersion={handleSwitchVersion}
          isLoading={switchVersionMutation.isPending}
        />
      )}

      {/* Regenerate Draft Modal */}
      <RegenerateDraftModal
        open={refineModalOpen}
        onOpenChange={setRefineModalOpen}
        onRegenerate={handleRegenerate}
        versionsRemaining={3 - regenerationCount}
        isLoading={regenerateMutation.isPending}
      />

      {/* Archive Draft Dialog */}
      <ArchiveDraftDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        onConfirm={handleConfirmArchive}
        isLoading={archiveMutation.isPending}
      />

      {/* Send Confirmation Dialog */}
      <SendConfirmationDialog
        open={sendConfirmDialogOpen}
        onOpenChange={setSendConfirmDialogOpen}
        onConfirm={handleConfirmSend}
        recipientEmail={latestInboundEmail?.from || 'sarah@acme-ai.com'}
        subject="Re: Office Space Inquiry - Acme AI"
        isLoading={sendMutation.isPending}
      />
    </div>
  );
}
