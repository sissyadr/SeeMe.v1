/* =====================================================
   SeeMe! Studio
   photobooth.js
   Production Render / Capture / Camera Engine (v4)

   Key behavior:
   - Filters are Canvas API pixel functions (FILTER ENGINE), not CSS.
   - The chosen filter is applied LIVE to the camera preview (via a
     <canvas id="livePreview">) and is baked into each captured shot
     at full resolution the moment it's taken.
   - Only two top-level categories: "oval" and "grid". Each determines
     the number of required shots.
   - Frame assets live in two folders, drop your .png files straight in:
       assets/frame/oval/*.png
       assets/frame/grid/*.png
   - Frame PNG selection can happen any time (browsable before capture),
     and can be freely swapped after a full set of shots exists.
===================================================== */

(() => {
"use strict";

/* =====================================================
   CONFIG
===================================================== */

const CONFIG = {

    COUNTDOWN_STEPS: [3, 2, 1],
    COUNTDOWN_STEP_MS: 900,
    COUNTDOWN_GO_MS: 350,

    // Mirror the webcam preview AND the captured photo so it behaves
    // like a normal selfie mirror
    MIRROR_CAPTURE: true,

    // How much extra the captured photo is scaled up beyond a strict
    // "cover" fit of its slot, and how many px the clip region is
    // inflated by. Both purposely overfill each slot so no sliver of
    // the white base canvas can peek through at curved/oval edges.
    PHOTO_ZOOM: 1.09,
    SLOT_INFLATE_PX: 8,

    CAMERA_CONSTRAINTS: {
        video: {
            facingMode: "user",
            width: { ideal: 1920 },
            height: { ideal: 1440 }
        },
        audio: false
    },

    // Live preview render loop. Kept modest on purpose — the heavier
    // filters (Comic Book, Old Movie) run a per-pixel pass every tick,
    // so 15fps keeps things smooth without cooking the CPU.
    LIVE_PREVIEW_FPS: 15,
    LIVE_PREVIEW_WIDTH: 480,
    LIVE_PREVIEW_HEIGHT: 360,

    EXPORT_FILENAME_PREFIX: "seeme",

    FLASH_DURATION_MS: 420,

    // DEBUG ONLY: set to true to skip drawing the frame PNG overlay,
    // so you can verify the captured photos are rendering correctly
    // inside their slots independent of the frame asset's transparency.
    DEBUG_HIDE_FRAME_OVERLAY: false

};

/* =====================================================
   LAYOUT META
   The only two top-level categories. Every frame belongs to exactly
   one of these, and every frame in a category shares its shot count
   and canvas dimensions.
===================================================== */

const LAYOUT_META = {
    oval: {
        id: "oval",
        label: "Oval",
        shotCount: 3,
        width: 1200,
        height: 1800
    },
    grid: {
        id: "grid",
        label: "Grid",
        shotCount: 6,
        width: 1058,
        height: 1600
    }
};

/* =====================================================
   SLOT GEOMETRY
   Shared by every frame in a layout — measured directly from the
   real frame assets' transparent windows.
===================================================== */

const SLOTS_OVAL = [
    { shape: "oval", x: 120, y: 84,   width: 938, height: 502 },
    { shape: "oval", x: 131, y: 648,  width: 937, height: 503 },
    { shape: "oval", x: 141, y: 1213, width: 938, height: 503 }
];

const SLOTS_GRID = [
    { shape: "rect", x: 37,  y: 69,  width: 474, height: 319 },
    { shape: "rect", x: 525, y: 69,  width: 475, height: 319 },
    { shape: "rect", x: 37,  y: 420, width: 474, height: 319 },
    { shape: "rect", x: 525, y: 420, width: 475, height: 319 },
    { shape: "rect", x: 37,  y: 771, width: 474, height: 319 },
    { shape: "rect", x: 525, y: 771, width: 475, height: 319 }
];

/* =====================================================
   DATABASE
   Every frame is one object with its own unique name and its .png in
   one of the two asset folders below:
       assets/frame/oval/<file>.png
       assets/frame/grid/<file>.png
   Drop your PNGs in with matching filenames (or edit `file` below to
   match whatever you name them) — everything else (slot count, canvas
   size, clip geometry) is inherited from LAYOUT_META / SLOTS_* above,
   so you never need to hand-measure a new frame again.
===================================================== */

const FRAMES = [

    /* ================= OVAL ================= */

    {
        id: "frutiger-oval-01",
        layout: "oval",
        name: "Frutiger Oval 01",
        file: "assets/frames/oval/frutiger-oval-01.png",
        width: LAYOUT_META.oval.width,
        height: LAYOUT_META.oval.height,
        slots: SLOTS_OVAL
    },

    {
        id: "gothic-oval-01",
        layout: "oval",
        name: "Gothic Oval 01",
        file: "assets/frames/oval/gothic-oval-01.png",
        width: LAYOUT_META.oval.width,
        height: LAYOUT_META.oval.height,
        slots: SLOTS_OVAL
    },

    {
        id: "pride-oval-01",
        layout: "oval",
        name: "Pride Oval 01",
        file: "assets/frames/oval/pride-oval-01.png",
        width: LAYOUT_META.oval.width,
        height: LAYOUT_META.oval.height,
        slots: SLOTS_OVAL
    },

    {
        id: "pride-oval-02",
        layout: "oval",
        name: "Pride Oval 02",
        file: "assets/frames/oval/pride-oval-02.png",
        width: LAYOUT_META.oval.width,
        height: LAYOUT_META.oval.height,
        slots: SLOTS_OVAL
    },

    {
        id: "pride-oval-03",
        layout: "oval",
        name: "Pride Oval 03",
        file: "assets/frames/oval/pride-oval-03.png",
        width: LAYOUT_META.oval.width,
        height: LAYOUT_META.oval.height,
        slots: SLOTS_OVAL
    },

    {
        id: "y2k-oval-01",
        layout: "oval",
        name: "Y2K Oval 01",
        file: "assets/frames/oval/y2k-oval-01.png",
        width: LAYOUT_META.oval.width,
        height: LAYOUT_META.oval.height,
        slots: SLOTS_OVAL
    },

    {
        id: "y2k-oval-02",
        layout: "oval",
        name: "Y2K Oval 02",
        file: "assets/frames/oval/y2k-oval-02.png",
        width: LAYOUT_META.oval.width,
        height: LAYOUT_META.oval.height,
        slots: SLOTS_OVAL
    },

    {
        id: "y2k-oval-03",
        layout: "oval",
        name: "Y2K Oval 03",
        file: "assets/frames/oval/y2k-oval-03.png",
        width: LAYOUT_META.oval.width,
        height: LAYOUT_META.oval.height,
        slots: SLOTS_OVAL
    },

    {
        id: "y2k-oval-04",
        layout: "oval",
        name: "Y2K Oval 04",
        file: "assets/frames/oval/y2k-oval-04.png",
        width: LAYOUT_META.oval.width,
        height: LAYOUT_META.oval.height,
        slots: SLOTS_OVAL
    },


    /* ================= GRID ================= */

    {
        id: "frutiger-grid6-01",
        layout: "grid",
        name: "Frutiger Grid 01",
        file: "assets/frames/grid/frutiger-grid6-01.png",
        width: LAYOUT_META.grid.width,
        height: LAYOUT_META.grid.height,
        slots: SLOTS_GRID
    },

    {
        id: "gothic-grid6-01",
        layout: "grid",
        name: "Gothic Grid 01",
        file: "assets/frames/grid/gothic-grid6-01.png",
        width: LAYOUT_META.grid.width,
        height: LAYOUT_META.grid.height,
        slots: SLOTS_GRID
    },

    {
        id: "pride-grid6-01",
        layout: "grid",
        name: "Pride Grid 01",
        file: "assets/frames/grid/pride-grid6-01.png",
        width: LAYOUT_META.grid.width,
        height: LAYOUT_META.grid.height,
        slots: SLOTS_GRID
    },

    {
        id: "pride-grid6-02",
        layout: "grid",
        name: "Pride Grid 02",
        file: "assets/frames/grid/pride-grid6-02.png",
        width: LAYOUT_META.grid.width,
        height: LAYOUT_META.grid.height,
        slots: SLOTS_GRID
    },

    {
        id: "pride-grid6-03",
        layout: "grid",
        name: "Pride Grid 03",
        file: "assets/frames/grid/pride-grid6-03.png",
        width: LAYOUT_META.grid.width,
        height: LAYOUT_META.grid.height,
        slots: SLOTS_GRID
    },

    {
        id: "y2k-grid6-01",
        layout: "grid",
        name: "Y2K Grid 01",
        file: "assets/frames/grid/y2k-grid6-01.png",
        width: LAYOUT_META.grid.width,
        height: LAYOUT_META.grid.height,
        slots: SLOTS_GRID
    },

    {
        id: "y2k-grid6-02",
        layout: "grid",
        name: "Y2K Grid 02",
        file: "assets/frames/grid/y2k-grid6-02.png",
        width: LAYOUT_META.grid.width,
        height: LAYOUT_META.grid.height,
        slots: SLOTS_GRID
    },

    {
        id: "y2k-grid6-03",
        layout: "grid",
        name: "Y2K Grid 03",
        file: "assets/frames/grid/y2k-grid6-03.png",
        width: LAYOUT_META.grid.width,
        height: LAYOUT_META.grid.height,
        slots: SLOTS_GRID
    },

    {
        id: "y2k-grid6-04",
        layout: "grid",
        name: "Y2K Grid 04",
        file: "assets/frames/grid/y2k-grid6-04.png",
        width: LAYOUT_META.grid.width,
        height: LAYOUT_META.grid.height,
        slots: SLOTS_GRID
    }

];

/* =====================================================
   FILTER ENGINE
   Every filter is its own Canvas API pixel-processing function.
   Signature: (imageData) => imageData. Each function mutates
   imageData.data in place and returns the same object, so callers can
   do `ctx.putImageData(FILTER_ENGINE[id](ctx.getImageData(...)), 0, 0)`.

   These run at BOTH the live-preview resolution (real time, every
   tick) and at full capture resolution (once, per shot) — so the
   downloaded photo always matches exactly what was seen live.
===================================================== */

function clamp(v) {
    return v < 0 ? 0 : v > 255 ? 255 : v;
}

function heatColor(t) {
    // 0 -> near-black/blue, 0.25 -> purple, 0.5 -> red,
    // 0.75 -> orange, 1 -> pale yellow/white. Classic thermal-camera ramp.
    const stops = [
        [0.00, 8,   8,   40 ],
        [0.25, 90,  0,   160],
        [0.50, 220, 20,  20 ],
        [0.75, 255, 150, 0  ],
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
    return [last[1], last[2], last[3]];
}

const FILTER_ENGINE = {

    none(imageData) {
        return imageData;
    },

    warm(imageData) {
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
            d[i]     = clamp(d[i]     * 1.18 + 12);
            d[i + 1] = clamp(d[i + 1] * 1.05 + 4);
            d[i + 2] = clamp(d[i + 2] * 0.82);
        }
        return imageData;
    },

    vintage(imageData) {
        const { data, width, height } = imageData;
        const cx = width / 2, cy = height / 2;
        const maxDist = Math.sqrt(cx * cx + cy * cy);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                let r = data[i], g = data[i + 1], b = data[i + 2];

                const avg = (r + g + b) / 3;
                r = r * 0.6 + avg * 0.4;
                g = g * 0.6 + avg * 0.4;
                b = b * 0.6 + avg * 0.4;

                const nr = r * 0.95 + g * 0.05 + 20;
                const ng = g * 0.9 + 10;
                const nb = b * 0.7;

                const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
                const vig = 1 - Math.min(dist * 0.55, 0.45);

                data[i]     = clamp(nr * vig);
                data[i + 1] = clamp(ng * vig);
                data[i + 2] = clamp(nb * vig);
            }
        }
        return imageData;
    },

    bw(imageData) {
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
            const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
            const c = clamp((gray - 128) * 1.2 + 128 + 8);
            d[i] = d[i + 1] = d[i + 2] = c;
        }
        return imageData;
    },

    oldmovie(imageData) {
        const { data, width, height } = imageData;
        const cx = width / 2, cy = height / 2;
        const maxDist = Math.sqrt(cx * cx + cy * cy);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                const noise = (Math.random() - 0.5) * 35;

                const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
                const vig = 1 - Math.min(dist * 0.75, 0.6);

                const v = clamp((gray + noise) * vig);
                data[i]     = clamp(v * 1.02);
                data[i + 1] = clamp(v * 0.98);
                data[i + 2] = clamp(v * 0.85);
            }
        }
        return imageData;
    },

    cocktail(imageData) {
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
            let r = d[i], g = d[i + 1], b = d[i + 2];

            // lift shadows into a soft pastel wash, then push a warm/pink tint
            r = r * 0.85 + 255 * 0.15;
            g = g * 0.85 + 230 * 0.15;
            b = b * 0.85 + 255 * 0.15;

            d[i]     = clamp(r * 1.05 + 10);
            d[i + 1] = clamp(g);
            d[i + 2] = clamp(b * 1.12 + 8);
        }
        return imageData;
    },

    spycam(imageData) {
        const { data, width, height } = imageData;
        const cx = width / 2, cy = height / 2;
        const maxDist = Math.sqrt(cx * cx + cy * cy);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                const noise = (Math.random() - 0.5) * 22;

                const scanline = (y % 3 === 0) ? 0.85 : 1;
                const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
                const vig = 1 - Math.min(dist * 0.7, 0.55);

                const v = clamp(gray * 1.15 + noise) * scanline * vig;

                data[i]     = clamp(v * 0.25);
                data[i + 1] = clamp(v * 1.35);
                data[i + 2] = clamp(v * 0.35);
            }
        }
        return imageData;
    },

    comicbook(imageData) {
        const { data, width, height } = imageData;

        // 1) grayscale buffer for edge detection
        const gray = new Uint8ClampedArray(width * height);
        for (let p = 0; p < width * height; p++) {
            const i = p * 4;
            gray[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        }

        // 2) posterize the color channels
        const levels = 4;
        const step = 255 / (levels - 1);
        for (let i = 0; i < data.length; i += 4) {
            data[i]     = clamp(Math.round(data[i]     / step) * step * 1.05);
            data[i + 1] = clamp(Math.round(data[i + 1] / step) * step * 1.05);
            data[i + 2] = clamp(Math.round(data[i + 2] / step) * step * 1.05);
        }

        // 3) Sobel edge detection -> black outline where edges are strong
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const tl = gray[(y - 1) * width + (x - 1)];
                const t  = gray[(y - 1) * width + x];
                const tr = gray[(y - 1) * width + (x + 1)];
                const l  = gray[y * width + (x - 1)];
                const r  = gray[y * width + (x + 1)];
                const bl = gray[(y + 1) * width + (x - 1)];
                const b  = gray[(y + 1) * width + x];
                const br = gray[(y + 1) * width + (x + 1)];

                const gx = -tl + tr - 2 * l + 2 * r - bl + br;
                const gy = -tl - 2 * t - tr + bl + 2 * b + br;
                const mag = Math.sqrt(gx * gx + gy * gy);

                if (mag > 90) {
                    const i = (y * width + x) * 4;
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                }
            }
        }

        return imageData;
    },

    thermal(imageData) {
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
            const gray = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
            const [r, g, b] = heatColor(gray);
            d[i] = r;
            d[i + 1] = g;
            d[i + 2] = b;
        }
        return imageData;
    },

    traditional(imageData) {
        const { data, width, height } = imageData;
        const cx = width / 2, cy = height / 2;
        const maxDist = Math.sqrt(cx * cx + cy * cy);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                let r = data[i], g = data[i + 1], b = data[i + 2];

                const avg = (r + g + b) / 3;
                r = r * 0.75 + avg * 0.25;
                g = g * 0.75 + avg * 0.25;
                b = b * 0.75 + avg * 0.25;

                // gentle classic sepia matrix
                const nr = clamp(r * 0.393 + g * 0.769 + b * 0.189);
                const ng = clamp(r * 0.349 + g * 0.686 + b * 0.168);
                const nb = clamp(r * 0.272 + g * 0.534 + b * 0.131);

                const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
                const vig = 1 - Math.min(dist * 0.35, 0.25);

                data[i]     = clamp(nr * vig * 1.02);
                data[i + 1] = clamp(ng * vig);
                data[i + 2] = clamp(nb * vig * 0.92);
            }
        }
        return imageData;
    }

};

