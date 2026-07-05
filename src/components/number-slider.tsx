import type { ReactNode } from "react";

import { Label } from "@/ui/label";
import { Slider } from "@/ui/slider";
import { cn } from "@/utils/tailwind";

interface NumberSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => ReactNode;
  className?: string;
}

function defaultFormat(value: number, step: number) {
  const precision = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;

  return value.toFixed(precision);
}

export function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  className,
}: NumberSliderProps) {
  const displayedValue = formatValue ? formatValue(value) : defaultFormat(value, step);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm text-muted-foreground">{displayedValue}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => {
          if (typeof next === "number") onChange(next);
        }}
      />
    </div>
  );
}
