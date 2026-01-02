'use client';

import { useState } from 'react';

// Components
import { ChevronIcon } from '@/components/ui/icons/chevron-icon';
import { cn } from '@/lib/utils';

interface EmailThreadItemProps {
  email: {
    id: number;
    from: string;
    to: string;
    subject: string;
    body: string;
    sent_at: string | Date;
  };
  senderType?: 'agent' | 'client';
  isExpanded?: boolean;
  isLatest?: boolean;
  onToggle?: () => void;
}

export function EmailThreadItem({ email, senderType = 'agent', isExpanded = false, isLatest = false, onToggle }: EmailThreadItemProps) {
  const [localExpanded, setLocalExpanded] = useState(isExpanded);

  const expanded = onToggle ? isExpanded : localExpanded;
  const handleToggle = () => {
    if (isLatest) return; // Cannot collapse latest email
    if (onToggle) {
      onToggle();
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPreviewText = (body: string) => {
    const singleLine = body.replace(/\n+/g, ' ');
    const normalized = singleLine.replace(/\s+/g, ' ').trim();
    const maxLength = 120;
    return normalized.length > maxLength
      ? normalized.substring(0, maxLength) + '...'
      : normalized;
  };

  const getAvatarStyles = (type: 'agent' | 'client') => {
    if (type === 'client') {
      return {
        containerClass: 'bg-white border border-black',
        textClass: 'text-black'
      };
    }
    return {
      containerClass: 'bg-gradient-to-br from-[#FFC9BF] to-[#FF2727]',
      textClass: 'text-white'
    };
  };

  const avatarStyles = getAvatarStyles(senderType);

  return (
    <div
      className={cn(
        "border border-gray-200 rounded-lg bg-white transition-all duration-200 ease-in-out overflow-hidden",
        expanded ? "shadow-sm" : "shadow-xs",
        !expanded && !isLatest && "hover:shadow-sm cursor-pointer",
        isLatest && "cursor-default"
      )}
      style={{
        height: expanded ? 'auto' : '80px',
      }}
      onClick={expanded || isLatest ? undefined : handleToggle}
    >
      <div className="flex gap-3 p-4">
        {/* Avatar - always visible */}
        <div className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
          avatarStyles.containerClass,
          avatarStyles.textClass
        )}>
          {email.from.charAt(0).toUpperCase()}
        </div>

        {/* Content area - both collapsed and expanded content align here */}
        <div className="flex-1 min-w-0">
          {/* Header with name and timestamp */}
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-gray-900 text-sm truncate">
              {email.from.split('@')[0]}
            </span>
            <span className="text-xs text-gray-500 shrink-0">
              {formatDate(email.sent_at)}
            </span>
          </div>

          {/* Preview text when collapsed */}
          {!expanded && (
            <div className="text-xs text-gray-600 truncate mt-0.5 overflow-hidden whitespace-nowrap">
              {getPreviewText(email.body)}
            </div>
          )}

          {/* Expanded content - naturally aligned with header */}
          {expanded && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-3 space-y-1">
                <div>
                  <span className="font-medium">From:</span> {email.from}
                </div>
                <div>
                  <span className="font-medium">To:</span> {email.to}
                </div>
                <div>
                  <span className="font-medium">Subject:</span> {email.subject}
                </div>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {email.body}
              </div>
            </div>
          )}
        </div>

        {/* Chevron button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          disabled={isLatest}
          className={cn(
            "shrink-0 ml-2 p-1 rounded transition-colors self-start",
            isLatest ? "cursor-default opacity-50" : "hover:bg-gray-100"
          )}
        >
          <ChevronIcon
            className={cn(
              "w-5 h-5 text-gray-500 transition-transform duration-200",
              expanded ? "rotate-180" : ""
            )}
          />
        </button>
      </div>
    </div>
  );
}
