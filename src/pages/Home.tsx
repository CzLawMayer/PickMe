// src/pages/Home.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Link } from "react-router-dom";

import AppHeader from "@/components/AppHeader";
import { sampleBooks } from "@/booksData";
import { profile } from "@/profileData";


import "./Home.css";
import "./Home3D.css";

import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";
import StarButton from "@/components/StarButton";
import ReaderMenu from "@/components/ReaderMenu";

import CommentSidebar, { ReviewModal } from "@/components/CommentSidebar";
import "@/components/CommentSidebar.css";

type BookSpread = { left: string; right: string };

type ReaderTheme = "cream" | "dark" | "white";

type ReaderControls = {
  setFontSize: (px: number) => void;
  setLineHeight: (lh: number) => void;
  setFontFamily: (family: string) => void;
  setTheme: (theme: ReaderTheme) => void;
};

type TypographyOptions = {
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  theme?: ReaderTheme;
};

// ---- Comment system types ----
type CommentItem = {
  id: number;
  username: string;
  pfpUrl: string;
  date: number | string;
  text: string;
  reactions: Record<string, number>;
  replies: CommentItem[];
  rating?: number;
};

type ThreadState = {
  comments: CommentItem[];
  reviews: CommentItem[];
};

type FilterSort =
  | "newest"
  | "oldest"
  | "mostLiked"
  | "mostReplies"
  | "highestRating"
  | "lowestRating";

const CURRENT_USER_ID = "CurrentUser";

// ✅ same helper as Library.tsx (transparent pills)
function colorFromString(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const bg = `hsl(${h} 70% 50% / 0.16)`;
  const border = `hsl(${h} 70% 50% / 0.38)`;
  const text = `hsl(${h} 85% 92%)`;
  return { bg, border, text };
}

