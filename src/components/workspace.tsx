"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import {
  IconBookmark,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
  IconDownload,
  IconFileText,
  IconFilePlus,
  IconHelp,
  IconLayoutColumns,
  IconMaximize,
  IconMoon,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconSettings,
  IconSun,
  IconUpload,
  IconWindowMaximize,
  IconX,
  IconDeviceMobile,
  IconTrash,
  IconArrowBarToUp,
  IconEdit,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SpeedControl } from "@/components/speed-control";
import { ScriptEditor } from "@/components/script-editor";
import { Logo } from "@/components/logo";
import { ContactDialog } from "@/components/contact-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconButton,
  RangeControl,
  Section,
  ToggleControl,
} from "@/components/controls";
import { Reader, type ReaderHandle } from "@/components/reader";
import { s, SAMPLE_SCRIPT } from "@/content/strings.en";
import {
  clamp,
  configSchema,
  defaults,
  download,
  DRAFT_KEY,
  FOCUS_INACTIVE_OPACITY,
  draftSchema,
  id,
  isTypingTarget,
  reconcileLines,
  SETTINGS_KEY,
  settingsSchema,
  toCues,
  type Anchor,
  type Bookmark,
  type Config,
  type ScriptLine,
  type Settings,
} from "@/lib/model";
import { connectChannel, type Action, type Snapshot } from "@/lib/protocol";
import { applyPreviewEdit, type PreviewEdit } from "@/lib/markdown";

