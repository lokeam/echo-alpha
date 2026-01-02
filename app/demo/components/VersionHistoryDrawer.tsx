'use client';

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
import { DraftVersionHistory } from '@/app/drafts/[id]/components/DraftVersionHistory';

interface DraftVersion {
  version: number;
  body: string;
  prompt: string | null;
  confidence: number;
  reasoning: unknown;
  metadata: {
    model: string;
    tokensUsed: number;
    generatedAt: Date;
  };
  createdAt: Date;
}

interface VersionHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: DraftVersion[];
  currentVersion: number;
  regenerationCount: number;
  onSwitchVersion: (version: number) => void;
  isLoading: boolean;
}

export function VersionHistoryDrawer({
  open,
  onOpenChange,
  versions,
  currentVersion,
  regenerationCount,
  onSwitchVersion,
  isLoading,
}: VersionHistoryDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-[50vw] max-w-[50vw]! fixed right-0 top-0 bottom-0">
        <DrawerHeader className="border-b">
          <DrawerTitle>Draft Version History</DrawerTitle>
          <DrawerDescription>
            View and switch between different versions of your draft. Use Cmd+Z/Cmd+Shift+Z for quick navigation.
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto flex-1 p-6">
          <DraftVersionHistory
            versions={versions}
            currentVersion={currentVersion}
            regenerationCount={regenerationCount}
            onSwitchVersion={onSwitchVersion}
            isLoading={isLoading}
          />
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
