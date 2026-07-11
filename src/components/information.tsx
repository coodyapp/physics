import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { CollapsiblePanel } from "@/components/collapsible-panel";

interface InformationProps {
  title: string;
  children: ReactNode;
  id?: string;
  open: boolean;
  onClose: () => void;
}

export default function Information({ title, children, id, open, onClose }: InformationProps) {
  return (
    <CollapsiblePanel
      side="left"
      title={title}
      icon={<Info className="h-4 w-4" />}
      id={id}
      open={open}
      onClose={onClose}
      contentClassName="text-sm text-muted-foreground space-y-2"
    >
      {children}
    </CollapsiblePanel>
  );
}
