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

// Icons
import { Button } from '@/components/ui/button';
import { ChevronIcon } from '@/components/ui/icons/chevron-icon';
import { BulbIcon } from '@/components/ui/icons/bulb-icon';
import { MailOpenedIcon } from '@/components/ui/icons/mail-opened-icon';
import { CircleCheckIcon } from '@/components/ui/icons/circle-check-icon';
import { CheckIcon } from '@/components/ui/icons/check-icon';
import { WarningIcon } from '@/components/ui/icons/warning-icon';
import { CircleXIcon } from '@/components/ui/icons/circle-x-icon';
import { XIcon } from '@/components/ui/icons/x-icon';

// Utils
import { cn } from '@/lib/utils';

interface CRMLookup {
  spaceId: number;
  spaceName: string;
  address: string;
  details: {
    parking?: {
      type: string;
      location?: string;
      costMonthly?: number;
      costPerDay?: number;
      spotsAvailable?: number;
      note?: string;
    };
    dogPolicy?: {
      allowed: boolean;
      reason?: string;
      flexibility?: string;
      note?: string;
    };
    access?: {
      system?: string;
      costPerCard?: number;
      process?: string;
      hours?: string;
      advanceNotice?: string;
    };
    meetingRooms?: {
      count: number;
      sizes: number[];
      bookingSystem?: string;
      maxHoursPerBooking?: number;
    };
    rentInclusions?: {
      utilities?: boolean;
      internet?: string;
      janitorial?: string;
      hvac?: boolean;
    };
  };
  excluded?: boolean;
  excludedReason?: string;
}

interface CalendarCheck {
  day: string;
  time: string;
  spaces: Array<{
    spaceName: string;
    available: boolean;
    note?: string;
  }>;
}

interface QuestionWithSource {
  question: string;
  answer: string;
  sourceEmailId?: number;
  sourceText?: string;
  sourceEmailSubject?: string;
  sourceEmailDate?: string;
  sourceEmailFrom?: string;
}

interface AIReasoningDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionsAddressed: QuestionWithSource[];
  crmLookups: CRMLookup[];
  calendarChecks: CalendarCheck[];
  tourRoute?: {
    recommended: string;
    route: string;
    driveTimes: string;
    totalTime: string;
  };
  validation?: {
    status: 'passed' | 'warnings' | 'failed';
    issues: string[];
    checkedAt: Date;
  };
}