export default function Home() {
  const threeRootRef = useRef<HTMLDivElement | null>(null);

  // 3D carousel state
  const [centerIndex, setCenterIndex] = useState(0);
  const centerIndexRef = useRef(0);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const [isBookOpen, setIsBookOpen] = useState(false);

  // Reader typography controls
  const readerControlsRef = useRef<ReaderControls | null>(null);

  // Effective book in the center (if locked by open-book)
  const effectiveIndex = lockedIndex ?? centerIndex;
  const centerBook = sampleBooks[effectiveIndex] ?? sampleBooks[0];

  // ---------- Per-book like/save/rating ----------
  const [likedById, setLikedById] = useState<Record<string, boolean>>({});
  const [savedById, setSavedById] = useState<Record<string, boolean>>({});
  const [userRatingById, setUserRatingById] = useState<Record<string, number>>(
    {}
  );

  const centerId = (centerBook as any)?.id ?? "";

  const liked = centerId ? !!likedById[centerId] : false;
  const saved = centerId ? !!savedById[centerId] : false;
  const userRating = centerId ? userRatingById[centerId] ?? 0 : 0;

  const baseRating =
    typeof (centerBook as any)?.rating === "string"
      ? parseFloat(String((centerBook as any).rating).split("/")[0] || "0")
      : Number((centerBook as any)?.rating ?? 0);

  const votesRaw = (centerBook as any)?.ratingCount ?? 0;
  const votes = Number.isFinite(Number(votesRaw)) ? Number(votesRaw) : 0;
  const PRIOR_VOTES = 20;

  const combinedRating =
    userRating > 0
      ? votes > 0
        ? (baseRating * votes + userRating) / (votes + 1)
        : baseRating > 0
        ? (baseRating * PRIOR_VOTES + userRating) / (PRIOR_VOTES + 1)
        : userRating
      : baseRating;

  const displayLikes = ((centerBook as any)?.likes ?? 0) + (liked ? 1 : 0);
  const displaySaves = ((centerBook as any)?.bookmarks ?? 0) + (saved ? 1 : 0);

  const toggleLike = () => {
    if (!centerId) return;
    setLikedById((m) => ({ ...m, [centerId]: !m[centerId] }));
  };

  const toggleSave = () => {
    if (!centerId) return;
    setSavedById((m) => ({ ...m, [centerId]: !m[centerId] }));
  };

  const onRate = (value: number) => {
    if (!centerId) return;
    setUserRatingById((m) => ({ ...m, [centerId]: value }));
  };

  // ---------- COMMENT / REVIEW STATE (per book) ----------
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [commentThreads, setCommentThreads] = useState<
    Record<string, ThreadState>
  >({});

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [filterSort, setFilterSort] = useState<FilterSort>("newest");
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  // ---------- 3D + Reader setup ----------
  useEffect(() => {
    const root = threeRootRef.current;
    if (!root) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let carouselGroup: THREE.Group;
    let raycaster: THREE.Raycaster;
    let mouse: THREE.Vector2;

    // Books from data
    const bookCovers =
      sampleBooks.length > 0
        ? sampleBooks.map((b, index) => ({
            front:
              (b as any).coverUrl ||
              `https://placehold.co/470x675/222222/f0f0f0?text=Book+${index + 1}`,
            back:
              (b as any).backCoverUrl ||
              `https://placehold.co/470x675/111111/f0f0f0?text=Back`,
            title: (b as any).title || `Book ${index + 1}`,
          }))
        : [];

    const numBooks = bookCovers.length;
    if (numBooks === 0) return;

    const INITIAL_CENTER_INDEX = 0;
    centerIndexRef.current = INITIAL_CENTER_INDEX;
    let currentCenterIndex = centerIndexRef.current;

    let isCarouselMoving = false;
    let targetCarouselX = 0;

    function setCenter(newIndex: number) {
      const clamped = Math.max(0, Math.min(numBooks - 1, newIndex));
      currentCenterIndex = clamped;
      centerIndexRef.current = clamped;
      setCenterIndex(clamped);
    }

    const bookWidth = 5.7;
    const bookHeight = 8;
    const bookDepth = 0.55;
    const bookSpacing = 13.5;

    let isBookOpenLocal = false;
    let currentPageSpread = 0;
    let bookSpreads: BookSpread[] = [];

    const spineColors = ["#ef5623", "#e41f6c", "#6a1b9a", "#1e88e5"];

    let currentFontSize = 14;
    let currentLineHeight = 1.6;
    let currentFontFamily = "Georgia, 'Times New Roman', serif";
    let currentTheme: ReaderTheme = "cream";

    let paginationTimer: number | null = null;

    // Lazy-loading
    const MAX_LOADED = 30;
    const CHUNK = 10;
    let windowStart = 0;
    let windowEnd = Math.min(CHUNK - 1, numBooks - 1);
    let lastDirection: 1 | -1 | 0 = 0;

    const bookMeshesByIndex: (THREE.Mesh | null)[] = Array(numBooks).fill(null);
    let activeBooks: THREE.Mesh[] = [];

    let loadQueue: number[] = [];
    let unloadQueue: number[] = [];

    const textureLoader = new THREE.TextureLoader();
    const pageMaterial = new THREE.MeshBasicMaterial({ color: 0xf5f5dc });

    // ---- DOM refs ----
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
    const metadataPanel = document.getElementById(
      "metadata-panel"
    ) as HTMLDivElement | null;

    if (!openBookContainer || !pageLeft || !pageRight || !navContainer) {
      console.warn("Reader DOM elements not found.");
      return;
    }

    // ---- Helpers ----
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
      return new THREE.CanvasTexture(canvas);
    }

    function cleanPage(html: string) {
      if (!html) return "";
      let cleaned = html.replace(/^(<br>\s*)+/i, "");
      cleaned = cleaned.replace(/(\s*<br>)+$/i, "");
      return cleaned.trim();
    }

    // ---- THREE init ----
    function createBookMesh(index: number): THREE.Mesh {
      const coverMeta = bookCovers[index];
      const frontTexture = textureLoader.load(coverMeta.front);
      const backTexture = textureLoader.load(coverMeta.back);

      frontTexture.colorSpace = THREE.SRGBColorSpace;
      backTexture.colorSpace = THREE.SRGBColorSpace;

      backTexture.wrapS = THREE.RepeatWrapping;
      backTexture.repeat.x = -1;
      backTexture.center.set(0.5, 0.5);

      const spineCanvasWidth = bookDepth * 100;
      const spineCanvasHeight = bookHeight * 100;
      const spineColor = spineColors[index % spineColors.length];
      const spineTexture = createSpineTexture(
        coverMeta.title,
        spineCanvasWidth,
        spineCanvasHeight,
        spineColor
      );
      spineTexture.colorSpace = THREE.SRGBColorSpace;

      const frontCoverMaterial = new THREE.MeshBasicMaterial({
        map: frontTexture,
      });
      const backCoverMaterial = new THREE.MeshBasicMaterial({
        map: backTexture,
      });
      const spineMaterial = new THREE.MeshBasicMaterial({
        map: spineTexture,
      });

      const materials = [
        pageMaterial,
        spineMaterial,
        pageMaterial,
        pageMaterial,
        frontCoverMaterial,
        backCoverMaterial,
      ];

      const geom = new THREE.BoxGeometry(bookWidth, bookHeight, bookDepth);
      const book = new THREE.Mesh(geom, materials);

      book.position.x = (index - INITIAL_CENTER_INDEX) * bookSpacing;
      book.userData = {
        logicalIndex: index,
        isFlipping: false,
        targetRotation: 0,
        targetScale: 1,
        isScaling: false,
        isSlidingOut: false,
        targetSlideX: 0,
        targetSlideScale: 1,
      };

      carouselGroup.add(book);
      bookMeshesByIndex[index] = book;
      activeBooks.push(book);

      return book;
    }

    function ensureBookLoaded(index: number, immediate = false) {
      if (index < 0 || index >= numBooks) return;
      if (bookMeshesByIndex[index]) return;
      if (immediate) {
        createBookMesh(index);
      } else {
        if (!loadQueue.includes(index)) {
          loadQueue.push(index);
        }
      }
    }

    function unloadBook(index: number) {
      if (index < 0 || index >= numBooks) return;
      const book = bookMeshesByIndex[index];
      if (!book) return;
      carouselGroup.remove(book);
      activeBooks = activeBooks.filter((b) => b !== book);
      bookMeshesByIndex[index] = null;
    }

    function ensureRangeLoaded(start: number, end: number, immediate = false) {
      const s = Math.max(0, start);
      const e = Math.min(numBooks - 1, end);
      for (let i = s; i <= e; i++) {
        ensureBookLoaded(i, immediate);
      }
    }

    function trimWindowIfNeeded() {
      const loadedCount = windowEnd - windowStart + 1;
      if (loadedCount <= MAX_LOADED) return;
      const over = loadedCount - MAX_LOADED;
      const toDrop = Math.min(CHUNK, over);

      if (lastDirection >= 0) {
        const dropEnd = windowStart + toDrop - 1;
        for (let i = windowStart; i <= dropEnd; i++) {
          unloadBook(i);
        }
        windowStart = dropEnd + 1;
      } else {
        const dropStart = windowEnd - toDrop + 1;
        for (let i = dropStart; i <= windowEnd; i++) {
          unloadBook(i);
        }
        windowEnd = dropStart - 1;
      }
    }

    function adjustWindow() {
      ensureRangeLoaded(currentCenterIndex - 1, currentCenterIndex + 1);

      if (currentCenterIndex >= windowEnd - 3 && windowEnd < numBooks - 1) {
        const newEnd = Math.min(windowEnd + CHUNK, numBooks - 1);
        ensureRangeLoaded(windowEnd + 1, newEnd);
        windowEnd = newEnd;
      }

      if (currentCenterIndex <= windowStart + 3 && windowStart > 0) {
        const newStart = Math.max(windowStart - CHUNK, 0);
        ensureRangeLoaded(newStart, windowStart - 1);
        windowStart = newStart;
      }

      trimWindowIfNeeded();
    }

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f0f10);

      const w = root.clientWidth || window.innerWidth;
      const h = root.clientHeight || window.innerHeight;

      camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
      camera.position.y = 0;
      camera.position.z = 8;
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.setSize(w, h);
      root.appendChild(renderer.domElement);

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      carouselGroup = new THREE.Group();
      scene.add(carouselGroup);

      ensureRangeLoaded(windowStart, windowEnd, true);

      targetCarouselX = carouselGroup.position.x;
      updateBookProperties(true);
    }

    function onWindowResize() {
      if (!renderer || !camera) return;
      const w = root.clientWidth || window.innerWidth;
      const h = root.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    // ---- Pagination / pages ----
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

      let normalized = (fullText || "").replace(/\r\n/g, "\n");
      normalized = normalized.replace(/\n{3,}/g, "\n\n");
      const processedText = normalized
        .replace(/\n{2}/g, " <br><br> ")
        .replace(/\n/g, " ");

      const words = processedText.split(" ");

      const measureDiv = document.createElement("div");
      measureDiv.style.fontSize = `${currentFontSize}px`;
      measureDiv.style.lineHeight = String(currentLineHeight);
      measureDiv.style.overflow = "hidden";
      measureDiv.style.visibility = "hidden";
      measureDiv.style.height = "auto";
      measureDiv.style.width = "100%";
      testPage.appendChild(measureDiv);

      let currentPageText = "";
      if (titleHtml) currentPageText += titleHtml;

      for (const word of words) {
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

    function buildBookSpreads(bookIndex: number): BookSpread[] {
      const meta = bookCovers[bookIndex];
      const bookData = sampleBooks[bookIndex] as any | undefined;

      const bookTitle = meta.title;
      const bookAuthor = bookData?.author || "A. Nonymous";
      const isbn = "978-0-999999-99-9";
      const copyright = (bookData?.year ?? 2024).toString();
      const dedication =
        bookData?.dedication || "For everyone who reads in a world of screens.";

      const chapterTitles: string[] = Array.isArray(bookData?.chapters)
        ? bookData.chapters
        : [];
      const chapterTexts: string[] = Array.isArray(bookData?.chapterTexts)
        ? bookData.chapterTexts
        : [];

      let tocItems = "";
      if (chapterTitles.length > 0) {
        tocItems = chapterTitles
          .map((t, idx) => `<li>Chapter ${idx + 1}: ${t}</li>`)
          .join("");
      } else if (chapterTexts.length > 0) {
        tocItems = chapterTexts
          .map((_, idx) => `<li>Chapter ${idx + 1}</li>`)
          .join("");
      } else {
        tocItems = "<li>Chapter 1</li>";
      }

      const staticSpreads: BookSpread[] = [
        {
          left: "",
          right: `<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; text-align:center;">
              <div>
                <h1 style="font-size: 2.4em; margin: 0; padding: 0;">${bookTitle}</h1>
                <p style="font-size: 1.3em; margin-top: 16px;">By ${bookAuthor}</p>
              </div>
            </div>`,
        },
        {
          left: "",
          right: `<div style="display:flex; justify-content:center; align-items:center; height:100%; text-align:center; font-style:italic;">
              <p>${dedication}</p>
            </div>`,
        },
        {
          left: `<div style="display:flex; flex-direction:column; justify-content:flex-end; height:100%; text-align:center; font-size: 0.7em;">
              <p style="margin-bottom: 5px;">ISBN: ${isbn}</p>
              <p>&copy; Copyright ${copyright}</p>
            </div>`,
          right: `<h3 style="text-align:center; margin-bottom: 20px;">Table of Contents</h3>
            <ul style="line-height: 2.5; list-style-position: inside;">
              ${tocItems}
            </ul>`,
        },
      ];

      let allPages: string[] = [];

      if (chapterTexts.length === 0) {
        const fallbackText =
          "This book doesn’t have any chapters loaded yet. Check back soon.";

        const chapterTitleHtml = `
          <div style="text-align:center; margin: 0 0 12px 0;">
            <span style="font-weight:700; font-size:1.4em;">${bookTitle}</span>
          </div>
        `;
        const pages = paginateChapter(fallbackText, chapterTitleHtml);
        allPages = allPages.concat(pages);
      } else {
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

      return staticSpreads.concat(chapterSpreads);
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
      bookSpreads = buildBookSpreads(currentCenterIndex);
      if (currentPageSpread >= bookSpreads.length) {
        currentPageSpread = bookSpreads.length - 1;
      }
      if (currentPageSpread < 0) currentPageSpread = 0;
      updatePageContent(currentPageSpread);
    }

    function scheduleRepaginate(layoutChanged: boolean) {
      if (!layoutChanged) return;
      if (paginationTimer !== null) {
        window.clearTimeout(paginationTimer);
      }
      paginationTimer = window.setTimeout(() => {
        if (!isBookOpenLocal) return;
        rePaginateBook();
      }, 80);
    }

    // Expose reader controls
    readerControlsRef.current = {
      setFontSize: (px: number) => {
        currentFontSize = px;
        applyTypographyStyles();
        scheduleRepaginate(true);
      },
      setLineHeight: (lh: number) => {
        currentLineHeight = lh;
        applyTypographyStyles();
        scheduleRepaginate(true);
      },
      setFontFamily: (family: string) => {
        currentFontFamily = family;
        applyTypographyStyles();
        scheduleRepaginate(true);
      },
      setTheme: (theme: ReaderTheme) => {
        currentTheme = theme;
        applyTypographyStyles();
        scheduleRepaginate(false);
      },
    };

    // ---- Carousel scaling ----
    function updateBookProperties(isInitial = false) {
      const centerScale = 1.2;
      const sideScale = 1.2;
      const outerScale = 1.0;

      const wrappedCenter =
        ((currentCenterIndex % numBooks) + numBooks) % numBooks;

      for (let i = 0; i < numBooks; i++) {
        const book = bookMeshesByIndex[i];
        if (!book) continue;

        const diff = Math.abs(i - wrappedCenter);
        const distance = Math.min(diff, numBooks - diff);

        let newScale = outerScale;
        if (distance === 0) newScale = centerScale;
        else if (distance === 1) newScale = sideScale;

        if (distance !== 0 && book.rotation.y !== 0) {
          book.userData.targetRotation = 0;
          book.userData.isFlipping = true;
        }

        if (isInitial) {
          book.scale.set(newScale, newScale, newScale);
          book.userData.targetScale = newScale;
          book.userData.isScaling = false;
        } else {
          if (distance === 0) {
            book.userData.targetScale = newScale;
            book.userData.isScaling = true;
          } else {
            book.scale.set(newScale, newScale, newScale);
            book.userData.targetScale = newScale;
            book.userData.isScaling = false;
          }
        }
      }
    }

    function moveCarouselLeft() {
      if (isBookOpenLocal) return;
      if (currentCenterIndex <= 0) return;
      lastDirection = -1;
      isCarouselMoving = true;
      setCenter(currentCenterIndex - 1);
      targetCarouselX += bookSpacing;
      adjustWindow();
      updateBookProperties();
    }

    function moveCarouselRight() {
      if (isBookOpenLocal) return;
      if (currentCenterIndex >= numBooks - 1) return;
      lastDirection = 1;
      isCarouselMoving = true;
      setCenter(currentCenterIndex + 1);
      targetCarouselX -= bookSpacing;
      adjustWindow();
      updateBookProperties();
    }

    // ---- Open / Close book ----
    function openBook() {
      currentPageSpread = 0;

      setLockedIndex(currentCenterIndex);
      setIsBookOpen(true);
      isBookOpenLocal = true;

      // Per-book comment thread key
      const openedBook = sampleBooks[currentCenterIndex] as any;
      if (openedBook?.id) {
        setActiveBookId(openedBook.id);
      } else {
        setActiveBookId(`book-${currentCenterIndex}`);
      }
      setIsCommentsOpen(false);
      setIsReviewModalOpen(false);

      bookSpreads = buildBookSpreads(currentCenterIndex);
      updatePageContent(currentPageSpread);

      const leftBookIndex =
        currentCenterIndex - 1 >= 0 ? currentCenterIndex - 1 : -1;
      const rightBookIndex =
        currentCenterIndex + 1 < numBooks ? currentCenterIndex + 1 : -1;

      for (let i = 0; i < numBooks; i++) {
        const book = bookMeshesByIndex[i];
        if (!book) continue;

        if (i === currentCenterIndex) {
          book.visible = false;
          book.userData.isSlidingOut = false;
        } else if (i === leftBookIndex && leftBookIndex !== -1) {
          book.userData.isSlidingOut = true;
          book.userData.targetSlideX = book.position.x - 20;
          book.userData.targetSlideScale = 0;
        } else if (i === rightBookIndex && rightBookIndex !== -1) {
          book.userData.isSlidingOut = true;
          book.userData.targetSlideX = book.position.x + 20;
          book.userData.targetSlideScale = 0;
        } else {
          book.userData.isSlidingOut = false;
        }
      }

      navContainer!.classList.add("is-open");
      openBookContainer.classList.add("is-open");
      metadataPanel?.classList.add("is-open");
    }

    function closeBook() {
      openBookContainer.style.transition = "none";
      navContainer!.style.transition = "none";

      openBookContainer.classList.remove("is-open");
      navContainer!.classList.remove("is-open");
      metadataPanel?.classList.remove("is-open");

      void openBookContainer.offsetWidth;

      openBookContainer.style.transition =
        "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease";
      navContainer!.style.transition =
        "opacity 0.3s ease, left 0.5s cubic-bezier(0.25, 1, 0.5, 1)";

      carouselGroup.position.x = targetCarouselX;

      const centerScale = 1.2;
      const sideScale = 1.2;
      const outerScale = 0.4;

      for (let i = 0; i < numBooks; i++) {
        const book = bookMeshesByIndex[i];
        if (!book) continue;

        book.userData.isSlidingOut = false;
        book.userData.isScaling = false;

        const distance = Math.abs(i - currentCenterIndex);
        const finalX = (i - INITIAL_CENTER_INDEX) * bookSpacing;

        if (distance === 0) {
          book.userData.targetRotation = 0;
          book.userData.isFlipping = true;
          book.position.x = finalX;
          book.scale.set(centerScale, centerScale, centerScale);
          book.visible = true;
        } else {
          book.position.x = finalX;
          book.rotation.y = 0;
          book.userData.isFlipping = false;

          if (distance === 1) {
            book.scale.set(sideScale, sideScale, sideScale);
            book.visible = true;
          } else {
            book.scale.set(outerScale, outerScale, outerScale);
            const inWindow = i >= windowStart && i <= windowEnd;
            book.visible = inWindow;
          }
        }
      }

      isBookOpenLocal = false;
      currentPageSpread = 0;

      setLockedIndex(null);
      setCenter(currentCenterIndex);
      setIsBookOpen(false);
      setIsCommentsOpen(false);
      setIsReviewModalOpen(false);
      setActiveBookId(null);
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

    // ---- Click handling ----
    function onDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.classList.contains("nav-arrow") || target.id === "nav-container") {
        return;
      }

      if (openBookContainer.classList.contains("is-open")) {
        return;
      }

      const canvasRect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(activeBooks, false);

      if (intersects.length > 0) {
        const clickedBook = intersects[0].object as THREE.Mesh;
        const clickedIndex = (clickedBook.userData.logicalIndex as number) ?? -1;
        if (clickedIndex < 0) return;

        const leftIndex = currentCenterIndex - 1 >= 0 ? currentCenterIndex - 1 : -1;
        const rightIndex =
          currentCenterIndex + 1 < numBooks ? currentCenterIndex + 1 : -1;

        if (clickedIndex === currentCenterIndex) {
          if (clickedBook.userData.isFlipping) {
            openBook();
            return;
          }

          const targetRotation = clickedBook.userData.targetRotation;
          const atFront = Math.abs(targetRotation % (2 * Math.PI)) < 0.01;
          const atBack = Math.abs((targetRotation - Math.PI) % (2 * Math.PI)) < 0.01;

          if (atFront) {
            clickedBook.userData.isFlipping = true;
            clickedBook.userData.targetRotation += Math.PI;
          } else if (atBack) {
            openBook();
          }
        } else if (clickedIndex === leftIndex && leftIndex !== -1) {
          moveCarouselLeft();
        } else if (clickedIndex === rightIndex && rightIndex !== -1) {
          moveCarouselRight();
        }
      }
    }

    // ---- Nav arrows ----
    leftArrowBtn?.addEventListener("click", () => {
      if (isBookOpenLocal) flipPageLeft();
      else moveCarouselLeft();
    });

    rightArrowBtn?.addEventListener("click", () => {
      if (isBookOpenLocal) flipPageRight();
      else moveCarouselRight();
    });

    closeBookBtn?.addEventListener("click", () => {
      closeBook();
    });

    // ---- Drag to navigate ----
    let dragStartX: number | null = null;
    let dragged = false;

    function onPointerDown(e: PointerEvent) {
      dragStartX = e.clientX;
      dragged = false;
    }

    function onPointerMove(e: PointerEvent) {
      if (dragStartX === null) return;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 10) {
        dragged = true;
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (dragStartX === null) return;
      const dx = e.clientX - dragStartX;
      dragStartX = null;
      if (!dragged) return;
      const threshold = 40;
      if (Math.abs(dx) < threshold) return;

      if (!isBookOpenLocal) {
        if (dx < 0) moveCarouselRight();
        else moveCarouselLeft();
      } else {
        if (dx < 0) flipPageRight();
        else flipPageLeft();
      }
    }

    // ---- Animation loop ----
    const slowEase = 0.02;
    const fastEase = 0.08;
    let rafId: number;

    function animate() {
      rafId = requestAnimationFrame(animate);

      const MAX_LOADS_PER_FRAME = 2;
      const MAX_UNLOADS_PER_FRAME = 4;

      let loadsThisFrame = 0;
      while (loadsThisFrame < MAX_LOADS_PER_FRAME && loadQueue.length > 0) {
        const idx = loadQueue.shift()!;
        createBookMesh(idx);
        loadsThisFrame++;
      }

      let unloadsThisFrame = 0;
      while (unloadsThisFrame < MAX_UNLOADS_PER_FRAME && unloadQueue.length > 0) {
        const idx = unloadQueue.shift()!;
        unloadBook(idx);
        unloadsThisFrame++;
      }

      if (isBookOpenLocal) {
        activeBooks.forEach((book) => {
          if (!book) return;
          if (book.userData.isSlidingOut) {
            book.position.x += (book.userData.targetSlideX - book.position.x) * slowEase;

            const s = book.scale.x;
            const targetS = book.userData.targetSlideScale;
            const newS = s + (targetS - s) * slowEase;
            book.scale.set(newS, newS, newS);

            if (Math.abs(targetS - newS) < 0.01) {
              book.userData.isSlidingOut = false;
            }
          }
        });
      } else {
        activeBooks.forEach((book) => {
          if (!book) return;
          if (book.userData.isFlipping) {
            book.rotation.y += (book.userData.targetRotation - book.rotation.y) * fastEase;

            if (Math.abs(book.userData.targetRotation - book.rotation.y) < 0.01) {
              book.rotation.y = book.userData.targetRotation;
              book.userData.isFlipping = false;
            }
          }
        });

        if (isCarouselMoving) {
          carouselGroup.position.x += (targetCarouselX - carouselGroup.position.x) * fastEase;

          if (Math.abs(targetCarouselX - carouselGroup.position.x) < 0.01) {
            carouselGroup.position.x = targetCarouselX;
            isCarouselMoving = false;
          }
        }

        activeBooks.forEach((book) => {
          if (!book) return;
          if (book.userData.isScaling) {
            const currentScale = book.scale.x;
            const targetScale = book.userData.targetScale;
            const newScale = currentScale + (targetScale - currentScale) * fastEase;

            book.scale.set(newScale, newScale, newScale);

            if (Math.abs(targetScale - newScale) < 0.01) {
              book.scale.set(targetScale, targetScale, targetScale);
              book.userData.isScaling = false;
            }
          }
        });
      }

      renderer.render(scene, camera);
    }

    // ---- Start + cleanup ----
    init();
    window.addEventListener("resize", onWindowResize);
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);

    animate();

    return () => {
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      if (paginationTimer !== null) {
        window.clearTimeout(paginationTimer);
      }
      readerControlsRef.current = null;
      cancelAnimationFrame(rafId);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode === root) {
          root.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  // ---------- COMMENT / REVIEW HELPERS ----------
  const ensureThread = (bookId: string): ThreadState => {
    return commentThreads[bookId] ?? { comments: [], reviews: [] };
  };

  const updateCurrentThread = (updater: (prev: ThreadState) => ThreadState) => {
    if (!activeBookId) return;
    setCommentThreads((prev) => {
      const previous = prev[activeBookId] ?? { comments: [], reviews: [] };
      return {
        ...prev,
        [activeBookId]: updater(previous),
      };
    });
  };

  const createDataObject = (
    text: string,
    rating: number | null = null
  ): CommentItem => ({
    id: Date.now(),
    username: CURRENT_USER_ID,
    pfpUrl: "https://placehold.co/40x40/7A86B6/FFF?text=Me",
    date: Date.now(),
    text,
    reactions: {},
    replies: [],
    ...(rating !== null ? { rating } : {}),
  });

  const triggerToast = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    setIsToastVisible(true);
    toastTimerRef.current = window.setTimeout(() => {
      setIsToastVisible(false);
      toastTimerRef.current = null;
    }, 3000);
  };

  const handleToggleComments = () => {
    if (!isBookOpen || !activeBookId) return;
    if (!isCommentsOpen) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 800);
    }
    setIsCommentsOpen((open) => !open);
  };

  const currentThread = activeBookId
    ? ensureThread(activeBookId)
    : { comments: [], reviews: [] };
  const commentsForBook = currentThread.comments;
  const reviewsForBook = currentThread.reviews;

  const handleAddComment = (text: string) => {
    updateCurrentThread((prev) => ({
      ...prev,
      comments: [createDataObject(text), ...prev.comments],
    }));
  };

  const handleAddReply = (parentId: number, text: string) => {
    const reply = createDataObject(text);
    updateCurrentThread((prev) => ({
      ...prev,
      comments: prev.comments.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies ?? []), reply] }
          : c
      ),
    }));
  };

  const handleAddReviewReply = (parentId: number, text: string) => {
    const reply = createDataObject(text);
    updateCurrentThread((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) =>
        r.id === parentId
          ? { ...r, replies: [...(r.replies ?? []), reply] }
          : r
      ),
    }));
  };

  const handleEditComment = (commentId: number, newText: string) => {
    updateCurrentThread((prev) => ({
      ...prev,
      comments: prev.comments.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, text: newText, date: "Edited" };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === commentId
                ? { ...reply, text: newText, date: "Edited" }
                : reply
            ),
          };
        }
        return comment;
      }),
    }));
  };

  const handleEditReview = (reviewId: number, newText: string) => {
    updateCurrentThread((prev) => ({
      ...prev,
      reviews: prev.reviews.map((review) => {
        if (review.id === reviewId) {
          return { ...review, text: newText, date: "Edited" };
        }
        if (review.replies) {
          return {
            ...review,
            replies: review.replies.map((reply) =>
              reply.id === reviewId
                ? { ...reply, text: newText, date: "Edited" }
                : reply
            ),
          };
        }
        return review;
      }),
    }));
  };

  const handleDeleteComment = (commentId: number) => {
    updateCurrentThread((prev) => ({
      ...prev,
      comments: prev.comments
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies.filter((r) => r.id !== commentId),
        })),
    }));
  };

  const handleDeleteReview = (reviewId: number) => {
    updateCurrentThread((prev) => ({
      ...prev,
      reviews: prev.reviews
        .filter((r) => r.id !== reviewId)
        .map((r) => ({
          ...r,
          replies: r.replies.filter((rr) => rr.id !== reviewId),
        })),
    }));
  };

  const handleSubmitReview = ({
    rating,
    text,
  }: {
    rating: number;
    text: string;
  }) => {
    if (!activeBookId) return;
    updateCurrentThread((prev) => {
      const existing = prev.reviews.find((r) => r.username === CURRENT_USER_ID);
      if (existing) {
        return {
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.username === CURRENT_USER_ID
              ? { ...r, rating, text, date: Date.now() }
              : r
          ),
        };
      }
      const newReview = createDataObject(text, rating);
      return {
        ...prev,
        reviews: [newReview, ...prev.reviews],
      };
    });
  };

  const handleDeleteOwnReview = () => {
    updateCurrentThread((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((r) => r.username !== CURRENT_USER_ID),
    }));
  };

  const usersReview = reviewsForBook.find((r) => r.username === CURRENT_USER_ID);
  const hasUserReviewed = Boolean(usersReview);

  const getDateVal = (d: number | string) => (typeof d === "number" ? d : 0);

  const sortedComments = useMemo(() => {
    const sorted = [...commentsForBook];
    switch (filterSort) {
      case "oldest":
        return sorted.sort((a, b) => getDateVal(a.date) - getDateVal(b.date));
      case "mostLiked":
        return sorted.sort((a, b) => {
          const likesA = Object.values(a.reactions || {}).reduce(
            (s, c) => s + c,
            0
          );
          const likesB = Object.values(b.reactions || {}).reduce(
            (s, c) => s + c,
            0
          );
          return likesB - likesA;
        });
      case "mostReplies":
        return sorted.sort(
          (a, b) => (b.replies?.length || 0) - (a.replies?.length || 0)
        );
      case "newest":
      default:
        return sorted.sort((a, b) => getDateVal(b.date) - getDateVal(a.date));
    }
  }, [commentsForBook, filterSort]);

  const sortedReviews = useMemo(() => {
    const sorted = [...reviewsForBook];
    switch (filterSort) {
      case "oldest":
        return sorted.sort((a, b) => getDateVal(a.date) - getDateVal(b.date));
      case "mostLiked":
        return sorted.sort((a, b) => {
          const likesA = Object.values(a.reactions || {}).reduce(
            (s, c) => s + c,
            0
          );
          const likesB = Object.values(b.reactions || {}).reduce(
            (s, c) => s + c,
            0
          );
          return likesB - likesA;
        });
      case "highestRating":
        return sorted.sort((a, b) => (b.rating || 0) - (b.rating || 0));
      case "lowestRating":
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case "newest":
      default:
        return sorted.sort((a, b) => getDateVal(b.date) - getDateVal(a.date));
    }
  }, [reviewsForBook, filterSort]);

  // Helper for Text-to-Speech etc.
  const getVisiblePageText = () => {
    const left = document.getElementById("page-left");
    const right = document.getElementById("page-right");
    const lt = left?.innerText ?? "";
    const rt = right?.innerText ?? "";
    return `${lt}\n\n${rt}`.trim();
  };

  const displayLanguage =
    ((centerBook as any)?.language as string | undefined) ?? "Unknown";
  const displayYear = (centerBook as any)?.year ?? "";

  const profileAvatarSrc =
    (profile as any)?.avatarUrl ||
    (profile as any)?.photo ||
    (profile as any)?.avatar ||
    "";


  const tags = Array.isArray((centerBook as any)?.tags)
    ? (((centerBook as any).tags ?? []) as string[]).filter(Boolean)
    : [];

  return (
    <div className="app home3d-root">
      <AppHeader />

      <main className="carousel home3d-main">
        {/* LEFT: Metadata */}
        <div className="metadata" id="metadata-panel">
          {/* 1. title */}
          <div className="meta-title" title={(centerBook as any)?.title ?? ""}>
            {(centerBook as any)?.title ?? "Untitled"}
          </div>

          {/* 3. year and "written by" */}
          <div className="meta-subline">
            <span className="meta-year">{displayYear}</span>
            <span className="meta-writtenby"> written by</span>
          </div>

          {/* 2. separator */}
          <hr className="meta-hr" />

          {/* 4. author profile picture and author name */}
          <div className="meta-header">
            <Link
              to="/profile"
              className="meta-avatar-link"
              aria-label="Open profile"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="meta-avatar" aria-hidden="true">
                {profileAvatarSrc ? (
                  <img src={profileAvatarSrc} alt="" />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                    <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                    <path
                      d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
            </Link>


            {/* Keeping the same behavior as before (Link + stopPropagation) */}
            <Link
              to="/profile"
              className="meta-username"
              title={(centerBook as any)?.author ?? (centerBook as any)?.user ?? ""}
              onClick={(e) => e.stopPropagation()}
            >
              {(centerBook as any)?.author ??
                (centerBook as any)?.user ??
                "Unknown Author"}
            </Link>
          </div>

          {/* 5. separator */}
          <hr className="meta-hr" />

          {/* 6. 3 icons */}
          <div className="meta-actions">
            <LikeButton count={displayLikes} active={liked} onToggle={toggleLike} />
            <StarButton
              rating={combinedRating}
              userRating={userRating}
              active={userRating > 0}
              onRate={onRate}
            />
            <SaveButton count={displaySaves} active={saved} onToggle={toggleSave} />
          </div>

          {/* 7. separator */}
          <hr className="meta-hr" />

          {/* 8. chapters */}
          <p className="meta-chapters">
            {((centerBook as any)?.currentChapter ?? 0)}/
            {((centerBook as any)?.totalChapters ?? 0)} Chapters
          </p>

          {/* 9. separator */}
          <hr className="meta-hr" />

          {/* 10. language */}
          <p className="meta-language">Language: {displayLanguage}</p>

          {/* 11. separator */}
          <hr className="meta-hr" />

          {/* ✅ 12. genres as transparent pills (same idea as Library) */}
          <div
            className="meta-tags meta-tags--pills"
            onClick={(e) => e.stopPropagation()}
          >
            {tags.length > 0
              ? tags.map((t, i) => {
                  const c = colorFromString(t);
                  return (
                    <span
                      key={`${t}-${i}`}
                      className="genre-pill"
                      title={t}
                      style={{
                        backgroundColor: c.bg,
                        borderColor: c.border,
                        color: c.text,
                      }}
                    >
                      {t}
                    </span>
                  );
                })
              : null}
          </div>
        </div>

        {/* CENTER: 3D + Reader */}
        <section className="home3d-stage">
          <div ref={threeRootRef} className="three-root" />

          <div id="open-book-container" className="open-book-container">
            <div className="open-book-page" id="page-left" />
            <div className="open-book-page" id="page-right" />
          </div>

          <div className="nav-container" id="nav-container">
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

          {/* Reader menu */}
          <ReaderMenu
            visible={isBookOpen}
            getVisiblePageText={getVisiblePageText}
            onApplyTypography={({
              fontSize,
              lineHeight,
              fontFamily,
              theme,
            }: TypographyOptions) => {
              const controls = readerControlsRef.current;
              if (!controls) return;
              if (typeof fontSize === "number") controls.setFontSize(fontSize);
              if (typeof lineHeight === "number") controls.setLineHeight(lineHeight);
              if (typeof fontFamily === "string") controls.setFontFamily(fontFamily);
              if (typeof theme === "string") controls.setTheme(theme);
            }}
          />

          {/* Comments sidebar – only when book open */}
          {isBookOpen && activeBookId && (
            <CommentSidebar
              isOpen={isCommentsOpen}
              onToggle={handleToggleComments}
              comments={sortedComments}
              reviews={sortedReviews}
              onAddComment={handleAddComment}
              onAddReply={handleAddReply}
              onAddReviewReply={handleAddReviewReply}
              onOpenReviewModal={() => setIsReviewModalOpen(true)}
              hasUserReviewed={hasUserReviewed}
              filterSort={filterSort}
              onFilterChange={setFilterSort}
              onEditComment={handleEditComment}
              onEditReview={handleEditReview}
              onDeleteComment={handleDeleteComment}
              onDeleteReview={handleDeleteReview}
              isLoading={isLoading}
              onReport={triggerToast}
              toastMessage={toastMessage}
              isToastVisible={isToastVisible}
            />
          )}

          {/* Review modal – global overlay */}
          {isReviewModalOpen && (
            <ReviewModal
              isOpen={isReviewModalOpen}
              onClose={() => setIsReviewModalOpen(false)}
              onSubmit={(data: { rating: number; text: string }) => {
                handleSubmitReview(data);
                setIsReviewModalOpen(false);
              }}
              onDelete={() => {
                handleDeleteOwnReview();
                setIsReviewModalOpen(false);
              }}
              initialReview={usersReview ?? null}
            />
          )}
        </section>
      </main>
    </div>
  );
}