const FILTER_LABELS = {
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
   DOM
===================================================== */

const DOM = {

    layoutCards:   document.querySelectorAll("[data-layout]"),
    filterButtons: document.querySelectorAll("[data-filter]"),

    frameList:  document.getElementById("frameList"),
    frameCount: document.getElementById("frameCount"),
    filterHint: document.getElementById("filterHint"),

    video:       document.getElementById("video"),
    livePreview: document.getElementById("livePreview"),
    countdown:   document.getElementById("countdown"),
    flash:       document.getElementById("flash"),

    startBtn:     document.getElementById("startBtn"),
    shotsCounter: document.getElementById("shotsCounter"),

    timestampToggle: document.getElementById("timestampToggle"),
    captionInput:    document.getElementById("captionInput"),

    resultCard:  document.getElementById("resultCard"),
    photostrip:  document.getElementById("photostrip"),
    downloadBtn: document.getElementById("downloadBtn")

};

const CTX = DOM.photostrip.getContext("2d");

/* =====================================================
   STATE
===================================================== */

const STATE = {

    layout: "oval",
    filter: "none",

    frame: null,          // currently selected frame object (may be picked
                           // before capture just for browsing, is required
                           // to actually render once shots exist)
    frameImageCache: {},  // id -> loaded HTMLImageElement of frame.file

    stream: null,
    cameraReady: false,

    isCapturing: false,
    capturedShots: [],    // per-slot canvases, already filter-baked

    timestampEnabled: false,
    caption: "",

    hasRendered: false

};

/* =====================================================
   UTILS
===================================================== */

function getFramesFor(layout) {
    return FRAMES.filter(f => f.layout === layout);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image: " + src));
        img.src = src;
    });
}