export function AIReasoningDrawer({
  open,
  onOpenChange,
  questionsAddressed,
  crmLookups,
  calendarChecks,
  tourRoute,
  validation,
}: AIReasoningDrawerProps) {
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
            <BulbIcon className="w-8 h-8" />
            AI Reasoning & Data Sources
          </DrawerTitle>
          <DrawerDescription>
            See exactly what the AI analyzed and how it reached its conclusions
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Validation Status */}
          {validation && (
            <div className={cn(
              "border rounded-lg p-4",
              validation.status === 'passed' && "border-green-200 bg-green-50",
              validation.status === 'warnings' && "border-yellow-200 bg-yellow-50",
              validation.status === 'failed' && "border-red-200 bg-red-50"
            )}>
              <div className="flex items-center gap-2 mb-2">
                {validation.status === 'passed' && (
                  <>
                    <CheckIcon className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Validation Passed</h3>
                  </>
                )}
                {validation.status === 'warnings' && (
                  <>
                    <WarningIcon className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-900">Validation Warnings</h3>
                  </>
                )}
                {validation.status === 'failed' && (
                  <>
                    <CircleXIcon className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">Validation Failed</h3>
                  </>
                )}
              </div>

              {validation.issues.length > 0 && (
                <ul className="text-sm space-y-1 ml-7">
                  {validation.issues.map((issue, i) => (
                    <li key={i} className={cn(
                      validation.status === 'passed' && "text-green-700",
                      validation.status === 'warnings' && "text-yellow-700",
                      validation.status === 'failed' && "text-red-700"
                    )}>
                      • {issue}
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-gray-600 mt-3">
                Self-critique validation completed at {new Date(validation.checkedAt).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Questions Addressed */}
          <CollapsibleSection
            title="Questions Addressed"
            count={questionsAddressed.length}
            expanded={expandedSections.has('questions')}
            onToggle={() => toggleSection('questions')}
          >
            <div className="space-y-3">
              {questionsAddressed.map((item, index) => (
                <QuestionItem key={index} question={item} />
              ))}
            </div>
          </CollapsibleSection>

          {/* CRM Database Lookups */}
          <CollapsibleSection
            title="CRM Database Lookups"
            count={crmLookups.length}
            subtitle="spaces queried"
            expanded={expandedSections.has('crm')}
            onToggle={() => toggleSection('crm')}
          >
            <div className="space-y-4">
              {crmLookups.map((lookup) => (
                <div
                  key={lookup.spaceId}
                  className={cn(
                    "border rounded-lg p-4",
                    lookup.excluded ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{lookup.spaceName}</h4>
                      <p className="text-xs text-gray-600">{lookup.address}</p>
                    </div>
                    {lookup.excluded && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Excluded
                      </span>
                    )}
                  </div>

                  {lookup.excludedReason && (
                    <div className="mb-3 text-sm text-red-700">
                      <strong>Reason:</strong> {lookup.excludedReason}
                    </div>
                  )}

                  <div className="space-y-3 text-sm">
                    {lookup.details.parking && (
                      <DetailItem
                        label="Parking"
                        value={`${lookup.details.parking.type} - ${
                          lookup.details.parking.costMonthly
                            ? `$${lookup.details.parking.costMonthly}/mo`
                            : `$${lookup.details.parking.costPerDay}/day`
                        } - ${lookup.details.parking.spotsAvailable} spots available`}
                        note={lookup.details.parking.note}
                      />
                    )}

                    {lookup.details.dogPolicy && (
                      <DetailItem
                        label="Dog Policy"
                        value={lookup.details.dogPolicy.allowed ? '✓ Allowed' : '✗ Not allowed'}
                        note={lookup.details.dogPolicy.reason || lookup.details.dogPolicy.note}
                        success={lookup.details.dogPolicy.allowed}
                      />
                    )}

                    {lookup.details.access && (
                      <DetailItem
                        label="Access"
                        value={`${lookup.details.access.hours || '24/7'} - ${lookup.details.access.system}`}
                        note={lookup.details.access.process}
                      />
                    )}

                    {lookup.details.meetingRooms && (
                      <DetailItem
                        label="Meeting Rooms"
                        value={`${lookup.details.meetingRooms.count} rooms (${lookup.details.meetingRooms.sizes.join(', ')} person)`}
                        note={lookup.details.meetingRooms.bookingSystem}
                      />
                    )}

                    {lookup.details.rentInclusions && (
                      <DetailItem
                        label="Rent Inclusions"
                        value={`Internet: ${lookup.details.rentInclusions.internet}, Utilities: ${
                          lookup.details.rentInclusions.utilities ? 'Yes' : 'No'
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Calendar Availability */}
          <CollapsibleSection
            title="Calendar Availability Check"
            expanded={expandedSections.has('calendar')}
            onToggle={() => toggleSection('calendar')}
          >
            <div className="space-y-3">
              {calendarChecks.map((check, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="font-medium text-sm text-gray-900 mb-2">
                    {check.day} {check.time}
                  </div>
                  <div className="space-y-1">
                    {check.spaces.map((space, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className={space.available ? 'text-green-600' : 'text-red-600'}>
                          {space.available ? <CheckIcon /> : <XIcon />}
                        </span>
                        <span className="text-gray-700">{space.spaceName}</span>
                        {space.note && (
                          <span className="text-xs text-gray-500">({space.note})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Tour Route Optimization */}
          {tourRoute && (
            <CollapsibleSection
              title="Tour Route Optimization"
              expanded={expandedSections.has('route')}
              onToggle={() => toggleSection('route')}
            >
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2 text-sm">
                <DetailItem label="Recommended" value={tourRoute.recommended} />
                <DetailItem label="Route" value={tourRoute.route} />
                <DetailItem label="Drive Times" value={tourRoute.driveTimes} />
                <DetailItem label="Total Time" value={tourRoute.totalTime} />
              </div>
            </CollapsibleSection>
          )}
        </div>

        <div className="border-t p-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function QuestionItem({ question }: { question: QuestionWithSource }) {
  const [showSource, setShowSource] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-start gap-2">
        <CircleCheckIcon className="w-7 h-7 text-green-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-md text-gray-900 font-medium">{question.question}</p>

          {question.sourceEmailId && (
            <button
              onClick={() => setShowSource(!showSource)}
              className="mt-2 text-sm text-[#FF2727] hover:text-[#FF2727] flex items-center gap-1"
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
            <div className="mt-2 p-3 bg-white border border-[#FF2727] rounded text-xs">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {question.sourceEmailSubject || 'Email Thread'}
                  </p>
                  <p className="text-gray-600 mt-0.5">
                    From: {question.sourceEmailFrom || 'Sarah Chen'} • {question.sourceEmailDate || 'Recent'}
                  </p>
                </div>
                <span className="text-xs bg-[#FFE6E2] text-[#FF2727]] px-2 py-1 rounded">
                  Email #{question.sourceEmailId}
                </span>
              </div>
              <div className="text-gray-700 italic border-l-2 border-gray-400 pl-3 mt-2">
                &ldquo;{question.sourceText.trim()}&rdquo;
              </div>
            </div>
          )}
        </div>
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
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
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

function DetailItem({
  label,
  value,
  note,
  success,
}: {
  label: string;
  value: string;
  note?: string;
  success?: boolean;
}) {
  return (
    <div>
      <div className="flex items-start gap-2">
        <span className="font-medium text-gray-700 min-w-[120px]">{label}:</span>
        <span className={cn("text-gray-900", success && "text-green-700")}>{value}</span>
      </div>
      {note && <div className="text-xs text-gray-500 ml-[128px] mt-0.5">{note}</div>}
    </div>
  );
}
