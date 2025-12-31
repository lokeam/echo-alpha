'use client';

import { trpc } from '../../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import Link from 'next/link';
import { useState } from 'react';

export default function DraftsPage() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'sent' | undefined>('pending');

  const { data: drafts, isLoading, error } = trpc.draft.list.useQuery({
    status: statusFilter,
    limit: 50,
  });

  const getConfidenceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-600">High: {score}%</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-600">Medium: {score}%</Badge>;
    return <Badge className="bg-red-600">Low: {score}%</Badge>;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'border-l-green-500';
    if (score >= 70) return 'border-l-yellow-500';
    return 'border-l-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Draft Review Queue</h1>
          <p className="text-gray-600">
            Review AI-generated email drafts before sending. Low confidence drafts appear first.
          </p>
        </div>

        <Tabs value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="all">All Drafts</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading drafts...</p>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">Error loading drafts: {error.message}</p>
            </CardContent>
          </Card>
        )}

        {drafts && drafts.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-600 mb-4">No drafts found</p>
              <Link href="/overview">
                <Button>Generate Your First Draft</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {drafts && drafts.length > 0 && (
          <div className="space-y-4">
            {drafts.map((draft: any) => (
              <Card key={draft.id} className={`border-l-4 ${getConfidenceColor(draft.confidence_score)} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        Deal: {draft.company_name}
                      </CardTitle>
                      <CardDescription>
                        <div className="space-y-1">
                          <div><strong>From:</strong> {draft.inbound_from}</div>
                          <div><strong>Subject:</strong> {draft.inbound_subject}</div>
                          <div className="text-xs text-gray-500">
                            Received: {new Date(draft.inbound_sent_at).toLocaleString()}
                          </div>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getConfidenceBadge(draft.confidence_score)}
                      <Badge variant="outline">{draft.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {draft.final_body || draft.ai_generated_body}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/drafts/${draft.id}`}>
                      <Button variant="default">
                        {draft.status === 'pending' ? 'Review Draft' : 'View Details'}
                      </Button>
                    </Link>
                    {draft.status === 'pending' && draft.confidence_score >= 90 && (
                      <Link href={`/drafts/${draft.id}?quickApprove=true`}>
                        <Button variant="outline">Quick Approve</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {drafts && drafts.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
