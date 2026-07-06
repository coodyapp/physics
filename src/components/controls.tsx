import type { ReactNode } from "react";
import { Settings } from "lucide-react";

import { CollapsiblePanel } from "@/components/collapsible-panel";

interface ControlsProps {
  title?: string;
  children: ReactNode;
  id?: string;
  open: boolean;
}

export default function Controls({ title = "Controls", children, id, open }: ControlsProps) {
  return (
    <CollapsiblePanel
      side="right"
      title={title}
      icon={<Settings className="h-4 w-4" />}
      id={id}
      open={open}
      showTitle={false}
    >
      {children}
    </CollapsiblePanel>
  );
}
