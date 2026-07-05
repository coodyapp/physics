import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { CollapsiblePanel } from "@/components/collapsible-panel";

interface InformationProps {
  title: string;
  children: ReactNode;
}

export default function Information({ title, children }: InformationProps) {
  return (
    <CollapsiblePanel
      side="left"
      title={title}
      icon={<Info className="h-4 w-4" />}
      contentClassName="text-sm text-muted-foreground space-y-2"
    >
      {children}
    </CollapsiblePanel>
  );
}