async function getFrameImage(frame) {
    if (STATE.frameImageCache[frame.id]) {
        return STATE.frameImageCache[frame.id];
    }
    const img = await loadImage(frame.file);
    STATE.frameImageCache[frame.id] = img;
    return img;
}

// "Cover" fit of a source image inside a target box, overscanned by
// `zoom` so the slot is always slightly overfilled (never underfilled).
function coverRect(sourceW, sourceH, targetW, targetH, zoom) {
    const z = zoom || 1;
    const scale = Math.max(targetW / sourceW, targetH / sourceH) * z;

    const drawW = sourceW * scale;
    const drawH = sourceH * scale;

    const offsetX = (targetW - drawW) / 2;
    const offsetY = (targetH - drawH) / 2;

    return { drawW, drawH, offsetX, offsetY };
}

/* =====================================================
   SHAPES
   Clip-path builders keyed by slot.shape. Future-proof: heart/circle/
   star are already wired even though no frame uses them yet.
===================================================== */

const SHAPES = {

    rect(ctx, slot) {
        ctx.beginPath();
        ctx.rect(slot.x, slot.y, slot.width, slot.height);
        ctx.closePath();
    },

    oval(ctx, slot) {
        const cx = slot.x + slot.width / 2;
        const cy = slot.y + slot.height / 2;
        const rx = slot.width / 2;
        const ry = slot.height / 2;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.closePath();
    },

    circle(ctx, slot) {
        const cx = slot.x + slot.width / 2;
        const cy = slot.y + slot.height / 2;
        const r = Math.min(slot.width, slot.height) / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();
    },

    heart(ctx, slot) {
        const x = slot.x, y = slot.y, w = slot.width, h = slot.height;

        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h * 0.28);

        ctx.bezierCurveTo(
            x + w * 0.1, y - h * 0.12,
            x - w * 0.05, y + h * 0.45,
            x + w / 2, y + h
        );

        ctx.bezierCurveTo(
            x + w * 1.05, y + h * 0.45,
            x + w * 0.9, y - h * 0.12,
            x + w / 2, y + h * 0.28
        );

        ctx.closePath();
    },

    star(ctx, slot) {
        const cx = slot.x + slot.width / 2;
        const cy = slot.y + slot.height / 2;
        const outerR = Math.min(slot.width, slot.height) / 2;
        const innerR = outerR * 0.45;
        const points = 5;

        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outerR : innerR;
            const angle = (Math.PI / points) * i - Math.PI / 2;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

};

