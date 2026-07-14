/* =====================================================
   SeeMe! Studio
   photobooth.js
   Production Render / Capture / Camera Engine (v2)
===================================================== */

(() => {
"use strict";

/* =====================================================
   CONFIG
===================================================== */

const CONFIG = {

    // Final export canvas size (matches frame.width / frame.height per-frame,
    // this is only the fallback if a frame does not define its own size)
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 1800,

    COUNTDOWN_STEPS: [3, 2, 1],
    COUNTDOWN_STEP_MS: 900,
    COUNTDOWN_GO_MS: 350,

    // Mirror the webcam preview AND the captured photo so it behaves
    // like a normal selfie mirror
    MIRROR_CAPTURE: true,

    // How much extra the captured photo is scaled up beyond a strict
    // "cover" fit of its slot. This purposely overfills each slot so no
    // sliver of the white base canvas can peek through at the edges
    // (anti-aliasing on curved/oval clips, or tiny asset/coordinate
    // rounding) — the frame artwork drawn on top masks the overflow.
    PHOTO_ZOOM: 1.09,

    // Extra pixels the clip region is inflated by (in canvas space)
    // on every side, for the same reason as PHOTO_ZOOM above.
    SLOT_INFLATE_PX: 8,

    CAMERA_CONSTRAINTS: {
        video: {
            facingMode: "user",
            width: { ideal: 1920 },
            height: { ideal: 1440 }
        },
        audio: false
    },

    EXPORT_FILENAME_PREFIX: "seeme-photobooth",

    FLASH_DURATION_MS: 420,

    // DEBUG ONLY: set to true to skip drawing the frame PNG overlay,
    // so you can verify the captured photos are rendering correctly
    // inside their slots independent of the frame asset's transparency.
    DEBUG_HIDE_FRAME_OVERLAY: false,

    FILTERS: {
        none: {
            id: "none",
            label: "Original",
            css: "none"
        },
        warm: {
            id: "warm",
            label: "Warm",
            css: "sepia(0.35) saturate(1.45) brightness(1.06) contrast(1.05)"
        },
        vintage: {
            id: "vintage",
            label: "Vintage",
            css: "sepia(0.5) contrast(0.9) brightness(0.92) saturate(0.72) hue-rotate(-8deg)"
        },
        bw: {
            id: "bw",
            label: "B&W",
            css: "grayscale(1) contrast(1.12) brightness(1.04)"
        }
    }

};

/* =====================================================
   DATABASE
   Every frame is one object. Never hardcode "shots: N",
   always derive the shot count from frame.slots.length.
===================================================== */

const FRAMES = [

    /* ================= Y2K / OVAL ================= */
    {
        id: "y2k-oval-01",
        collection: "y2k",
        layout: "oval",
        name: "Y2K Oval Chrome",
        file: "assets/frames/y2k/oval/y2k-oval-01.png",
        width: 1200,
        height: 1800,
        slots: [
            { shape: "oval", x: 120, y: 84,   width: 938, height: 502 },
            { shape: "oval", x: 131, y: 648,  width: 937, height: 503 },
            { shape: "oval", x: 141, y: 1213, width: 938, height: 503 }
        ]
    },
    {
        id: "y2k-oval-02",
        collection: "y2k",
        layout: "oval",
        name: "Y2K Oval Chrome",
        file: "assets/frames/y2k/oval/y2k-oval-02.png",
        width: 1200,
        height: 1800,
        slots: [
            { shape: "oval", x: 120, y: 84,   width: 938, height: 502 },
            { shape: "oval", x: 131, y: 648,  width: 937, height: 503 },
            { shape: "oval", x: 141, y: 1213, width: 938, height: 503 }
        ]
    },

    /* ================= Y2K / GRID6 ================= */
    {
        id: "y2k-grid6-01",
        collection: "y2k",
        layout: "grid6",
        name: "Y2K Grid Cyber",
        file: "assets/frames/y2k/grid6/y2k-grid6-01.png",
        width: 1058,
        height: 1600,
        slots: [
            { shape: "rect", x: 37,  y: 69,  width: 474, height: 319 },
            { shape: "rect", x: 525, y: 69,  width: 475, height: 319 },
            { shape: "rect", x: 37,  y: 420, width: 474, height: 319 },
            { shape: "rect", x: 525, y: 420, width: 475, height: 319 },
            { shape: "rect", x: 37,  y: 771, width: 474, height: 319 },
            { shape: "rect", x: 525, y: 771, width: 475, height: 319 }
        ]
    },
    

    /* ================= FRUTIGER / OVAL ================= */
    {
        id: "frutiger-oval-01",
        collection: "frutiger",
        layout: "oval",
        name: "Frutiger Aero Bubble",
        file: "assets/frames/frutiger/oval/frutiger-oval-01.png",
        width: 1200,
        height: 1800,
        slots: [
            { shape: "oval", x: 120, y: 84,   width: 938, height: 502 },
            { shape: "oval", x: 131, y: 648,  width: 937, height: 503 },
            { shape: "oval", x: 141, y: 1213, width: 938, height: 503 }
        ]
    },

    /* ================= FRUTIGER / GRID6 ================= */
    {
        id: "frutiger-grid6-01",
        collection: "frutiger",
        layout: "grid6",
        name: "Frutiger Aqua Grid",
        file: "assets/frames/frutiger/grid6/frutiger-grid6-01.png",
        width: 1058,
        height: 1600,
        slots: [
            { shape: "rect", x: 37,  y: 69,  width: 474, height: 319 },
            { shape: "rect", x: 525, y: 69,  width: 475, height: 319 },
            { shape: "rect", x: 37,  y: 420, width: 474, height: 319 },
            { shape: "rect", x: 525, y: 420, width: 475, height: 319 },
            { shape: "rect", x: 37,  y: 771, width: 474, height: 319 },
            { shape: "rect", x: 525, y: 771, width: 475, height: 319 }
        ]
    },

    /* ================= GOTHIC / OVAL ================= */
    {
        id: "gothic-oval-01",
        collection: "gothic",
        layout: "oval",
        name: "Gothic Oval Noir",
        file: "assets/frames/gothic/oval/gothic-oval-01.png",
        width: 1200,
        height: 1800,
        slots: [
            { shape: "oval", x: 120, y: 84,   width: 938, height: 502 },
            { shape: "oval", x: 131, y: 648,  width: 937, height: 503 },
            { shape: "oval", x: 141, y: 1213, width: 938, height: 503 }
        ]
    },


    /* ================= GOTHIC / GRID6 ================= */
    {
        id: "gothic-grid6-01",
        collection: "gothic",
        layout: "grid6",
        name: "Gothic Grid Velvet",
        file: "assets/frames/gothic/grid6/gothic-grid6-01.png",
        width: 1058,
        height: 1600,
        slots: [
            { shape: "rect", x: 37,  y: 69,  width: 474, height: 319 },
            { shape: "rect", x: 525, y: 69,  width: 475, height: 319 },
            { shape: "rect", x: 37,  y: 420, width: 474, height: 319 },
            { shape: "rect", x: 525, y: 420, width: 475, height: 319 },
            { shape: "rect", x: 37,  y: 771, width: 474, height: 319 },
            { shape: "rect", x: 525, y: 771, width: 475, height: 319 }
        ]
    },
];

/* =====================================================
   DOM
===================================================== */

const DOM = {

    collectionCards: document.querySelectorAll("[data-collection]"),
    layoutCards:     document.querySelectorAll("[data-layout]"),
    filterButtons:   document.querySelectorAll("[data-filter]"),

    frameList:   document.getElementById("frameList"),
    frameCount:  document.getElementById("frameCount"),
    filterHint:  document.getElementById("filterHint"),

    video:     document.getElementById("video"),
    countdown: document.getElementById("countdown"),
    flash:     document.getElementById("flash"),

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

    collection: "y2k",
    layout: "oval",
    filter: "none",

    frame: null,          // currently selected frame object
    frameImageCache: {},  // id -> loaded HTMLImageElement of frame.file

    stream: null,
    cameraReady: false,

    isCapturing: false,
    capturedShots: [],    // array of offscreen canvases, one per slot, in order

    timestampEnabled: false,
    caption: "",

    hasRendered: false

};

/* =====================================================
   UTILS
===================================================== */

function getFramesFor(collection, layout) {
    return FRAMES.filter(
        f => f.collection === collection && f.layout === layout
    );
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

// Computes the draw rectangle for a "cover" fit of a source image inside
// a target width/height box, then overscans it by CONFIG.PHOTO_ZOOM so the
// slot is always slightly overfilled (never underfilled) — this is what
// hides any white sliver at the slot edges.
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
   Clip-path builders keyed by slot.shape.
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
        const x = slot.x;
        const y = slot.y;
        const w = slot.width;
        const h = slot.height;

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

// Inflates a slot's geometry outward by `inflate` px on every side before
// handing it to the shape builder — used together with PHOTO_ZOOM so the
// photo always fully backs the frame's transparent window with margin
// to spare (the frame artwork drawn on top hides the overflow).
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
        this.updateFilterAvailability();
    },

    setActiveGroup(nodeList, key, value) {
        nodeList.forEach(node => {
            node.classList.toggle("active", node.dataset[key] === value);
        });
    },

    syncActiveButtons() {
        this.setActiveGroup(DOM.collectionCards, "collection", STATE.collection);
        this.setActiveGroup(DOM.layoutCards, "layout", STATE.layout);
        this.setActiveGroup(DOM.filterButtons, "filter", STATE.filter);
    },

    // Filters only make sense once there's an actual rendered photo to
    // apply them to. Lock the buttons until STATE.hasRendered is true.
    updateFilterAvailability() {
        const unlocked = STATE.hasRendered;

        DOM.filterButtons.forEach(btn => {
            btn.disabled = !unlocked;
            btn.classList.toggle("locked", !unlocked);
        });

        if (DOM.filterHint) {
            DOM.filterHint.textContent = unlocked ? "Tap to preview" : "Unlocks after capture";
        }
    },

    renderFrameList() {

        const frames = getFramesFor(STATE.collection, STATE.layout);

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

        // Auto-select first frame of this collection/layout if none matches
        const stillValid = STATE.frame &&
            STATE.frame.collection === STATE.collection &&
            STATE.frame.layout === STATE.layout;

        if (!stillValid) {
            if (frames.length > 0) {
                this.selectFrame(frames[0].id);
            } else {
                STATE.frame = null;
                this.updateShotCounter();
                CameraEngine.refreshStartButtonState();
            }
        }

    },

    selectCollection(collection) {
        if (STATE.collection === collection) return;
        STATE.collection = collection;
        CaptureEngine.resetShots();
        this.syncActiveButtons();
        this.renderFrameList();
    },

    selectLayout(layout) {
        if (STATE.layout === layout) return;
        STATE.layout = layout;
        CaptureEngine.resetShots();
        this.syncActiveButtons();
        this.renderFrameList();
    },

    selectFrame(frameId) {

        const frame = FRAMES.find(f => f.id === frameId);
        if (!frame) return;

        STATE.frame = frame;
        CaptureEngine.resetShots();

        document.querySelectorAll(".frame-card").forEach(card => {
            card.classList.toggle("active", card.dataset.frameId === frameId);
        });

        this.updateShotCounter();
        CameraEngine.refreshStartButtonState();

    },

    selectFilter(filterId) {
        if (!CONFIG.FILTERS[filterId]) return;
        if (!STATE.hasRendered) return;
        STATE.filter = filterId;
        this.syncActiveButtons();
        RenderEngine.renderFinal();
    },

    updateShotCounter() {
        const total = STATE.frame ? STATE.frame.slots.length : 0;
        DOM.shotsCounter.textContent = STATE.capturedShots.length + " / " + total;
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

            if (CONFIG.MIRROR_CAPTURE) {
                DOM.video.style.transform = "scaleX(-1)";
            }

            await DOM.video.play();

            STATE.cameraReady = true;
            this.refreshStartButtonState();

        } catch (err) {
            console.error("Camera init failed:", err);
            STATE.cameraReady = false;
            DOM.startBtn.disabled = true;
            DOM.startBtn.textContent = "Camera Unavailable";
        }
    },

    stop() {
        if (STATE.stream) {
            STATE.stream.getTracks().forEach(track => track.stop());
            STATE.stream = null;
        }
        STATE.cameraReady = false;
    },

    refreshStartButtonState() {
        const ready = STATE.cameraReady &&
            STATE.frame &&
            !STATE.isCapturing;

        DOM.startBtn.disabled = !ready;

        if (!STATE.cameraReady) {
            DOM.startBtn.textContent = "Starting Camera...";
        } else if (!STATE.frame) {
            DOM.startBtn.textContent = "Select a Frame";
        } else if (!STATE.isCapturing) {
            DOM.startBtn.textContent = "Start Capturing";
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
        // force reflow so the animation restarts every time
        void DOM.flash.offsetWidth;
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
        UIEngine.updateFilterAvailability();
        CameraEngine.refreshStartButtonState();
        this.clearCanvas();
        DOM.downloadBtn.disabled = true;
        DOM.resultCard.style.display = "none";
    },

    clearCanvas() {
        CTX.clearRect(0, 0, DOM.photostrip.width, DOM.photostrip.height);
    },

    async startSequence() {

        if (!STATE.frame || STATE.isCapturing || !STATE.cameraReady) return;

        this.resetShots();

        STATE.isCapturing = true;
        DOM.startBtn.disabled = true;
        DOM.startBtn.textContent = "Capturing...";

        const totalSlots = STATE.frame.slots.length;

        for (let i = 0; i < totalSlots; i++) {
            await this.runCountdown();
            FlashEngine.trigger();
            this.captureFrame();
            UIEngine.updateShotCounter();
            await this.delay(CONFIG.FLASH_DURATION_MS);
        }

        STATE.isCapturing = false;

        await RenderEngine.renderFinal();
        UIEngine.updateFilterAvailability();

        DOM.startBtn.textContent = "Retake";
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

    captureFrame() {

        const video = DOM.video;
        const w = video.videoWidth;
        const h = video.videoHeight;

        if (!w || !h) return;

        const shotCanvas = document.createElement("canvas");
        shotCanvas.width = w;
        shotCanvas.height = h;

        const shotCtx = shotCanvas.getContext("2d");

        shotCtx.save();

        if (CONFIG.MIRROR_CAPTURE) {
            shotCtx.translate(w, 0);
            shotCtx.scale(-1, 1);
        }

        shotCtx.drawImage(video, 0, 0, w, h);
        shotCtx.restore();

        STATE.capturedShots.push(shotCanvas);

    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

};

/* =====================================================
   RENDER ENGINE
===================================================== */

const RenderEngine = {

    async renderFinal() {

        const frame = STATE.frame;
        if (!frame || STATE.capturedShots.length === 0) return;

        const canvasW = frame.width || CONFIG.CANVAS_WIDTH;
        const canvasH = frame.height || CONFIG.CANVAS_HEIGHT;

        DOM.photostrip.width = canvasW;
        DOM.photostrip.height = canvasH;

        CTX.clearRect(0, 0, canvasW, canvasH);

        // Fill white base so transparent frame PNGs still export a
        // clean background instead of a black/transparent canvas.
        CTX.fillStyle = "#ffffff";
        CTX.fillRect(0, 0, canvasW, canvasH);

        const filter = CONFIG.FILTERS[STATE.filter] || CONFIG.FILTERS.none;

        frame.slots.forEach((slot, index) => {

            const source = STATE.capturedShots[index];
            if (!source) return;

            CTX.save();

            clipSlot(CTX, slot, CONFIG.SLOT_INFLATE_PX);

            CTX.filter = filter.css;

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

            CTX.filter = "none";

            CTX.restore();

        });

        // Overlay the frame artwork on top of the photos
        if (!CONFIG.DEBUG_HIDE_FRAME_OVERLAY) {
            const frameImg = await getFrameImage(frame);
            CTX.drawImage(frameImg, 0, 0, canvasW, canvasH);
        }

        // Timestamp + caption, baked into the final export
        this.drawOverlayText(canvasW, canvasH);

        STATE.hasRendered = true;
        DOM.downloadBtn.disabled = false;

        // Reveal the result card now that there's actually something to show
        DOM.resultCard.style.display = "block";

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

    DOM.collectionCards.forEach(card => {
        card.addEventListener("click", () => {
            UIEngine.selectCollection(card.dataset.collection);
        });
    });

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