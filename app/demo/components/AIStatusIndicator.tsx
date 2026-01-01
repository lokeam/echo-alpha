'use client';

import { CircleCheckIcon } from '../../../components/ui/icons/circle-check-icon';
import { cn } from '../../../lib/utils';

export type AIStatus =
  | 'reading_thread'
  | 'identifying_questions'
  | 'querying_crm_fidi'
  | 'querying_crm_soma'
  | 'querying_crm_mission'
  | 'checking_availability'
  | 'calculating_route'
  | 'drafting'
  | 'complete';

interface StatusStep {
  id: AIStatus;
  label: string;
  completed: boolean;
  inProgress: boolean;
}

interface AIStatusIndicatorProps {
  currentStatus: AIStatus;
  className?: string;
}

const STATUS_STEPS: Array<{ id: AIStatus; label: string }> = [
  { id: 'reading_thread', label: 'Reading email thread (10 emails)' },
  { id: 'identifying_questions', label: 'Identifying questions (12 found)' },
  { id: 'querying_crm_fidi', label: 'Querying CRM: FiDi Office parking details...' },
  { id: 'querying_crm_soma', label: 'Querying CRM: SOMA Space amenities...' },
  { id: 'querying_crm_mission', label: 'Querying CRM: Mission Hub availability...' },
  { id: 'checking_availability', label: 'Checking availability: Tuesday 2-4pm slots...' },
  { id: 'calculating_route', label: 'Calculating optimal tour route...' },
  { id: 'drafting', label: 'Drafting comprehensive response...' },
];

export function AIStatusIndicator({ currentStatus, className }: AIStatusIndicatorProps) {
  const currentIndex = STATUS_STEPS.findIndex(step => step.id === currentStatus);

  const steps: StatusStep[] = STATUS_STEPS.map((step, index) => ({
    id: step.id,
    label: step.label,
    completed: index < currentIndex || currentStatus === 'complete',
    inProgress: index === currentIndex && currentStatus !== 'complete',
  }));

  const progress = currentStatus === 'complete'
    ? 100
    : Math.round(((currentIndex + 1) / STATUS_STEPS.length) * 100);

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-6", className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
        <h3 className="font-semibold text-gray-900">AI is working...</h3>
      </div>

      <div className="space-y-3 mb-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {step.completed ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <CircleCheckIcon className="w-3 h-3 text-white" />
                </div>
              ) : step.inProgress ? (
                <div className="w-5 h-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin"></div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                step.completed && "text-gray-600",
                step.inProgress && "text-purple-700 font-medium",
                !step.completed && !step.inProgress && "text-gray-400"
              )}
            >
              {step.completed ? '✓ ' : ''}{step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
