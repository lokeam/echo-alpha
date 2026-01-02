'use client';

import { useState } from 'react';

// TRPC
import { trpc } from '@/lib/trpc';

// Components
import { SparklesIcon } from '@/components/ui/icons/sparkles-icon';

interface EmailDraftGeneratorProps {
  dealId: number;
  inboundEmailId: number;
}

export function EmailDraftGenerator({ dealId, inboundEmailId }: EmailDraftGeneratorProps) {
  const [showDraft, setShowDraft] = useState(false);

  const generateDraft = trpc.deal.generateEmailDraft.useMutation({
    onSuccess: () => {
      setShowDraft(true);
    },
  });

  const handleGenerate = () => {
    setShowDraft(false);
    generateDraft.mutate({ dealId, inboundEmailId });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">AI Email Draft Generator</h2>
        <button
          onClick={handleGenerate}
          disabled={generateDraft.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {generateDraft.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </span>
          ) : (
            <><SparklesIcon className="w-4 h-4" /> Generate AI Draft</>
          )}
        </button>
      </div>

      {generateDraft.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {generateDraft.error.message}
          </p>
        </div>
      )}

      {showDraft && generateDraft.data && (
        <div className="space-y-4">
          {/* Generated Email */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900">Generated Draft</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                  Confidence: {generateDraft.data.confidence}%
                </span>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-white p-4 rounded border border-gray-200">
              {generateDraft.data.body}
            </div>
          </div>

          {/* AI Insights */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-3">AI Insights</h3>

            {generateDraft.data.reasoning.questionsAddressed.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Questions Addressed:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {generateDraft.data.reasoning.questionsAddressed.map((q, i) => (
                    <li key={i}>✓ {q}</li>
                  ))}
                </ul>
              </div>
            )}

            {generateDraft.data.reasoning.dataUsed.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Data Sources Used:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {generateDraft.data.reasoning.dataUsed.map((d, i) => (
                    <li key={i}>• {d}</li>
                  ))}
                </ul>
              </div>
            )}

            {generateDraft.data.reasoning.schedulingLogic && (
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">Scheduling Logic:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {generateDraft.data.reasoning.schedulingLogic.map((s, i) => (
                    <li key={i}>→ {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 flex gap-4">
            <span>Model: {generateDraft.data.metadata.model}</span>
            <span>Tokens: {generateDraft.data.metadata.tokensUsed}</span>
            <span>Generated: {new Date(generateDraft.data.metadata.generatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {!showDraft && !generateDraft.isPending && (
        <p className="text-sm text-gray-500 text-center py-8">
          Click "Generate AI Draft" to create a response to the latest email
        </p>
      )}
    </div>
  );
}
