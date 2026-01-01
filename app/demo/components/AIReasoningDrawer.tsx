'use client';

import { useState } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../../../components/ui/drawer';
import { Button } from '../../../components/ui/button';
import { ChevronIcon } from '../../../components/ui/icons/chevron-icon';
import { cn } from '../../../lib/utils';

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

interface AIReasoningDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionsAddressed: string[];
  crmLookups: CRMLookup[];
  calendarChecks: CalendarCheck[];
  tourRoute?: {
    recommended: string;
    route: string;
    driveTimes: string;
    totalTime: string;
  };
}

export function AIReasoningDrawer({
  open,
  onOpenChange,
  questionsAddressed,
  crmLookups,
  calendarChecks,
  tourRoute,
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
      <DrawerContent className="h-full w-[600px] fixed right-0 top-0 bottom-0">
        <DrawerHeader className="border-b">
          <DrawerTitle>🧠 AI Reasoning & Data Sources</DrawerTitle>
          <DrawerDescription>
            See exactly what the AI analyzed and how it reached its conclusions
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Questions Addressed */}
          <CollapsibleSection
            title="Questions Addressed"
            count={questionsAddressed.length}
            expanded={expandedSections.has('questions')}
            onToggle={() => toggleSection('questions')}
          >
            <div className="space-y-2">
              {questionsAddressed.map((question, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span className="text-gray-700">{question}</span>
                </div>
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
                    lookup.excluded ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"
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
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
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
              <div className="border border-green-200 rounded-lg p-4 bg-green-50 space-y-2 text-sm">
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
