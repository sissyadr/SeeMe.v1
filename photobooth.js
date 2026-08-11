/* =====================================================
   SeeMe! Studio — photobooth.js
   Production Render / Capture / Camera Engine (v5 - cleaned)

   Layouts: oval, grid6, grid4, frameless (3/4/6/8)
   Fixes in this pass:
   - Removed duplicate #startBtn click handler (was firing capture twice)
   - Removed duplicate filter-button click handler
   - Live preview filter now actually visible (uses ctx.filter instead
     of an almost-invisible low-alpha compositing trick)
   - Countdown / flash / live-preview FPS now honor CONFIG values
   - Layout/frame selection is now ignored while a capture is running
     (prevents state corruption mid-countdown)
   - Start button disables + explains itself when no frame is selected
   - #captureMode, #frameSectionTitle, #frameHint are now kept in sync
   - Removed dead code (never-called functions)
   - FRAMES array built with a small helper instead of 39 duplicated blocks
===================================================== */

(() => {
"use strict";

/* =====================================================
   CONFIG
===================================================== */

const CONFIG = {
  COUNTDOWN_STEP_MS: 900,
  COUNTDOWN_GO_MS: 350,

  // Mirror webcam preview and captured photos like a normal selfie camera.
  MIRROR_CAPTURE: true,

  PHOTO_ZOOM: 1.09,
  SLOT_INFLATE_PX: 8,

  CAMERA_CONSTRAINTS: {
    video: {
        facingMode: "user",
        width: {
            ideal: 1280,
            max: 1280
        },
        height: {
            ideal: 960,
            max: 960
        }
    },
    audio: false
},
  LIVE_PREVIEW_FPS: 20,

  EXPORT_FILENAME_PREFIX: "seeme",

  FLASH_DURATION_MS: 420,

  DEBUG_HIDE_FRAME_OVERLAY: false
};

/* =====================================================
   LAYOUT META
===================================================== */

const LAYOUT_META = {
  oval: { id: "oval", label: "Oval", shotCount: 3, width: 1200, height: 1800 },
  grid6: { id: "grid6", label: "Grid 6", shotCount: 6, width: 1058, height: 1600 },
  grid4: { id: "grid4", label: "Grid 4", shotCount: 4, width: 736, height: 920 }
};

/* =====================================================
   FRAMELESS LAYOUTS
===================================================== */

function makeGridSlots(cols, rows, cellWidth, cellHeight) {
  const slots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        shape: "rect",
        x: c * cellWidth,
        y: r * cellHeight,
        width: cellWidth,
        height: cellHeight
      });
    }
  }
  return slots;
}

/* =====================================================
   FRAMELESS / BORDERLESS LAYOUTS
   ===================================================== */




const FRAMELESS_LAYOUTS = {

  /* -------------------------------------------------
     3 PHOTOS
     Long vertical photobooth strip
     Ratio: 3 : 10
     ------------------------------------------------- */

  frameless3: {
    id: "frameless3",
    label: "3 Photos",
    shotCount: 3,

   width: 900,
height: 2400,
slots: makeGridSlots(1, 3, 900, 800)
  },


  /* -------------------------------------------------
     4 PHOTOS
     Extra-long vertical photobooth strip
     Ratio: 3 : 14
     ------------------------------------------------- */

  frameless4: {
    id: "frameless4",
    label: "4 Photos",
    shotCount: 4,

   width: 900,
height: 3000,
slots: makeGridSlots(1, 4, 900, 750)
  },


  /* -------------------------------------------------
     6 PHOTOS
     3 LEFT + 3 RIGHT
     ------------------------------------------------- */

  frameless6: {
    id: "frameless6",
    label: "6 Photos",
    shotCount: 6,

    width: 900,
    height: 1200,

    slots: makeGridSlots(
      2,
      3,
      450,
      400
    )
  },


  /* -------------------------------------------------
     8 PHOTOS
     4 LEFT + 4 RIGHT
     ------------------------------------------------- */

  frameless8: {
    id: "frameless8",
    label: "8 Photos",
    shotCount: 8,

    width: 900,
    height: 1600,

    slots: makeGridSlots(
      2,
      4,
      450,
      400
    )
  }

};

/* =====================================================
   FRAME SLOTS (printed-frame layouts)
===================================================== */

const SLOTS_OVAL = [
  { shape: "oval", x: 120, y: 84, width: 938, height: 502 },
  { shape: "oval", x: 131, y: 648, width: 937, height: 503 },
  { shape: "oval", x: 141, y: 1213, width: 938, height: 503 }
];

const SLOTS_GRID6 = [
  { shape: "rect", x: 37, y: 69, width: 474, height: 319 },
  { shape: "rect", x: 525, y: 69, width: 475, height: 319 },
  { shape: "rect", x: 37, y: 420, width: 474, height: 319 },
  { shape: "rect", x: 525, y: 420, width: 475, height: 319 },
  { shape: "rect", x: 37, y: 771, width: 474, height: 319 },
  { shape: "rect", x: 525, y: 771, width: 475, height: 319 }
];

const SLOTS_GRID4 = [
  { shape: "rect", x: 31, y: 28, width: 324, height: 404 },
  { shape: "rect", x: 383, y: 28, width: 324, height: 404 },
  { shape: "rect", x: 31, y: 473, width: 324, height: 405 },
  { shape: "rect", x: 383, y: 473, width: 324, height: 405 }
];

/* =====================================================
   FRAME DATA
===================================================== */

const FRAME_FOLDERS = { oval: "oval", grid6: "grid", grid4: "grid4" };
const FRAME_SLOTS = { oval: SLOTS_OVAL, grid6: SLOTS_GRID6, grid4: SLOTS_GRID4 };

function buildFrames(layoutId, ids) {
  const meta = LAYOUT_META[layoutId];
  const folder = FRAME_FOLDERS[layoutId];
  const slots = FRAME_SLOTS[layoutId];

  return ids.map(id => ({
    id,
    layout: layoutId,
    file: `assets/frames/${folder}/${id}.png`,
    width: meta.width,
    height: meta.height,
    slots
  }));
}

