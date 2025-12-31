'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { useState, useEffect } from 'react';

interface DraftVersion {
  version: number;
  body: string;
  prompt: string | null;
  confidence: number;
  reasoning: any;
  metadata: {
    model: string;
    tokensUsed: number;
    generatedAt: Date;
  };
  createdAt: Date;
}

interface DraftVersionHistoryProps {
  versions: DraftVersion[];
  currentVersion: number;
  regenerationCount: number;
  onSwitchVersion: (version: number) => void;
  isLoading?: boolean;
}

export function DraftVersionHistory({
  versions,
  currentVersion,
  regenerationCount,
  onSwitchVersion,
  isLoading = false,
}: DraftVersionHistoryProps) {
  const [localCurrentVersion, setLocalCurrentVersion] = useState(currentVersion);

  useEffect(() => {
    setLocalCurrentVersion(currentVersion);
  }, [currentVersion]);

  const handleUndo = () => {
    if (localCurrentVersion > 0) {
      const newVersion = localCurrentVersion - 1;
      setLocalCurrentVersion(newVersion);
      onSwitchVersion(newVersion);
    }
  };

  const handleRedo = () => {
    if (localCurrentVersion < versions.length - 1) {
      const newVersion = localCurrentVersion + 1;
      setLocalCurrentVersion(newVersion);
      onSwitchVersion(newVersion);
    }
  };

  const handleVersionClick = (version: number) => {
    setLocalCurrentVersion(version);
    onSwitchVersion(version);
  };

  const getConfidenceDelta = (version: number): number | null => {
    if (version === 0) return null;
    const current = versions[version];
    const previous = versions[version - 1];
    return current.confidence - previous.confidence;
  };

  const formatDelta = (delta: number | null): string => {
    if (delta === null) return '';
    const sign = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
    return `${sign}${Math.abs(delta)}%`;
  };

  const versionsRemaining = 3 - regenerationCount;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localCurrentVersion, versions.length]);

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-purple-900">📜 Draft Versions</CardTitle>
            <CardDescription className="text-purple-700">
              Version history with undo/redo (Cmd+Z / Cmd+Shift+Z)
            </CardDescription>
          </div>
          <Badge className="bg-purple-600">
            {versionsRemaining} refinement{versionsRemaining !== 1 ? 's' : ''} remaining
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {versions.map((version) => {
            const delta = getConfidenceDelta(version.version);
            const isCurrent = version.version === localCurrentVersion;

            return (
              <div
                key={version.version}
                onClick={() => handleVersionClick(version.version)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-purple-600 bg-purple-100'
                    : 'border-purple-200 bg-white hover:border-purple-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${isCurrent ? 'text-purple-900' : 'text-gray-700'}`}>
                        {version.version === 0 ? '○ v0 - Original AI Generation' : `○ v${version.version} - "${version.prompt}"`}
                      </span>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>Confidence: {version.confidence}%</span>
                      {delta !== null && (
                        <span className={delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-600'}>
                          {formatDelta(delta)}
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(version.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-3 border-t border-purple-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={localCurrentVersion === 0 || isLoading}
          >
            ← Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={localCurrentVersion === versions.length - 1 || isLoading}
          >
            Redo →
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-purple-700 self-center">
            Viewing v{localCurrentVersion} of {versions.length - 1}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
