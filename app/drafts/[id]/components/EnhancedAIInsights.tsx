'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { useState } from 'react';

interface Question {
  question: string;
  answer: string;
  sourceEmailId?: number;
  sourceText?: string;
}

interface DataSource {
  sourceType: 'space' | 'deal' | 'email';
  sourceId: number;
  sourceName: string;
  sourceTitle: string;
  sourceSubtitle?: string;
  details: {
    // For spaces
    address?: string;
    monthlyRate?: number;
    hostCompany?: string;
    // For emails
    from?: string;
    to?: string;
    sentAt?: Date;
    subject?: string;
  };
  dataPointsUsed?: string[];
}

interface Reasoning {
  questionsAddressed: Question[];
  dataUsed: DataSource[];
  schedulingLogic?: string[];
}

interface EnhancedAIInsightsProps {
  reasoning: Reasoning;
  version: number;
  confidence: number;
}

export function EnhancedAIInsights({ reasoning, version, confidence = 0 }: EnhancedAIInsightsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [expandedDataSources, setExpandedDataSources] = useState<Set<number>>(new Set());

  // Ensure confidence is a valid number
  const displayConfidence = confidence || 0;

  const toggleQuestion = (index: number) => {
    const newSet = new Set(expandedQuestions);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedQuestions(newSet);
  };

  const toggleDataSource = (index: number) => {
    const newSet = new Set(expandedDataSources);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedDataSources(newSet);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-blue-900">🧠 AI Reasoning (Version {version})</CardTitle>
            <CardDescription className="text-blue-700">
              How the AI generated this response
            </CardDescription>
          </div>
          <Badge className="bg-white border-2 text-gray-900">
            <span className={getConfidenceColor(displayConfidence)}>{displayConfidence}%</span> Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Questions Addressed */}
          {reasoning.questionsAddressed && reasoning.questionsAddressed.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">Questions Addressed:</h4>
              <div className="space-y-2">
                {reasoning.questionsAddressed.filter(q => q.sourceText).map((q, i) => (
                  <div key={i} className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                    <div
                      className="p-3 cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => toggleQuestion(i)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-blue-900">
                            ✓ {q.question}
                          </span>
                        </div>
                        <button className="text-blue-600 text-xs ml-2">
                          {expandedQuestions.has(i) ? '▼ Hide' : '▶ Show source'}
                        </button>
                      </div>
                    </div>
                    {expandedQuestions.has(i) && q.sourceText && (
                      <div className="px-3 pb-3 pt-0">
                        <div className="bg-gray-50 rounded p-3 border-l-4 border-blue-400">
                          <p className="text-xs text-gray-600 mb-1">From original email:</p>
                          <p className="text-sm text-gray-800 italic">&ldquo;{q.sourceText}&hellip;&rdquo;</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Sources Used */}
          {reasoning.dataUsed && reasoning.dataUsed.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">Data Sources Used:</h4>
              <div className="space-y-2">
                {reasoning.dataUsed.map((source, i) => (
                  <div key={i} className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                    <div
                      className="p-3 cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => toggleDataSource(i)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {source.sourceType === 'email' ? '📧' : '📄'}
                            </span>
                            <span className="text-sm font-semibold text-blue-900">
                              {source.sourceTitle}
                            </span>
                          </div>
                          {source.sourceSubtitle && (
                            <div className="text-xs text-gray-600 ml-7">
                              {source.sourceSubtitle}
                            </div>
                          )}
                        </div>
                        <button className="text-blue-600 text-xs ml-2 whitespace-nowrap">
                          {expandedDataSources.has(i) ? '▼ Hide' : '▶ View details'}
                        </button>
                      </div>
                    </div>

                    {expandedDataSources.has(i) && (
                      <div className="px-3 pb-3 pt-0">
                        <div className="bg-gray-50 rounded p-3 border-l-4 border-green-400">
                          <div className="space-y-3">
                            {/* Source Details */}
                            <div>
                              <div className="text-xs font-semibold text-gray-700 mb-2">Source Details:</div>

                              {/* Email details */}
                              {source.sourceType === 'email' && (
                                <div className="space-y-1 text-xs text-gray-600">
                                  {source.details.from && (
                                    <div><span className="font-medium">From:</span> {source.details.from}</div>
                                  )}
                                  {source.details.to && (
                                    <div><span className="font-medium">To:</span> {source.details.to}</div>
                                  )}
                                  {source.details.sentAt && (
                                    <div><span className="font-medium">Sent:</span> {new Date(source.details.sentAt).toLocaleString()}</div>
                                  )}
                                  {source.details.subject && (
                                    <div><span className="font-medium">Subject:</span> {source.details.subject}</div>
                                  )}
                                </div>
                              )}

                              {/* Space details */}
                              {source.sourceType === 'space' && (
                                <div className="space-y-1 text-xs text-gray-600">
                                  {source.details.hostCompany && (
                                    <div><span className="font-medium">Host Company:</span> {source.details.hostCompany}</div>
                                  )}
                                  {source.details.address && (
                                    <div><span className="font-medium">Location:</span> {source.details.address}</div>
                                  )}
                                  {source.details.monthlyRate && (
                                    <div><span className="font-medium">Rate:</span> ${source.details.monthlyRate.toLocaleString()}/mo</div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Data points used */}
                            {source.dataPointsUsed && source.dataPointsUsed.length > 0 && (
                              <div className="pt-2 border-t border-gray-200">
                                <div className="text-xs font-semibold text-gray-700 mb-1">Used for:</div>
                                <div className="flex flex-wrap gap-1">
                                  {source.dataPointsUsed.map((point, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {point}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduling Logic */}
          {reasoning.schedulingLogic && reasoning.schedulingLogic.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">Scheduling Logic:</h4>
              <div className="space-y-2">
                {reasoning.schedulingLogic.map((logic, i) => (
                  <div key={i} className="bg-white rounded-lg border border-blue-200 p-3">
                    <span className="text-sm text-blue-900">→ {logic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