const FRAMES = [
  ...buildFrames("oval", [
    "frutiger-oval-01", "gothic-oval-01",
    "y2k-oval-01", "y2k-oval-02", "y2k-oval-03", "y2k-oval-04",
    "oval-10", "oval-12", "oval-13", "oval-14", "oval-15",
    "oval-16", "oval-17", "oval-18", "oval-19", "oval-20", "oval-21",
    "pride-oval-01", "pride-oval-02", "pride-oval-03"
  ]),
  ...buildFrames("grid6", [
    "frutiger-grid6-01", "gothic-grid6-01", "pride-grid6-01",
    "y2k-grid6-01", "y2k-grid6-02", "y2k-grid6-03",
    "pride-grid6-02", "y2k-grid6-04",
    "grid6-10", "grid6-11", "grid6-12", "grid6-13", "grid6-14",
    "grid6-15", "grid6-16", "pride-grid6-03", "grid6-17", "grid6-18"
  ]),
  ...buildFrames("grid4", ["grid4-01"])
];

/* =====================================================
   GEOMETRY HELPERS
===================================================== */

function coverRect(sourceWidth, sourceHeight, targetWidth, targetHeight, zoom = 1) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  let drawW, drawH;

  if (sourceRatio > targetRatio) {
    drawH = targetHeight * zoom;
    drawW = drawH * sourceRatio;
  } else {
    drawW = targetWidth * zoom;
    drawH = drawW / sourceRatio;
  }

  return {
    drawW,
    drawH,
    offsetX: (targetWidth - drawW) / 2,
    offsetY: (targetHeight - drawH) / 2
  };
}

function clipSlot(ctx, slot, inflate = 0) {
  const x = slot.x - inflate;
  const y = slot.y - inflate;
  const width = slot.width + inflate * 2;
  const height = slot.height + inflate * 2;

  ctx.beginPath();

  if (slot.shape === "oval") {
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(x, y, width, height);
  }

  ctx.clip();
}

/* =====================================================
   DRAWING HELPERS
===================================================== */

function drawCanvasCover(ctx, sourceCanvas, slot, zoom) {
  const fit = coverRect(sourceCanvas.width, sourceCanvas.height, slot.width, slot.height, zoom);
  ctx.drawImage(sourceCanvas, slot.x + fit.offsetX, slot.y + fit.offsetY, fit.drawW, fit.drawH);
}

function drawCapturedShot(ctx, shot, slot) {
  if (!shot) return;

  ctx.save();
  clipSlot(ctx, slot, CONFIG.SLOT_INFLATE_PX);
  drawCanvasCover(ctx, shot, slot, CONFIG.PHOTO_ZOOM);
  ctx.restore();
}

function drawTimestamp(ctx, width, height) {
  if (!STATE.timestampEnabled) return;

  const now = new Date();
  const dateText = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  const timeText = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const text = `${dateText} · ${timeText}`;

  ctx.save();
  ctx.font = "500 24px Poppins, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  const padding = 32;
  const metrics = ctx.measureText(text);
  const boxWidth = metrics.width + 24;
  const boxHeight = 40;
  const x = width - padding;
  const y = height - padding;

  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.beginPath();
  ctx.roundRect(x - boxWidth, y - boxHeight, boxWidth, boxHeight, 8);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, x - 12, y - 10);
  ctx.restore();
}

function drawCaption(ctx, width, height) {
  const text = STATE.caption.trim();
  if (!text) return;

  ctx.save();
  ctx.font = "600 30px Poppins, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  const x = width / 2;
  const y = height - 34;
  const metrics = ctx.measureText(text);
  const boxWidth = metrics.width + 44;
  const boxHeight = 54;

  ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
  ctx.beginPath();
  ctx.roundRect(x - boxWidth / 2, y - boxHeight, boxWidth, boxHeight, 12);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, x, y - 12);
  ctx.restore();
}

function drawEmptyCanvasBackground(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function getRenderLayout() {
  if (STATE.layout === "frameless") {
    const meta = FRAMELESS_LAYOUTS[STATE.framelessVariant];

    return {
      id: STATE.framelessVariant,
      label: meta.label,
      shotCount: meta.shotCount,
      width: meta.width,
      height: meta.height,
      slots: meta.slots,
      frame: null
    };
  }

  const meta = LAYOUT_META[STATE.layout];

  return {
    id: meta.id,
    label: meta.label,
    shotCount: meta.shotCount,
    width: meta.width,
    height: meta.height,
    slots: STATE.frame ? STATE.frame.slots : [],
    frame: STATE.frame
  };
}

/* =====================================================
   DOM
===================================================== */

const DOM = {
  video: document.getElementById("video"),
  livePreview: document.getElementById("livePreview"),
  flash: document.getElementById("flash"),
  countdown: document.getElementById("countdown"),
  startBtn: document.getElementById("startBtn"),
  shotsCounter: document.getElementById("shotsCounter"),
  captureMode: document.getElementById("captureMode"),
  frameList: document.getElementById("frameList"),
  frameCount: document.getElementById("frameCount"),
  frameSectionTitle: document.getElementById("frameSectionTitle"),
  frameHint: document.getElementById("frameHint"),
  filterList: document.getElementById("filterList"),
  filterHint: document.getElementById("filterHint"),
  photostrip: document.getElementById("photostrip"),
  downloadBtn: document.getElementById("downloadBtn"),
  resultCard: document.getElementById("resultCard"),
  timerOptions:document.querySelectorAll(".timer-option"),
  timestampToggle: document.getElementById("timestampToggle"),
  captionInput: document.getElementById("captionInput"),
  layoutCards: document.querySelectorAll(".layout-card")
  };

const liveCtx = DOM.livePreview
  ? DOM.livePreview.getContext("2d", { willReadFrequently: true })
  : null;

/* =====================================================
   STATE
===================================================== */

const STATE = {
  layout: "oval",
  framelessVariant: "frameless4",
  frame: null,
  shots: [],
  filter: "none",

  stream: null,
  cameraReady: false,
  cameraStarting: false,

  capturing: false,
  retakeIndex: null, // null = normal capture, number = replacing that shot

  // Timer duration in seconds
  // Default: 3 seconds
  timerDuration: 3,

  timestampEnabled: false,
  caption: "",

  liveLoop: null,
  lastLiveRender: 0,

  resultReady: false
};

const FILTER_NAMES = {
  none: "Original",
  warm: "Warm",
  vintage: "Vintage",
  bw: "B&W",
  oldmovie: "Old Movie",
  cocktail: "Cocktail",
  spycam: "Spy Cam",
  comicbook: "Comic Book",
  thermal: "Thermal",
  traditional: "Traditional"
};

/* =====================================================
   FILTER ENGINE
   OLD GOOD VERSION
===================================================== */

function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function heatColor(t) {
  const stops = [
    [0.00, 8,   8,   40],
    [0.25, 90,  0,   160],
    [0.50, 220, 20,  20],
    [0.75, 255, 150, 0],
    [1.00, 255, 255, 200]
  ];

  for (let k = 0; k < stops.length - 1; k++) {
    const [t0, r0, g0, b0] = stops[k];
    const [t1, r1, g1, b1] = stops[k + 1];

    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0);

      return [
        r0 + (r1 - r0) * f,
        g0 + (g1 - g0) * f,
        b0 + (b1 - b0) * f
      ];
    }
  }

  const last = stops[stops.length - 1];

  return [
    last[1],
    last[2],
    last[3]
  ];
}


