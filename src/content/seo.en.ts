export type GuideSection = {
  heading: string;
  paragraphs: readonly string[];
  steps?: readonly string[];
  code?: string;
};
export type Guide = {
  path: string;
  label: string;
  title: string;
  description: string;
  heading: string;
  introduction: string;
  sections: readonly GuideSection[];
  related: readonly string[];
};

export const seo = {
  name: "Teleprompter Lite",
  title: "Online Teleprompter for Creators | Teleprompter Lite",
  description:
    "Read scripts in your browser with adjustable scrolling, bookmarks, mirror mode and a popup reader. Fit the text around your laptop-and-phone setup.",
  heading: "An online teleprompter for your next take",
  introduction:
    "Paste your script, set a comfortable scrolling speed, and read while recording with your own camera or phone. Teleprompter Lite lets you adjust the reading width and height, bookmark passages, and open a separate reader window. Your current draft and preferences save in this browser.",
  about: "About this teleprompter",
  open: "Open the teleprompter",
  quickStart: "Read the quick-start guide",
  navigation: "Teleprompter guides",
  breadcrumb: "Breadcrumb",
  onThisPage: "On this page",
  related: "Continue reading",
  back: "Use the teleprompter",
  geometryHeading: "Fit your script around your recording setup",
  geometry:
    "Adjust the side margins to keep lines close to your camera lens. Change the reading height to reserve space for a phone in front of your screen. The reserved area is empty space for your setup, not a camera preview.",
  controlsHeading: "Keep control of your next take",
  features: [
    {
      heading: "Set your reading pace",
      text: "Change the scrolling speed while reading, pause at any point, and jump between paragraph cues. Font size, line spacing, a reading guide and focus mode help you shape a comfortable reading surface.",
      path: "/docs/getting-started",
      link: "Learn the reading controls",
    },
    {
      heading: "Return to the right passage",
      text: "Bookmark script lines, give them useful labels, and jump back for a retake. If editing removes or changes a bookmarked line, you can reassign the bookmark instead of guessing where it moved.",
      path: "/docs/scripts-and-bookmarks",
      link: "Prepare scripts and bookmarks",
    },
    {
      heading: "Choose your output",
      text: "Read in fullscreen, mirror the text for reflective teleprompter glass, or open a synchronized popup reader on the same computer. You can move the popup to a second monitor.",
      path: "/docs/popup-reader",
      link: "Use a popup reader",
    },
  ],
  stepsHeading: "Prepare a script in three steps",
  steps: [
    "Open Edit script and paste or write your words.",
    "Choose Save, then adjust text size, reading width and scrolling speed.",
    "Press Play when ready. Record with your separate camera or phone.",
  ],
  audiencesHeading: "Made for videos, rehearsals and presentations",
  audiences:
    "Prepare a YouTube introduction, rehearse a training video, or read a presentation script. Use short paragraphs as cues and bookmarks for sections you expect to repeat.",
  storageHeading: "Your draft stays in this browser",
  storage:
    "This version saves one current script, bookmarks and preferences in browser storage. Export your script and configuration to keep backups. Clearing browser data can remove your saved work; there is no account or cloud script library.",
  faqHeading: "Questions before your first take",
  share: {
    title: "Your script. Your pace.",
    description: "A browser teleprompter for your next take.",
    features: "Adjustable scrolling · Bookmarks · Mirror mode · Popup reader",
    alt: "Teleprompter Lite — browser teleprompter",
  },
  presenter: {
    title: "Reader Output | Teleprompter Lite",
    description:
      "A synchronized reading window controlled by your Teleprompter Lite workspace on this device.",
  },
  editor: {
    title: "Teleprompter Editor | Teleprompter Lite",
    description:
      "Prepare your script, adjust your reading layout and control your next take in the Teleprompter Lite editor.",
  },
  blog: {
    label: "Blog",
    title: "Teleprompter Tips and Script Writing | Teleprompter Lite",
    description:
      "Practical guides to writing spoken scripts, choosing a scrolling pace and preparing retakes with a browser teleprompter.",
    heading: "A little preparation. A better next take.",
    introduction:
      "Practical notes for the work around the reader: shaping your words, finding your pace, and making the next retake easier.",
    read: "Read article",
  },
} as const;

