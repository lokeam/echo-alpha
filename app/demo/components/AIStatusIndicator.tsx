'use client';

// Icons
import { CircleCheckIcon } from '@/components/ui/icons/circle-check-icon';

// Utils
import { cn } from '@/lib/utils';

// Icons
import { CheckIcon } from '@/components/ui/icons/check-icon';

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

export interface StatusStep {
  id: string;
  label: string;
  completed?: boolean;
  inProgress?: boolean;
}

export interface BrandColors {
  primary: string;
  success: string;
  text: {
    active: string;
    completed: string;
    pending: string;
  };
}

interface AIStatusIndicatorProps {
  currentStatus?: AIStatus | string;
  steps?: StatusStep[];
  progress?: number;
  isComplete?: boolean;
  showSpinner?: boolean;
  title?: string;
  brandColors?: BrandColors;
  className?: string;
}

const DEFAULT_STATUS_STEPS: Array<{ id: AIStatus; label: string }> = [
  { id: 'reading_thread', label: 'Reading email thread (10 emails)' },
  { id: 'identifying_questions', label: 'Identifying questions (12 found)' },
  { id: 'querying_crm_fidi', label: 'Querying CRM: FiDi Office parking details...' },
  { id: 'querying_crm_soma', label: 'Querying CRM: SOMA Space amenities...' },
  { id: 'querying_crm_mission', label: 'Querying CRM: Mission Hub availability...' },
  { id: 'checking_availability', label: 'Checking availability: Tuesday 2-4pm slots...' },
  { id: 'calculating_route', label: 'Calculating optimal tour route...' },
  { id: 'drafting', label: 'Drafting comprehensive response...' },
];

const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#FF2727',
  success: '#10b981',
  text: {
    active: '#FF2727',
    completed: '#5a5a5a',
    pending: '#9ca3af',
  },
};

export function AIStatusIndicator({
  currentStatus,
  steps: customSteps,
  progress: customProgress,
  isComplete = false,
  showSpinner = true,
  title = 'AI is working...',
  brandColors = DEFAULT_BRAND_COLORS,
  className,
}: AIStatusIndicatorProps) {
  const statusSteps = customSteps || DEFAULT_STATUS_STEPS;
  const currentIndex = currentStatus
    ? statusSteps.findIndex(step => step.id === currentStatus)
    : -1;

  const steps: StatusStep[] = customSteps
    ? customSteps.map(step => ({
        id: step.id,
        label: step.label,
        completed: step.completed ?? false,
        inProgress: step.inProgress ?? false,
      }))
    : statusSteps.map((step, index) => ({
        id: step.id,
        label: step.label,
        completed: index < currentIndex || isComplete,
        inProgress: index === currentIndex && !isComplete,
      }));

  const progress = customProgress !== undefined
    ? customProgress
    : isComplete
    ? 100
    : currentIndex >= 0
    ? Math.round(((currentIndex + 1) / statusSteps.length) * 100)
    : 0;

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-6", className)}>
      <div className="flex items-center gap-3 mb-4">
        {showSpinner && !isComplete && (
          <div
            className="animate-spin rounded-full h-5 w-5 border-b-2"
            style={{ borderBottomColor: brandColors.primary }}
          />
        )}
        {isComplete && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: brandColors.success }}
          >
            <CheckIcon className="w-3 h-3 text-white" />
          </div>
        )}
        <h3 className="font-semibold text-gray-900">{isComplete ? 'Complete!' : title}</h3>
      </div>

      <div className="space-y-3 mb-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            <div className="shrink-0">
              {step.completed ? (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: brandColors.success }}
                >
                  <CircleCheckIcon className="w-6 h-6 text-white" />
                </div>
              ) : step.inProgress ? (
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: brandColors.primary, borderTopColor: 'transparent' }}
                />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
              )}
            </div>
            <div
              className="text-md"
              style={{
                color: step.completed
                  ? brandColors.text.completed
                  : step.inProgress
                  ? brandColors.text.active
                  : brandColors.text.pending,
                fontWeight: step.inProgress ? 500 : 400,
              }}
            >
              {step.label}
            </div>
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
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(to right, white, ${brandColors.primary})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