const FILTER_ENGINE = {

  /* -----------------------------
     ORIGINAL
  ----------------------------- */

  none(imageData) {
    return imageData;
  },


  /* -----------------------------
     WARM
  ----------------------------- */

  warm(imageData) {

    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {

      d[i] =
        clamp(d[i] * 1.18 + 12);

      d[i + 1] =
        clamp(d[i + 1] * 1.05 + 4);

      d[i + 2] =
        clamp(d[i + 2] * 0.82);

    }

    return imageData;
  },


  /* -----------------------------
     VINTAGE
  ----------------------------- */

  vintage(imageData) {

    const {
      data,
      width,
      height
    } = imageData;

    const cx = width / 2;
    const cy = height / 2;

    const maxDist =
      Math.sqrt(
        cx * cx +
        cy * cy
      );

    for (
      let y = 0;
      y < height;
      y++
    ) {

      for (
        let x = 0;
        x < width;
        x++
      ) {

        const i =
          (y * width + x) * 4;

        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        /*
         * Slightly desaturate
         */
        const avg =
          (r + g + b) / 3;

        r =
          r * 0.6 +
          avg * 0.4;

        g =
          g * 0.6 +
          avg * 0.4;

        b =
          b * 0.6 +
          avg * 0.4;


        /*
         * Vintage color tone
         */
        const nr =
          r * 0.95 +
          g * 0.05 +
          20;

        const ng =
          g * 0.9 +
          10;

        const nb =
          b * 0.7;


        /*
         * Vignette
         */
        const dist =
          Math.sqrt(
            (x - cx) ** 2 +
            (y - cy) ** 2
          ) / maxDist;

        const vig =
          1 -
          Math.min(
            dist * 0.55,
            0.45
          );


        data[i] =
          clamp(nr * vig);

        data[i + 1] =
          clamp(ng * vig);

        data[i + 2] =
          clamp(nb * vig);

      }
    }

    return imageData;
  },


  /* -----------------------------
     B&W
  ----------------------------- */

  bw(imageData) {

    const d =
      imageData.data;

    for (
      let i = 0;
      i < d.length;
      i += 4
    ) {

      const gray =
        d[i] * 0.299 +
        d[i + 1] * 0.587 +
        d[i + 2] * 0.114;

      const c =
        clamp(
          (gray - 128) *
          1.2 +
          128 +
          8
        );

      d[i] =
        c;

      d[i + 1] =
        c;

      d[i + 2] =
        c;
    }

    return imageData;
  },


  /* -----------------------------
     OLD MOVIE
  ----------------------------- */

  oldmovie(imageData) {

    const {
      data,
      width,
      height
    } = imageData;

    const cx =
      width / 2;

    const cy =
      height / 2;

    const maxDist =
      Math.sqrt(
        cx * cx +
        cy * cy
      );

    for (
      let y = 0;
      y < height;
      y++
    ) {

      for (
        let x = 0;
        x < width;
        x++
      ) {

        const i =
          (y * width + x) * 4;

        const gray =
          data[i] * 0.299 +
          data[i + 1] * 0.587 +
          data[i + 2] * 0.114;

        /*
         * Film grain
         */
        const noise =
          (Math.random() - 0.5) *
          35;


        /*
         * Vignette
         */
        const dist =
          Math.sqrt(
            (x - cx) ** 2 +
            (y - cy) ** 2
          ) / maxDist;

        const vig =
          1 -
          Math.min(
            dist * 0.75,
            0.6
          );


        const v =
          clamp(
            (gray + noise) *
            vig
          );


        data[i] =
          clamp(v * 1.02);

        data[i + 1] =
          clamp(v * 0.98);

        data[i + 2] =
          clamp(v * 0.85);

      }
    }

    return imageData;
  },


  /* -----------------------------
     COCKTAIL
  ----------------------------- */

  cocktail(imageData) {

    const d =
      imageData.data;

    for (
      let i = 0;
      i < d.length;
      i += 4
    ) {

      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];


      /*
       * Soft pastel wash
       */
      r =
        r * 0.85 +
        255 * 0.15;

      g =
        g * 0.85 +
        230 * 0.15;

      b =
        b * 0.85 +
        255 * 0.15;


      /*
       * Pink / blue cocktail tone
       */
      d[i] =
        clamp(
          r * 1.05 + 10
        );

      d[i + 1] =
        clamp(g);

      d[i + 2] =
        clamp(
          b * 1.12 + 8
        );
    }

    return imageData;
  },


  /* -----------------------------
     SPY CAM
  ----------------------------- */

  spycam(imageData) {

    const {
      data,
      width,
      height
    } = imageData;

    const cx =
      width / 2;

    const cy =
      height / 2;

    const maxDist =
      Math.sqrt(
        cx * cx +
        cy * cy
      );


    for (
      let y = 0;
      y < height;
      y++
    ) {

      for (
        let x = 0;
        x < width;
        x++
      ) {

        const i =
          (y * width + x) * 4;

        const gray =
          data[i] * 0.299 +
          data[i + 1] * 0.587 +
          data[i + 2] * 0.114;


        /*
         * CCTV noise
         */
        const noise =
          (Math.random() - 0.5) *
          22;


        /*
         * Scanlines
         */
        const scanline =
          y % 3 === 0
            ? 0.85
            : 1;


        /*
         * Vignette
         */
        const dist =
          Math.sqrt(
            (x - cx) ** 2 +
            (y - cy) ** 2
          ) / maxDist;

        const vig =
          1 -
          Math.min(
            dist * 0.7,
            0.55
          );


        const v =
          clamp(
            gray * 1.15 +
            noise
          ) *
          scanline *
          vig;


        /*
         * Green CCTV tone
         */
        data[i] =
          clamp(v * 0.25);

        data[i + 1] =
          clamp(v * 1.35);

        data[i + 2] =
          clamp(v * 0.35);

      }
    }

    return imageData;
  },


  /* -----------------------------
     COMIC BOOK
  ----------------------------- */

  comicbook(imageData) {

    const {
      data,
      width,
      height
    } = imageData;


    /*
     * Grayscale buffer
     */
    const gray =
      new Uint8ClampedArray(
        width * height
      );


    for (
      let p = 0;
      p < width * height;
      p++
    ) {

      const i =
        p * 4;

      gray[p] =
        data[i] * 0.299 +
        data[i + 1] * 0.587 +
        data[i + 2] * 0.114;
    }


    /*
     * Posterize
     */
    const levels = 4;

    const step =
      255 /
      (levels - 1);


    for (
      let i = 0;
      i < data.length;
      i += 4
    ) {

      data[i] =
        clamp(
          Math.round(
            data[i] / step
          ) *
          step *
          1.05
        );

      data[i + 1] =
        clamp(
          Math.round(
            data[i + 1] / step
          ) *
          step *
          1.05
        );

      data[i + 2] =
        clamp(
          Math.round(
            data[i + 2] / step
          ) *
          step *
          1.05
        );
    }


    /*
     * Sobel edge detection
     */
    for (
      let y = 1;
      y < height - 1;
      y++
    ) {

      for (
        let x = 1;
        x < width - 1;
        x++
      ) {

        const tl =
          gray[
            (y - 1) *
            width +
            (x - 1)
          ];

        const t =
          gray[
            (y - 1) *
            width +
            x
          ];

        const tr =
          gray[
            (y - 1) *
            width +
            (x + 1)
          ];

        const l =
          gray[
            y * width +
            (x - 1)
          ];

        const r =
          gray[
            y * width +
            (x + 1)
          ];

        const bl =
          gray[
            (y + 1) *
            width +
            (x - 1)
          ];

        const b =
          gray[
            (y + 1) *
            width +
            x
          ];

        const br =
          gray[
            (y + 1) *
            width +
            (x + 1)
          ];


        const gx =
          -tl +
          tr -
          2 * l +
          2 * r -
          bl +
          br;

        const gy =
          -tl -
          2 * t -
          tr +
          bl +
          2 * b +
          br;


        const mag =
          Math.sqrt(
            gx * gx +
            gy * gy
          );


        if (mag > 90) {

          const i =
            (y * width + x) *
            4;

          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        }
      }
    }

    return imageData;
  },


  /* -----------------------------
     THERMAL
  ----------------------------- */

  thermal(imageData) {

    const d =
      imageData.data;

    for (
      let i = 0;
      i < d.length;
      i += 4
    ) {

      const intensity =
        (
          d[i] * 0.299 +
          d[i + 1] * 0.587 +
          d[i + 2] * 0.114
        ) / 255;


      const [
        r,
        g,
        b
      ] =
        heatColor(
          intensity
        );


      d[i] =
        r;

      d[i + 1] =
        g;

      d[i + 2] =
        b;
    }

    return imageData;
  },


  /* -----------------------------
     TRADITIONAL
  ----------------------------- */

  traditional(imageData) {

    const {
      data,
      width,
      height
    } = imageData;

    const cx =
      width / 2;

    const cy =
      height / 2;

    const maxDist =
      Math.sqrt(
        cx * cx +
        cy * cy
      );


    for (
      let y = 0;
      y < height;
      y++
    ) {

      for (
        let x = 0;
        x < width;
        x++
      ) {

        const i =
          (y * width + x) * 4;

        let r =
          data[i];

        let g =
          data[i + 1];

        let b =
          data[i + 2];


        const avg =
          (r + g + b) / 3;


        r =
          r * 0.75 +
          avg * 0.25;

        g =
          g * 0.75 +
          avg * 0.25;

        b =
          b * 0.75 +
          avg * 0.25;


        /*
         * Classic sepia matrix
         */
        const nr =
          clamp(
            r * 0.393 +
            g * 0.769 +
            b * 0.189
          );

        const ng =
          clamp(
            r * 0.349 +
            g * 0.686 +
            b * 0.168
          );

        const nb =
          clamp(
            r * 0.272 +
            g * 0.534 +
            b * 0.131
          );


        /*
         * Soft vignette
         */
        const dist =
          Math.sqrt(
            (x - cx) ** 2 +
            (y - cy) ** 2
          ) / maxDist;

        const vig =
          1 -
          Math.min(
            dist * 0.35,
            0.25
          );


        data[i] =
          clamp(
            nr * vig * 1.02
          );

        data[i + 1] =
          clamp(
            ng * vig
          );

        data[i + 2] =
          clamp(
            nb * vig * 0.92
          );
      }
    }

    return imageData;
  }

};