type Tab = "script" | "bookmarks";
type RightTab = "settings" | "layout";
type MobileTab = "home" | Tab | RightTab;
export function Workspace() {
  const { resolvedTheme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(defaults);
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [renamingBookmark, setRenamingBookmark] = useState<string | null>(null);
  const [title, setTitle] = useState<string>(s.sampleTitle);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("script");
  const [editing, setEditing] = useState(false);
  const [scriptRevision, setScriptRevision] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("home");
  const [rightTab, setRightTab] = useState<RightTab>("settings");
  const [help, setHelp] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible")
        setTipIndex((index) => (index + 1) % s.tips.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);
  const [clearDialog, setClearDialog] = useState(false);
  const [notice, setNotice] = useState("");
  const [position, setPosition] = useState({ cue: 0, progress: 0 });
  const [readingView, setReadingView] = useState(false);
  const [popupActive, setPopupActive] = useState(false);
  const [popupSession, setPopupSession] = useState<string | null>(null);
  const [pendingConfig, setPendingConfig] = useState<Config | null>(null);
  const [previousConfig, setPreviousConfig] = useState<Config | null>(null);
  const [pendingScript, setPendingScript] = useState<{
    text: string;
    title: string;
  } | null>(null);
  const reader = useRef<ReaderHandle>(null);
  const playbackSpacePressed = useRef(false);
  const anchor = useRef<Anchor | null>(null);
  const popup = useRef<Window | null>(null);
  const channel = useRef<ReturnType<typeof connectChannel> | null>(null);
  const sequence = useRef(0);
  const lastPulse = useRef(0);
  const scriptFile = useRef<HTMLInputElement>(null);
  const configFile = useRef<HTMLInputElement>(null);
  const cueOutline = useRef<HTMLElement>(null);
  const cues = useMemo(() => toCues(lines), [lines]);
  useLayoutEffect(() => {
    if (tab !== "script" || (isMobile && (mobileTab !== "script" || editing)))
      return;
    const current = cueOutline.current?.querySelector<HTMLElement>(
      '[aria-current="step"]',
    );
    const scroller = cueOutline.current?.closest<HTMLElement>(".panel-scroll");
    if (!current || !scroller || !scroller.clientHeight) return;
    const bounds = scroller.getBoundingClientRect();
    const cueBounds = current.getBoundingClientRect();
    const top = bounds.top + scroller.clientTop;
    const bottom = top + scroller.clientHeight;
    // Move only this panel; keep focus, the reader, and mobile navigation intact.
    if (cueBounds.top < top) scroller.scrollTop += cueBounds.top - top;
    else if (cueBounds.bottom > bottom)
      scroller.scrollTop += Math.min(
        cueBounds.bottom - bottom,
        cueBounds.top - top,
      );
  }, [
    position.cue,
    cues,
    tab,
    isMobile,
    mobileTab,
    editing,
    settings.leftCollapsed,
  ]);
  const text = useMemo(
    () => lines.map((line) => line.text).join("\n"),
    [lines],
  );
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const update = useCallback(
    (patch: Partial<Settings>) =>
      setSettings((value) => ({ ...value, ...patch })),
    [],
  );

  useEffect(() => {
    // Local browser data is loaded after hydration, deliberately producing one initial render.
    /* eslint-disable react-hooks/set-state-in-effect */
    const mobile = window.matchMedia("(max-width: 900px)");
    setIsMobile(mobile.matches);
    const resize = () => setIsMobile(mobile.matches);
    mobile.addEventListener("change", resize);
    let restored: Anchor | null = null;
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const envelope = JSON.parse(saved);
        if (envelope.version === 1) {
          const parsed = settingsSchema.safeParse(envelope.settings);
          if (parsed.success)
            setSettings({
              ...parsed.data,
              inactiveOpacity: FOCUS_INACTIVE_OPACITY,
            });
          else setNotice(s.settingsRecovered);
        }
      }
    } catch {
      setNotice(s.settingsRecovered);
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const draft = raw ? draftSchema.safeParse(JSON.parse(raw)) : null;
      if (draft?.success) {
        setLines(draft.data.lines);
        setBookmarks(draft.data.bookmarks);
        setTitle(draft.data.title);
        restored = draft.data.anchor;
      } else setLines(reconcileLines(SAMPLE_SCRIPT));
    } catch {
      setNotice(s.storageError);
      setLines(reconcileLines(SAMPLE_SCRIPT));
    }
    anchor.current = restored;
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const timer = setTimeout(() => reader.current?.restore(restored), 100);
    return () => {
      clearTimeout(timer);
      mobile.removeEventListener("change", resize);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          SETTINGS_KEY,
          JSON.stringify({ version: 1, settings }),
        );
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            version: 1,
            title,
            lines,
            bookmarks,
            anchor: anchor.current,
          }),
        );
      } catch {
        setNotice(s.storageError);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [ready, settings, title, lines, bookmarks, playing]);
  useEffect(() => {
    if (!ready) return;
    const saveAnchor = () => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            version: 1,
            title,
            lines,
            bookmarks,
            anchor: anchor.current,
          }),
        );
      } catch {
        setNotice(s.storageError);
      }
    };
    const timer = setInterval(saveAnchor, 2500);
    window.addEventListener("pagehide", saveAnchor);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", saveAnchor);
    };
  }, [ready, title, lines, bookmarks]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (countdown == null) return;
    const timer = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        setPlaying(true);
      } else setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);
  useEffect(() => {
    if (editing || !ready) return;
    const timer = setTimeout(() => reader.current?.restore(anchor.current), 0);
    return () => clearTimeout(timer);
  }, [editing, ready]);
  const stop = useCallback(() => {
    setPlaying(false);
    setCountdown(null);
  }, []);
  const onProgress = useCallback(
    (cue: number, progress: number, value: Anchor | null) => {
      anchor.current = value;
      setPosition({ cue, progress });
      if (popupActive)
        channel.current?.send({ type: "jump", version: 1, anchor: value });
    },
    [popupActive],
  );
  const onEnd = useCallback(() => {
    setPlaying(false);
    setEnded(true);
  }, []);
  const jump = useCallback(
    (lineId: string) => {
      setEnded(false);
      anchor.current = { lineId, fraction: 0 };
      if (popupActive)
        channel.current?.send({
          type: "jump",
          version: 1,
          anchor: anchor.current,
        });
      if (popupActive) reader.current?.restore(anchor.current, false);
      else reader.current?.jump(lineId);
    },
    [popupActive],
  );
  const action = useCallback(
    (command: Action) => {
      if (command === "pause") {
        stop();
        return;
      }
      if (command === "play") {
        if (!cues.length || editing) return;
        if (ended) jump(cues[0].lines[0].id);
        setEnded(false);
        if (settings.countdown) setCountdown(3);
        else setPlaying(true);
        return;
      }
      if (!cues.length) return;
      if (command === "reset") {
        stop();
        jump(cues[0].lines[0].id);
        return;
      }
      const index = clamp(
        position.cue + (command === "next" ? 1 : -1),
        0,
        cues.length - 1,
      );
      jump(cues[index].lines[0].id);
    },
    [stop, cues, editing, ended, jump, settings.countdown, position.cue],
  );
  const snapshot = useRef<Snapshot | null>(null);
  const currentAction = useRef(action);
  useLayoutEffect(() => {
    snapshot.current = {
      lines,
      bookmarks,
      settings,
      playing,
      countdown,
      anchor: anchor.current,
      theme: resolvedTheme === "light" ? "light" : "dark",
    };
    currentAction.current = action;
  });
  const sendSnapshot = useCallback(() => {
    if (snapshot.current)
      channel.current?.send({
        type: "snapshot",
        version: 1,
        sequence: ++sequence.current,
        snapshot: { ...snapshot.current, anchor: anchor.current },
      });
  }, []);
  useEffect(() => {
    if (!popupSession) return;
    const seen = new Set<string>();
    const connection = connectChannel(
      popupSession,
      (message) => {
        if (message.type === "request") {
          setPopupActive(true);
          lastPulse.current = Date.now();
          sendSnapshot();
        }
        if (message.type === "progress") {
          anchor.current = message.anchor;
          setPosition({ cue: message.cue, progress: message.progress });
          reader.current?.restore(message.anchor, false);
        }
        if (message.type === "command" && !seen.has(message.id)) {
          seen.add(message.id);
          if (seen.size > 500) seen.clear();
          currentAction.current(message.action);
        }
        if (message.type === "speed") update({ speed: message.speed });
        if (message.type === "settings") update(message.patch);
        if (message.type === "pulse" && message.owner === "presenter")
          lastPulse.current = Date.now();
        if (message.type === "goodbye") {
          stop();
          setPopupActive(false);
          setPopupSession(null);
          setNotice(s.popupClosed);
          setTimeout(() => reader.current?.restore(anchor.current), 0);
        }
      },
      popup.current,
    );
    channel.current = connection;
    const timer = setInterval(() => {
      connection.send({ type: "pulse", version: 1, owner: "workspace" });
      if (
        popup.current?.closed ||
        (!popup.current &&
          lastPulse.current > 0 &&
          Date.now() - lastPulse.current > 7000 &&
          document.visibilityState === "visible")
      ) {
        stop();
        setPopupActive(false);
        setPopupSession(null);
        setNotice(s.popupClosed);
        setTimeout(() => reader.current?.restore(anchor.current), 0);
      }
    }, 1000);
    const goodbye = () => connection.send({ type: "goodbye", version: 1 });
    window.addEventListener("pagehide", goodbye);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", goodbye);
      connection.close();
      channel.current = null;
    };
  }, [popupSession, sendSnapshot, update, stop]);
  useEffect(() => {
    if (popupSession) sendSnapshot();
  }, [
    popupSession,
    lines,
    bookmarks,
    settings,
    playing,
    resolvedTheme,
    sendSnapshot,
  ]);
  function openPopup() {
    if (popup.current && !popup.current.closed) {
      popup.current.focus();
      return;
    }
    const session = id();
    const output = window.open(
      `/presenter?session=${session}`,
      `teleprompter-${session}`,
      "popup,width=1000,height=780",
    );
    if (!output) {
      setNotice(s.popupBlocked);
      return;
    }
    anchor.current = reader.current?.getAnchor() ?? anchor.current;
    popup.current = output;
    lastPulse.current = 0;
    setPopupSession(session);
  }
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (contactOpen) return;
      if (event.key === "Escape") {
        setReadingView(false);
        if (isMobile) {
          setMobileTab("home");
          setEditing(false);
        }
        return;
      }
      if (
        !settings.shortcuts ||
        (isMobile && mobileTab !== "home") ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isTypingTarget(event.target) ||
        (event.key.startsWith("Arrow") && event.target instanceof Element &&
          !!event.target.closest(".width-handle, .height-handle, .guide-handle")) ||
        help ||
        pendingConfig ||
        pendingScript ||
        clearDialog
      )
        return;
      let handled = true;
      if (event.code === "Space") {
        playbackSpacePressed.current = true;
        event.stopPropagation();
        if (!event.repeat)
          action(playing || countdown != null ? "pause" : "play");
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
      else if (event.key === "End" && cues.length)
        jump(cues[cues.length - 1].lines[0].id);
      else if (["+", "="].includes(event.key))
        update({ speed: clamp(settings.speed + 5, 5, 200) });
      else if (event.key === "-")
        update({ speed: clamp(settings.speed - 5, 5, 200) });
      else if (event.key === "?") setHelp(true);
      else handled = false;
      if (handled) event.preventDefault();
    }
    function releaseSpace(event: KeyboardEvent) {
      if (event.code !== "Space" || !playbackSpacePressed.current) return;
      playbackSpacePressed.current = false;
      // Non-native switches activate on keyup even after a canceled keydown.
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
  }, [
    settings,
    isMobile,
    mobileTab,
    help,
    contactOpen,
    action,
    playing,
    cues,
    jump,
    update,
    countdown,
    pendingConfig,
    pendingScript,
    clearDialog,
  ]);
  useEffect(() => {
    if (!settings.wakeLock || !playing || popupActive) return;
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;
    const request = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          const result = await navigator.wakeLock.request("screen");
          if (disposed) await result.release();
          else sentinel = result;
        }
      } catch {
        setNotice(s.wakeUnavailable);
      }
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      disposed = true;
      sentinel?.release();
      document.removeEventListener("visibilitychange", request);
    };
  }, [settings.wakeLock, playing, popupActive]);
  const toggleBookmark = useCallback(
    (lineId: string) => {
      const line = lines.find((line) => line.id === lineId);
      if (!line) return;
      setBookmarks((value) =>
        value.some((b) => b.lineId === lineId)
          ? value.filter((b) => b.lineId !== lineId)
          : [
              ...value,
              {
                id: id(),
                lineId,
                excerpt: line.text.slice(0, 100),
                label: line.text.replace(/[#*_~`]/g, "").slice(0, 50),
              },
            ],
      );
    },
    [lines],
  );
  function newScript() {
    stop();
    setLines([]);
    setBookmarks([]);
    setRenamingBookmark(null);
    setTitle("");
    setEnded(false);
    setPosition({ cue: 0, progress: 0 });
    setPendingScript(null);
    anchor.current = null;
    setScriptRevision((revision) => revision + 1);
    setTab("script");
    setMobileTab("script");
    setEditing(true);
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          version: 1,
          title: "",
          lines: [],
          bookmarks: [],
          anchor: null,
        }),
      );
    } catch {
      setNotice(s.storageError);
    }
  }
  function trySample() {
    stop();
    setLines(reconcileLines(SAMPLE_SCRIPT));
    setBookmarks([]);
    setRenamingBookmark(null);
    setTitle(s.sampleTitle);
    setEnded(false);
    setPosition({ cue: 0, progress: 0 });
    anchor.current = null;
  }
  function editText(value: string) {
    stop();
    setLines((previous) => reconcileLines(value, previous));
  }
  const editPreview = useCallback((edit: PreviewEdit) => {
    setLines((previous) => applyPreviewEdit(previous, edit));
  }, []);
  async function importScript(file?: File) {
    if (!file) return;
    try {
      if (!/\.(md|txt)$/i.test(file.name) || file.size > 1024 * 1024)
        throw new Error();
      const content = await file.text();
      if (content.includes("\0")) throw new Error();
      stop();
      setPendingScript({
        text: content,
        title: file.name.replace(/\.(md|txt)$/i, "").slice(0, 200),
      });
    } catch {
      setNotice(s.importError);
    }
  }
  async function importConfig(file?: File) {
    if (!file) return;
    try {
      if (file.size > 100_000) throw new Error();
      const parsed = configSchema.parse(JSON.parse(await file.text()));
      stop();
      setPendingConfig(parsed);
    } catch {
      setNotice(s.configError);
    }
  }
  function exportConfig() {
    download(
      s.fileConfig,
      JSON.stringify(
        {
          app: "teleprompter-pro",
          version: 1,
          settings,
          theme: resolvedTheme === "light" ? "light" : "dark",
        },
        null,
        2,
      ),
      "application/json",
    );
  }
  function applyConfig() {
    if (!pendingConfig) return;
    setPreviousConfig({
      app: "teleprompter-pro",
      version: 1,
      settings,
      theme: resolvedTheme === "light" ? "light" : "dark",
    });
    setSettings({
      ...pendingConfig.settings,
      inactiveOpacity: FOCUS_INACTIVE_OPACITY,
    });
    setTheme(pendingConfig.theme);
    setPendingConfig(null);
    setNotice(s.configApplied);
  }
  function preset(value: string) {
    if (value === "phone")
      update({
        leftMargin: 25,
        rightMargin: 25,
        height: 60,
        linked: true,
        outputClearance: true,
        leftCollapsed: false,
        rightCollapsed: false,
      });
    if (value === "wide")
      update({
        leftMargin: 8,
        rightMargin: 8,
        height: 100,
        linked: true,
        outputClearance: false,
        leftCollapsed: false,
        rightCollapsed: false,
      });
    if (value === "clean")
      update({
        leftMargin: 20,
        rightMargin: 20,
        height: 100,
        linked: true,
        outputClearance: false,
        leftCollapsed: true,
        rightCollapsed: true,
      });
  }
  const sortedBookmarks = useMemo(
    () =>
      [...bookmarks].sort((a, b) => {
        const ia = lines.findIndex((l) => l.id === a.lineId),
          ib = lines.findIndex((l) => l.id === b.lineId);
        return (ia < 0 ? Infinity : ia) - (ib < 0 ? Infinity : ib);
      }),
    [bookmarks, lines],
  );
  async function exitReading() {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        setNotice(s.fullscreenExitError);
        return false;
      }
    }
    setReadingView(false);
    return true;
  }
  async function chooseMobileTab(value: MobileTab) {
    if (document.fullscreenElement || readingView) {
      if (!(await exitReading())) return;
    }
    if (value !== "home") stop();
    if (value !== "script") setEditing(false);
    setMobileTab(value);
    if (value === "script" || value === "bookmarks") setTab(value);
    if (value === "settings" || value === "layout") setRightTab(value);
  }
  async function openEditor() {
    stop();
    if (document.fullscreenElement && !(await exitReading())) return;
    setReadingView(false);
    anchor.current = reader.current?.getAnchor() ?? anchor.current;
    setTab("script");
    setMobileTab("script");
    setEditing(true);
  }
  function saveScript() {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ version: 1, title, lines, bookmarks, anchor: anchor.current }),
      );
      setEditing(false);
    } catch {
      setNotice(s.storageError);
    }
  }
  const editorActions = {
    onDownload: () => download(s.fileScript, text, "text/markdown"),
    onUpload: () => scriptFile.current?.click(),
    onUseSample: trySample,
    onNew: newScript,
    onDone: saveScript,
  };
  const transportControls = (fullscreen: boolean) => (
    <div className="transport-main">
      <IconButton
        label={s.reset}
        onClick={() => action("reset")}
        disabled={!cues.length}
      >
        <IconArrowBarToUp size={18} />
      </IconButton>
      <IconButton
        label={s.previous}
        onClick={() => action("previous")}
        disabled={!cues.length}
      >
        <IconPlayerSkipBack size={18} />
      </IconButton>
      <Button
        className="play-button"
        aria-label={playing || countdown != null ? s.pause : s.play}
        onClick={() => action(playing || countdown != null ? "pause" : "play")}
        disabled={!cues.length || editing}
      >
        {playing || countdown != null ? (
          <IconPlayerPauseFilled size={19} />
        ) : (
          <IconPlayerPlayFilled size={19} />
        )}
        <span>{playing || countdown != null ? s.pause : s.play}</span>
        <kbd>Space</kbd>
      </Button>
      <IconButton
        label={s.next}
        onClick={() => action("next")}
        disabled={!cues.length}
      >
        <IconPlayerSkipForward size={18} />
      </IconButton>
      <SpeedControl
        speed={settings.speed}
        onChange={(speed) => update({ speed })}
      />
      {!fullscreen && (
        <Button
          variant="ghost"
          aria-label={s.popup}
          onClick={openPopup}
          className="popup-button footer-action ml-auto"
          disabled={editing}
        >
          <IconWindowMaximize size={18} />
          <span>{s.popup}</span>
        </Button>
      )}
      <Button
        variant="ghost"
        aria-label={fullscreen ? s.exitFullscreen : s.fullscreen}
        onClick={() =>
          fullscreen ? void exitReading() : reader.current?.fullscreen()
        }
        className="footer-action"
        disabled={editing}
      >
        <IconMaximize size={18} />
        <span>{fullscreen ? s.exitFullscreen : s.fullscreen}</span>
      </Button>
    </div>
  );
  const mobileNavigation = (
    <nav className="mobile-navigation" aria-label={s.mobileNavigation}>
      {(
        [
          ["home", s.home, IconHome],
          ["script", s.script, IconFileText],
          ["settings", s.settings, IconSettings],
          ["bookmarks", s.bookmarkTab, IconBookmark],
          ["layout", s.layout, IconLayoutColumns],
        ] as const
      ).map(([value, label, Icon]) => (
        <button
          key={value}
          aria-current={mobileTab === value ? "page" : undefined}
          onClick={() => void chooseMobileTab(value)}
        >
          <Icon size={21} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
  if (!ready)
    return (
      <div className="workspace-loading" aria-busy="true">
        <Logo size={36} />
        <span>{s.app}</span>
      </div>
    );
  return (
    <main
      className="app-shell"
      data-mobile-tab={mobileTab}
      style={
        {
          "--left-width": settings.leftCollapsed ? "48px" : "240px",
          "--right-width": settings.rightCollapsed ? "48px" : "260px",
        } as React.CSSProperties
      }
    >
      <div className="workspace-grid">
        <Sidebar
          side="left"
          mobileOpen={mobileTab === "script" || mobileTab === "bookmarks"}
          mobileTitle={mobileTab === "bookmarks" ? s.bookmarkTab : s.script}
          title={s.app}
          tabs={
            <div className="panel-tabs">
              {(["script", "bookmarks"] as Tab[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  aria-pressed={tab === value}
                  className={tab === value ? "selected" : ""}
                >
                  {s[value]}
                </button>
              ))}
            </div>
          }
          header={
            <div className="brand">
              <Logo size={21} />
              <span>{s.app}</span>
            </div>
          }
          collapsed={settings.leftCollapsed}
          onCollapse={() => update({ leftCollapsed: !settings.leftCollapsed })}
          rail={
            <>
              <IconButton
                label={s.script}
                active={tab === "script"}
                onClick={() => setTab("script")}
              >
                <IconFileText />
              </IconButton>
              <IconButton
                label={s.bookmarks}
                active={tab === "bookmarks"}
                onClick={() => setTab("bookmarks")}
              >
                <IconBookmark />
              </IconButton>
            </>
          }
        >
          {tab === "script" && editing && isMobile ? (
            <ScriptEditor
              key={scriptRevision}
              value={text}
              onChange={editText}
              {...editorActions}
            />
          ) : (
            tab === "script" && (
              <>
                <div className="px-4 pt-4 pb-2">
                  <Button
                    className="mb-2 w-full gap-2"
                    variant="outline"
                    onClick={newScript}
                  >
                    <IconFilePlus size={16} />
                    {s.newScript}
                  </Button>
                  <Button
                    className="w-full gap-2"
                    variant={"outline"}
                    onClick={editing ? saveScript : openEditor}
                  >
                    <IconEdit size={16} />
                    {editing ? s.done : s.editor}
                  </Button>
                  <div className="mt-3 flex items-center gap-1">
                    <IconButton
                      label={s.importScript}
                      className="size-8"
                      onClick={() => scriptFile.current?.click()}
                    >
                      <IconUpload size={16} />
                    </IconButton>
                    <IconButton
                      label={s.exportScript}
                      className="size-8"
                      onClick={() =>
                        download(s.fileScript, text, "text/markdown")
                      }
                    >
                      <IconDownload size={16} />
                    </IconButton>
                    <p className="ml-1 text-xs text-muted-foreground tabular-nums">
                      {s.words(words)} · {s.cues(cues.length)}
                    </p>
                  </div>
                </div>
                <nav
                  ref={cueOutline}
                  className="cue-outline"
                  aria-label={s.script}
                >
                  {cues.map((cue, index) => (
                    <button
                      key={cue.id}
                      onClick={() => {
                        jump(cue.lines[0].id);
                        if (isMobile) setMobileTab("home");
                      }}
                      aria-current={position.cue === index ? "step" : undefined}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{cue.markdown.replace(/[#*_~`]/g, "").slice(0, 90)}</p>
                    </button>
                  ))}
                </nav>
                <div className="mt-auto border-t p-4">
                  <p className="text-[11px] text-muted-foreground">
                    {s.importHint}
                  </p>
                </div>
              </>
            )
          )}
          {tab === "bookmarks" && (
            <div className="p-4">
              {!bookmarks.length ? (
                <div className="panel-empty">
                  <IconBookmark size={25} />
                  <p>{s.bookmarkEmpty}</p>
                  <span>{s.bookmarkHint}</span>
                </div>
              ) : (
                sortedBookmarks.map((bookmark) => {
                  const valid = lines.some((l) => l.id === bookmark.lineId);
                  return (
                    <div key={bookmark.id} className="bookmark-row">
                      <button
                        type="button"
                        disabled={!valid || renamingBookmark === bookmark.id}
                        aria-label={bookmark.label.trim() || bookmark.excerpt}
                        onClick={() => {
                          jump(bookmark.lineId);
                          if (isMobile) setMobileTab("home");
                        }}
                        className="bookmark-jump"
                      >
                        <IconBookmark size={16} aria-hidden="true" />
                        <span className="bookmark-copy">
                          <span className="bookmark-label">
                            {bookmark.label.trim() || bookmark.excerpt}
                          </span>
                          {!valid && (
                            <span className="bookmark-status">
                              {s.unresolved}
                            </span>
                          )}
                        </span>
                      </button>
                      {renamingBookmark === bookmark.id && (
                        <Input
                          className="bookmark-rename"
                          autoFocus
                          onBlur={() => setRenamingBookmark(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") {
                              e.stopPropagation();
                              setRenamingBookmark(null);
                              e.currentTarget
                                .closest(".bookmark-row")
                                ?.querySelector<HTMLButtonElement>(
                                  ".bookmark-actions button",
                                )
                                ?.focus();
                            }
                          }}
                          aria-label={s.bookmarkName}
                          value={bookmark.label}
                          maxLength={100}
                          onChange={(e) =>
                            setBookmarks((value) =>
                              value.map((b) =>
                                b.id === bookmark.id
                                  ? { ...b, label: e.target.value }
                                  : b,
                              ),
                            )
                          }
                        />
                      )}
                      <div className="bookmark-actions">
                        <IconButton
                          label={s.renameBookmark}
                          onClick={() => setRenamingBookmark(bookmark.id)}
                        >
                          <IconEdit size={16} />
                        </IconButton>
                        {!valid && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              if (anchor.current)
                                setBookmarks((value) =>
                                  value.map((b) =>
                                    b.id === bookmark.id
                                      ? {
                                          ...b,
                                          lineId: anchor.current!.lineId,
                                          excerpt:
                                            lines
                                              .find(
                                                (l) =>
                                                  l.id ===
                                                  anchor.current!.lineId,
                                              )
                                              ?.text.slice(0, 100) ?? b.excerpt,
                                        }
                                      : b,
                                  ),
                                );
                            }}
                          >
                            {s.reassign}
                          </Button>
                        )}
                        <IconButton
                          label={s.removeBookmark}
                          className="bookmark-delete"
                          onClick={() =>
                            setBookmarks((value) =>
                              value.filter((b) => b.id !== bookmark.id),
                            )
                          }
                        >
                          <IconTrash size={16} />
                        </IconButton>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </Sidebar>
        <section
          className="center-workspace"
          inert={isMobile && mobileTab !== "home"}
        >
          <div className={readingView ? "fallback-reading" : "stage-wrap"}>
            {editing && !isMobile ? (
              <ScriptEditor
                key={scriptRevision}
                value={text}
                onChange={editText}
                {...editorActions}
              />
            ) : (
              <Reader
                key={scriptRevision}
                ref={reader}
                cues={cues}
                settings={settings}
                playing={playing}
                active={!popupActive}
                output={readingView}
                bookmarks={sortedBookmarks}
                onEditScript={openEditor}
                onPreviewEdit={editPreview}
                onExitFullscreen={exitReading}
                onTrySample={trySample}
                onBookmark={toggleBookmark}
                onSettings={update}
                onProgress={onProgress}
                onEnd={onEnd}
                onPauseForResize={(value) => setPlaying(!value)}
                onFallbackFullscreen={() => setReadingView(true)}
                countdown={countdown}
                fullscreenControls={
                  isMobile ? (
                    <div className="mobile-fullscreen-controls">
                      {transportControls(true)}
                      {mobileNavigation}
                    </div>
                  ) : undefined
                }
              />
            )}
          </div>
          <footer className="transport">
            {transportControls(false)}
          </footer>
        </section>
        <Sidebar
          side="right"
          mobileOpen={mobileTab === "settings" || mobileTab === "layout"}
          mobileTitle={mobileTab === "layout" ? s.layout : s.settings}
          tabs={
            <div className="panel-tabs">
              {(["settings", "layout"] as RightTab[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setRightTab(value)}
                  aria-pressed={rightTab === value}
                  className={rightTab === value ? "selected" : ""}
                >
                  {s[value]}
                </button>
              ))}
            </div>
          }
          title={""}
          actions={
            <>
              <ContactDialog icon onOpenChange={setContactOpen} />
              <IconButton
                label={s.help}
                className="size-8"
                onClick={() => setHelp(true)}
              >
                <IconHelp size={17} />
              </IconButton>
              <IconButton
                label={s.theme}
                className="size-8"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                {resolvedTheme === "dark" ? (
                  <IconSun size={17} />
                ) : (
                  <IconMoon size={17} />
                )}
              </IconButton>
            </>
          }
          collapsed={settings.rightCollapsed}
          onCollapse={() =>
            update({ rightCollapsed: !settings.rightCollapsed })
          }
          rail={
            <>
              <IconButton
                label={s.settings}
                active={rightTab === "settings"}
                onClick={() => setRightTab("settings")}
              >
                <IconSettings />
              </IconButton>
              <IconButton
                label={s.layout}
                active={rightTab === "layout"}
                onClick={() => setRightTab("layout")}
              >
                <IconLayoutColumns />
              </IconButton>
            </>
          }
        >
          {rightTab === "settings" && (
            <>
              <Section title={s.typography}>
                <label
                  className="block text-xs text-muted-foreground"
                  htmlFor="font-select"
                >
                  {s.font}
                </label>
                <select
                  id="font-select"
                  value={settings.font}
                  onChange={(e) =>
                    update({ font: e.target.value as Settings["font"] })
                  }
                  className="native-select"
                >
                  {Object.entries(s.fonts).map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <RangeControl
                  label={s.fontSize}
                  value={settings.fontSize}
                  min={18}
                  max={96}
                  unit={s.px}
                  onChange={(v) => update({ fontSize: v })}
                />
                <RangeControl
                  label={s.lineHeight}
                  value={settings.lineHeight}
                  min={1.1}
                  max={2.2}
                  step={0.05}
                  onChange={(v) => update({ lineHeight: v })}
                />
                <RangeControl
                  label={s.speed}
                  value={settings.speed}
                  min={5}
                  max={200}
                  unit={s.speedUnit}
                  onChange={(v) => update({ speed: v })}
                />
              </Section>
              <Section title={s.output}>
                <ToggleControl
                  label={s.mirror}
                  value={settings.mirror}
                  onChange={(v) => update({ mirror: v })}
                />
                <ToggleControl
                  label={s.outputBookmarks}
                  value={settings.outputBookmarks}
                  onChange={(v) => update({ outputBookmarks: v })}
                />
                <ToggleControl
                  label={s.preserveClearance}
                  value={settings.outputClearance}
                  onChange={(v) => update({ outputClearance: v })}
                />

                <ToggleControl
                  label={s.focus}
                  value={settings.focus}
                  onChange={(v) => update({ focus: v })}
                />
                <ToggleControl
                  label={s.guide}
                  value={settings.showGuide}
                  onChange={(v) => update({ showGuide: v })}
                />
                <ToggleControl
                  label={s.countdownLabel}
                  value={settings.countdown}
                  onChange={(v) => update({ countdown: v })}
                />
                <ToggleControl
                  label={s.wakeLock}
                  value={settings.wakeLock}
                  onChange={(v) => {
                    if (v && !("wakeLock" in navigator))
                      setNotice(s.wakeUnavailable);
                    else update({ wakeLock: v });
                  }}
                />
              </Section>
              <Section title={s.tip}>
                <p className="settings-tip">{s.tips[tipIndex]}</p>
              </Section>
            </>
          )}
          {rightTab === "layout" && (
            <>
              <div className="layout-presets">
                <Section title={s.preset}>
                  <div className="space-y-2">
                    {Object.entries(s.presets).map(([key, label]) => (
                      <Button
                        key={key}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => preset(key)}
                      >
                        {key === "phone" ? (
                          <IconDeviceMobile />
                        ) : (
                          <IconLayoutColumns />
                        )}
                        {label}
                      </Button>
                    ))}
                  </div>
                </Section>
              </div>
              <div className="layout-actions space-y-2 p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => configFile.current?.click()}
                >
                  <IconUpload />
                  {s.importConfig}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={exportConfig}
                >
                  <IconDownload />
                  {s.exportConfig}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => {
                    stop();
                    setClearDialog(true);
                  }}
                >
                  <IconTrash />
                  {s.confirmClear}
                </Button>
              </div>
            </>
          )}
        </Sidebar>
      </div>
      {mobileNavigation}
      <input
        ref={scriptFile}
        type="file"
        accept=".md,.txt,text/plain,text/markdown"
        hidden
        onChange={(e) => {
          importScript(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={configFile}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          importConfig(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          {previousConfig && notice === s.configApplied && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setSettings(previousConfig.settings);
                setTheme(previousConfig.theme);
                setPreviousConfig(null);
                setNotice("");
              }}
            >
              {s.undo}
            </Button>
          )}
          <IconButton label={s.close} onClick={() => setNotice("")}>
            <IconX size={15} />
          </IconButton>
        </div>
      )}
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="shortcuts-dialog sm:max-w-md">
          <div className="shortcut-heading">
            <DialogTitle>{s.help}</DialogTitle>
            <Switch
              aria-label={s.enableShortcuts}
              checked={settings.shortcuts}
              onCheckedChange={(value) => update({ shortcuts: value })}
            />
          </div>
          <dl className="shortcut-list">
            {(
              [
                [s.keys.play, ["Space"]],
                [s.previousCue, ["↑"]],
                [s.nextCue, ["↓"]],
                [s.keys.fontSize, ["←", "→"]],
                [s.keys.fullscreen, ["F"]],
                [s.keys.speed, ["+", "−"]],
                [s.keys.reset, ["Home"]],
                [s.keys.end, ["End"]],
                [s.keys.escape, ["Esc"]],
                [s.showShortcuts, ["?"]],
              ] as const
            ).map(([label, keys]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className="shortcut-keycaps">
                  {keys.map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <section className="shortcut-mouse" aria-label={s.pointerControls}>
            <h3>{s.pointerControls}</h3>
            <ul>
              {[s.keys.wheel, s.keys.middle].map(
                (label) => (
                  <li key={label}>{label}</li>
                ),
              )}
            </ul>
          </section>
          <p className="shortcut-context">{s.shortcutContext}</p>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!pendingConfig}
        onOpenChange={(open) => {
          if (!open) setPendingConfig(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{s.configTitle}</DialogTitle>
          <DialogDescription>{s.configHint}</DialogDescription>
          {pendingConfig && (
            <p className="text-sm text-muted-foreground">
              {s.fontSize}: {pendingConfig.settings.fontSize}
              {s.px}
              <br />
              {s.height}: {pendingConfig.settings.height}%<br />
              {s.speed}: {pendingConfig.settings.speed} {s.speedUnit}
              <br />
              {pendingConfig.theme === "dark" ? s.dark : s.light}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingConfig(null)}>
              {s.cancel}
            </Button>
            <Button onClick={applyConfig}>{s.apply}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!pendingScript}
        onOpenChange={(open) => {
          if (!open) setPendingScript(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{s.scriptImportTitle}</DialogTitle>
          <DialogDescription>{s.scriptImportHint}</DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => download(s.fileScript, text, "text/markdown")}
            >
              {s.exportScript}
            </Button>
            <Button
              onClick={() => {
                if (pendingScript) {
                  editText(pendingScript.text);
                  setTitle(pendingScript.title);
                  setPendingScript(null);
                  setEnded(false);
                  anchor.current = null;
                }
              }}
            >
              {s.replace}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={clearDialog} onOpenChange={setClearDialog}>
        <DialogContent>
          <DialogTitle>{s.clearTitle}</DialogTitle>
          <DialogDescription>{s.clearHint}</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialog(false)}>
              {s.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                stop();
                setLines([]);
                setBookmarks([]);
                setTitle("");
                setSettings(defaults);
                anchor.current = null;
                setTheme("dark");
                setClearDialog(false);
              }}
            >
              {s.clear}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Sidebar({
  side,
  mobileOpen,
  mobileTitle,
  title,
  header,
  actions,
  tabs,
  collapsed,
  onCollapse,
  rail,
  children,
}: {
  side: "left" | "right";
  mobileOpen: boolean;
  mobileTitle: string;
  title: string;
  header?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  collapsed: boolean;
  onCollapse: () => void;
  rail: ReactNode;
  children: ReactNode;
}) {
  const sidebar = useRef<HTMLElement>(null);
  const suppressFocus = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function enter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setRevealed(true);
  }
  function leave() {
    closeTimer.current = setTimeout(() => {
      if (!sidebar.current?.contains(document.activeElement))
        setRevealed(false);
    }, 250);
  }
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
  return (
    <aside
      ref={sidebar}
      className={`sidebar sidebar-${side} ${mobileOpen ? "mobile-open" : ""} ${collapsed ? "is-collapsed" : ""} ${revealed ? "is-revealed" : ""}`}
      onMouseEnter={() => {
        if (window.matchMedia("(min-width: 901px)").matches) enter();
      }}
      onMouseLeave={leave}
      onFocus={() => {
        if (
          window.matchMedia("(min-width: 901px)").matches &&
          !suppressFocus.current
        )
          enter();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) leave();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          setRevealed(false);
          suppressFocus.current = true;
          e.currentTarget
            .querySelector<HTMLButtonElement>(".rail-toggle")
            ?.focus();
          suppressFocus.current = false;
        }
      }}
    >
      <div
        className="sidebar-rail"
        onClick={(e) => {
          if (
            !(e.target instanceof Element && e.target.closest(".rail-toggle"))
          )
            enter();
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="rail-toggle"
          aria-label={side === "left" ? s.expandLeft : s.expandRight}
          onClick={() => {
            if (window.matchMedia("(max-width: 900px)").matches)
              setRevealed(!revealed);
            else onCollapse();
          }}
        >
          {side === "left" ? (
            <IconLayoutSidebarRightCollapse size={19} />
          ) : (
            <IconLayoutSidebarLeftCollapse size={19} />
          )}
        </Button>
        {rail}
      </div>
      <div className="sidebar-body">
        <div className="panel-header">
          <div className="desktop-panel-heading">
            {header ?? <h2>{title}</h2>}
          </div>
          <h2 className="mobile-panel-heading">{mobileTitle}</h2>
          <div className="panel-actions">
            {actions}
            <IconButton
              className="panel-toggle"
              label={
                side === "left"
                  ? collapsed && !revealed
                    ? s.expandLeft
                    : s.collapseLeft
                  : collapsed && !revealed
                    ? s.expandRight
                    : s.collapseRight
              }
              onClick={() => {
                if (window.matchMedia("(max-width: 900px)").matches)
                  setRevealed(false);
                else {
                  onCollapse();
                  setRevealed(false);
                }
              }}
            >
              {(side === "left") !== (collapsed && !revealed) ? (
                <IconLayoutSidebarLeftCollapse size={19} />
              ) : (
                <IconLayoutSidebarRightCollapse size={19} />
              )}
            </IconButton>
          </div>
        </div>
        {tabs}
        <div className="panel-scroll">{children}</div>
      </div>
    </aside>
  );
}
