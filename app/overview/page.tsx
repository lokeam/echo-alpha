'use client';

import { trpc } from '../../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

export default function OverviewPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: emailThread, isLoading, error } = trpc.deal.getEmailThread.useQuery({ dealId: 1 });

  const createDraftMutation = trpc.draft.create.useMutation({
    onSuccess: (draft) => {
      toast.success('AI draft generated! Redirecting to review...');
      setTimeout(() => {
        router.push(`/drafts/${draft.id}`);
      }, 1000);
    },
    onError: (error) => {
      toast.error(`Failed to generate draft: ${error.message}`);
      setIsGenerating(false);
    },
  });

  const latestInboundEmail = emailThread?.find(email => email.from === 'sarah@acme-ai.com');

  const handleGenerateDraft = () => {
    if (!latestInboundEmail) {
      toast.error('No inbound email found');
      return;
    }

    setIsGenerating(true);
    createDraftMutation.mutate({
      dealId: 1,
      inboundEmailId: latestInboundEmail.id,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Email Assistant for Office Leasing</h1>
          <p className="text-gray-600">
            Demonstrating the human-in-the-loop AI co-pilot workflow
          </p>
        </div>

        {/* The Problem */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>The Problem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p>
                Traditional office brokers spend <strong>80% of their time</strong> on transactional work:
                drafting emails, looking up space details, coordinating tours.
              </p>
              <p>
                Only <strong>20% of time</strong> is spent on their "superpower": building trust, reading between
                the lines, delivering empathy at critical moments.
              </p>
              <p className="text-gray-600">
                Result: Brokers can only handle <strong>5-10 deals simultaneously</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* The Solution */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>The Solution: AI Co-Pilot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p>
                <strong>AI handles the 80%:</strong> Analyzes deal data, generates email drafts, proposes tour schedules.
              </p>
              <p>
                <strong>Human handles the 20%:</strong> Reviews drafts, makes edits, approves before sending.
              </p>
              <p className="text-blue-800 font-semibold">
                Result: <strong>10-20x volume</strong> (currently), targeting <strong>100x</strong> with better tooling.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Demo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Live Demo: Acme AI Deal</CardTitle>
            <CardDescription>See the AI co-pilot workflow in action</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-600">Loading email thread...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
                <strong>Error:</strong> {error.message}
              </div>
            )}

            {emailThread && emailThread.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  <strong>Context:</strong> Sarah from Acme AI (8-person team, $5k budget) is looking for dog-friendly
                  office space in SF. We sent her 3 options. She replied with questions.
                </div>

                {emailThread.map((email) => (
                  <div key={email.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-white rounded-r shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-600">
                        <strong>From:</strong> {email.from} → <strong>To:</strong> {email.to}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(email.sent_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm font-semibold mb-2">{email.subject}</div>
                    <div className="text-sm whitespace-pre-wrap text-gray-700">{email.body}</div>
                  </div>
                ))}

                <Separator className="my-6" />

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-lg mb-3">Traditional Approach</h3>
                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p>• Broker reads email (2 min)</p>
                    <p>• Looks up space amenities in database (3 min)</p>
                    <p>• Checks availability calendars (2 min)</p>
                    <p>• Drafts response addressing all questions (5 min)</p>
                    <p>• Reviews and sends (3 min)</p>
                    <p className="font-semibold text-gray-900 pt-2">Total: <strong>15 minutes</strong></p>
                  </div>

                  <h3 className="font-semibold text-lg mb-3 mt-6">AI Co-Pilot Approach</h3>
                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p>• AI analyzes email and generates draft (3 seconds)</p>
                    <p>• Broker reviews and approves (2 min)</p>
                    <p className="font-semibold text-gray-900 pt-2">Total: <strong>2-3 minutes</strong></p>
                    <p className="text-blue-700 font-semibold">Time saved: <strong>80%</strong></p>
                  </div>

                  <Button
                    onClick={handleGenerateDraft}
                    disabled={isGenerating || createDraftMutation.isPending}
                    size="lg"
                    className="w-full mt-4"
                  >
                    {isGenerating || createDraftMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating AI Draft...
                      </span>
                    ) : (
                      '✨ Generate AI Draft & Review'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>What Happens Next</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 mt-1">1</Badge>
                <div>
                  <strong>AI Generation (3 seconds):</strong> Analyzes deal requirements, space amenities,
                  availability windows, and email history to generate a contextually relevant response.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 mt-1">2</Badge>
                <div>
                  <strong>Confidence Scoring:</strong> AI calculates confidence (50-95%) based on how well
                  it addressed questions and used available data.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 mt-1">3</Badge>
                <div>
                  <strong>Human Review:</strong> You'll see the draft with AI insights. Low confidence drafts
                  appear first in the queue for priority review.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 mt-1">4</Badge>
                <div>
                  <strong>Edit & Approve:</strong> Make any changes needed, then approve. You can approve
                  without sending, or approve and send immediately.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 mt-1">5</Badge>
                <div>
                  <strong>Real Email Sent:</strong> Email goes out via Resend API to the test recipient
                  (lokeahnming@gmail.com).
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Frontend:</strong>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• Next.js 15 + App Router</li>
                  <li>• TypeScript</li>
                  <li>• shadcn/ui + Tailwind CSS</li>
                  <li>• tRPC + React Query</li>
                </ul>
              </div>
              <div>
                <strong>Backend:</strong>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• tRPC procedures</li>
                  <li>• OpenAI GPT-4o-mini</li>
                  <li>• Drizzle ORM</li>
                  <li>• Supabase (Postgres)</li>
                  <li>• Resend (email sending)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/drafts">
            <Button variant="outline" size="lg">
              View Draft Queue →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
