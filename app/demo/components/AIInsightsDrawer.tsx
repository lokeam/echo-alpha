'use client';

import { useState } from 'react';

// Components
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

// Icons
import { BulbIcon } from '@/components/ui/icons/bulb-icon';
import { MailOpenedIcon } from '@/components/ui/icons/mail-opened-icon';
import { CircleCheckIcon } from '@/components/ui/icons/circle-check-icon';
import { ChevronIcon } from '@/components/ui/icons/chevron-icon';
import { FilesIcon } from '@/components/ui/icons/files-icon';

// Utils
import { cn } from '@/lib/utils';

interface Question {
  question: string;
  answer: string;
  sourceEmailId?: number;
  sourceText?: string;
  sourceEmailFrom?: string;
  sourceEmailTo?: string;
  sourceEmailSubject?: string;
  sourceEmailDate?: Date | string;
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

interface AIInsightsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reasoning: Reasoning;
  version: number;
  confidence: number;
}

export function AIInsightsDrawer({
  open,
  onOpenChange,
  reasoning,
  version,
  confidence,
}: AIInsightsDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['questions']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-[50vw] max-w-[50vw]! fixed right-0 top-0 bottom-0">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center gap-2 text-2xl">
            <BulbIcon className="w-8 h-8 text-yellow-400" />
            AI Reasoning & Data Sources
          </DrawerTitle>
          <DrawerDescription>
            See exactly what the AI analyzed and how it reached its conclusions
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Questions Addressed */}
          {reasoning.questionsAddressed && reasoning.questionsAddressed.length > 0 && (
            <CollapsibleSection
              title="Questions Addressed"
              count={reasoning.questionsAddressed.length}
              expanded={expandedSections.has('questions')}
              onToggle={() => toggleSection('questions')}
            >
              <div className="space-y-3">
                {reasoning.questionsAddressed.map((item, index) => (
                  <QuestionItem key={index} question={item} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Data Sources Used */}
          {reasoning.dataUsed && reasoning.dataUsed.length > 0 && (
            <CollapsibleSection
              title="Data Sources Used"
              count={reasoning.dataUsed.length}
              subtitle="sources"
              expanded={expandedSections.has('data')}
              onToggle={() => toggleSection('data')}
            >
              <div className="space-y-3">
                {reasoning.dataUsed.map((source, index) => (
                  <DataSourceItem key={index} source={source} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Calendar Availability */}
          {reasoning.calendarChecks && reasoning.calendarChecks.length > 0 && (
            <CollapsibleSection
              title="Calendar Availability Check"
              expanded={expandedSections.has('calendar')}
              onToggle={() => toggleSection('calendar')}
            >
              <div className="space-y-3">
                {reasoning.calendarChecks.map((check, index) => (
                  <CalendarCheckItem key={index} check={check} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Tour Route Optimization */}
          {reasoning.tourRoute && (
            <CollapsibleSection
              title="Tour Route Optimization"
              expanded={expandedSections.has('route')}
              onToggle={() => toggleSection('route')}
            >
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2 text-sm">
                <DetailItem label="Recommended" value={reasoning.tourRoute.recommended} />
                <DetailItem label="Route" value={reasoning.tourRoute.route} />
                <DetailItem label="Drive Times" value={reasoning.tourRoute.driveTimes} />
                <DetailItem label="Total Time" value={reasoning.tourRoute.totalTime} />
              </div>
            </CollapsibleSection>
          )}
        </div>

        <div className="border-t p-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full cursor-pointer">
              Close
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function QuestionItem({ question }: { question: Question }) {
  const [showSource, setShowSource] = useState(false);

  const formatEmailDate = (date: Date | string | undefined) => {
    if (!date) return 'Unknown date';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Unknown date';

    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-start gap-2">
        <CircleCheckIcon className="w-7 h-7 text-green-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-md text-gray-900 font-medium">{question.question}</p>

          {question.sourceEmailId && (
            <button
              onClick={() => setShowSource(!showSource)}
              className="mt-2 text-sm text-[#FF2727] hover:text-[#FF2727] flex items-center gap-1 cursor-pointer"
            >
              <MailOpenedIcon className="w-5 h-5" />
              View Source Email
              <ChevronIcon
                className={cn(
                  "w-3 h-3 transition-transform",
                  showSource ? "rotate-180" : ""
                )}
              />
            </button>
          )}

          {showSource && question.sourceText && (
            <div className="mt-2 bg-white border border-[#FF2727] rounded overflow-hidden">
              {/* Email Header */}
              <div className="bg-gray-50 border-b border-gray-200 p-3 space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-600 min-w-[50px]">Date:</span>
                  <span className="text-gray-900">{formatEmailDate(question.sourceEmailDate)}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-600 min-w-[50px]">From:</span>
                  <span className="text-gray-900">{question.sourceEmailFrom || 'Unknown'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-600 min-w-[50px]">To:</span>
                  <span className="text-gray-900">{question.sourceEmailTo || 'Unknown'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-600 min-w-[50px]">Subject:</span>
                  <span className="text-gray-900">{question.sourceEmailSubject || 'No subject'}</span>
                </div>
              </div>

              {/* Quoted Text */}
              <div className="p-3">
                <div className="text-gray-700 italic border-l-2 border-gray-400 pl-3 text-xs">
                  &ldquo;{question.sourceText.trim()}&rdquo;
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataSourceItem({ source }: { source: DataSource }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 text-left hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            {source.sourceType === 'email' ? (
              <MailOpenedIcon className="w-5 h-5 text-gray-600 mt-0.5" />
            ) : (
              <FilesIcon className="w-5 h-5 text-gray-600 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-gray-900">{source.sourceTitle}</p>
              {source.sourceSubtitle && (
                <p className="text-xs text-gray-600">{source.sourceSubtitle}</p>
              )}
            </div>
          </div>
          <ChevronIcon
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform",
              expanded ? "rotate-180" : ""
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-200">
          <div className="pt-3 space-y-2 text-sm">
            {source.details.address && (
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <span className="text-gray-900 ml-2">{source.details.address}</span>
              </div>
            )}
            {source.details.monthlyRate && (
              <div>
                <span className="font-medium text-gray-700">Rate:</span>
                <span className="text-gray-900 ml-2">${source.details.monthlyRate.toLocaleString()}/mo</span>
              </div>
            )}
            {source.details.hostCompany && (
              <div>
                <span className="font-medium text-gray-700">Host:</span>
                <span className="text-gray-900 ml-2">{source.details.hostCompany}</span>
              </div>
            )}
            {source.dataPointsUsed && source.dataPointsUsed.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-700 block mb-1">Data points used:</span>
                <div className="flex flex-wrap gap-1">
                  {source.dataPointsUsed.map((point, idx) => (
                    <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarCheckItem({ check }: { check: { day: string; time: string; spaces: Array<{ spaceName: string; available: boolean; note?: string }> } }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="font-medium text-sm text-gray-900 mb-2">
        {check.day} {check.time}
      </div>
      <div className="space-y-1">
        {check.spaces.map((space, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span className={space.available ? 'text-green-600' : 'text-red-600'}>
              {space.available ? '✓' : '✗'}
            </span>
            <span className="text-gray-700">{space.spaceName}</span>
            {space.note && (
              <span className="text-xs text-gray-500">({space.note})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-start gap-2">
        <span className="font-medium text-gray-700 min-w-[120px]">{label}:</span>
        <span className="text-gray-900">{value}</span>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  count,
  subtitle,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <ChevronIcon
            className={cn(
              "w-5 h-5 text-gray-500 transition-transform",
              expanded ? "rotate-180" : ""
            )}
          />
          <span className="font-semibold text-gray-900">{title}</span>
          {count !== undefined && (
            <span className="text-sm text-gray-600">
              ({count} {subtitle || 'items'})
            </span>
          )}
        </div>
      </button>
      {expanded && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}