/* =====================================================
   FILTER APPLICATION
   Uses the same FILTER_ENGINE for captured photos
   ===================================================== */

function applyFilter(canvas, filterName) {
  if (!canvas) return canvas;

  const filterFn =
    FILTER_ENGINE[filterName] ||
    FILTER_ENGINE.none;

  if (filterFn === FILTER_ENGINE.none) {
    return canvas;
  }

  const ctx = canvas.getContext("2d", {
    willReadFrequently: true
  });

  if (!ctx) return canvas;

  const imageData = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  filterFn(imageData);

  ctx.putImageData(
    imageData,
    0,
    0
  );

  return canvas;
}

function setupFilterButtons() {
  if (!DOM.filterList) return;

  const buttons = DOM.filterList.querySelectorAll("[data-filter]");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      if (STATE.capturing) return;

      const filter = button.dataset.filter;
      if (!FILTER_NAMES[filter]) return;

      STATE.filter = filter;

      buttons.forEach(item => item.classList.toggle("active", item === button));

      if (DOM.filterHint) {
        DOM.filterHint.textContent = `${FILTER_NAMES[filter]} · live`;
      }
      // Note: filter only affects the live preview and future captures.
      // Already-captured shots keep the filter they were taken with.
    });
  });
}

/* =====================================================
   FRAME IMAGE CACHE
===================================================== */