export const landingMedia: {
  editorScreenshot: { src: string; width: number; height: number } | null;
} = {
  editorScreenshot: {
    src: "/images/teleprompter-lite-demo.gif",
    width: 800,
    height: 450,
  },
};

export const landing = {
  screenshotAlt: "Teleprompter Lite editor with script and reading controls",
  editorPreview: "Your reading workspace",
  previewTitle: "A little space. A clearer delivery.",
  previewStatus: "Reading preview",
  setupTitle: "Your laptop. Your phone.\nA setup that feels like you.",
  setupText:
    "Keep the script near your lens, with space below for your recording phone. Adjust the reading area around your setup, instead of adjusting yourself around the screen.",
  setupAlt:
    "Laptop reading column aligned above a phone camera, with reserved space below the script",
  benefits: [
    "Adjustable reading area",
    "Keyboard playback controls",
    "Saved in your browser",
  ],
  workflow: ["Bring your words", "Find your pace", "Make your next take"],
  workflowText: [
    "Paste, write or import a Markdown script.",
    "Set your reading layout and scrolling speed.",
    "Press play. Record with your own camera.",
  ],
  bookmarkSample: ["Opening", "The main idea", "One more thing"],
  sampleLabel: "Example script",
  outputLabel: "Workspace → Popup reader",
  localLabel: "A workspace without the sign-up.",
  localLink: "Learn about saving and exports",
  articleImages: [
    "/images/script.svg",
    "/images/pace.svg",
    "/images/retake.svg",
  ],
  footerText: "A little preparation. A better next take.",
  heading: "Your script.\nYour pace.\nYour next take.",
  introduction:
    "An online teleprompter that fits the way you record. Keep your words close to the lens, find a comfortable pace, and leave room for your phone.",
  open: "Open the editor",
  setup: "See the setup guide",
  facts: "Free. Private. No account needed. Data stays in your browser.",
  navigation: "Main navigation",
  home: "Home",
  skip: "Skip to content",
  features: "How it works",
  guides: "Getting started",
  faq: "Questions",
  guideHeading: "Make room for your next take",
  guideIntroduction:
    "Start with the setup, then shape the script and pace to match your delivery.",
  closeHeading: "Ready when you are.",
  closeText: "Bring your words. Set your pace. Press play.",
} as const;

export const faqs = [
  {
    question: "What is Teleprompter Lite?",
    answer:
      "Teleprompter Lite is a browser teleprompter that scrolls a prepared script while you speak. You can change the reading speed, adjust the text layout, bookmark passages, and use fullscreen, mirrored text or a separate popup reader. Record with your own camera or phone; the app does not record video.",
  },
  {
    question: "Do I need an account or a download?",
    answer:
      "The current version runs in your browser without an account. Open the workspace, paste or import your script, and choose your reading settings. It does not require installing a desktop application.",
  },
  {
    question: "Where are my script and settings saved?",
    answer:
      "The app saves one current draft, bookmarks and preferences in this browser's local storage. It does not upload your script to a script-storage service. Export your Markdown script and configuration JSON for backups. Clearing browser data or using a different browser or device can make the saved draft unavailable.",
  },
  {
    question: "Can I use it while recording on my phone?",
    answer:
      "Yes. Open the teleprompter on your laptop, place your recording phone in front of the screen, and adjust the reading width and height around the lens. Phone mode reserves empty space below the text. Recording happens on your phone, separately from the teleprompter.",
    path: "/guides/laptop-phone-setup",
    link: "Set up a laptop and phone",
  },
  {
    question: "What does mirror mode do?",
    answer:
      "Mirror mode flips the script horizontally for reflective teleprompter glass. Leave it off when reading directly from a normal screen. It changes the displayed text, not your camera image or saved script.",
    path: "/features/mirror-mode",
    link: "Use mirror mode with teleprompter glass",
  },
  {
    question: "Can the popup reader run on another device?",
    answer:
      "The popup reader synchronizes with the workspace in a separate browser window on the same computer. Move that window to a second monitor if you use one. This version does not connect to a separate phone, tablet or computer as a remote reader.",
    path: "/docs/popup-reader",
    link: "Popup reader troubleshooting",
  },
] as const;

