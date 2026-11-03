"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "next-themes";
import {
  IconMaximize,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
} from "@tabler/icons-react";
import { Reader, type ReaderHandle } from "@/components/reader";
import { IconButton } from "@/components/controls";
import { Button } from "@/components/ui/button";
import { s } from "@/content/strings.en";
import {
  clamp,
  defaults,
  id,
  isTypingTarget,
  toCues,
  type Anchor,
  type Settings,
} from "@/lib/model";
import { connectChannel, type Action, type Snapshot } from "@/lib/protocol";

export function Presenter() {
  const { setTheme } = useTheme();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const [fallback, setFallback] = useState(false);
  const reader = useRef<ReaderHandle>(null);
  const playbackSpacePressed = useRef(false);
  const channel = useRef<ReturnType<typeof connectChannel> | null>(null);
  const anchor = useRef<Anchor | null>(null);
  const receivedSequence = useRef(-1);
  const pulse = useRef(0);
  const cue = useRef(0);
  const initialized = useRef(false);
  const cues = useMemo(() => toCues(snapshot?.lines ?? []), [snapshot?.lines]);
  const settings = snapshot?.settings ?? defaults;
  const current = useRef({ snapshot, cues, disconnected });
  useLayoutEffect(() => {
    current.current = { snapshot, cues, disconnected };
  });
  useEffect(() => {
    const session = new URLSearchParams(location.search).get("session");
    pulse.current = Date.now();
    // Browser URL is available only after mount.
    if (!session || !/^[\da-f-]{36}$/.test(session)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisconnected(true);
      return;
    }
    let restoreTimer: ReturnType<typeof setTimeout> | undefined;
    const connection = connectChannel(session, (message) => {
      if (
        message.type === "snapshot" &&
        message.sequence > receivedSequence.current
      ) {
        receivedSequence.current = message.sequence;
        pulse.current = Date.now();
        setDisconnected(false);
        setSnapshot(message.snapshot);
        setTheme(message.snapshot.theme);
        if (!initialized.current) {
          initialized.current = true;
          anchor.current = message.snapshot.anchor;
          restoreTimer = setTimeout(
            () => reader.current?.restore(message.snapshot.anchor),
            100,
          );
        }
      }
      if (message.type === "jump") {
        anchor.current = message.anchor;
        reader.current?.restore(message.anchor);
      }
      if (message.type === "pulse" && message.owner === "workspace") {
        pulse.current = Date.now();
      }
      if (message.type === "goodbye") {
        setDisconnected(true);
        setSnapshot((value) => (value ? { ...value, playing: false } : value));
      }
    });
    channel.current = connection;
    connection.send({ type: "request", version: 1 });
    const timer = setInterval(() => {
      if (!initialized.current)
        connection.send({ type: "request", version: 1 });
      connection.send({ type: "pulse", version: 1, owner: "presenter" });
      // Hidden workspace tabs have throttled timers. Closing the actual opener is decisive.
      if (
        window.opener?.closed ||
        (!window.opener && Date.now() - pulse.current > 15000)
      ) {
        setDisconnected(true);
        setSnapshot((value) => (value ? { ...value, playing: false } : value));
      }
    }, 1000);
    const close = () => connection.send({ type: "goodbye", version: 1 });
    window.addEventListener("pagehide", close);
    return () => {
      clearInterval(timer);
      clearTimeout(restoreTimer);
      window.removeEventListener("pagehide", close);
      connection.close();
    };
  }, [setTheme]);
  const action = useCallback((value: Action) => {
    if (!current.current.disconnected) {
      channel.current?.send({
        type: "command",
        version: 1,
        id: id(),
        action: value,
      });
      return;
    }
    if (value === "play" || value === "pause")
      setSnapshot((snap) =>
        snap ? { ...snap, playing: value === "play" } : snap,
      );
    else {
      const items = current.current.cues;
      if (!items.length) return;
      const index =
        value === "reset"
          ? 0
          : clamp(
              cue.current + (value === "next" ? 1 : -1),
              0,
              items.length - 1,
            );
      reader.current?.jump(items[index].lines[0].id);
      if (value === "reset")
        setSnapshot((snap) => (snap ? { ...snap, playing: false } : snap));
    }
  }, []);
  const update = useCallback((patch: Partial<Settings>) => {
    if (!current.current.disconnected && patch.speed != null)
      channel.current?.send({ type: "speed", version: 1, speed: patch.speed });
    else if (!current.current.disconnected)
      channel.current?.send({
        type: "settings",
        version: 1,
        patch: {
          ...(patch.fontSize != null ? { fontSize: patch.fontSize } : {}),
          ...(patch.leftMargin != null ? { leftMargin: patch.leftMargin } : {}),
          ...(patch.rightMargin != null
            ? { rightMargin: patch.rightMargin }
            : {}),
          ...(patch.height != null ? { height: patch.height } : {}),
          ...(patch.guide != null ? { guide: patch.guide } : {}),
          ...(patch.outputClearance != null
            ? { outputClearance: patch.outputClearance }
            : {}),
        },
      });
    setSnapshot((value) =>
      value ? { ...value, settings: { ...value.settings, ...patch } } : value,
    );
  }, []);
  const progress = useCallback(
    (index: number, amount: number, value: Anchor | null) => {
      cue.current = index;
      anchor.current = value;
      if (!current.current.disconnected)
        channel.current?.send({
          type: "progress",
          version: 1,
          cue: index,
          progress: amount,
          anchor: value,
        });
    },
    [],
  );
  const end = useCallback(() => action("pause"), [action]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFallback(false);
        return;
      }
      if (
        !settings.shortcuts ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isTypingTarget(event.target) ||
        (event.key.startsWith("Arrow") && event.target instanceof Element &&
          !!event.target.closest(".width-handle, .height-handle, .guide-handle"))
      )
        return;
      let handled = true;
      if (event.code === "Space") {
        playbackSpacePressed.current = true;
        event.stopPropagation();
        if (!event.repeat) action(snapshot?.playing ? "pause" : "play");
      } else if (event.key === "ArrowDown")
        action("next");
      else if (event.key === "ArrowUp") action("previous");
      else if (event.key === "ArrowLeft")
        update({ fontSize: clamp(settings.fontSize - 2, 18, 96) });
      else if (event.key === "ArrowRight")
        update({ fontSize: clamp(settings.fontSize + 2, 18, 96) });
      else if (event.key.toLowerCase() === "f") {
        if (!event.repeat) reader.current?.fullscreen();
      } else if (event.key === "Home") action("reset");
      else if (event.key === "+" || event.key === "=")
        update({ speed: clamp(settings.speed + 5, 5, 200) });
      else if (event.key === "-")
        update({ speed: clamp(settings.speed - 5, 5, 200) });
      else handled = false;
      if (handled) event.preventDefault();
    };
    function releaseSpace(event: KeyboardEvent) {
      if (event.code !== "Space" || !playbackSpacePressed.current) return;
      playbackSpacePressed.current = false;
      // Non-native controls may activate on keyup after a canceled keydown.
      event.preventDefault();
      event.stopPropagation();
    }
    function resetSpace() {
      playbackSpacePressed.current = false;
    }
    window.addEventListener("keydown", keyboard, true);
    window.addEventListener("keyup", releaseSpace, true);
    window.addEventListener("blur", resetSpace);
    return () => {
      window.removeEventListener("keydown", keyboard, true);
      window.removeEventListener("keyup", releaseSpace, true);
      window.removeEventListener("blur", resetSpace);
    };
  }, [settings, snapshot?.playing, action, update]);
  useEffect(() => {
    if (!snapshot?.playing || !settings.wakeLock || !("wakeLock" in navigator))
      return;
    let lock: WakeLockSentinel | null = null;
    let done = false;
    navigator.wakeLock
      .request("screen")
      .then((value) => {
        if (done) value.release();
        else lock = value;
      })
      .catch(() => {});
    return () => {
      done = true;
      lock?.release();
    };
  }, [snapshot?.playing, settings.wakeLock]);
  return (
    <main className={`presenter-shell ${fallback ? "fallback-reading" : ""}`}>
      {!snapshot ? (
        <div className="reader-empty">
          <h1>{s.app}</h1>
          <p>{disconnected ? s.disconnected : s.waiting}</p>
        </div>
      ) : (
        <Reader
          ref={reader}
          cues={cues}
          settings={settings}
          playing={snapshot.playing}
          output
          bookmarks={snapshot.bookmarks}
          onSettings={update}
          onProgress={progress}
          onEnd={end}
          onPauseForResize={(paused) => action(paused ? "pause" : "play")}
          onFallbackFullscreen={() => setFallback(true)}
          countdown={snapshot.countdown}
        />
      )}
      <div className="presenter-controls">
        <IconButton label={s.previous} onClick={() => action("previous")}>
          <IconPlayerSkipBack />
        </IconButton>
        <IconButton
          label={snapshot?.playing ? s.pause : s.play}
          onClick={() => action(snapshot?.playing ? "pause" : "play")}
        >
          {snapshot?.playing ? (
            <IconPlayerPauseFilled />
          ) : (
            <IconPlayerPlayFilled />
          )}
        </IconButton>
        <IconButton label={s.next} onClick={() => action("next")}>
          <IconPlayerSkipForward />
        </IconButton>
        <IconButton
          label={s.fullscreen}
          onClick={() => reader.current?.fullscreen()}
        >
          <IconMaximize />
        </IconButton>
      </div>
      {disconnected && snapshot && (
        <div className="notice" role="status">
          <span>{s.disconnected}</span>
          <Button
            variant="outline"
            onClick={() => action(snapshot.playing ? "pause" : "play")}
          >
            {snapshot.playing ? s.pause : s.resumeHere}
          </Button>
        </div>
      )}
    </main>
  );
}