const FRAME_IMAGE_CACHE = new Map();

function loadFrameImage(frame) {
  if (FRAME_IMAGE_CACHE.has(frame.id)) {
    return FRAME_IMAGE_CACHE.get(frame.id);
  }

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load frame: ${frame.file}`));
    image.src = frame.file;
  });

  FRAME_IMAGE_CACHE.set(frame.id, promise);
  return promise;
}

function getFramesForLayout(layout) {
  return FRAMES.filter(frame => frame.layout === layout);
}

/* =====================================================
   FRAME LIST / FRAMELESS OPTIONS
===================================================== */

function renderFrameList() {
  if (!DOM.frameList) return;

  updateFrameSectionCopy();
  DOM.frameList.innerHTML = "";

  if (STATE.layout === "frameless") {
    renderFramelessOptions();
    if (DOM.frameCount) DOM.frameCount.textContent = "No Frame";
    return;
  }

  const frames = getFramesForLayout(STATE.layout);

  if (DOM.frameCount) {
    DOM.frameCount.textContent = `${frames.length} Frames`;
  }

  if (frames.length === 0) {
    DOM.frameList.innerHTML = `
      <div class="empty-frame-state">
        <strong>No frames yet</strong>
        <span>Add PNG frames to the matching folder.</span>
      </div>
    `;
    return;
  }

  frames.forEach((frame, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "frame-option";

    if (STATE.frame && STATE.frame.id === frame.id) {
      button.classList.add("active");
    }

    button.dataset.frameId = frame.id;

    const thumbnail = document.createElement("img");
    thumbnail.src = frame.file;
    thumbnail.alt = `Frame ${index + 1}`;
    thumbnail.loading = "lazy";

    const number = document.createElement("span");
    number.className = "frame-number";
    number.textContent = String(index + 1);

    button.appendChild(thumbnail);
    button.appendChild(number);

    button.addEventListener("click", () => selectFrame(frame.id));

    DOM.frameList.appendChild(button);
  });
}

function renderFramelessOptions() {
  if (!DOM.frameList) return;

  Object.values(FRAMELESS_LAYOUTS).forEach(layout => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "frame-option frameless-option";

    if (STATE.framelessVariant === layout.id) {
      button.classList.add("active");
    }

    button.dataset.variant = layout.id;

    const preview = document.createElement("div");
    preview.className = "frameless-mini-preview";

    layout.slots.forEach(slot => {
      const cell = document.createElement("span");
      cell.style.left = `${(slot.x / layout.width) * 100}%`;
      cell.style.top = `${(slot.y / layout.height) * 100}%`;
      cell.style.width = `${(slot.width / layout.width) * 100}%`;
      cell.style.height = `${(slot.height / layout.height) * 100}%`;
      preview.appendChild(cell);
    });

    const label = document.createElement("span");
    label.className = "frameless-label";
    label.textContent = layout.label;

    button.appendChild(preview);
    button.appendChild(label);

    button.addEventListener("click", () => {
      if (STATE.capturing) return;

      STATE.framelessVariant = layout.id;
      STATE.shots = [];
      STATE.resultReady = false;

      clearResult();
      updateUI();
      renderFrameList();
    });

    DOM.frameList.appendChild(button);
  });
}

/* =====================================================
   SELECT FRAME / LAYOUT
===================================================== */

async function selectFrame(frameId) {
  if (STATE.capturing) return;

  const frame = FRAMES.find(item => item.id === frameId);
  if (!frame) return;

  STATE.frame = frame;

  // Keep existing shots — lets the user change frame after capturing.
  renderFrameList();
  updateUI();

  if (STATE.shots.length > 0) {
    await renderFinalResult();
  }
}

function selectLayout(layout) {
  if (STATE.capturing) return;

  // Backward compatibility with an older "grid" button value.
  if (layout === "grid") layout = "grid6";

  const validLayouts = ["oval", "grid6", "grid4", "frameless"];
  if (!validLayouts.includes(layout)) return;

  STATE.layout = layout;
  STATE.shots = [];
  STATE.retakeIndex = null;
  STATE.resultReady = false;

  if (layout !== "frameless") {
    const frames = getFramesForLayout(layout);
    STATE.frame = frames[0] || null;
  } else {
    STATE.frame = null;
  }

  clearResult();
  updateLayoutButtons();
  renderFrameList();
  updateUI();
}

function updateLayoutButtons() {
  DOM.layoutCards.forEach(card => {
    let cardLayout = card.dataset.layout;
    if (cardLayout === "grid") cardLayout = "grid6";
    card.classList.toggle("active", cardLayout === STATE.layout);
  });
}

function setupLayoutButtons() {
  DOM.layoutCards.forEach(card => {
    card.addEventListener("click", () => {
      let layout = card.dataset.layout;
      if (layout === "grid") layout = "grid6";
      selectLayout(layout);
    });
  });
}

/* =====================================================
   UI UPDATES
===================================================== */

function updateCaptureModeLabel() {
  if (!DOM.captureMode) return;
  DOM.captureMode.textContent = getRenderLayout().label;
}

function updateFrameSectionCopy() {
  if (DOM.frameSectionTitle) {
    DOM.frameSectionTitle.textContent =
      STATE.layout === "frameless" ? "Choose Layout" : "Choose Frame";
  }

  if (DOM.frameHint) {
    DOM.frameHint.textContent =
      STATE.layout === "frameless"
        ? "Pick how many photos and how they're split — no printed frame, just clean panels."
        : "Pick a frame before or after taking your photos.";
  }
}

function updateRequiredShotDisplay() {
  const element = document.getElementById("requiredShots");
  if (!element) return;

  element.textContent = `${getRenderLayout().shotCount} Photos`;
}

function updateUI() {
  const renderLayout = getRenderLayout();
  const captured = STATE.shots.length;
  const total = renderLayout.shotCount;

  if (DOM.shotsCounter) {
    DOM.shotsCounter.textContent = `${captured} / ${total}`;
  }

  const needsFrame = STATE.layout !== "frameless" && !STATE.frame;

  if (DOM.startBtn) {
    DOM.startBtn.disabled = !STATE.cameraReady || STATE.capturing || needsFrame;

    if (STATE.capturing) {
      DOM.startBtn.textContent = "Capturing...";
    } else if (needsFrame) {
      DOM.startBtn.textContent = "Select a Frame First";
    } else if (!STATE.cameraReady) {
      DOM.startBtn.textContent = "Starting Camera...";
    } else if (STATE.shots.length >= total) {
      DOM.startBtn.textContent = "Retake / Capture Again";
    } else {
      DOM.startBtn.textContent = "Start Capturing";
    }
  }

  if (DOM.filterHint) {
    DOM.filterHint.textContent = `${FILTER_NAMES[STATE.filter]} · live`;
  }

  updateCaptureModeLabel();
  updateRequiredShotDisplay();
}

/* =====================================================
   CAMERA ENGINE
===================================================== */

async function startCamera() {
  if (STATE.cameraStarting || STATE.cameraReady) return;

  if (!DOM.video) {
    console.error("Video element not found.");
    return;
  }

  STATE.cameraStarting = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(CONFIG.CAMERA_CONSTRAINTS);

    STATE.stream = stream;
    DOM.video.srcObject = stream;
    await DOM.video.play();

    STATE.cameraReady = true;
    STATE.cameraStarting = false;

    updateUI();
    startLivePreview();
  } catch (error) {
    STATE.cameraStarting = false;
    STATE.cameraReady = false;
    console.error("Camera error:", error);

    if (DOM.startBtn) DOM.startBtn.disabled = true;

    alert("Unable to access your camera. Please allow camera permission and try again.");
  }
}

function stopCamera() {
  if (STATE.stream) {
    STATE.stream.getTracks().forEach(track => track.stop());
  }

  STATE.stream = null;
  STATE.cameraReady = false;

  if (DOM.video) DOM.video.srcObject = null;

  if (STATE.liveLoop) {
    cancelAnimationFrame(STATE.liveLoop);
    STATE.liveLoop = null;
  }
}

async function initializeCamera() {
  if (STATE.cameraReady || STATE.cameraStarting) return;
  await startCamera();
  updateUI();
}

/* =====================================================
   LIVE PREVIEW
===================================================== */

/* =====================================================
   LIVE PREVIEW
===================================================== */

/* =====================================================
   LIVE PREVIEW
   Mobile / Retina safe + full-area filter
===================================================== */

function startLivePreview() {

  if (!DOM.livePreview || !liveCtx) {
    return;
  }

  if (STATE.liveLoop) {
    cancelAnimationFrame(STATE.liveLoop);
    STATE.liveLoop = null;
  }

  /*
   * IMPORTANT:
   * Keep the internal live-preview canvas small.
   *
   * The CSS can still display the canvas at a large size,
   * but the filter only processes 480 x 360 pixels.
   *
   * This keeps the live camera smooth on Android
   * without reducing the quality of captured photos.
   */
  const PREVIEW_WIDTH = 480;
  const PREVIEW_HEIGHT = 360;

  /*
   * Set the internal canvas size ONCE.
   * Do NOT use devicePixelRatio here.
   */
  if (
    DOM.livePreview.width !== PREVIEW_WIDTH ||
    DOM.livePreview.height !== PREVIEW_HEIGHT
  ) {
    DOM.livePreview.width = PREVIEW_WIDTH;
    DOM.livePreview.height = PREVIEW_HEIGHT;
  }

  const frameInterval =
    1000 / CONFIG.LIVE_PREVIEW_FPS;

  function drawLivePreview(timestamp) {

    /*
     * Schedule next frame
     */
    STATE.liveLoop =
      requestAnimationFrame(drawLivePreview);

    /*
     * FPS limiter
     */
    if (
      timestamp - STATE.lastLiveRender <
      frameInterval
    ) {
      return;
    }

    STATE.lastLiveRender = timestamp;

    /*
     * Camera must be ready
     */
    if (
      !STATE.cameraReady ||
      DOM.video.readyState < 2
    ) {
      return;
    }

    const videoWidth =
      DOM.video.videoWidth;

    const videoHeight =
      DOM.video.videoHeight;

    if (!videoWidth || !videoHeight) {
      return;
    }

    /*
     * IMPORTANT:
     * Use the INTERNAL canvas dimensions,
     * not the CSS/display dimensions.
     */
    const previewWidth = PREVIEW_WIDTH;
    const previewHeight = PREVIEW_HEIGHT;

    /*
     * Reset transform.
     *
     * No devicePixelRatio scaling.
     */
    liveCtx.setTransform(
      1,
      0,
      0,
      1,
      0,
      0
    );

    liveCtx.clearRect(
      0,
      0,
      previewWidth,
      previewHeight
    );

    /*
     * Cover crop
     */
    const rect = coverRect(
      videoWidth,
      videoHeight,
      previewWidth,
      previewHeight,
      1
    );

    /*
     * Draw mirrored camera
     */
    liveCtx.save();

    if (CONFIG.MIRROR_CAPTURE) {

      liveCtx.translate(
        previewWidth,
        0
      );

      liveCtx.scale(
        -1,
        1
      );
    }

    liveCtx.drawImage(
      DOM.video,
      rect.offsetX,
      rect.offsetY,
      rect.drawW,
      rect.drawH
    );

    liveCtx.restore();

    /*
     * APPLY FILTER
     *
     * Same FILTER_ENGINE.
     * Same visual effect.
     *
     * The only difference is that the live
     * preview is processed at 480 x 360.
     */
    const filterFn =
      FILTER_ENGINE[STATE.filter] ||
      FILTER_ENGINE.none;

    if (
      filterFn !== FILTER_ENGINE.none
    ) {

      const imageData =
        liveCtx.getImageData(
          0,
          0,
          PREVIEW_WIDTH,
          PREVIEW_HEIGHT
        );

      filterFn(imageData);

      liveCtx.putImageData(
        imageData,
        0,
        0
      );
    }
  }

  /*
   * Start live preview
   */
  STATE.liveLoop =
    requestAnimationFrame(
      drawLivePreview
    );
}


/* =====================================================
   COUNTDOWN / FLASH
===================================================== */

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function runCountdown() {
  if (!DOM.countdown) return;

  DOM.countdown.classList.add("show");

  const duration =
    [3, 5, 7].includes(STATE.timerDuration)
      ? STATE.timerDuration
      : 3;

  for (let number = duration; number >= 1; number--) {

    DOM.countdown.textContent = number;

    DOM.countdown.classList.remove(
      "countdown-pop"
    );

    void DOM.countdown.offsetWidth;

    DOM.countdown.classList.add(
      "countdown-pop"
    );

    await sleep(
      CONFIG.COUNTDOWN_STEP_MS
    );
  }

  DOM.countdown.textContent = "✦";

  DOM.countdown.classList.remove(
    "countdown-pop"
  );

  void DOM.countdown.offsetWidth;

  DOM.countdown.classList.add(
    "countdown-pop"
  );

  await sleep(
    CONFIG.COUNTDOWN_GO_MS
  );

  DOM.countdown.classList.remove(
    "show"
  );
}

function triggerFlash() {
  if (!DOM.flash) return;

  DOM.flash.classList.remove("flash-active");
  void DOM.flash.offsetWidth; // restart the animation
  DOM.flash.classList.add("flash-active");

  setTimeout(() => DOM.flash.classList.remove("flash-active"), CONFIG.FLASH_DURATION_MS);
}

/* =====================================================
   CAPTURE
===================================================== */

function createCapturedPhoto() {
  if (!DOM.video || !DOM.video.videoWidth || !DOM.video.videoHeight) return null;

  const sourceWidth = DOM.video.videoWidth;
  const sourceHeight = DOM.video.videoHeight;

  const targetWidth = 1200;
  const targetHeight = Math.round(targetWidth * (sourceHeight / sourceWidth));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  ctx.save();
  ctx.translate(targetWidth, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(DOM.video, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  return applyFilter(canvas, STATE.filter);
}

async function captureOnePhoto() {
  if (!STATE.cameraReady) return null;

  await runCountdown();
  triggerFlash();

  // Tiny delay makes the flash feel synchronized with the capture.
  await sleep(80);

  return createCapturedPhoto();
}

function saveCapturedPhoto(photo) {
  if (!photo) return;

  if (STATE.retakeIndex !== null) {
    const index = STATE.retakeIndex;

    if (index >= 0 && index < STATE.shots.length) {
      STATE.shots[index] = photo;
    }

    STATE.retakeIndex = null;
  } else {
    STATE.shots.push(photo);
  }

  updateUI();
}

async function startCaptureSession() {
  if (!STATE.cameraReady || STATE.capturing) return;

  const renderLayout = getRenderLayout();
  const requiredShots = renderLayout.shotCount;

  // If all photos already exist, start a fresh session.
  if (STATE.shots.length >= requiredShots && STATE.retakeIndex === null) {
    STATE.shots = [];
    STATE.resultReady = false;
    clearResult();
  }

  STATE.capturing = true;
  updateUI();

  try {
    if (STATE.retakeIndex !== null) {
      const photo = await captureOnePhoto();
      saveCapturedPhoto(photo);
      await renderFinalResult();
      return;
    }

    while (STATE.shots.length < requiredShots) {
      const photo = await captureOnePhoto();
      if (photo) saveCapturedPhoto(photo);

      if (STATE.shots.length < requiredShots) {
        await sleep(350); // small pause between shots
      }
    }

    if (STATE.shots.length >= requiredShots) {
      await renderFinalResult();
    }
  } catch (error) {
    console.error("Capture session error:", error);
  } finally {
    STATE.capturing = false;
    updateUI();
  }
}

async function retakePhoto(index) {
  if (STATE.capturing) return;
  if (index < 0 || index >= STATE.shots.length) return;

  STATE.retakeIndex = index;

  const cameraCard = document.querySelector(".camera-card");
  if (cameraCard) {
    cameraCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  await startCaptureSession();
}

/* =====================================================
   RESULT RENDERING
===================================================== */

function clearResult() {
  if (DOM.resultCard) DOM.resultCard.style.display = "none";

  if (DOM.photostrip) {
    const ctx = DOM.photostrip.getContext("2d");
    ctx.clearRect(0, 0, DOM.photostrip.width, DOM.photostrip.height);
  }

  STATE.resultReady = false;
}

async function renderFinalResult() {
  if (!DOM.photostrip) return;
  if (STATE.shots.length === 0) return;

  const layout = getRenderLayout();

  if (STATE.shots.length < layout.shotCount) return;

  const canvas = DOM.photostrip;
  canvas.width = layout.width;
  canvas.height = layout.height;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // White background — important for frameless layouts.
  drawEmptyCanvasBackground(ctx, canvas.width, canvas.height);

  layout.slots.forEach((slot, index) => {
    const shot = STATE.shots[index];
    if (!shot) return;
    drawCapturedShot(ctx, shot, slot);
  });

  if (layout.frame && !CONFIG.DEBUG_HIDE_FRAME_OVERLAY) {
    try {
      const frameImage = await loadFrameImage(layout.frame);
      ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error("Frame render error:", error);
    }
  }

  drawCaption(ctx, canvas.width, canvas.height);
  drawTimestamp(ctx, canvas.width, canvas.height);

  STATE.resultReady = true;

  if (DOM.resultCard) DOM.resultCard.style.display = "block";
  if (DOM.downloadBtn) DOM.downloadBtn.disabled = false;

  renderRetakePanel();

  // On mobile, guide the user toward the result.
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      if (DOM.resultCard) {
        DOM.resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 250);
  }
}

/* =====================================================
   RETAKE PANEL
===================================================== */

function getRetakeContainer() {
  let container = document.getElementById("retakePanel");

  if (!container) {
    container = document.createElement("section");
    container.id = "retakePanel";
    container.className = "retake-panel";

    if (DOM.resultCard && DOM.resultCard.parentNode) {
      DOM.resultCard.parentNode.insertBefore(container, DOM.resultCard);
    }
  }

  return container;
}

function renderRetakePanel() {
  if (STATE.shots.length === 0) return;

  const panel = getRetakeContainer();
  panel.innerHTML = "";

  const title = document.createElement("div");
  title.className = "retake-header";

  const heading = document.createElement("h3");
  heading.textContent = "Retake a photo";

  const hint = document.createElement("p");
  hint.textContent = "Tap any photo to retake only that shot.";

  title.appendChild(heading);
  title.appendChild(hint);
  panel.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "retake-grid";

  STATE.shots.forEach((shot, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "retake-card";
    card.dataset.index = index;

    const image = document.createElement("img");
    image.src = shot.toDataURL("image/jpeg", 0.88);
    image.alt = `Photo ${index + 1}`;

    const badge = document.createElement("span");
    badge.className = "retake-number";
    badge.textContent = index + 1;

    const label = document.createElement("span");
    label.className = "retake-label";
    label.textContent = "Retake";

    card.appendChild(image);
    card.appendChild(badge);
    card.appendChild(label);

    card.addEventListener("click", async () => {
      if (STATE.capturing) return;
      await retakePhoto(index);
    });

    grid.appendChild(card);
  });

  panel.appendChild(grid);

  // Only show the retake panel after a complete result exists.
  panel.style.display = STATE.resultReady ? "block" : "none";
}

function clearRetakePanel() {
  const panel = document.getElementById("retakePanel");
  if (panel) {
    panel.innerHTML = "";
    panel.style.display = "none";
  }
}

/* =====================================================
   DOWNLOAD
===================================================== */

function downloadResult() {
  if (!STATE.resultReady || !DOM.photostrip) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  const filename = `${CONFIG.EXPORT_FILENAME_PREFIX}-${year}${month}${day}-${hour}${minute}.png`;

  const link = document.createElement("a");
  link.download = filename;
  link.href = DOM.photostrip.toDataURL("image/png");

  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* =====================================================
   CUSTOMIZE (timestamp / caption)
===================================================== */

function setupCustomize() {
  if (DOM.timestampToggle) {
    DOM.timestampToggle.addEventListener("change", () => {
      STATE.timestampEnabled = DOM.timestampToggle.checked;
      if (STATE.resultReady) renderFinalResult();
    });
  }

  if (DOM.captionInput) {
    DOM.captionInput.addEventListener("input", () => {
      STATE.caption = DOM.captionInput.value.slice(0, 40);
      if (STATE.resultReady) renderFinalResult();
    });
  }
}

/* =====================================================
   TIMER OPTIONS
===================================================== */

function setupTimerOptions() {

    if (
        !DOM.timerOptions ||
        DOM.timerOptions.length === 0
    ) {
        return;
    }


    DOM.timerOptions.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const duration =
                        Number(
                            button.dataset.timer
                        );


                    /*
                     * Only allow the three
                     * timer options.
                     */
                    if (
                        ![3, 5, 7].includes(
                            duration
                        )
                    ) {
                        return;
                    }


                    /*
                     * Save selected timer.
                     */
                    STATE.timerDuration =
                        duration;


                    /*
                     * Update active button.
                     */
                    DOM.timerOptions.forEach(
                        option => {

                            option.classList.toggle(
                                "active",
                                option === button
                            );

                        }
                    );


                    console.log(
                        `Timer selected: ${duration}s`
                    );

                }
            );

        }
    );

}


/* =====================================================
   SESSION MANAGEMENT
===================================================== */

function resetSession() {
  STATE.shots = [];
  STATE.retakeIndex = null;
  STATE.resultReady = false;
  STATE.capturing = false;

  clearResult();
  clearRetakePanel();
  updateUI();
}

function initializeFrame() {
  if (STATE.layout === "frameless") {
    STATE.frame = null;
    return;
  }

  const frames = getFramesForLayout(STATE.layout);
  STATE.frame = frames[0] || null;
}

function initializeResultState() {
  if (DOM.resultCard) DOM.resultCard.style.display = "none";
  if (DOM.downloadBtn) DOM.downloadBtn.disabled = true;
  clearRetakePanel();
}

/* =====================================================
   EVENT BINDINGS
===================================================== */

function setupCaptureEvent() {
  if (!DOM.startBtn) return;

  DOM.startBtn.addEventListener("click", async () => {
    if (!STATE.cameraReady) {
      await initializeCamera();
      return;
    }

    const layout = getRenderLayout();

    // If the result is already complete, start a fresh session.
    if (STATE.shots.length >= layout.shotCount && STATE.retakeIndex === null) {
      resetSession();
    }

    await startCaptureSession();
  });
}

function setupDownloadEvent() {
  if (!DOM.downloadBtn) return;
  DOM.downloadBtn.addEventListener("click", downloadResult);
}

function setupVisibilityEvents() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (STATE.liveLoop) {
        cancelAnimationFrame(STATE.liveLoop);
        STATE.liveLoop = null;
      }
    } else if (STATE.cameraReady) {
      startLivePreview();
    }
  });
}

function setupCameraErrorHandling() {
  if (!DOM.video) return;

  DOM.video.addEventListener("error", event => {
    console.error("Video element error:", event);
    STATE.cameraReady = false;
    updateUI();
  });
}

function resizeLivePreview() {
  if (!DOM.livePreview) return;

  // CSS controls the visible size; canvas backing resolution is updated
  // by the live preview loop itself.
  DOM.livePreview.style.width = "100%";
  DOM.livePreview.style.height = "100%";
}

/* =====================================================
   INITIALIZATION
===================================================== */

function initializeUI() {
  updateLayoutButtons();
  initializeFrame();
  renderFrameList();

  setupFilterButtons();
  setupLayoutButtons();
  setupCustomize();
  setupTimerOptions();

  setupCaptureEvent();
  setupDownloadEvent();

  setupVisibilityEvents();
  setupCameraErrorHandling();

  initializeResultState();
  updateUI();
  resizeLivePreview();
}

async function initializeApplication() {
  if (window.__SEEME_INITIALIZED__) return;
  window.__SEEME_INITIALIZED__ = true;

  console.log("SeeMe! Studio initializing...");

  initializeUI();
  await initializeCamera();

  console.log("SeeMe! Studio ready.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApplication, { once: true });
} else {
  initializeApplication();
}

/* =====================================================
   GLOBAL LIFECYCLE
===================================================== */

window.addEventListener("beforeunload", stopCamera);
window.addEventListener("pagehide", stopCamera);

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (STATE.cameraReady) startLivePreview();
  }, 150);
});

/* =====================================================
   END OF SeeMe! Studio
===================================================== */

})();