export const guides: readonly Guide[] = [
  {
    path: "/docs/getting-started",
    label: "Getting started",
    title: "How to Use Teleprompter Lite | Quick Start",
    description:
      "Paste a script, adjust your reading layout and control playback. Learn saving, shortcuts and browser limits in Teleprompter Lite.",
    heading: "Get started with Teleprompter Lite",
    introduction:
      "Start with a short script and a comfortable layout. Open Edit script, paste your words and choose Save. Adjust the reading column before pressing Play, and record separately with your camera or phone.",
    sections: [
      {
        heading: "Prepare your script",
        paragraphs: [
          "Open Edit script to paste or write your words, then choose Save to return to reading. The formatting toolbar can emphasize selected text or format the current line when nothing is selected.",
          "Import a plain-text .txt or Markdown .md file up to 1 MiB. The app keeps one current draft; replacing it is not the same as adding a script to a library.",
        ],
        steps: seo.steps,
      },
      {
        heading: "Set up your reading surface",
        paragraphs: [
          "Use the side handles to adjust the reading width and the lower divider to change reading height. Enable Phone mode when you need empty space for a physical phone below the text. Handles also support arrow-key adjustments.",
          "Choose a font, text size and line spacing that you can read comfortably at your recording distance. A reading guide marks a position in the column; focus mode brings the current paragraph forward by dimming the others. Rehearse before committing to a layout.",
        ],
      },
      {
        heading: "Start and control a take",
        paragraphs: [
          "Press Play when ready, or focus the reading surface and press Space. If the three-second countdown is enabled, playback begins after it finishes. Pause to reset or return to a paragraph cue.",
          "The slower and faster transport buttons change speed in 5 px/s steps, from 5 to 200 px/s. The multiplier uses a 20 px/s base: 1× is 20 px/s. Typography changes how this pace feels; the app does not follow your voice.",
          "Mouse-wheel input over the reader scrolls the script whether playing or paused. Ctrl/Meta-wheel preserves browser zoom.",
          "With shortcuts enabled and the reader focused, use Up/Down for previous/next paragraph, Left/Right to decrease/increase font size, + or − for speed, F for fullscreen, Home for the start, and End for the last cue. Shortcuts do not override typing in inputs or open dialogs. Open Keyboard shortcuts for the full list.",
          "Fullscreen removes surrounding controls. If native fullscreen is unavailable, the reading-view fallback fills the viewport. On desktop, a popup can provide a separate reader window.",
        ],
      },
      {
        heading: "Save and export your work",
        paragraphs: [
          "The current draft, bookmarks, preferences and reading anchor save in this browser. Reload starts paused. If local saving is unavailable, export your script to keep a copy.",
          "Export (.md) saves script text. Export configuration saves layout, reading preferences and theme as JSON, without the script or bookmarks. Keep these separate backups before replacing a draft or clearing browser data. There is no cloud backup or bookmark export.",
        ],
      },
      {
        heading: "Browser permissions and current limits",
        paragraphs: [
          "Popups, fullscreen and Keep screen awake depend on your browser and permissions. Allow popups for this site when using a separate reader; native fullscreen must be requested by a user action.",
          "Record with your separate camera or phone. This version does not record video/audio, follow your voice, connect a remote phone, or offer a cloud script library. Local saving is not guaranteed offline access: no installable offline mode is provided.",
        ],
      },
    ],
    related: [
      "/guides/laptop-phone-setup",
      "/docs/scripts-and-bookmarks",
      "/docs/popup-reader",
    ],
  },
  {
    path: "/guides/laptop-phone-setup",
    label: "Laptop and phone setup",
    title: "Laptop Teleprompter and Phone Camera Setup | Teleprompter Lite",
    description:
      "Position a recording phone in front of your laptop, narrow the script near the lens and enable Phone mode. Follow a practical teleprompter setup guide.",
    heading: "Set up your laptop teleprompter with a phone camera",
    introduction:
      "Use your laptop for the script and your phone for recording. Position the phone in front of the screen, keep the reading column close to its lens, and reserve enough empty space below the text for the phone. Rehearse a short passage and review your recording before a longer take.",
    sections: [
      {
        heading: "What you need",
        paragraphs: [
          "Use a laptop with the teleprompter open, a recording phone and a stable phone support. Recording runs in your phone's camera app, separately from this browser. Keep the laptop screen and your phone lens visible from your speaking position.",
        ],
      },
      {
        heading: "Position the phone and reading column",
        paragraphs: [
          "Secure the phone in front of the screen so it does not move during a take or obstruct the text you need to read. Use the actual camera lens position as your reference.",
          "Adjust the side margins to narrow the reading column near the lens. Choose line length and text size together: a column that is too narrow can break the script into awkward fragments, while a wide column requires more sideways reading.",
        ],
      },
      {
        heading: "Enable Phone mode",
        paragraphs: [
          "Enable Phone mode in the output preferences, then adjust the lower reading-height divider to leave enough space below the text for your phone. This is empty reserved space, not a live camera feed.",
          "The divider can be dragged or adjusted with arrow keys. At full reading height the clearance reaches zero. Saved layout preferences apply again when you return; you can export configuration to reuse them.",
        ],
      },
      {
        heading: "Choose a readable pace",
        paragraphs: [
          "Set font size and line spacing from your actual speaking distance. Place the reading guide where your eyes can follow the text near the lens, and use focus mode if it helps you keep the current paragraph in view.",
          "Begin with a short passage and change speed until it suits your delivery. No particular font size, margin or multiplier is ideal for every setup.",
        ],
      },
      {
        heading: "Rehearse and review a short take",
        paragraphs: [
          "Make a short recording before a long session. Check that the phone does not cover the script, that text is comfortable to read, and that your pace leaves room for pauses. Use a bookmark to return to the passage after reviewing.",
        ],
        steps: [
          "Prepare a short paragraph and adjust the reading column.",
          "Start recording on your phone, then start the teleprompter.",
          "Pause and review the take before adjusting layout or speed.",
        ],
      },
      {
        heading: "Limits of screen-based eye contact",
        paragraphs: [
          "Keeping words close to the lens can make the setup easier to use, but a screen beside a lens is not the same as text reflected directly in front of it. Review your actual recording rather than expecting guaranteed eye contact.",
          "If you use reflective teleprompter glass, check whether mirrored text is required. This app flips text horizontally; it does not correct your eyes or certify compatibility with a physical rig.",
        ],
      },
    ],
    related: [
      "/docs/getting-started",
      "/features/mirror-mode",
      "/docs/scripts-and-bookmarks",
    ],
  },
  {
    path: "/docs/popup-reader",
    label: "Popup reader",
    title: "Popup and Second-Monitor Teleprompter | Teleprompter Lite",
    description:
      "Open a synchronized teleprompter reader in a separate window on the same computer. Learn second-monitor setup, fullscreen and popup troubleshooting.",
    heading: "Use a popup reader on the same computer",
    introduction:
      "Open popup reader from the desktop workspace to separate the scrolling script from your controls. The reader stays synchronized on the same computer, and you can move it to another monitor. It does not connect to a separate phone or tablet.",
    sections: [
      {
        heading: "Open the popup from the workspace",
        paragraphs: [
          "Choose Open popup reader beside the fullscreen action on the desktop transport. Use that button directly rather than bookmarking a session URL. The popup action is hidden in the mobile workspace.",
          "If the browser blocks the window, allow popups for this site and try the button again. Keep the workspace open so it can control the connected reader.",
        ],
      },
      {
        heading: "Move the window to a second monitor",
        paragraphs: [
          "Drag the popup to another monitor connected to the same computer, leaving the workspace on your operator display. Browser window placement and fullscreen permissions may limit where or how the output opens.",
        ],
      },
      {
        heading: "Control playback and layout",
        paragraphs: [
          "The connected popup runs playback while the workspace sends the script, settings, bookmarks, theme and countdown. Pause, jump to another cue or adjust speed from the controller; the reader stays synchronized.",
          "Output resize handles adjust shared geometry. These changes return to the workspace and its saved preferences. The popup is a reader, not a separate script editor.",
        ],
      },
      {
        heading: "Enter fullscreen inside the popup",
        paragraphs: [
          "Request the popup's native fullscreen from that window. A fullscreen request in the workspace cannot automatically fullscreen another browser window. When native fullscreen is unavailable, use the available reading-view fallback. Check text orientation if using reflective glass.",
        ],
      },
      {
        heading: "If the window disconnects",
        paragraphs: [
          "Closing the popup pauses the workspace so it can recover its reading position. If the controller closes, the output pauses safely and can continue locally using Continue here.",
          "To reconnect for synchronized operation, return to the workspace and open a fresh popup. A disconnected local reader is not a remote connection to another device.",
        ],
      },
      {
        heading: "Same-device limits",
        paragraphs: [
          "This workflow connects browser windows on the same origin and computer. It does not send the script to a phone, tablet or another computer, provide a network remote, or integrate with a recording/meeting service.",
        ],
      },
    ],
    related: [
      "/docs/getting-started",
      "/features/mirror-mode",
      "/guides/laptop-phone-setup",
    ],
  },
  {
    path: "/docs/scripts-and-bookmarks",
    label: "Scripts and bookmarks",
    title: "Markdown Scripts and Bookmarks | Teleprompter Lite",
    description:
      "Import text or Markdown, format your script and bookmark lines for retakes. Learn file limits, unresolved bookmarks and export boundaries.",
    heading: "Prepare scripts and bookmarks for your next take",
    introduction:
      "Write in plain text or Markdown, then use paragraphs as reading cues and bookmarks for specific lines. Import a .txt or .md file up to 1 MiB. Keep a separate export of your script before replacing it or clearing browser data.",
    sections: [
      {
        heading: "Paste or import a script",
        paragraphs: [
          "Open Edit script to paste or write, then choose Save. Import accepts UTF-8 .txt and .md files up to 1,048,576 bytes (1 MiB); content with NUL characters is rejected. Word/PDF files are not supported.",
          "The app keeps one current draft. Before confirming a replacement import, export anything you want to retain.",
        ],
      },
      {
        heading: "Format your text",
        paragraphs: [
          "The toolbar supports bold, italic, strikethrough, inline code, heading, quote and lists. An explicit selection formats selected text; without a selection it formats the current source line. Keyboard formatting shortcuts preserve the editing selection.",
          "The reader deliberately omits images, tables, raw HTML and embedded content. Links display their text but are not clickable in reading output. Blank lines separate paragraphs into navigation cues.",
        ],
        code: "# Introduction\n\nWelcome to **this week's update**.\n\nPause, then share the next point.",
      },
      {
        heading: "Navigate paragraphs and bookmark lines",
        paragraphs: [
          "Paragraph cues let you jump through passages with the previous/next controls or Up/Down arrow keys. Left/Right arrow keys adjust font size. A bookmark targets a particular script source line, rather than an entire paragraph.",
          "Use the bookmark button beside a reading line, then open Bookmarks to jump, rename or remove it. Inline bookmark buttons are omitted inside list items, keeping their markers clear; the separate bookmark navigation remains available.",
        ],
      },
      {
        heading: "Rename and repair bookmarks",
        paragraphs: [
          "Give bookmarks names that describe the section or retake. Editing tries to preserve recognizable source-line identities. Changed, removed or ambiguously duplicated lines can leave a bookmark unresolved rather than move it to an uncertain passage.",
          "An unresolved bookmark cannot jump to its former line. Reassign it to the current line or delete it from Bookmarks. Check bookmarks after a substantial script rewrite.",
        ],
      },
      {
        heading: "Export and back up",
        paragraphs: [
          "Export (.md) downloads script text only; it does not include bookmark metadata, reading position or settings. Export configuration downloads layout, reading preferences and theme as JSON, without your script or bookmarks.",
          "Both exports are separate from browser-local saving. Browser clearing, a different browser or another device can make the local draft unavailable. There is no cloud backup or bookmark-export feature.",
        ],
      },
      {
        heading: "Start a new script without changing preferences",
        paragraphs: [
          "New script pauses playback, clears the current script, bookmarks and reading position, and opens a blank editor. It keeps typography, layout, playback preferences and theme. Export first if you need the previous script.",
        ],
      },
    ],
    related: [
      "/docs/getting-started",
      "/guides/laptop-phone-setup",
      "/docs/popup-reader",
    ],
  },
  {
    path: "/features/mirror-mode",
    label: "Mirror mode",
    title: "Teleprompter Mirror Mode for Reflective Glass | Teleprompter Lite",
    description:
      "Flip your teleprompter script horizontally for reflective glass. Learn when to enable mirror mode and how to use it in fullscreen or popup output.",
    heading: "Mirror your script for reflective teleprompter glass",
    introduction:
      "Turn on Mirror script when your display reflects through teleprompter glass. The app flips the script horizontally so its reflection can be read normally. Leave mirroring off when reading directly from the screen.",
    sections: [
      {
        heading: "When mirrored text is useful",
        paragraphs: [
          "Reflective teleprompter glass can reverse the displayed text. Horizontal mirror mode reverses it on the screen so you can check that the reflection reads normally. Your physical rig determines the orientation you need.",
        ],
      },
      {
        heading: "Turn on Mirror script",
        paragraphs: [
          "Open Settings and enable Mirror script. The shared reader flips the displayed script horizontally; the Markdown you edit/export stays unchanged. This feature does not mirror your camera image or change a recording.",
        ],
      },
      {
        heading: "Choose fullscreen or popup output",
        paragraphs: [
          "Use fullscreen for a single reading surface or open a popup on the same computer to keep operator controls separate. Mirroring applies to the shared script output. Move the popup to a connected second monitor when your setup calls for one.",
        ],
      },
      {
        heading: "Check orientation before recording",
        paragraphs: [
          "Read a short sample through the glass before beginning a take. Confirm the orientation, reading size and speed from your actual speaking position. The app provides a horizontal flip only, not vertical flipping or hardware certification.",
        ],
      },
      {
        heading: "When to leave mirroring off",
        paragraphs: [
          "For direct reading from a laptop, phone or monitor screen, leave Mirror script off so the text reads normally. A laptop-and-phone arrangement without reflective glass usually uses normal orientation.",
        ],
      },
    ],
    related: [
      "/docs/popup-reader",
      "/guides/laptop-phone-setup",
      "/docs/getting-started",
    ],
  },
];

