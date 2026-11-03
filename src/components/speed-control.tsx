"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { s } from "@/content/strings.en";
import { clamp } from "@/lib/model";

export function SpeedControl({ speed, onChange }: {
  speed: number;
  onChange: (speed: number) => void;
}) {
  return (
    <div className="transport-speed" role="group" aria-label={s.speed}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={s.slower}
              disabled={speed <= 5}
              onClick={() => onChange(clamp(speed - 5, 5, 200))}
            >
              <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 15a7 7 0 0 1 14 0H4Zm3-1 3-5 4 5M4 15l-2 1m5-1-1 4m9-4 1 4" />
                <path d="M18 14h2a2 2 0 1 1 0 4h-2" />
              </svg>
            </Button>
          }
        />
        <TooltipContent>{s.slower}</TooltipContent>
      </Tooltip>
      <output aria-label={s.speed} aria-live="polite" className="speed-value">
        {Number((speed / 20).toFixed(2))}×
      </output>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={s.faster}
              disabled={speed >= 200}
              onClick={() => onChange(clamp(speed + 5, 5, 200))}
            >
              <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 9c-3-5-2-8 0-7 1 1 2 4 2 7m0 0c0-5 2-8 3-6 1 2-1 5-2 7" />
                <path d="M19 10c3 1 3 5 0 6l-2 1 3 3h-5l-2-3M15 11c-6-5-12-1-11 5 0 3 4 5 8 4h3M3 13a2 2 0 1 0 0 4" />
                <path d="M19 12h.01M8 17l-2 3h4" />
              </svg>
            </Button>
          }
        />
        <TooltipContent>{s.faster}</TooltipContent>
      </Tooltip>
    </div>
  );
}
