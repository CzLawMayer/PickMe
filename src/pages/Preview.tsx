// src/pages/Preview.tsx
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as THREE from "three";

import AppHeader from "@/components/AppHeader";

import "./Home.css";
import "./Home3D.css";
import "./Preview.css";

// ---------- Types ----------
type Book = {
  id: string;
  title: string;
  author?: string;
  user?: string;
  coverUrl?: string;
  backCoverUrl?: string;
  tags?: string[];
  rating?: string | number;
  ratingCount?: number;
  likes?: number;
  bookmarks?: number;
  currentChapter?: number;
  totalChapters?: number;
  dedication?: string;
  chapters?: string[];
  chapterTexts?: string[];
  year?: number;
  copyright?: string;
};

type IncomingBook = Book & {
  coverFile?: File | null;
  backCoverFile?: File | null;
};

type BookSpread = { left: string; right: string };
type ReaderTheme = "cream" | "dark" | "white";

export default function Preview() {
  const location = useLocation() as any;
  const navigate = useNavigate();

  const injected: IncomingBook | null = location?.state?.book || null;
  const center: Book | null = injected ?? null;

  const threeRootRef = useRef<HTMLDivElement | null>(null);

  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isRightOpen, setRightOpen] = useState(true);

  // Resolved URLs for covers (only from injected book; no fallbacks)
  const [frontUrl, setFrontUrl] = useState<string | undefined>(undefined);
  const [backUrl, setBackUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!injected) {
      setFrontUrl(undefined);
      setBackUrl(undefined);
      return;
    }

    let revokeFront: string | undefined;
    let revokeBack: string | undefined;

    // Front cover – only from submission modal
    if (injected.coverUrl && injected.coverUrl.trim()) {
      setFrontUrl(injected.coverUrl);
    } else if (injected.coverFile instanceof File) {
      const u = URL.createObjectURL(injected.coverFile);
      setFrontUrl(u);
      revokeFront = u;
    } else {
      setFrontUrl(undefined);
    }

    // Back cover – only from submission modal
    if (injected.backCoverUrl && injected.backCoverUrl.trim()) {
      setBackUrl(injected.backCoverUrl);
    } else if (injected.backCoverFile instanceof File) {
      const u = URL.createObjectURL(injected.backCoverFile);
      setBackUrl(u);
      revokeBack = u;
    } else {
      setBackUrl(undefined);
    }

    return () => {
      if (revokeFront) {
        try {
          URL.revokeObjectURL(revokeFront);
        } catch {}
      }
      if (revokeBack) {
        try {
          URL.revokeObjectURL(revokeBack);
        } catch {}
      }
    };
  }, [injected]);

  if (!center) {
    // No submission data at all → nothing about the book is shown
    return (
      <div className="app home3d-root">
        <AppHeader />
        <main className="carousel home3d-main">
          {/* intentionally minimal when there is no injected book */}
        </main>
      </div>
    );
  }

  const projectTitle = (center.title ?? "").trim();
  const mainGenreLabel =
    Array.isArray(center.tags) && center.tags.length > 0
      ? center.tags[0]
      : "";

  const chapterCount = (() => {
    if (Array.isArray(center.chapters) && center.chapters.length > 0) {
      return center.chapters.length;
    }
    const n = Number(center.totalChapters ?? 0);
    if (Number.isFinite(n) && n > 0) return n;
    if (Array.isArray(center.chapterTexts)) return center.chapterTexts.length;
    return 0;
  })();

  // ---------- 3D + Reader setup (single-book version) ----------
  useEffect(() => {
    const root = threeRootRef.current;
    if (!root || !center) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let raycaster: THREE.Raycaster;
    let mouse: THREE.Vector2;
    let bookMesh: THREE.Mesh | null = null;

    let isBookOpenLocal = false;
    let currentPageSpread = 0;
    let bookSpreads: BookSpread[] = [];
    let pendingOpenAfterFlip = false;

    // typography + theme
    let currentFontSize = 14;
    let currentLineHeight = 1.6;
    let currentFontFamily = "Georgia, 'Times New Roman', serif";
    let currentTheme: ReaderTheme = "cream";

    let paginationTimer: number | null = null;
    let animationId: number;

    const spineColors = ["#ef5623", "#e41f6c", "#6a1b9a", "#1e88e5"];

    // DOM elements for reader
    const openBookContainer = document.getElementById(
      "open-book-container"
    ) as HTMLDivElement | null;
    const pageLeft = document.getElementById(
      "page-left"
    ) as HTMLDivElement | null;
    const pageRight = document.getElementById(
      "page-right"
    ) as HTMLDivElement | null;
    const navContainer = document.getElementById(
      "nav-container"
    ) as HTMLDivElement | null;
    const leftArrowBtn = document.getElementById(
      "left-arrow"
    ) as HTMLDivElement | null;
    const rightArrowBtn = document.getElementById(
      "right-arrow"
    ) as HTMLDivElement | null;
    const closeBookBtn = document.getElementById(
      "close-book-btn"
    ) as HTMLDivElement | null;

    if (!openBookContainer || !pageLeft || !pageRight || !navContainer) {
      console.warn("Reader DOM elements not found for Preview.");
      return;
    }

    // ------------ helpers for spine + pages ------------
    function createSpineTexture(
      title: string,
      width: number,
      height: number,
      color: string
    ) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let fontSize = 40;
      ctx.font = `bold ${fontSize}px "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      const maxWidth = height - 20;
      let textWidth = ctx.measureText(title).width;

      while (textWidth > maxWidth && fontSize > 10) {
        fontSize--;
        ctx.font = `bold ${fontSize}px "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        textWidth = ctx.measureText(title).width;
      }

      ctx.fillText(title, 0, 0);
      ctx.restore();

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    function cleanPage(html: string) {
      if (!html) return "";
      let cleaned = html.replace(/^(<br>\s*)+/i, "");
      cleaned = cleaned.replace(/(\s*<br>)+$/i, "");
      return cleaned.trim();
    }

    // --- Paragraph-aware pagination: preserve paragraph breaks ---
    function paginateChapter(fullText: string, titleHtml: string | null = null) {
      const testPage = pageLeft!;
      const computedStyle = window.getComputedStyle(testPage);
      const pageHeight = parseFloat(computedStyle.height);
      const contentAreaHeight =
        pageHeight -
        (parseFloat(computedStyle.paddingTop) +
          parseFloat(computedStyle.paddingBottom));
      const effectiveHeight = contentAreaHeight;

      const originalContent = testPage.innerHTML;
      const pages: string[] = [];

      const raw = fullText || "";

      let processedText: string;

      // If content already looks like HTML (editor HTML), keep it as-is for pagination.
      if (raw.includes("<") && !raw.includes("\n")) {
        processedText = raw;
      } else {
        // Plain text with newlines → convert to <p> + <br> so paragraphs are preserved.
        let normalized = raw.replace(/\r\n/g, "\n");
        normalized = normalized.replace(/\n{3,}/g, "\n\n"); // collapse 3+ into 2

        // Turn newlines into <br>, then separate paragraphs on blank lines
        const withBr = normalized.replace(/\n/g, "<br>");
        const withParagraphs = `<p>${withBr.replace(
          /(<br>\s*){2,}/g,
          "</p><p>"
        )}</p>`;

        processedText = withParagraphs;
      }

      const measureDiv = document.createElement("div");
      measureDiv.style.fontSize = `${currentFontSize}px`;
      measureDiv.style.lineHeight = String(currentLineHeight);
      measureDiv.style.overflow = "hidden";
      measureDiv.style.visibility = "hidden";
      measureDiv.style.height = "auto";
      measureDiv.style.width = "100%";
      testPage.appendChild(measureDiv);

      // Keep the original pagination behaviour: grow by “words” and measure scrollHeight
      const words = processedText.split(" ");

      let currentPageText = "";
      if (titleHtml) currentPageText += titleHtml;

      for (const word of words) {
        if (!word && word !== "") continue;
        const testWord = word + " ";
        const before = currentPageText;
        const testText = currentPageText + testWord;

        measureDiv.innerHTML = testText;
        const isOverflowing = measureDiv.scrollHeight > effectiveHeight;

        if (isOverflowing) {
          pages.push(cleanPage(before));
          currentPageText = testWord;
        } else {
          currentPageText = testText;
        }
      }

      if (currentPageText.trim() !== "") {
        pages.push(cleanPage(currentPageText));
      }

      testPage.removeChild(measureDiv);
      testPage.innerHTML = originalContent;
      return pages;
    }



    function buildBookSpreads(): BookSpread[] {
      const bookData = center as any;

      const bookTitle = center.title ?? "";
      const authorRaw = (bookData?.author as string | undefined) ?? "";
      const bookAuthor = authorRaw.trim(); // no "you" fallback, exactly what you typed

      const yearVal =
        typeof bookData?.year === "number" ? String(bookData.year) : "";
      const dedicationText =
        typeof bookData?.dedication === "string"
          ? bookData.dedication.trim()
          : "";

      const chapterTitles: string[] = Array.isArray(bookData?.chapters)
        ? bookData.chapters
            .map((t: string) => String(t ?? ""))
            .filter((t) => t.trim().length > 0)
        : [];
      const chapterTexts: string[] = Array.isArray(bookData?.chapterTexts)
        ? bookData.chapterTexts
            .map((t: string) => String(t ?? ""))
            .filter((t) => t.trim().length > 0)
        : [];

      let tocItems = "";
      if (chapterTitles.length > 0) {
        tocItems = chapterTitles
          .map((t: string, idx: number) => `<li>Chapter ${idx + 1}: ${t}</li>`)
          .join("");
      }

      const spreads: BookSpread[] = [];

      // Front page: title + byline
      if (bookTitle) {
        const authorBlock = bookAuthor
          ? `<p style="font-size: 1.3em; margin-top: 16px;">by ${bookAuthor}</p>`
          : "";
        spreads.push({
          left: "",
          right: `<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; text-align:center;">
              <div>
                <h1 style="font-size: 2.4em; margin: 0; padding: 0;">${bookTitle}</h1>
                ${authorBlock}
              </div>
            </div>`,
        });
      }

      // Dedication spread – only if we actually have a dedication
      if (dedicationText) {
        spreads.push({
          left: "",
          right: `<div style="display:flex; justify-content:center; align-items:center; height:100%; text-align:center; font-style:italic;">
              <p>${dedicationText}</p>
            </div>`,
        });
      }

      // Copyright / TOC spread – only if either year or TOC items exist
      if (yearVal || tocItems) {
        const leftHtml = yearVal
          ? `<div style="display:flex; flex-direction:column; justify-content:flex-end; height:100%; text-align:center; font-size: 0.7em;">
              <p style="margin-bottom: 5px;">&copy; Copyright ${yearVal}</p>
            </div>`
          : "";

        const rightHtml = tocItems
          ? `<h3 style="text-align:center; margin-bottom: 20px;">Table of Contents</h3>
            <ul style="line-height: 2.5; list-style-position: inside;">
              ${tocItems}
            </ul>`
          : "";

        spreads.push({
          left: leftHtml,
          right: rightHtml,
        });
      }

      // Chapter content pages – only from submission data
      let allPages: string[] = [];

      if (chapterTexts.length > 0) {
        for (let i = 0; i < chapterTexts.length; i++) {
          const text = chapterTexts[i];
          if (!text) continue;
          const title = chapterTitles[i] ?? `Chapter ${i + 1}`;

          const chapterTitleHtml = `
            <div style="text-align:center; margin: 0 0 12px 0;">
              <span style="font-weight:700; font-size:1.4em;">${title}</span>
            </div>
          `;
          const pages = paginateChapter(text, chapterTitleHtml);
          allPages = allPages.concat(pages);
        }
      }

      const chapterSpreads: BookSpread[] = [];
      for (let i = 0; i < allPages.length; i += 2) {
        chapterSpreads.push({
          left: allPages[i] ?? "",
          right: allPages[i + 1] ?? "",
        });
      }

      return spreads.concat(chapterSpreads);
    }


    function applyThemeColors() {
      if (!pageLeft || !pageRight) return;
      let bg: string;
      let fg: string;

      if (currentTheme === "cream") {
        bg = "#fdf6e3";
        fg = "#111111";
      } else if (currentTheme === "dark") {
        bg = "#181717";
        fg = "#f5f0e6";
      } else {
        bg = "#ffffff";
        fg = "#111111";
      }

      pageLeft.style.backgroundColor = bg;
      pageRight.style.backgroundColor = bg;
      pageLeft.style.color = fg;
      pageRight.style.color = fg;
    }

    function applyTypographyStyles() {
      if (!pageLeft || !pageRight) return;

      pageLeft.style.fontSize = `${currentFontSize}px`;
      pageRight.style.fontSize = `${currentFontSize}px`;
      pageLeft.style.lineHeight = String(currentLineHeight);
      pageRight.style.lineHeight = String(currentLineHeight);
      pageLeft.style.fontFamily = currentFontFamily;
      pageRight.style.fontFamily = currentFontFamily;
      pageLeft.style.textAlign = "justify";
      pageRight.style.textAlign = "justify";

      applyThemeColors();
    }

    function updatePageContent(index: number) {
      const spread = bookSpreads[index];
      if (!spread || !pageLeft || !pageRight) return;
      pageLeft.innerHTML = spread.left;
      pageRight.innerHTML = spread.right;
      applyTypographyStyles();
    }

    function rePaginateBook() {
      bookSpreads = buildBookSpreads();
      if (currentPageSpread >= bookSpreads.length) {
        currentPageSpread = bookSpreads.length - 1;
      }
      if (currentPageSpread < 0) currentPageSpread = 0;
      updatePageContent(currentPageSpread);
    }

    function scheduleRepaginate() {
      if (paginationTimer !== null) {
        window.clearTimeout(paginationTimer);
      }
      paginationTimer = window.setTimeout(() => {
        if (!isBookOpenLocal) return;
        rePaginateBook();
      }, 80);
    }

    // ------------ THREE init ------------
    function initThree() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f0f10);

      const w = root.clientWidth || window.innerWidth;
      const h = root.clientHeight || window.innerHeight;

      camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
      camera.position.set(0, 0, 8);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setSize(w, h);
      root.appendChild(renderer.domElement);

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      const bookWidth = 5.7;
      const bookHeight = 8;
      const bookDepth = 0.55;

      const pageMaterial = new THREE.MeshBasicMaterial({ color: 0xf5f5dc });

      // Front cover material – only uses submission cover if provided
      let frontCoverMaterial: THREE.MeshBasicMaterial;
      if (frontUrl) {
        const frontTexture = new THREE.TextureLoader().load(frontUrl);
        frontTexture.colorSpace = THREE.SRGBColorSpace;
        frontCoverMaterial = new THREE.MeshBasicMaterial({ map: frontTexture });
      } else {
        frontCoverMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
      }

      // Back cover material – only uses submission cover if provided
      let backCoverMaterial: THREE.MeshBasicMaterial;
      if (backUrl) {
        const backTexture = new THREE.TextureLoader().load(backUrl);
        backTexture.colorSpace = THREE.SRGBColorSpace;
        backTexture.wrapS = THREE.RepeatWrapping;
        backTexture.repeat.x = -1;
        backTexture.center.set(0.5, 0.5);
        backCoverMaterial = new THREE.MeshBasicMaterial({ map: backTexture });
      } else {
        backCoverMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
      }

      const spineCanvasWidth = bookDepth * 100;
      const spineCanvasHeight = bookHeight * 100;
      const spineColor = spineColors[0];
      const spineTexture = createSpineTexture(
        center.title ?? "",
        spineCanvasWidth,
        spineCanvasHeight,
        spineColor
      );

      const spineMaterial = new THREE.MeshBasicMaterial({
        map: spineTexture,
      });

      const materials = [
        pageMaterial, // right side
        spineMaterial, // left side (spine)
        pageMaterial, // top
        pageMaterial, // bottom
        frontCoverMaterial, // front
        backCoverMaterial, // back
      ];

      const geom = new THREE.BoxGeometry(bookWidth, bookHeight, bookDepth);
      bookMesh = new THREE.Mesh(geom, materials);
      bookMesh.position.set(0, 0, 0);
      bookMesh.scale.set(1.2, 1.2, 1.2);
      bookMesh.userData = {
        isFlipping: false,
        targetRotation: 0,
      };

      scene.add(bookMesh);
    }

    function onWindowResize() {
      if (!renderer || !camera) return;
      const w = root.clientWidth || window.innerWidth;
      const h = root.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      scheduleRepaginate();
    }

    // ------------ open / close / page flip ------------
    function openBook() {
      if (!bookMesh) return;

      currentPageSpread = 0;
      isBookOpenLocal = true;
      setIsBookOpen(true);

      bookSpreads = buildBookSpreads();
      updatePageContent(currentPageSpread);

      bookMesh.visible = false;

      openBookContainer.classList.add("is-open");
      navContainer.classList.add("is-open");
    }

    function closeBook() {
      if (!bookMesh) return;

      isBookOpenLocal = false;
      setIsBookOpen(false);

      // Instantly hide the open-book UI (no fading) but keep flip-back animation on the 3D book
      openBookContainer.style.transition = "none";
      navContainer.style.transition = "none";

      openBookContainer.classList.remove("is-open");
      navContainer.classList.remove("is-open");

      // force reflow so the removal is immediate
      void openBookContainer.offsetWidth;

      // restore original transitions for future openings
      openBookContainer.style.transition =
        "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease";
      navContainer.style.transition =
        "opacity 0.3s ease, left 0.5s cubic-bezier(0.25, 1, 0.5, 1)";

      // Book appears on its back cover and rotates back to the front
      bookMesh.visible = true;
      bookMesh.rotation.y = Math.PI;
      bookMesh.userData.targetRotation = 0;
      bookMesh.userData.isFlipping = true;

      currentPageSpread = 0;
      pendingOpenAfterFlip = false;
    }

    function flipPageLeft() {
      if (currentPageSpread > 0) {
        currentPageSpread--;
        updatePageContent(currentPageSpread);
      } else {
        closeBook();
      }
    }

    function flipPageRight() {
      if (currentPageSpread < bookSpreads.length - 1) {
        currentPageSpread++;
        updatePageContent(currentPageSpread);
      } else {
        closeBook();
      }
    }

    // ------------ click handling on the canvas ------------
    function onCanvasClick(event: MouseEvent) {
      if (!renderer || !camera || !bookMesh) return;

      const target = event.target as HTMLElement;
      if (
        target.classList.contains("nav-arrow") ||
        target.id === "nav-container"
      ) {
        return;
      }

      // When book is open, arrows handle navigation; clicking canvas does nothing.
      if (openBookContainer.classList.contains("is-open")) {
        return;
      }

      const canvasRect = renderer.domElement.getBoundingClientRect();
      mouse.x =
        ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      mouse.y =
        -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(bookMesh, false);

      if (intersects.length > 0) {
        const currentRotation = bookMesh.rotation.y;
        const targetRotation = bookMesh.userData.targetRotation ?? 0;

        const atFront = Math.abs(currentRotation) < 0.01;
        const atBack = Math.abs(currentRotation - Math.PI) < 0.01;
        const goingToBack = Math.abs(targetRotation - Math.PI) < 0.01;

        // If user clicks while it's flipping to the back, schedule an open
        if (bookMesh.userData.isFlipping && goingToBack) {
          pendingOpenAfterFlip = true;
          return;
        }

        if (atFront && !bookMesh.userData.isFlipping) {
          // flip to back
          bookMesh.userData.targetRotation = Math.PI;
          bookMesh.userData.isFlipping = true;
        } else if (atBack && !bookMesh.userData.isFlipping) {
          // back side visible, open book
          openBook();
        } else if (!bookMesh.userData.isFlipping) {
          // default: send it to the back if in-between somehow
          bookMesh.userData.targetRotation = Math.PI;
          bookMesh.userData.isFlipping = true;
        }
      }
    }

    // ------------ nav arrows (DOM) ------------
    rightArrowBtn?.addEventListener("click", () => {
      if (isBookOpenLocal) flipPageRight();
    });

    leftArrowBtn?.addEventListener("click", () => {
      if (isBookOpenLocal) flipPageLeft();
    });

    closeBookBtn?.addEventListener("click", () => {
      if (isBookOpenLocal) closeBook();
    });

    // ------------ animation loop ------------
    function animate() {
      animationId = requestAnimationFrame(animate);

      if (bookMesh && bookMesh.userData.isFlipping) {
        const targetRotation = bookMesh.userData.targetRotation ?? 0;
        const diff = targetRotation - bookMesh.rotation.y;
        const ease = 0.08;
        bookMesh.rotation.y += diff * ease;

        if (Math.abs(diff) < 0.01) {
          bookMesh.rotation.y = targetRotation;
          bookMesh.userData.isFlipping = false;

          // If user clicked during the flip to back, open automatically once finished
          if (
            pendingOpenAfterFlip &&
            Math.abs(targetRotation - Math.PI) < 0.01
          ) {
            pendingOpenAfterFlip = false;
            openBook();
          }
        }
      }

      renderer.render(scene, camera);
    }

    // ------------ init + listeners ------------
    initThree();
    applyTypographyStyles();
    window.addEventListener("resize", onWindowResize);
    if (threeRootRef.current && (threeRootRef.current as any).firstChild) {
      const canvas = (threeRootRef.current as HTMLDivElement)
        .firstChild as HTMLCanvasElement;
      canvas.addEventListener("click", onCanvasClick);
    }

    animate();

    // cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (threeRootRef.current && (threeRootRef.current as any).firstChild) {
        const canvas = (threeRootRef.current as HTMLDivElement)
          .firstChild as HTMLCanvasElement;
        canvas.removeEventListener("click", onCanvasClick);
      }
      if (paginationTimer !== null) {
        window.clearTimeout(paginationTimer);
      }
      cancelAnimationFrame(animationId);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode === root) {
          root.removeChild(renderer.domElement);
        }
      }
    };
  }, [center, frontUrl, backUrl]);

  // ---------- Render ----------
  return (
    <div className="app home3d-root">
      <AppHeader />

      <main className="carousel home3d-main">
        {/* CENTER: 3D + Reader */}
        <section className="home3d-stage">
          <div ref={threeRootRef} className="three-root" />

          <div id="open-book-container" className="open-book-container">
            <div className="open-book-page" id="page-left" />
            <div className="open-book-page" id="page-right" />
          </div>

          <div
            className="nav-container"
            id="nav-container"
            // Arrows only visible when book is open
            style={{ display: isBookOpen ? "flex" : "none" }}
          >
            <div className="nav-arrow" id="right-arrow" title="Next Page">
              &rsaquo;
            </div>
            <div className="nav-arrow" id="close-book-btn" title="Close Book">
              &times;
            </div>
            <div className="nav-arrow" id="left-arrow" title="Previous Page">
              &lsaquo;
            </div>
          </div>
        </section>

        {/* --- RIGHT SLIDE MENU --- */}
        <aside
          className={`slide-panel slide-right ${
            isRightOpen ? "is-open" : "is-closed"
          }`}
          aria-hidden={!isRightOpen}
          style={{ zIndex: 10 }}
        >
          <div className="slide-inner">
            <div className="rm-shell">
              <h2 className="rm-title">{projectTitle}</h2>

              <div className="rm-middle">
                <button
                  type="button"
                  className="rm-cover-btn"
                  title="Edit submission"
                  onClick={(e) => {
                    e.preventDefault();
                    // Navigate back to write page and ask it to open the submission modal
                    navigate("/write", {
                      state: {
                        book: center,
                        openSubmissionModal: true,
                      },
                    });
                  }}
                >
                  <div className="rm-cover-box">
                    {frontUrl ? (
                      <img src={frontUrl} alt="Project cover" />
                    ) : (
                      // If no cover was provided, we show an empty placeholder (no text fallback)
                      <span className="rm-cover-plus"></span>
                    )}
                  </div>
                </button>

                <div className="rm-meta">
                  <div className="rm-chapters">
                    {chapterCount
                      ? `${chapterCount} chapter${
                          chapterCount === 1 ? "" : "s"
                        }`
                      : ""}
                  </div>
                  <div className="rm-separator" />
                  <div className="rm-genre">{mainGenreLabel}</div>
                </div>
              </div>

              <div className="rm-actions">
                <button
                  type="button"
                  className="rm-btn rm-btn-preview"
                  onClick={() => navigate("/write")}
                >
                  Back to editor
                </button>

                <button type="button" className="rm-btn rm-btn-save" disabled>
                  Save
                </button>
                <button
                  type="button"
                  className="rm-btn rm-btn-publish"
                  disabled
                >
                  Publish
                </button>
              </div>
            </div>
          </div>

          <button
            className="slide-tab tab-right"
            onClick={() => setRightOpen((v) => !v)}
            aria-expanded={isRightOpen}
          >
            Notes
          </button>
        </aside>
      </main>
    </div>
  );
}
