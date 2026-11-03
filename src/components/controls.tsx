"use client";

import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function IconButton({
  label,
  children,
  onClick,
  disabled,
  active,
  className = "",
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={`size-9 ${className}`}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
export function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const fieldId = useId();
  return (
    <div className="range-control space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={fieldId} className="text-xs text-muted-foreground">
          {label}
        </label>
        <div className="flex items-center rounded-md border border-input bg-background px-2">
          <input
            id={fieldId}
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number(value.toFixed(2))}
            onChange={(e) => {
              if (
                e.target.value !== "" &&
                Number.isFinite(e.target.valueAsNumber)
              )
                onChange(Math.min(max, Math.max(min, e.target.valueAsNumber)));
            }}
            className="w-11 bg-transparent py-1 text-right text-xs tabular-nums outline-none"
          />
          <span className="ml-1 text-[11px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}
export function ToggleControl({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const fieldId = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={fieldId} className="cursor-pointer">
        <span className="block text-xs font-medium">{label}</span>
        {hint && (
          <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
            {hint}
          </span>
        )}
      </label>
      <Switch id={fieldId} checked={value} onCheckedChange={onChange} />
    </div>
  );
}
export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-section space-y-5 border-b border-border px-5 py-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
