import { z } from "zod";
import { bookmarkSchema, lineSchema, settingsSchema } from "@/lib/model";
export const anchorSchema = z
  .object({ lineId: z.string(), fraction: z.number().min(0).max(1) })
  .nullable();
export const snapshotSchema = z.object({
  lines: z.array(lineSchema),
  bookmarks: z.array(bookmarkSchema),
  settings: settingsSchema,
  playing: z.boolean(),
  countdown: z.number().int().min(1).nullable(),
  anchor: anchorSchema,
  theme: z.enum(["light", "dark"]),
});
export type Snapshot = z.infer<typeof snapshotSchema>;
const action = z.enum(["play", "pause", "next", "previous", "reset"]);
export const messageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("request"), version: z.literal(1) }),
  z.object({
    type: z.literal("snapshot"),
    version: z.literal(1),
    sequence: z.number(),
    snapshot: snapshotSchema,
  }),
  z.object({
    type: z.literal("command"),
    version: z.literal(1),
    id: z.string(),
    action,
  }),
  z.object({
    type: z.literal("jump"),
    version: z.literal(1),
    anchor: anchorSchema,
  }),
  z.object({
    type: z.literal("speed"),
    version: z.literal(1),
    speed: z.number().min(5).max(200),
  }),
  z.object({
    type: z.literal("settings"),
    version: z.literal(1),
    patch: settingsSchema
      .pick({
        fontSize: true,
        leftMargin: true,
        rightMargin: true,
        height: true,
        guide: true,
        outputClearance: true,
      })
      .partial()
      .strict(),
  }),
  z.object({
    type: z.literal("progress"),
    version: z.literal(1),
    anchor: anchorSchema,
    cue: z.number().int().min(0),
    progress: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal("pulse"),
    version: z.literal(1),
    owner: z.enum(["workspace", "presenter"]),
  }),
  z.object({ type: z.literal("goodbye"), version: z.literal(1) }),
]);
export type Message = z.infer<typeof messageSchema>;
export type Action = z.infer<typeof action>;
export const channelName = (session: string) =>
  `teleprompter-pro:presenter:${session}`;
export function connectChannel(
  session: string,
  receive: (message: Message) => void,
  target?: Window | null,
) {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(channelName(session));
    channel.onmessage = (e) => {
      const result = messageSchema.safeParse(e.data);
      if (result.success) receive(result.data);
    };
    return {
      send: (message: Message) => channel.postMessage(message),
      close: () => channel.close(),
    };
  }
  const listener = (event: MessageEvent) => {
    if (
      event.origin !== location.origin ||
      event.data?.session !== session ||
      event.source !== (target ?? window.opener)
    )
      return;
    const result = messageSchema.safeParse(event.data?.message);
    if (result.success) receive(result.data);
  };
  window.addEventListener("message", listener);
  return {
    send: (message: Message) =>
      (target ?? window.opener)?.postMessage(
        { session, message },
        location.origin,
      ),
    close: () => window.removeEventListener("message", listener),
  };
}
