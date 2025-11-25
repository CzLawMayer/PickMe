// src/pages/Home.tsx
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import AppHeader from "@/components/AppHeader";
import { sampleBooks } from "@/booksData";

import "./Home.css";
import "./Home3D.css";

import { Link } from "react-router-dom";
import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";
import StarButton from "@/components/StarButton";

type BookSpread = { left: string; right: string };

export default function Home() {
  const threeRootRef = useRef<HTMLDivElement | null>(null);

  // Which book is currently in the center of the carousel
  const [centerIndex, setCenterIndex] = useState(0);
  const centerIndexRef = useRef(0);

  // --- NEW: per-book UI state (one slot per book) ---
  const [likesByBook, setLikesByBook] = useState<boolean[]>(() =>
    sampleBooks.map(() => false)
  );
  const [savesByBook, setSavesByBook] = useState<boolean[]>(() =>
    sampleBooks.map(() => false)
  );
  const [ratingsByBook, setRatingsByBook] = useState<number[]>(() =>
    sampleBooks.map(() => 0)
  );

  // Convenience: the "current" book data from booksData
  const centerBook = sampleBooks[centerIndex] ?? sampleBooks[0];

  // Derived UI state for the current center book
  const liked = likesByBook[centerIndex] ?? false;
  const saved = savesByBook[centerIndex] ?? false;
  const userRating = ratingsByBook[centerIndex] ?? 0;

  // Base metadata from booksData
  // Base metadata from booksData
  const rawRating = centerBook?.rating;
  const baseRating =
    typeof rawRating === "string"
      ? parseFloat(String(rawRating).split("/")[0] || "0")
      : Number(rawRating ?? 0);

  const votesRaw = centerBook?.ratingCount ?? 0;
  const votes = Number.isFinite(Number(votesRaw)) ? Number(votesRaw) : 0;
  const PRIOR_VOTES = 20;

  // Blend the book's rating with your rating (per book)
  const combinedRating =
    userRating > 0
      ? votes > 0
        ? (baseRating * votes + userRating) / (votes + 1)
        : baseRating > 0
        ? (baseRating * PRIOR_VOTES + userRating) / (PRIOR_VOTES + 1)
        : userRating
      : baseRating;

  const baseLikes = centerBook?.likes ?? 0;
  const baseSaves = centerBook?.bookmarks ?? 0;

  // What we actually display in the UI
  const displayLikes = baseLikes + (liked ? 1 : 0);
  const displaySaves = baseSaves + (saved ? 1 : 0);


  // --- NEW: per-book handlers use the current index ---
  const toggleLike = () => {
    setLikesByBook(prev => {
      const next = [...prev];
      next[centerIndex] = !next[centerIndex];
      return next;
    });
  };

  const toggleSave = () => {
    setSavesByBook(prev => {
      const next = [...prev];
      next[centerIndex] = !next[centerIndex];
      return next;
    });
  };

  const onRate = (value: number) => {
    setRatingsByBook(prev => {
      const next = [...prev];
      next[centerIndex] = value;
      return next;
    });
  };

  useEffect(() => {
    const root = threeRootRef.current;
    if (!root) return;

    /* ------------------------------------------------------------------
       CORE STATE
    ------------------------------------------------------------------ */

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let carouselGroup: THREE.Group;
    let raycaster: THREE.Raycaster;
    let mouse: THREE.Vector2;

    // Books from booksData: covers + titles
    const bookCovers =
      sampleBooks.length > 0
        ? sampleBooks.map((b, index) => ({
            front:
              b.coverUrl ||
              `https://placehold.co/470x675/222222/f0f0f0?text=Book+${index + 1}`,
            back:
              (b as any).backCoverUrl ||
              `https://placehold.co/470x675/111111/f0f0f0?text=Back`,
            title: b.title || `Book ${index + 1}`,
          }))
        : [];

    const numBooks = bookCovers.length;
    if (numBooks === 0) return;

    const INITIAL_CENTER_INDEX = 0;
    centerIndexRef.current = INITIAL_CENTER_INDEX;
    let currentCenterIndex = centerIndexRef.current;

    let isCarouselMoving = false;
    let targetCarouselX = 0;

    // Book dimensions / spacing
    const bookWidth = 5.7;
    const bookHeight = 8;
    const bookDepth = 0.55;
    const bookSpacing = 13.5;

    let isBookOpen = false;
    let currentPageSpread = 0;
    let bookSpreads: BookSpread[] = [];

    const spineColors = ["#ef5623", "#e41f6c", "#6a1b9a", "#1e88e5"];

    // font settings for reader
    let currentFontSize = 14;
    let currentLineHeight = 1.6;

    // Lazy-loading window:
    const MAX_LOADED = 30;
    const CHUNK = 10;
    let windowStart = 0;
    let windowEnd = Math.min(CHUNK - 1, numBooks - 1);
    let lastDirection: 1 | -1 | 0 = 0;

    // Mesh storage: by logical index + active list
    const bookMeshesByIndex: (THREE.Mesh | null)[] = Array(numBooks).fill(null);
    let activeBooks: THREE.Mesh[] = [];

    // Queues for smooth loading/unloading
    let loadQueue: number[] = [];
    let unloadQueue: number[] = [];

    // Shared THREE helpers
    const textureLoader = new THREE.TextureLoader();
    const pageMaterial = new THREE.MeshBasicMaterial({ color: 0xf5f5dc });

    /* ------------------------------------------------------------------
       DOM refs
    ------------------------------------------------------------------ */

    const openBookContainer = document.getElementById(
      "open-book-container"
    ) as HTMLDivElement | null;
    const pageLeft = document.getElementById("page-left") as HTMLDivElement | null;
    const pageRight = document.getElementById("page-right") as HTMLDivElement | null;
    const navContainer = document.getElementById(
      "nav-container"
    ) as HTMLDivElement | null;
    const settingsBtn = document.getElementById(
      "settings-btn"
    ) as HTMLButtonElement | null;
    const settingsMenu = document.getElementById(
      "settings-menu"
    ) as HTMLDivElement | null;
    const fontSizeSlider = document.getElementById(
      "font-size-slider"
    ) as HTMLInputElement | null;
    const lineHeightSlider = document.getElementById(
      "line-height-slider"
    ) as HTMLInputElement | null;
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

    /* ------------------------------------------------------------------
       Helpers
    ------------------------------------------------------------------ */

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

    /* ------------------------------------------------------------------
       THREE setup + book creation
    ------------------------------------------------------------------ */

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
        pageMaterial, // right
        spineMaterial, // left (spine)
        pageMaterial, // top
        pageMaterial, // bottom
        frontCoverMaterial, // front
        backCoverMaterial, // back
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
        targetVisibility: true,
        isSlidingOut: false,
        isSlidingIn: false,
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
      activeBooks = activeBooks.filter(b => b !== book);
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

    // Helper so any change to currentCenterIndex also updates React state
    function setCenter(newIndex: number) {
      const clamped = Math.max(0, Math.min(numBooks - 1, newIndex));
      currentCenterIndex = clamped;
      centerIndexRef.current = clamped;
      setCenterIndex(clamped);
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

    /* ------------------------------------------------------------------
       Pagination using booksData chapterTexts
    ------------------------------------------------------------------ */

    function paginateChapter(fullText: string, titleHtml: string | null = null) {
      const testPage = pageLeft!;
      const computedStyle = window.getComputedStyle(testPage);
      const pageHeight = parseFloat(computedStyle.height);
      const contentAreaHeight =
        pageHeight -
        (parseFloat(computedStyle.paddingTop) +
          parseFloat(computedStyle.paddingBottom));
      const marginBuffer = 0;
      const effectiveHeight = contentAreaHeight - marginBuffer;

      const originalContent = testPage.innerHTML;
      const pages: string[] = [];

      const processedText = (fullText || "").replace(/\n/g, " <br><br> ");
      const words = processedText.split(" ");

      let currentPageText = "";
      if (titleHtml) currentPageText += titleHtml;

      const measureDiv = document.createElement("div");
      measureDiv.style.fontSize = `${currentFontSize}px`;
      measureDiv.style.lineHeight = String(currentLineHeight);
      measureDiv.style.overflow = "hidden";
      measureDiv.style.visibility = "hidden";
      measureDiv.style.height = "auto";
      measureDiv.style.width = "100%";
      testPage.appendChild(measureDiv);

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

    // Build spreads (title/dedication/ToC + chapters) from booksData
    function buildBookSpreads(bookIndex: number): BookSpread[] {
      const meta = bookCovers[bookIndex];
      const bookData = sampleBooks[bookIndex] as any | undefined;

      const bookTitle = meta.title;
      const bookAuthor = bookData?.author || "A. Nonymous";
      const isbn = "978-0-999999-99-9"; // you can move ISBN into booksData later
      const copyright = (bookData?.year ?? 2024).toString();
      const dedication =
        bookData?.dedication ||
        "For everyone who reads in a world of screens.";

      const chapterTitles: string[] = Array.isArray(bookData?.chapters)
        ? bookData.chapters
        : [];
      const chapterTexts: string[] = Array.isArray(bookData?.chapterTexts)
        ? bookData.chapterTexts
        : [];

      // Build ToC list from chapters, with fallback
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
          right: `<div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; text-align:center; padding-top: 15vh; padding-bottom: 5vh; color:#1a1a1a;">
              <div>
                <h1 style="font-size: 2.5em; margin: 0; padding: 0;">${bookTitle}</h1>
                <p style="font-size: 1.2em; margin-top: 20px;">By ${bookAuthor}</p>
              </div>
              <div style="font-size: 0.8em; color: #555;">
                <p>ISBN: ${isbn}</p>
                <p>&copy; Copyright ${copyright}</p>
              </div>
            </div>`,
        },
        {
          left: "",
          right: `<div style="display:flex; justify-content:center; align-items:center; height:100%; text-align:center; font-style:italic; color:#333;">
              <p>${dedication}</p>
            </div>`,
        },
        {
          left: `<div style="display:flex; flex-direction:column; justify-content:flex-end; height:100%; text-align:center; font-size: 0.7em; color: #555;">
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
        const pages = paginateChapter(fallbackText, `<h3>${bookTitle}</h3>`);
        allPages = allPages.concat(pages);
      } else {
        for (let i = 0; i < chapterTexts.length; i++) {
          const text = chapterTexts[i];
          if (!text) continue;
          const title = chapterTitles[i] ?? `Chapter ${i + 1}`;
          const pages = paginateChapter(text, `<h3>${title}</h3>`);
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

    function updatePageContent(index: number) {
      const spread = bookSpreads[index];
      if (!spread) return;
      pageLeft!.innerHTML = spread.left;
      pageRight!.innerHTML = spread.right;
    }

    function rePaginateBook() {
      pageLeft!.style.fontSize = `${currentFontSize}px`;
      pageRight!.style.fontSize = `${currentFontSize}px`;
      pageLeft!.style.lineHeight = String(currentLineHeight);
      pageRight!.style.lineHeight = String(currentLineHeight);

      bookSpreads = buildBookSpreads(currentCenterIndex);
      if (currentPageSpread >= bookSpreads.length) {
        currentPageSpread = bookSpreads.length - 1;
      }
      if (currentPageSpread < 0) currentPageSpread = 0;
      updatePageContent(currentPageSpread);
    }

    /* ------------------------------------------------------------------
       Carousel movement + scaling
    ------------------------------------------------------------------ */

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
      if (isBookOpen) {
        flipPageLeft();
        return;
      }
      if (currentCenterIndex <= 0) return;

      lastDirection = -1;
      isCarouselMoving = true;
      setCenter(currentCenterIndex - 1);
      targetCarouselX += bookSpacing;

      adjustWindow();
      updateBookProperties();
    }

    function moveCarouselRight() {
      if (isBookOpen) {
        flipPageRight();
        return;
      }
      if (currentCenterIndex >= numBooks - 1) return;

      lastDirection = 1;
      isCarouselMoving = true;
      setCenter(currentCenterIndex + 1);
      targetCarouselX -= bookSpacing;

      adjustWindow();
      updateBookProperties();
    }

    /* ------------------------------------------------------------------
       Open / Close book
    ------------------------------------------------------------------ */

    function openBook() {
      // Always rebuild pages for the *current* center book
      currentPageSpread = 0;

      // Clear pages immediately so we don't flash old content
      pageLeft!.innerHTML = "";
      pageRight!.innerHTML = "";

      // Keep your 550ms sync with the flip animation, but always rebuild
      setTimeout(() => {
        bookSpreads = buildBookSpreads(currentCenterIndex);
        currentPageSpread = 0;
        updatePageContent(currentPageSpread);
      }, 550);

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
      isBookOpen = true;
    }

    function closeBook() {
      settingsMenu?.classList.remove("is-open");

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
        book.userData.isSlidingIn = false;

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
            book.visible = inWindow && book.userData.targetVisibility;
          }
        }
      }

      isBookOpen = false;
      currentPageSpread = 0;
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

    /* ------------------------------------------------------------------
       Click to flip / open
    ------------------------------------------------------------------ */

    function onDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        target.classList.contains("nav-arrow") ||
        target.id === "nav-container" ||
        target.closest(".settings-menu")
      ) {
        return;
      }

      if (openBookContainer.classList.contains("is-open")) {
        return;
      }

      const canvasRect = renderer.domElement.getBoundingClientRect();
      mouse.x =
        ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      mouse.y =
        -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(activeBooks, false);

      if (intersects.length > 0) {
        const clickedBook = intersects[0].object as THREE.Mesh;
        const clickedIndex =
          (clickedBook.userData.logicalIndex as number) ?? -1;
        if (clickedIndex < 0) return;

        const leftIndex =
          currentCenterIndex - 1 >= 0 ? currentCenterIndex - 1 : -1;
        const rightIndex =
          currentCenterIndex + 1 < numBooks ? currentCenterIndex + 1 : -1;

        if (clickedIndex === currentCenterIndex) {
          if (clickedBook.userData.isFlipping) {
            openBook();
            return;
          }

          const targetRotation = clickedBook.userData.targetRotation;
          const atFront =
            Math.abs(targetRotation % (2 * Math.PI)) < 0.01;
          const atBack =
            Math.abs((targetRotation - Math.PI) % (2 * Math.PI)) < 0.01;

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

    /* ------------------------------------------------------------------
       Settings menu
    ------------------------------------------------------------------ */

    settingsBtn?.addEventListener("click", () => {
      settingsMenu?.classList.toggle("is-open");
    });

    fontSizeSlider?.addEventListener("input", (e: Event) => {
      const val = (e.target as HTMLInputElement).value;
      currentFontSize = Number(val);
      rePaginateBook();
    });

    lineHeightSlider?.addEventListener("input", (e: Event) => {
      const val = (e.target as HTMLInputElement).value;
      currentLineHeight = Number(val);
      rePaginateBook();
    });

    leftArrowBtn?.addEventListener("click", () => {
      if (isBookOpen) flipPageLeft();
      else moveCarouselLeft();
    });

    rightArrowBtn?.addEventListener("click", () => {
      if (isBookOpen) flipPageRight();
      else moveCarouselRight();
    });

    closeBookBtn?.addEventListener("click", () => {
      closeBook();
    });

    /* ------------------------------------------------------------------
       Drag-to-move
    ------------------------------------------------------------------ */

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

      if (!isBookOpen) {
        if (dx < 0) moveCarouselRight();
        else moveCarouselLeft();
      } else {
        if (dx < 0) flipPageRight();
        else flipPageLeft();
      }
    }

    /* ------------------------------------------------------------------
       Animation loop
    ------------------------------------------------------------------ */

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
      while (
        unloadsThisFrame < MAX_UNLOADS_PER_FRAME &&
        unloadQueue.length > 0
      ) {
        const idx = unloadQueue.shift()!;
        unloadBook(idx);
        unloadsThisFrame++;
      }

      if (isBookOpen) {
        activeBooks.forEach(book => {
          if (!book) return;
          if (book.userData.isSlidingOut) {
            book.position.x +=
              (book.userData.targetSlideX - book.position.x) * slowEase;

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
        activeBooks.forEach(book => {
          if (!book) return;
          if (book.userData.isFlipping) {
            book.rotation.y +=
              (book.userData.targetRotation - book.rotation.y) * fastEase;

            if (
              Math.abs(book.userData.targetRotation - book.rotation.y) < 0.01
            ) {
              book.rotation.y = book.userData.targetRotation;
              book.userData.isFlipping = false;
            }
          }
        });

        if (isCarouselMoving) {
          carouselGroup.position.x +=
            (targetCarouselX - carouselGroup.position.x) * fastEase;

          if (Math.abs(targetCarouselX - carouselGroup.position.x) < 0.01) {
            carouselGroup.position.x = targetCarouselX;
            isCarouselMoving = false;
          }
        }

        activeBooks.forEach(book => {
          if (!book) return;
          if (book.userData.isScaling) {
            const currentScale = book.scale.x;
            const targetScale = book.userData.targetScale;
            const newScale =
              currentScale + (targetScale - currentScale) * fastEase;

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

    /* ------------------------------------------------------------------
       Start + cleanup
    ------------------------------------------------------------------ */

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
      cancelAnimationFrame(rafId);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode === root) {
          root.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return (
    <div className="app home3d-root">
      <AppHeader />

      <main className="carousel home3d-main">
        {/* LEFT: Metadata tied to the current center book */}
        <div className="metadata" id="metadata-panel">
          <div className="meta-header">
            <div className="meta-avatar" aria-hidden="true">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="9" r="3" stroke="white" strokeWidth="2" />
                <path
                  d="M6 19c1.6-3 4-4 6-4s4.4 1 6 4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <Link
              to="/profile"
              className="meta-username"
              title={centerBook?.user ?? ""}
              onClick={e => e.stopPropagation()}
            >
              {centerBook?.user ?? "Unknown User"}
            </Link>
          </div>

          <hr className="meta-hr" />

          <div className="meta-actions">
            <LikeButton
              count={displayLikes}
              active={liked}
              onToggle={toggleLike}
            />
            <StarButton
              rating={combinedRating}
              userRating={userRating}
              active={userRating > 0}
              onRate={onRate}
            />
            <SaveButton
              count={displaySaves}
              active={saved}
              onToggle={toggleSave}
            />
          </div>

          <hr className="meta-hr" />

          <p className="meta-chapters">
            {(centerBook?.currentChapter ?? 0)}/{centerBook?.totalChapters ?? 0}{" "}
            Chapters
          </p>

          <hr className="meta-hr" />

          <ul className="meta-tags">
            {(centerBook?.tags ?? []).map((t: string) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        {/* CENTER: 3D stage + reader */}
        <section className="home3d-stage">
          <div ref={threeRootRef} className="three-root" />

          <div id="open-book-container" className="open-book-container">
            <div className="open-book-page" id="page-left" />
            <div className="open-book-page" id="page-right" />

            <button id="settings-btn" title="Settings">
              &#9881;
            </button>
            <div className="settings-menu" id="settings-menu">
              <div className="slider-group">
                <label htmlFor="font-size-slider">Font Size</label>
                <input
                  type="range"
                  id="font-size-slider"
                  min={12}
                  max={18}
                  step={1}
                  defaultValue={14}
                />
              </div>
              <div className="slider-group">
                <label htmlFor="line-height-slider">Line Height</label>
                <input
                  type="range"
                  id="line-height-slider"
                  min={1.4}
                  max={2.0}
                  step={0.1}
                  defaultValue={1.6}
                />
              </div>
            </div>
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
        </section>
      </main>
    </div>
  );
}
