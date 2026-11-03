"use client";

import { useState } from "react";
import { IconCheck, IconCopy, IconMail } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { s } from "@/content/strings.en";

export function ContactDialog({
  className,
  icon = false,
  onOpenChange,
}: {
  className?: string;
  icon?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(s.contactEmail);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setCopyState("idle");
        onOpenChange?.(value);
      }}
    >
      {icon ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <DialogTrigger
                render={<Button variant="ghost" size="icon" className="size-8" aria-label={s.contact} />}
              />
            }
          >
            <IconMail size={17} />
          </TooltipTrigger>
          <TooltipContent>{s.contact}</TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger className={className}>{s.contact}</DialogTrigger>
      )}
      <DialogContent className="contact-dialog">
        <DialogTitle>{s.contact}</DialogTitle>
        <DialogDescription>{s.contactHint}</DialogDescription>
        <button
          type="button"
          className="contact-email"
          aria-label={`${s.copyEmail}: ${s.contactEmail}`}
          onClick={() => void copyEmail()}
        >
          <span>{s.contactEmail}</span>
          {copyState === "copied" ? <IconCheck aria-hidden="true" /> : <IconCopy aria-hidden="true" />}
        </button>
        <p className="contact-copy-status" role="status">
          {copyState === "copied" ? s.emailCopied : copyState === "error" ? s.emailCopyError : ""}
        </p>
      </DialogContent>
    </Dialog>
  );
}