function inflateSlot(slot, inflate) {
    if (!inflate) return slot;
    return {
        ...slot,
        x: slot.x - inflate,
        y: slot.y - inflate,
        width: slot.width + inflate * 2,
        height: slot.height + inflate * 2
    };
}

function clipSlot(ctx, slot, inflate) {
    const builder = SHAPES[slot.shape] || SHAPES.rect;
    builder(ctx, inflateSlot(slot, inflate));
    ctx.clip();
}

/* =====================================================
   UI ENGINE
===================================================== */

const UIEngine = {

    init() {
        this.renderFrameList();
        this.syncActiveButtons();
    },

    setActiveGroup(nodeList, key, value) {
        nodeList.forEach(node => {
            node.classList.toggle("active", node.dataset[key] === value);
        });
    },

    syncActiveButtons() {
        this.setActiveGroup(DOM.layoutCards, "layout", STATE.layout);
        this.setActiveGroup(DOM.filterButtons, "filter", STATE.filter);
        if (DOM.filterHint) {
            DOM.filterHint.textContent = FILTER_LABELS[STATE.filter] + " · live";
        }
    },

    renderFrameList() {

        const frames = getFramesFor(STATE.layout);

        DOM.frameList.innerHTML = "";

        frames.forEach(frame => {

            const card = document.createElement("button");
            card.type = "button";
            card.className = "frame-card";
            card.dataset.frameId = frame.id;

            if (STATE.frame && STATE.frame.id === frame.id) {
                card.classList.add("active");
            }

            const img = document.createElement("img");
            img.src = frame.file;
            img.alt = frame.name;
            img.loading = "lazy";

            const label = document.createElement("div");
            label.className = "frame-name";
            label.textContent = frame.name;

            card.appendChild(img);
            card.appendChild(label);

            card.addEventListener("click", () => {
                this.selectFrame(frame.id);
            });

            DOM.frameList.appendChild(card);

        });

        DOM.frameCount.textContent = frames.length + " Frames";

        // Keep a sensible default selected so a full capture always
        // has *something* to render immediately, even if the person
        // never clicked a frame card themselves.
        const stillValid = STATE.frame && STATE.frame.layout === STATE.layout;
        if (!stillValid) {
            STATE.frame = frames[0] || null;
        }

    },

    selectLayout(layout) {
        if (STATE.layout === layout) return;
        STATE.layout = layout;
        CaptureEngine.resetShots();
        this.syncActiveButtons();
        this.renderFrameList();
        CameraEngine.refreshStartButtonState();
    },

    selectFrame(frameId) {

        const frame = FRAMES.find(f => f.id === frameId);
        if (!frame) return;

        STATE.frame = frame;

        document.querySelectorAll(".frame-card").forEach(card => {
            card.classList.toggle("active", card.dataset.frameId === frameId);
        });

        // Only re-render if a full set of shots already exists —
        // this is what lets people swap frames freely AFTER capture
        // without needing to shoot again.
        const required = LAYOUT_META[STATE.layout].shotCount;
        if (STATE.capturedShots.length === required) {
            RenderEngine.renderFinal();
        }

    },

    selectFilter(filterId) {
        if (!FILTER_ENGINE[filterId]) return;
        STATE.filter = filterId;
        this.syncActiveButtons();
        // Applies live from the next preview tick onward. Already-
        // captured shots keep whatever filter was baked in at the
        // moment they were taken, same as a real photobooth.
    },

    updateShotCounter() {
        const total = LAYOUT_META[STATE.layout] ? LAYOUT_META[STATE.layout].shotCount : 0;
        DOM.shotsCounter.textContent = STATE.capturedShots.length + " / " + total;
    }

};