export const blogPosts: readonly Guide[] = [
  {
    path: "/blog/write-a-teleprompter-script",
    label: "Writing a spoken script",
    title: "How to Write a Teleprompter Script | Teleprompter Lite",
    description:
      "Turn a written draft into a script you can speak aloud. Use short paragraphs, purposeful emphasis and a rehearsal pass before recording.",
    heading: "How do you write a script for a teleprompter?",
    introduction:
      "Write for your speaking voice, divide the draft into short paragraphs, and read it aloud before recording. A teleprompter helps you keep your place; a script that sounds like you makes the words easier to deliver.",
    sections: [
      {
        heading: "Start with what the viewer needs",
        paragraphs: [
          "Write down the question your video should answer and the point you want the viewer to remember. Use that to decide what belongs in the opening, the explanation and the close.",
          "If a sentence does not help the viewer understand or act, try removing it. A shorter draft gives you fewer words to track during a take.",
        ],
      },
      {
        heading: "Use language you would actually say",
        paragraphs: [
          "Read a paragraph aloud without scrolling. Rewrite phrases that make you stumble, split sentences that carry several ideas, and use contractions if that matches your natural voice.",
          "Spell out an unfamiliar abbreviation the first time you use it. Choose how you will say numbers before recording rather than decoding them while the script moves.",
        ],
      },
      {
        heading: "Give each paragraph a job",
        paragraphs: [
          "Separate thoughts with blank lines. In Teleprompter Lite, paragraphs become cues you can move between using previous and next controls. A paragraph can introduce a point, explain it or close it.",
          "Use bold sparingly for words that need emphasis. Keep stage directions visibly different from spoken words, and rehearse them so you do not accidentally read them aloud. Lists can help preparation, but continuous spoken paragraphs may be easier to follow in the reader.",
        ],
        code: "# Opening\n\nToday, let’s make **one small change** to your setup.\n\nStart with the words you want to share.\n\nThen give yourself a moment to pause.",
      },
      {
        heading: "Rehearse with the actual layout",
        paragraphs: [
          "Paste the draft into Edit script, choose Save, and set the font size and reading width from your speaking position. A line break on your writing screen may look different in the reader.",
          "Run a short passage. If you consistently hurry through a sentence, rewrite it or slow the scroll. The app uses a fixed scrolling pace and does not listen to your voice.",
        ],
      },
      {
        heading: "Keep a copy before the next rewrite",
        paragraphs: [
          "Export the script as Markdown before replacing the current draft. This version keeps one script in browser storage; an export gives you a separate copy of the words.",
          "Script export does not include bookmarks or settings. Check and repair bookmarked lines after a substantial edit, then rehearse the changed passage again.",
        ],
      },
    ],
    related: [
      "/docs/scripts-and-bookmarks",
      "/blog/choose-teleprompter-speed",
      "/blog/prepare-video-retakes",
    ],
  },
  {
    path: "/blog/choose-teleprompter-speed",
    label: "Finding your scrolling pace",
    title: "How to Choose Teleprompter Scrolling Speed | Teleprompter Lite",
    description:
      "Find a comfortable scrolling speed by rehearsing at your recording distance. Understand speed multipliers, text size and pauses in Teleprompter Lite.",
    heading: "What scrolling speed should you use for a teleprompter?",
    introduction:
      "Use the pace that lets you speak a short rehearsal passage comfortably without chasing the words. There is no universal speed: text size, line spacing, reading width and your delivery all change how a scrolling pace feels.",
    sections: [
      {
        heading: "Set the layout before the pace",
        paragraphs: [
          "Choose a readable font size from your actual recording position, then narrow the column enough to keep your eyes near the lens. Adjust line spacing so you can track the next line without crowding.",
          "Changing font size or width changes the number of lines in a passage. Recheck speed whenever you make a substantial layout change.",
        ],
      },
      {
        heading: "Understand the speed display",
        paragraphs: [
          "Teleprompter Lite measures scrolling in pixels per second. Its 1× display means 20 px/s; the slower and faster transport controls adjust it in 5 px/s steps, between 5 and 200 px/s.",
          "The multiplier is not a words-per-minute measurement. The same pixel speed can feel faster with smaller text or longer lines, so use a rehearsal rather than converting it into a speaking target.",
        ],
      },
      {
        heading: "Rehearse one representative passage",
        paragraphs: [
          "Choose a paragraph that includes the kind of pauses, names and explanations you expect in the full script. Start at a manageable pace and adjust until you can finish the thought without rushing.",
        ],
        steps: [
          "Set your layout and return to the start of the passage.",
          "Play and speak aloud from your recording position.",
          "If the text leaves before you finish, reduce speed. If you keep waiting for the next line, increase it.",
          "Repeat after a layout change, using the same passage for comparison.",
        ],
      },
      {
        heading: "Make room for pauses",
        paragraphs: [
          "A fixed-speed reader keeps moving during a pause. Use the play/pause control for a longer break, or shorten the passage into clear cues you can navigate between.",
          "The optional countdown gives you a moment before playback starts. It is a starting aid rather than a pause between every paragraph. The reading guide and focus mode can help you keep your place without changing speed.",
        ],
      },
      {
        heading: "Adjust during a take",
        paragraphs: [
          "Use the slower and faster buttons when you need a small change. With shortcuts enabled and no editing field or dialog active, + and − adjust speed in 5 px/s steps.",
          "On desktop, ordinary wheel input over the reader scrolls the script whether playing or paused. Try these controls in rehearsal so an adjustment does not surprise you during a recording.",
        ],
      },
    ],
    related: [
      "/docs/getting-started",
      "/guides/laptop-phone-setup",
      "/blog/write-a-teleprompter-script",
    ],
  },
  {
    path: "/blog/prepare-video-retakes",
    label: "Preparing for retakes",
    title: "Prepare Video Retakes with Script Bookmarks | Teleprompter Lite",
    description:
      "Plan a rehearsal and retake workflow using paragraph cues, named bookmarks and separate script backups in Teleprompter Lite.",
    heading: "How can you prepare a script for easier video retakes?",
    introduction:
      "Divide your script into clear passages, bookmark the lines you expect to repeat, and rehearse the recording setup before a longer take. Named bookmarks make it easier to return to a passage without scrolling through the whole draft.",
    sections: [
      {
        heading: "Use cues for the structure, bookmarks for the return point",
        paragraphs: [
          "Blank lines separate paragraph cues, which the previous and next controls can navigate. A bookmark points to a specific script source line and gives you a more deliberate place to restart.",
          "Add bookmarks at useful return points such as the opening, a demonstration or the closing sentence. Name them for the part you will recognize during a retake, rather than a position that may change after editing.",
        ],
      },
      {
        heading: "Check your recording setup first",
        paragraphs: [
          "Position your camera or phone securely, set the reading width near the lens and enable Phone mode if the device sits in front of the display. Check the text from the place where you will speak.",
          "Record a short sample with your separate camera app, then review framing, sound and reading pace. Teleprompter Lite provides the script display; it does not record or review the video.",
        ],
      },
      {
        heading: "Return to a passage deliberately",
        paragraphs: [
          "Pause playback, select a bookmark and check that it returns to the intended line. Start the camera recording separately and resume the teleprompter when ready. On mobile, jumping to a bookmark returns to the reader destination.",
        ],
        steps: [
          "Pause after the passage you want to repeat.",
          "Choose the named bookmark or use the previous cue control.",
          "Check the opening words and your scrolling pace.",
          "Begin the separate recording, then play the script again.",
        ],
      },
      {
        heading: "Repair bookmarks after editing",
        paragraphs: [
          "Editing tries to preserve recognizable script lines. Removing or substantially changing a line can leave a bookmark unresolved, so check your return points after a rewrite.",
          "Use the bookmark list to reassign an unresolved bookmark to the current line or delete it. An unresolved bookmark does not jump to a guessed location.",
        ],
      },
      {
        heading: "Back up before replacing the draft",
        paragraphs: [
          "Export the script as Markdown before starting a new one. New script clears the words, bookmarks and reading position while keeping typography, layout and playback preferences.",
          "Configuration export saves those preferences separately as JSON. Neither export includes bookmark metadata, and browser-local saving is not a cloud backup. Keep your recording files in your own recording workflow.",
        ],
      },
    ],
    related: [
      "/docs/scripts-and-bookmarks",
      "/blog/write-a-teleprompter-script",
      "/guides/laptop-phone-setup",
    ],
  },
];

export const publicPages = [
  {
    path: "/",
    label: seo.name,
    title: seo.title,
    description: seo.description,
  },
  {
    path: "/blog",
    label: seo.blog.label,
    title: seo.blog.title,
    description: seo.blog.description,
  },
  ...guides.map(({ path, label, title, description }) => ({
    path,
    label,
    title,
    description,
  })),
  ...blogPosts.map(({ path, label, title, description }) => ({
    path,
    label,
    title,
    description,
  })),
];
export function getGuide(path: string): Guide {
  const guide = [...guides, ...blogPosts].find((entry) => entry.path === path);
  if (!guide) throw new Error(`Unknown public guide: ${path}`);
  return guide;
}
export const sectionId = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
