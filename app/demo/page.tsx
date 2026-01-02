'use client';

import { useState, useEffect } from 'react';

// TRPC
import { trpc } from '@/lib/trpc';

// Next
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Components
import { EmailThreadItem } from '@/app/demo/components/EmailThreadItem';
import { AIStatusIndicator, AIStatus } from '@/app/demo/components/AIStatusIndicator';
import { StreamingDraft } from '@/app/demo/components/StreamingDraft';
import { AIReasoningDrawer } from '@/app/demo/components/AIReasoningDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

// Icons
import { BulbIcon } from '@/components/ui/icons/bulb-icon';
import { SparklesIcon } from '@/components/ui/icons/sparkles-icon';

type GenerationState = 'idle' | 'generating' | 'streaming' | 'complete';

export default function DemoPage() {
  const router = useRouter();
  const [expandedEmailIds, setExpandedEmailIds] = useState<Set<number>>(new Set());
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [currentStatus, setCurrentStatus] = useState<AIStatus>('reading_thread');
  const [generatedDraft, setGeneratedDraft] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftReasoning, setDraftReasoning] = useState<{
    questionsAddressed?: Array<{
      question: string;
      answer: string;
      sourceEmailId?: number;
      sourceText?: string;
      sourceEmailSubject?: string;
      sourceEmailDate?: string;
      sourceEmailFrom?: string;
    }>;
    dataUsed?: Array<any>;
    crmLookups?: Array<any>;
    calendarChecks?: Array<any>;
    tourRoute?: any;
  } | null>(null);

  const { data: emailThread, isLoading, error } = trpc.deal.getEmailThread.useQuery({ dealId: 1 });

  useEffect(() => {
    if (emailThread && emailThread.length > 0 && expandedEmailIds.size === 0) {
      const mostRecentEmail = emailThread.reduce((latest, email) => {
        return new Date(email.sent_at) > new Date(latest.sent_at) ? email : latest;
      });
      setExpandedEmailIds(new Set([mostRecentEmail.id]));
    }
  }, [emailThread, expandedEmailIds.size]);

  const createDraftMutation = trpc.draft.create.useMutation({
    onSuccess: (draft) => {
      setGeneratedDraft(draft.aiGeneratedBody);
      setDraftReasoning(draft.reasoning);
      setGenerationState('streaming');
    },
    onError: (error) => {
      toast.error(`Failed to generate draft: ${error.message}`);
      setGenerationState('idle');
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

    setGenerationState('generating');
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

  const handleStreamingComplete = () => {
    setGenerationState('complete');
  };

  const handleViewReasoning = () => {
    setDrawerOpen(true);
  };

  const handleContinueToReview = () => {
    toast.success('Navigating to draft review...');
    router.push('/drafts/1');
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
          {emailThread && emailThread.length > 0 && generationState === 'idle' && (
            <Card className="mt-6 border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">
                      <SparklesIcon className="w-6 h-6 mr-2"/> AI Draft Generator
                    </h3>
                    <p className="text-sm text-purple-700">
                      Generate an AI-powered response to the latest email in this thread.
                      The AI will analyze the conversation, deal requirements, and available spaces.
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateDraft}
                    disabled={createDraftMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    <SparklesIcon className="w-6 h-6 mr-2"/> Generate AI Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Status Indicator */}
          {generationState === 'generating' && (
            <div className="mt-6">
              <AIStatusIndicator currentStatus={currentStatus} />
            </div>
          )}

          {/* Streaming Draft */}
          {(generationState === 'streaming' || generationState === 'complete') && (
            <div className="mt-6 space-y-4">
              <StreamingDraft
                fullText={generatedDraft}
                onComplete={handleStreamingComplete}
                onViewReasoning={handleViewReasoning}
              />
              {generationState === 'complete' && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleViewReasoning}
                    variant="outline"
                    className="flex-1"
                  >
                    <BulbIcon className="w-4 h-4" /> View AI Reasoning
                  </Button>
                  <Button
                    onClick={handleContinueToReview}
                    className="flex-1 bg-[#FF2727] font-bold hover:bg-black"
                  >
                    Continue to Review →
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Reasoning Drawer */}
      {draftReasoning && (
        <AIReasoningDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          questionsAddressed={draftReasoning.questionsAddressed || []}
          crmLookups={draftReasoning.crmLookups || []}
          calendarChecks={draftReasoning.calendarChecks || []}
          tourRoute={draftReasoning.tourRoute}
        />
      )}
    </div>
  );
}
