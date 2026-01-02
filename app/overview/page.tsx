'use client';

// Next
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// TRPC
import { trpc } from '@/lib/trpc';

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Icons
import { SparklesIcon } from '@/components/ui/icons/sparkles-icon';
import { MailOpenedIcon } from '@/components/ui/icons/mail-opened-icon';


export default function OverviewPage() {
  const router = useRouter();

  const { data: emailThread, isLoading, error } = trpc.deal.getEmailThread.useQuery({ dealId: 1 });

  const handleContinueToDemo = () => {
    router.push('/demo');
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
                Only <strong>20% of time</strong> is spent on their &quot;superpower&quot;: building trust, reading between
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
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">📧 The Challenge</h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    Sarah from Acme AI sent a follow-up email with <strong>12 detailed questions</strong> about 3 different spaces:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-yellow-900">
                    <div className="bg-white p-3 rounded">
                      <strong className="block mb-1">FiDi Office (4 questions):</strong>
                      <ul className="space-y-1 text-yellow-800">
                        <li>• Parking: monthly or per use?</li>
                        <li>• Key cards for 8 people?</li>
                        <li>• Meeting room booking system?</li>
                        <li>• What&apos;s included in rent?</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <strong className="block mb-1">SOMA Space (3 questions):</strong>
                      <ul className="space-y-1 text-yellow-800">
                        <li>• Dog policy negotiable?</li>
                        <li>• Parking: per person or shared?</li>
                        <li>• After-hours advance notice?</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <strong className="block mb-1">Mission + Tours (5 questions):</strong>
                      <ul className="space-y-1 text-yellow-800">
                        <li>• Any update on Mission space?</li>
                        <li>• Tuesday 2-4pm availability?</li>
                        <li>• Wednesday 11am-12pm slots?</li>
                        <li>• See all 3 in one window?</li>
                        <li>• Tour in geographical order?</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-red-100 rounded text-sm">
                    <strong className="text-red-900">Manual Pain Point:</strong>
                    <span className="text-red-800"> 12 questions × 3 spaces = <strong>36 data points</strong> to look up across CRM, calendars, and host communications</span>
                  </div>
                </div>

                <details className="bg-gray-100 p-4 rounded">
                  <summary className="cursor-pointer font-semibold text-sm text-gray-700 hover:text-gray-900">
                    <MailOpenedIcon className="inline mr-2 w-6 h-6"/> View Full Email Thread ({emailThread.length} emails)
                  </summary>
                  <div className="mt-4 space-y-3">
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
                  </div>
                </details>

                <Separator className="my-6" />

                <div className="bg-linear-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-lg mb-3">⏱️ Traditional Approach</h3>
                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p>• Read and parse Sarah&apos;s 12 questions (3 min)</p>
                    <p>• Look up FiDi parking details in CRM (4 min)</p>
                    <p>• Look up SOMA dog policy + parking (4 min)</p>
                    <p>• Look up Mission space status (3 min)</p>
                    <p>• Check 3 calendars for Tuesday/Wednesday availability (5 min)</p>
                    <p>• Calculate optimal tour route (3 min)</p>
                    <p>• Draft comprehensive response (15 min)</p>
                    <p>• Wait for host responses on unclear items (hours to days)</p>
                    <p>• Review and send (3 min)</p>
                    <p className="font-semibold text-red-900 pt-2 bg-red-100 px-3 py-2 rounded">Total: <strong>45+ minutes</strong> (not including wait time)</p>
                  </div>

                  <h3 className="font-semibold text-lg mb-3 mt-6">✨ <SparklesIcon className="w-6 h-6 mr-2" /> AI Co-Pilot Approach</h3>
                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p>• AI reads thread + identifies 12 questions (instant)</p>
                    <p>• AI queries CRM for all 3 spaces&apos; detailed amenities (instant)</p>
                    <p>• AI checks calendar availability across all spaces (instant)</p>
                    <p>• AI calculates optimal tour route (instant)</p>
                    <p>• AI generates comprehensive draft (30 seconds)</p>
                    <p>• Broker reviews with full transparency into AI reasoning (2 min)</p>
                    <p className="font-semibold text-green-900 pt-2 bg-green-100 px-3 py-2 rounded">Total: <strong>~3 minutes</strong></p>
                    <p className="text-purple-700 font-semibold text-base mt-3">⚡ Time saved: <strong>93% (45 min → 3 min)</strong></p>
                  </div>

                  <Button
                    onClick={handleContinueToDemo}
                    size="lg"
                    className="w-full mt-4"
                  >
                    Continue to Demo →
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
                  <strong>Human Review:</strong> You&apos;ll see the draft with AI insights. Low confidence drafts
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