/* =====================================================
   LIVE PREVIEW ENGINE
   Continuously draws the mirrored webcam feed into a visible canvas,
   running the currently-selected FILTER_ENGINE function on every
   tick so what the person sees is what they'll actually capture.
===================================================== */

const LivePreviewEngine = {

    ctx: null,
    timer: null,

    setup() {
        DOM.livePreview.width = CONFIG.LIVE_PREVIEW_WIDTH;
        DOM.livePreview.height = CONFIG.LIVE_PREVIEW_HEIGHT;
        this.ctx = DOM.livePreview.getContext("2d", { willReadFrequently: true });
    },

    start() {
        this.stop();
        const intervalMs = Math.round(1000 / CONFIG.LIVE_PREVIEW_FPS);
        this.timer = setInterval(() => this.renderFrame(), intervalMs);
    },

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    renderFrame() {

        const video = DOM.video;
        if (!video.videoWidth || !video.videoHeight) return;

        const targetW = DOM.livePreview.width;
        const targetH = DOM.livePreview.height;

        // Cover-crop the source video so it fills the 4:3 preview box
        // without squishing, regardless of the camera's native aspect.
        const videoRatio = video.videoWidth / video.videoHeight;
        const targetRatio = targetW / targetH;

        let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;

        if (videoRatio > targetRatio) {
            sw = video.videoHeight * targetRatio;
            sx = (video.videoWidth - sw) / 2;
        } else {
            sh = video.videoWidth / targetRatio;
            sy = (video.videoHeight - sh) / 2;
        }

        this.ctx.save();
        if (CONFIG.MIRROR_CAPTURE) {
            this.ctx.translate(targetW, 0);
            this.ctx.scale(-1, 1);
        }
        this.ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);
        this.ctx.restore();

        const filterFn = FILTER_ENGINE[STATE.filter] || FILTER_ENGINE.none;
        if (filterFn !== FILTER_ENGINE.none) {
            const imageData = this.ctx.getImageData(0, 0, targetW, targetH);
            filterFn(imageData);
            this.ctx.putImageData(imageData, 0, 0);
        }

    }

};

