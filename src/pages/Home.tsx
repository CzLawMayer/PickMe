// src/pages/Home.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";

import AppHeader from "@/components/AppHeader";
import { sampleBooks } from "@/booksData";

import "./Home.css";
import "./Home3D.css";

type BookSpread = { left: string; right: string };

export default function Home() {
  const threeRootRef = useRef<HTMLDivElement | null>(null);

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

    // Books from data
    const bookCovers =
      sampleBooks.length > 0
        ? sampleBooks.map((b, index) => ({
            front:
              b.coverUrl ||
              `https://placehold.co/470x675/222222/f0f0f0?text=Book+${index + 1}`,
            back:
              (b.backCoverUrl as string | undefined) ||
              `https://placehold.co/470x675/111111/f0f0f0?text=Back`,
            title: b.title || `Book ${index + 1}`,
          }))
        : [
            {
              front:
                "https://placehold.co/470x675/660000/f0f0f0?text=Book+1+Cover",
              back: "https://placehold.co/470x675/4d0000/f0f0f0?text=Book+1+Back",
              title: "The First Book",
            },
            {
              front:
                "https://placehold.co/470x675/003366/f0f0f0?text=Book+2+Cover",
              back: "https://placehold.co/470x675/002244/f0f0f0?text=Book+2+Back",
              title: "A Second Story",
            },
            {
              front:
                "https://placehold.co/470x675/004d00/f0f0f0?text=Book+3+Cover",
              back: "https://placehold.co/470x675/003300/f0f0f0?text=Book+3+Back",
              title: "Book 3: The Middle",
            },
            {
              front:
                "https://placehold.co/470x675/4d2600/f0f0f0?text=Book+4+Cover",
              back: "https://placehold.co/470x675/331a00/f0f0f0?text=Book+4+Back",
              title: "Everything to Get More",
            },
            {
              front:
                "https://placehold.co/470x675/330033/f0f0f0?text=Book+5+Cover",
              back: "https://placehold.co/470x675/220022/f0f0f0?text=Book+5+Back",
              title: "Book Five",
            },
          ];

    const numBooks = bookCovers.length;
    if (numBooks === 0) return;

    const INITIAL_CENTER_INDEX = 0;
    let currentCenterIndex = Math.min(INITIAL_CENTER_INDEX, numBooks - 1);
    let isCarouselMoving = false;
    let targetCarouselX = 0;

    // Your tuned dimensions
    const bookWidth = 5.7;
    const bookHeight = 8;
    const bookDepth = 0.55;
    const bookSpacing = 13.5;

    let isBookOpen = false;
    let currentPageSpread = 0;
    let bookSpreads: BookSpread[] = [];

    const spineColors = ["#ef5623", "#e41f6c", "#6a1b9a", "#1e88e5"];

    // font settings
    let currentFontSize = 14;
    let currentLineHeight = 1.6;

    // Lazy-loading window:
    const MAX_LOADED = 30;
    const CHUNK = 10;
    let windowStart = 0; // inclusive logical index
    let windowEnd = Math.min(CHUNK - 1, numBooks - 1); // inclusive
    let lastDirection: 1 | -1 | 0 = 0;

    // Mesh storage: by logical index + active list
    const bookMeshesByIndex: (THREE.Mesh | null)[] = Array(numBooks).fill(null);
    let activeBooks: THREE.Mesh[] = [];

    // Shared THREE helpers
    const textureLoader = new THREE.TextureLoader();
    const pageMaterial = new THREE.MeshBasicMaterial({ color: 0xf5f5dc });

    /* ------------------------------------------------------------------
       DOM refs (same ids as your HTML)
    ------------------------------------------------------------------ */

    const openBookContainer = document.getElementById(
      "open-book-container"
    ) as HTMLDivElement | null;
    const pageLeft = document.getElementById("page-left") as HTMLDivElement | null;
    const pageRight = document.getElementById(
      "page-right"
    ) as HTMLDivElement | null;
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

    if (!openBookContainer || !pageLeft || !pageRight || !navContainer) {
      console.warn("Reader DOM elements not found.");
      return;
    }

    /* ------------------------------------------------------------------
       Chapter text (same as before)
    ------------------------------------------------------------------ */

    const chapter1Text = `My name is Names.
I was found alone in the middle of a tulip field, with a name tag naming me “Names.” I was told my body was so cold that my skin was blue. Later, when I was four, I was adopted by a woman who wasn’t ready to have a daughter and whom I never called mother. We grew up in a silent house. There, I found that silence brings thinking into the human mind, and that thinking takes you to weird places.
I was eighteen when I moved to Austria to study psychology, hoping I would learn something about myself. I learned nothing about myself, but learned everything about my three best friends, Archie, Kind, and Memory.
Every night during the last month before our graduation, my friends, their friends, and I gathered in Memory’s apartment to try to hold on to our adolescence. We were terrified. One week before the announced date, we gathered to watch the video of the first presentation the four of us ever did together. We were supposed to talk about world hunger, but got so drunk the night prior that we had to present wearing sunglasses. We failed, but we were by far the coolest. As we laughed about it, I looked at my face in that video and I didn’t recognize myself. I didn’t know who I was then, and I still didn’t know who I was at that moment. I always worried I wouldn’t be able to make friends, but those videos made all of my friends cry and hug me tenderly. Still, somehow, I felt like I felt like I didn’t belong with those friends who knew everything about my past, my present, and my future.
I didn’t know where my life was headed. I had spent the past year wishing for university to be over, just to be held as a coward the moment a date for graduation was announced. I was stuck in place as everyone fled away from me, because everyone somehow decided they were adults and that they could figure out how to get a job. Everyone except for Kind, who simply couldn’t find a job as an art major.
Kind, no pun intended, was a kind man. He was a year younger than the rest of us, and we always treated him as such. Even though he was a silent person, as silent as one can be, everyone could notice that his heart was filled with passion and emotion. He loved movies more than anything, and he was always somehow invested in one of those “we are getting married and having babies” type of relationships with some poor girl who would get her heart irremediably broken by his lack of direction towards life. He never worried about anything, which I admired to a degree. Everyone always came to him for advice, despite his age, and even though his advice always came down to “don’t worry,” he said it with such confidence and earnestness that you couldn’t help not to stop worrying.
“Are you having fun?” he asked me after I didn’t laugh when everyone else did. He had a comfortable soul; people always told him their deepest secrets and worries without even realizing it, and I was no different.
“I think?” I said bluntly as my voice cracked. “I don’t know, Kind. I feel like I flew away with the millions of tons of cigarette ash that we covered the campus with over these four years. I feel like I’m going to disappear.”
“You are not having fun,” he said.`;

    const chapter2Text = `My name is Memory.
My mom died giving birth to me. I was told that she held me tightly, covered in her blood, and cried out, “Me morí,” which means “I died” in Spanish. Those were her last words. “Me morí” sounds like “Memory,” and that was the twisted reasoning my father had when choosing my name, right before clogging the exhaust of our car with a wet towel and attempting to suffocate us both. I was the only survivor.
Growing up, I never had any friends. But at university, Kind became my first friend. I don’t think I was his best friend, but he for sure was mine. We met on the first day of classes when our Art History professor asked us to get in pairs and get to know each other. I’ll forever be thankful for that professor’s life, because God knows I would have spent the next four years of my life alone if it wasn’t for that one conversation. Kind was a silent person, as silent as one can be, but people just seemed to gravitate towards his indifference towards the world and its pain. Everything was simply better when he was around. He had such a comfortable soul.
Kind yearned for romance, while I, myself, wasn’t really the relationship kind of guy. Every year, he would somehow survive a “we’re going to get married and have babies” relationship that would last about five or six months, tops. After the breakups, driven by grief and his relentless spirit to find love, we would spend the remaining months of the year hunting for romance, quite unsuccessfully most of the time.
Regardless of how many girls we fell for every single week, my heart always belonged to Names. I caught glimpses of her eyes everywhere I went after I first saw them four years ago, and everywhere I went I thought she was beautiful. I somehow and somewhat belonged to her. Kind, trying to help me ask her out, joined us three and Archie to give a presentation about world hunger on our first week at university. However, that only chained me eternally to her as a friend. As the years passed by, my friendship with her grew larger, but the shyness of my love grew even larger as well, to the point I simply couldn’t endure the idea of her eventually treating me like a stranger when we’d inevitably break up after graduation.
One terrible evening inside my apartment, one week before our graduation, her pretty laugh, coming from downstairs, woke me up.
I hazily walked down the stairs in my pijamas. My three P.M. nap had turned my day into night, and Kind had taken the liberty of gathering the whole friend group inside my apartment to watch the video of our terrible first presentation and cry about it. As I stepped into the kitchen, Archie graciously and promptly pointed out that I was wearing pijamas at eight P.M. and brought the community together to ridicule me. But hey, at least they ordered pizza.
“Guys? Guys! They are saying that aliens are real!” shouted Alex suddenly. “On the news!”
Everyone turned their fingers away from my face as we all immediately turned our heads to see the news. All my friends saw pictures of UFOs, mass terror, and neon lights in the skies.
I, myself, saw Kind kissing Names on the mouth.`;

    /* ------------------------------------------------------------------
       Helpers copied from your HTML
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

    function ensureBookLoaded(index: number) {
      if (index < 0 || index >= numBooks) return;
      if (bookMeshesByIndex[index]) return;
      createBookMesh(index);
    }

    function unloadBook(index: number) {
      if (index < 0 || index >= numBooks) return;
      const book = bookMeshesByIndex[index];
      if (!book) return;
      carouselGroup.remove(book);
      activeBooks = activeBooks.filter((b) => b !== book);
      // (optional) dispose geometry/materials here
      bookMeshesByIndex[index] = null;
    }

    function ensureRangeLoaded(start: number, end: number) {
      const s = Math.max(0, start);
      const e = Math.min(numBooks - 1, end);
      for (let i = s; i <= e; i++) {
        ensureBookLoaded(i);
      }
    }

    function trimWindowIfNeeded() {
      const loadedCount = windowEnd - windowStart + 1;
      if (loadedCount <= MAX_LOADED) return;

      const over = loadedCount - MAX_LOADED;
      const toDrop = Math.min(CHUNK, over);

      // If moving right or neutral, drop from left.
      // If moving left, drop from right.
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
      // Always make sure center and its neighbors are loaded
      ensureRangeLoaded(currentCenterIndex - 1, currentCenterIndex + 1);

      // Moving near the right side of window: prefetch next CHUNK to the right
      if (currentCenterIndex >= windowEnd - 3 && windowEnd < numBooks - 1) {
        const newEnd = Math.min(windowEnd + CHUNK, numBooks - 1);
        ensureRangeLoaded(windowEnd + 1, newEnd);
        windowEnd = newEnd;
      }

      // Moving near the left side of window: prefetch previous CHUNK to the left
      if (currentCenterIndex <= windowStart + 3 && windowStart > 0) {
        const newStart = Math.max(windowStart - CHUNK, 0);
        ensureRangeLoaded(newStart, windowStart - 1);
        windowStart = newStart;
      }

      trimWindowIfNeeded();
    }

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);

      const w = root.clientWidth || window.innerWidth;
      const h = root.clientHeight || window.innerHeight;

      camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
      camera.position.y = 0;
      camera.position.z = 8;
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      root.appendChild(renderer.domElement);

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      carouselGroup = new THREE.Group();
      scene.add(carouselGroup);

      // Initial lazy window: 10 books (0..9)
      ensureRangeLoaded(windowStart, windowEnd);

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
       Pagination
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

      const processedText = fullText.replace(/\n/g, " <br><br> ");
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

    function buildBookSpreads(bookIndex: number): BookSpread[] {
      const meta = bookCovers[bookIndex];
      const bookTitle = meta.title;
      const bookAuthor = sampleBooks[bookIndex]?.author || "A. Nonymous";
      const isbn = "978-0-999999-99-9";
      const copyright = "2024";

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
              <p>For everyone who reads<br>in a world of screens.</p>
            </div>`,
        },
        {
          left: `<div style="display:flex; flex-direction:column; justify-content:flex-end; height:100%; text-align:center; font-size: 0.7em; color: #555;">
              <p style="margin-bottom: 5px;">ISBN: ${isbn}</p>
              <p>&copy; Copyright ${copyright}</p>
            </div>`,
          right: `<h3 style="text-align:center; margin-bottom: 20px;">Table of Contents</h3>
            <ul style="line-height: 2.5; list-style-position: inside;">
              <li>Chapter 1: The Beginning</li>
              <li>Chapter 2: The Second Story</li>
            </ul>`,
        },
      ];

      const chapters = [
        { title: "Chapter 1: The Beginning", text: chapter1Text },
        { title: "Chapter 2: The Second Story", text: chapter2Text },
      ];

      let allPages: string[] = [];
      for (const ch of chapters) {
        const pages = paginateChapter(ch.text, `<h3>${ch.title}</h3>`);
        allPages = allPages.concat(pages);
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

      // Wrap currentCenterIndex into [0, numBooks)
      const wrappedCenter =
        ((currentCenterIndex % numBooks) + numBooks) % numBooks;

      for (let i = 0; i < numBooks; i++) {
        const book = bookMeshesByIndex[i];
        if (!book) continue; // not loaded yet / has been unloaded

        // Circular distance on the ring of numBooks
        const diff = Math.abs(i - wrappedCenter);
        const distance = Math.min(diff, numBooks - diff);

        let newScale = outerScale;
        if (distance === 0) {
          newScale = centerScale; // center book
        } else if (distance === 1) {
          newScale = sideScale; // immediate neighbours
        }

        // Any non-center book that was flipped → reset to front
        if (distance !== 0 && book.rotation.y !== 0) {
          book.userData.targetRotation = 0;
          book.userData.isFlipping = true;
        }

        if (isInitial) {
          // First frame: snap everything to correct scale, no animation
          book.scale.set(newScale, newScale, newScale);
          book.userData.targetScale = newScale;
          book.userData.isScaling = false;
        } else {
          if (distance === 0) {
            // Only the center book animates scale
            book.userData.targetScale = newScale;
            book.userData.isScaling = true;
          } else {
            // Side + outer: snap scale, no animation
            book.scale.set(newScale, newScale, newScale);
            book.userData.targetScale = newScale;
            book.userData.isScaling = false;
          }
        }

        // IMPORTANT: we NEVER touch book.visible here.
        // Loaded books remain visible so they naturally slide out of frame
        // as the carouselGroup moves, instead of popping away.
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
      currentCenterIndex--;
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
      currentCenterIndex++;
      targetCarouselX -= bookSpacing;

      adjustWindow();
      updateBookProperties();
    }

    /* ------------------------------------------------------------------
       Open / Close book
    ------------------------------------------------------------------ */

    function openBook() {
      currentPageSpread = 0;

      if (bookSpreads.length === 0) {
        pageLeft!.innerHTML = "";
        pageRight!.innerHTML = "";

        setTimeout(() => {
          bookSpreads = buildBookSpreads(currentCenterIndex);
          updatePageContent(currentPageSpread);
        }, 550);
      } else {
        updatePageContent(currentPageSpread);
      }

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
      isBookOpen = true;
    }

    function closeBook() {
      settingsMenu?.classList.remove("is-open");

      openBookContainer.style.transition = "none";
      navContainer!.style.transition = "none";

      openBookContainer.classList.remove("is-open");
      navContainer!.classList.remove("is-open");

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

      if (isBookOpen) {
        // Book opened → slide neighbours away (no carousel moves)
        activeBooks.forEach((book) => {
          if (!book) return;
          if (book.userData.isSlidingOut) {
            // Slide to target X
            book.position.x +=
              (book.userData.targetSlideX - book.position.x) * slowEase;

            // Scale down to targetSlideScale
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
        // --- CLOSED STATE: carousel + flip + center scale ---

        // 1) Flip animation for any book with isFlipping
        activeBooks.forEach((book) => {
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

        // 2) Carousel movement
        if (isCarouselMoving) {
          carouselGroup.position.x +=
            (targetCarouselX - carouselGroup.position.x) * fastEase;

          if (Math.abs(targetCarouselX - carouselGroup.position.x) < 0.01) {
            carouselGroup.position.x = targetCarouselX;
            isCarouselMoving = false;

            // (loop logic kept, but moveLeft/Right already clamp indexes)
            if (currentCenterIndex < 0) {
              currentCenterIndex = numBooks - 1;
              targetCarouselX =
                -(currentCenterIndex - INITIAL_CENTER_INDEX) * bookSpacing;
              carouselGroup.position.x = targetCarouselX;
            } else if (currentCenterIndex >= numBooks) {
              currentCenterIndex = 0;
              targetCarouselX =
                -(currentCenterIndex - INITIAL_CENTER_INDEX) * bookSpacing;
              carouselGroup.position.x = targetCarouselX;
            }
          }
        }

        // 3) Center-book scale animation
        activeBooks.forEach((book) => {
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
        {/* LEFT: metadata – paste your exact old JSX here */}
        <aside className="metadata">
          {/* 🔁 REPLACE this block with your original metadata JSX */}
          <header className="meta-header">
            <h2 className="meta-title">Title from old metadata</h2>
            <p className="meta-author">Author / user etc</p>
          </header>
          <div className="meta-actions">
            <button className="meta-icon-btn like" type="button">
              <span className="material-symbols-outlined meta-icon-glyph">
                favorite
              </span>
            </button>
            <button className="meta-icon-btn save" type="button">
              <span className="material-symbols-outlined meta-icon-glyph">
                bookmark
              </span>
            </button>
          </div>
        </aside>

        {/* CENTER: 3D stage + reader */}
        <section className="home3d-stage">
          <div ref={threeRootRef} className="three-root" />

          {/* Open book container – same IDs/classes as HTML */}
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

          {/* Nav arrows – same structure as HTML */}
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