/* =====================================================
   CAMERA ENGINE
===================================================== */

const CameraEngine = {

    async init() {
        try {

            STATE.stream = await navigator.mediaDevices.getUserMedia(
                CONFIG.CAMERA_CONSTRAINTS
            );

            DOM.video.srcObject = STATE.stream;
            await DOM.video.play();
            await this.waitForMetadata();

            LivePreviewEngine.setup();
            LivePreviewEngine.start();

            STATE.cameraReady = true;
            this.refreshStartButtonState();

        } catch (err) {
            console.error("Camera init failed:", err);
            STATE.cameraReady = false;
            DOM.startBtn.disabled = true;
            DOM.startBtn.textContent = "Camera Unavailable";
        }
    },

    waitForMetadata() {
        return new Promise(resolve => {
            if (DOM.video.videoWidth) {
                resolve();
                return;
            }
            DOM.video.addEventListener("loadedmetadata", () => resolve(), { once: true });
        });
    },

    stop() {
        LivePreviewEngine.stop();
        if (STATE.stream) {
            STATE.stream.getTracks().forEach(track => track.stop());
            STATE.stream = null;
        }
        STATE.cameraReady = false;
    },

    refreshStartButtonState() {
        const ready = STATE.cameraReady && !STATE.isCapturing;

        DOM.startBtn.disabled = !ready;

        if (!STATE.cameraReady) {
            DOM.startBtn.textContent = "Starting Camera...";
        } else if (!STATE.isCapturing) {
            DOM.startBtn.textContent = STATE.hasRendered ? "Retake" : "Start Capturing";
        }
    }

};

/* =====================================================
   FLASH ENGINE
===================================================== */

const FlashEngine = {

    trigger() {
        if (!DOM.flash) return;
        DOM.flash.classList.remove("flash-pulse");
        void DOM.flash.offsetWidth; // force reflow so the animation restarts
        DOM.flash.classList.add("flash-pulse");
    }

};

/* =====================================================
   CAPTURE ENGINE
===================================================== */

const CaptureEngine = {

    resetShots() {
        STATE.capturedShots = [];
        STATE.hasRendered = false;
        UIEngine.updateShotCounter();
        CameraEngine.refreshStartButtonState();
        this.clearCanvas();
        DOM.downloadBtn.disabled = true;
        DOM.resultCard.style.display = "none";
    },

    clearCanvas() {
        CTX.clearRect(0, 0, DOM.photostrip.width, DOM.photostrip.height);
    },

    async startSequence() {

        if (STATE.isCapturing || !STATE.cameraReady) return;

        this.resetShots();

        STATE.isCapturing = true;
        DOM.startBtn.disabled = true;
        DOM.startBtn.textContent = "Capturing...";

        const totalSlots = LAYOUT_META[STATE.layout].shotCount;

        for (let i = 0; i < totalSlots; i++) {
            await this.runCountdown();
            FlashEngine.trigger();
            this.captureFrame();
            UIEngine.updateShotCounter();
            await this.delay(CONFIG.FLASH_DURATION_MS);
        }

        STATE.isCapturing = false;

        // Make sure a frame from the current layout is selected so the
        // result renders immediately, even if the person never clicked
        // a frame card before shooting.
        if (!STATE.frame || STATE.frame.layout !== STATE.layout) {
            const frames = getFramesFor(STATE.layout);
            STATE.frame = frames[0] || null;
            if (STATE.frame) {
                document.querySelectorAll(".frame-card").forEach(card => {
                    card.classList.toggle("active", card.dataset.frameId === STATE.frame.id);
                });
            }
        }

        await RenderEngine.renderFinal();

        CameraEngine.refreshStartButtonState();

    },

    runCountdown() {
        return new Promise(resolve => {

            DOM.countdown.style.display = "flex";
            let index = 0;

            const tick = () => {

                if (index < CONFIG.COUNTDOWN_STEPS.length) {
                    DOM.countdown.textContent = CONFIG.COUNTDOWN_STEPS[index];
                    index++;
                    setTimeout(tick, CONFIG.COUNTDOWN_STEP_MS);
                } else {
                    DOM.countdown.textContent = "📸";
                    setTimeout(() => {
                        DOM.countdown.style.display = "none";
                        resolve();
                    }, CONFIG.COUNTDOWN_GO_MS);
                }

            };

            tick();

        });
    },

    // Captures a full-resolution frame straight from the <video>
    // element (not the smaller live-preview canvas) and bakes the
    // currently-selected filter into it at full quality.
    captureFrame() {

        const video = DOM.video;
        const w = video.videoWidth;
        const h = video.videoHeight;

        if (!w || !h) return;

        const shotCanvas = document.createElement("canvas");
        shotCanvas.width = w;
        shotCanvas.height = h;

        const shotCtx = shotCanvas.getContext("2d", { willReadFrequently: true });

        shotCtx.save();
        if (CONFIG.MIRROR_CAPTURE) {
            shotCtx.translate(w, 0);
            shotCtx.scale(-1, 1);
        }
        shotCtx.drawImage(video, 0, 0, w, h);
        shotCtx.restore();

        const filterFn = FILTER_ENGINE[STATE.filter] || FILTER_ENGINE.none;
        if (filterFn !== FILTER_ENGINE.none) {
            const imageData = shotCtx.getImageData(0, 0, w, h);
            filterFn(imageData);
            shotCtx.putImageData(imageData, 0, 0);
        }

        STATE.capturedShots.push(shotCanvas);

    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

};

/* =====================================================
   RENDER ENGINE
   Composites already-filtered shots into the chosen frame's slots and
   overlays the frame PNG. No filter work happens here anymore — that
   was already baked in at capture time — so switching frames after
   capture is a cheap, instant redraw.
===================================================== */

const RenderEngine = {

    async renderFinal() {

        const frame = STATE.frame;
        if (!frame || STATE.capturedShots.length === 0) return;

        const meta = LAYOUT_META[frame.layout];
        const canvasW = frame.width || meta.width;
        const canvasH = frame.height || meta.height;

        DOM.photostrip.width = canvasW;
        DOM.photostrip.height = canvasH;

        CTX.clearRect(0, 0, canvasW, canvasH);

        // White base so transparent frame PNGs still export a clean
        // background instead of a black/transparent canvas.
        CTX.fillStyle = "#ffffff";
        CTX.fillRect(0, 0, canvasW, canvasH);

        frame.slots.forEach((slot, index) => {

            const source = STATE.capturedShots[index];
            if (!source) return;

            CTX.save();
            clipSlot(CTX, slot, CONFIG.SLOT_INFLATE_PX);

            const { drawW, drawH, offsetX, offsetY } = coverRect(
                source.width,
                source.height,
                slot.width,
                slot.height,
                CONFIG.PHOTO_ZOOM
            );

            CTX.drawImage(
                source,
                slot.x + offsetX,
                slot.y + offsetY,
                drawW,
                drawH
            );

            CTX.restore();

        });

        if (!CONFIG.DEBUG_HIDE_FRAME_OVERLAY) {
            const frameImg = await getFrameImage(frame);
            CTX.drawImage(frameImg, 0, 0, canvasW, canvasH);
        }

        this.drawOverlayText(canvasW, canvasH);

        STATE.hasRendered = true;
        DOM.downloadBtn.disabled = false;
        DOM.resultCard.style.display = "block";

        CameraEngine.refreshStartButtonState();

    },

    drawOverlayText(canvasW, canvasH) {

        const captionText = (STATE.caption || "").trim();
        const showTimestamp = STATE.timestampEnabled;

        if (!captionText && !showTimestamp) return;

        CTX.save();
        CTX.textAlign = "center";
        CTX.textBaseline = "alphabetic";
        CTX.lineJoin = "round";

        const bottomY = canvasH - Math.round(canvasH * 0.02);
        const captionSize = Math.round(canvasW * 0.05);
        const stampSize = Math.round(canvasW * 0.028);

        let y = bottomY;

        if (showTimestamp) {
            const now = new Date();
            const stamp =
                now.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }) +
                "  " +
                now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

            CTX.font = "500 " + stampSize + "px Poppins, sans-serif";
            CTX.lineWidth = Math.max(2, canvasW * 0.004);
            CTX.strokeStyle = "rgba(0,0,0,0.55)";
            CTX.fillStyle = "#ffffff";
            CTX.strokeText(stamp, canvasW / 2, y);
            CTX.fillText(stamp, canvasW / 2, y);

            y -= stampSize + Math.round(canvasH * 0.012);
        }

        if (captionText) {
            CTX.font = "600 " + captionSize + "px Poppins, sans-serif";
            CTX.lineWidth = Math.max(3, canvasW * 0.007);
            CTX.strokeStyle = "rgba(0,0,0,0.55)";
            CTX.fillStyle = "#ffffff";
            CTX.strokeText(captionText, canvasW / 2, y);
            CTX.fillText(captionText, canvasW / 2, y);
        }

        CTX.restore();

    }

};

/* =====================================================
   DOWNLOAD ENGINE
===================================================== */

const DownloadEngine = {

    download() {
        if (!STATE.hasRendered) return;

        const link = document.createElement("a");
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");

        link.download = CONFIG.EXPORT_FILENAME_PREFIX + "-" + stamp + ".png";
        link.href = DOM.photostrip.toDataURL("image/png", 1.0);
        link.click();
    }

};

/* =====================================================
   EVENT BINDINGS
===================================================== */

function debounce(fn, ms) {
    let t = null;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

function bindEvents() {

    DOM.layoutCards.forEach(card => {
        card.addEventListener("click", () => {
            UIEngine.selectLayout(card.dataset.layout);
        });
    });

    DOM.filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            UIEngine.selectFilter(btn.dataset.filter);
        });
    });

    DOM.startBtn.addEventListener("click", () => {
        CaptureEngine.startSequence();
    });

    DOM.downloadBtn.addEventListener("click", () => {
        DownloadEngine.download();
    });

    if (DOM.timestampToggle) {
        DOM.timestampToggle.addEventListener("change", () => {
            STATE.timestampEnabled = DOM.timestampToggle.checked;
            if (STATE.hasRendered) RenderEngine.renderFinal();
        });
    }

    if (DOM.captionInput) {
        const onCaptionChange = debounce(() => {
            STATE.caption = DOM.captionInput.value;
            if (STATE.hasRendered) RenderEngine.renderFinal();
        }, 250);
        DOM.captionInput.addEventListener("input", onCaptionChange);
    }

    window.addEventListener("beforeunload", () => {
        CameraEngine.stop();
    });

}

/* =====================================================
   INIT
===================================================== */

function init() {
    DOM.downloadBtn.disabled = true;
    DOM.resultCard.style.display = "none";
    UIEngine.init();
    bindEvents();
    CameraEngine.init();
}

document.addEventListener("DOMContentLoaded", init);

})();