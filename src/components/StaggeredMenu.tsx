// src/components/StaggeredMenu.tsx
import React, {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { Link } from "react-router-dom";
import "./StaggeredMenu.css";

/* --- types --- */
export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}
export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}
export interface StaggeredMenuProps {
  position?: "left" | "right";
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  isFixed?: boolean;
}

const StaggeredMenu: React.FC<StaggeredMenuProps> = (props) => {
  const {
    position = "right",
    colors = ["#B19EEF", "#5227FF"],
    items = [],
    socialItems = [],
    displaySocials = true,
    displayItemNumbering = true,
    className,
    logoUrl = "/src/assets/logos/reactbits-gh-white.svg",
    menuButtonColor = "#fff",
    openMenuButtonColor = "#fff",
    changeMenuColorOnOpen = true,
    accentColor = "#5227FF",
    isFixed = false,
    onMenuOpen,
    onMenuClose,
  } = props;

  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);

  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);

  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const textWrapRef = useRef<HTMLSpanElement | null>(null);
  const [textLines, setTextLines] = useState<string[]>(["Menu", "Close"]);

  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  /* Set initial positions & collect pre-layers */
  // Keep prelayers offscreen whenever we're closed (initial mount too)
  useLayoutEffect(() => {
    const pre = preLayersRef.current;
    if (!pre) return;

    const layers = Array.from(
      pre.querySelectorAll(".sm-prelayer")
    ) as HTMLElement[];

    preLayerElsRef.current = layers;

    // distance in the slide direction
    const dir = position === "left" ? -1 : 1;
    const distance = pre.offsetWidth * dir;

    // Only seed when closed; when open the timelines own positions.
    if (!openRef.current && layers.length) {
      gsap.set(layers, { x: distance });
    }
  }, [position, colors]);

  useEffect(() => {
    const onResize = () => {
      const pre = preLayersRef.current;
      if (!pre) return;
      const layers = Array.from(pre.querySelectorAll(".sm-prelayer")) as HTMLElement[];
      const dir = position === "left" ? -1 : 1;
      const distance = pre.offsetWidth * dir;
      if (!openRef.current) gsap.set(layers, { x: distance });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [position]);
  
  /* Build open animation timeline */
  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    if (!panel || !preContainer) return null;

    // live layers
    const layers = Array.from(
      preContainer.querySelectorAll(".sm-prelayer")
    ) as HTMLElement[];
    preLayerElsRef.current = layers;

    // direction + distance
    const dir = position === "left" ? -1 : 1;
    const distance = preContainer.offsetWidth * dir;

    // make sure layers are seeded offscreen before animating in
    gsap.set(layers, { x: distance });

    // kill any in-flight motion
    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
    const numberEls = Array.from(panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item")) as HTMLElement[];
    const socialTitle = panel.querySelector(".sm-socials-title") as HTMLElement | null;
    const socialLinks = Array.from(panel.querySelectorAll(".sm-socials-link")) as HTMLElement[];

    const tl = gsap.timeline({ paused: true });

    // seed content states (not positions)
    tl.add(() => {
      if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
      if (numberEls.length) gsap.set(numberEls, { ["--sm-num-opacity" as any]: 0 });
      if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
      if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
    }, 0);

    // prelayers in
    layers.forEach((el, i) => {
      tl.fromTo(
        el,
        { x: distance },
        { x: 0, duration: 0.5, ease: "power4.out" },
        i * 0.07 + 0.02
      );
    });

    // panel in
    const lastTime = layers.length ? (layers.length - 1) * 0.07 + 0.02 : 0;
    const panelInsertTime = lastTime + (layers.length ? 0.08 : 0);
    tl.fromTo(panel, { x: distance }, { x: 0, duration: 0.65, ease: "power4.out" }, panelInsertTime);

    // items in
    if (itemEls.length) {
      const itemsStart = panelInsertTime + 0.65 * 0.15;
      tl.to(itemEls, {
        yPercent: 0,
        rotate: 0,
        duration: 1,
        ease: "power4.out",
        stagger: { each: 0.1, from: "start" },
      }, itemsStart);

      if (numberEls.length) {
        tl.to(numberEls, {
          ["--sm-num-opacity" as any]: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: { each: 0.08, from: "start" },
        }, itemsStart + 0.1);
      }
    }

    // socials in
    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + 0.65 * 0.4;
      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: "power2.out" }, socialsStart);
      if (socialLinks.length) {
        tl.to(socialLinks, {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power3.out",
          stagger: { each: 0.08, from: "start" },
          onComplete: () => gsap.set(socialLinks, { clearProps: "opacity" }),
        }, socialsStart + 0.04);
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position, colors]);





  const buildCloseTimeline = useCallback(() => {
    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    if (!panel || !preContainer) return null;

    // live-collect layers every time
    const layers = Array.from(
      preContainer.querySelectorAll(".sm-prelayer")
    ) as HTMLElement[];
    preLayerElsRef.current = layers;

    // kill any in-flight motion
    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    itemEntranceTweenRef.current?.kill();

    // direction & pixel distance (uniform for everyone)
    const dir = position === "left" ? -1 : 1;
    const distance = preContainer.offsetWidth * dir; // same px for all layers

    // tuck content a bit first
    const itemEls = Array.from(
      panel.querySelectorAll(".sm-panel-itemLabel")
    ) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item")
    ) as HTMLElement[];
    const socialTitle = panel.querySelector(".sm-socials-title") as HTMLElement | null;
    const socialLinks = Array.from(
      panel.querySelectorAll(".sm-socials-link")
    ) as HTMLElement[];

    const tl = gsap.timeline({ paused: true });

    if (itemEls.length)
      tl.to(itemEls, {
        yPercent: 140,
        rotate: 10,
        duration: 0.35,
        ease: "power3.in",
        stagger: { each: 0.04, from: "end" },
      }, 0);

    if (numberEls.length)
      tl.to(numberEls, {
        ["--sm-num-opacity" as any]: 0,
        duration: 0.25,
        ease: "power2.in",
        stagger: { each: 0.04, from: "end" },
      }, 0.02);

    if (socialTitle) tl.to(socialTitle, { opacity: 0, duration: 0.2, ease: "power2.in" }, 0);
    if (socialLinks.length)
      tl.to(socialLinks, {
        y: 25,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        stagger: { each: 0.04, from: "end" },
      }, 0.02);

    // ensure we're starting from resting (no surprise jumps)
    tl.add(() => {
      gsap.set([panel, ...layers], { clearProps: "xPercent", x: 0 });
    }, 0);

    // 1) Slide the white panel away
    const panelOutAt = 0.06;
    tl.to(panel, {
      x: distance,
      duration: 0.45,
      ease: "power3.in",
    }, panelOutAt);

    // 2) Stagger layers out in a clean “fold” (uniform px distance)
    //    reverse() so the rearmost leaves last (feels layered)
    const layersOutAt = panelOutAt + 0.08;
    tl.to([...layers].reverse(), {
      x: distance,
      duration: 0.5,
      ease: "power4.in",
      stagger: { each: 0.07, from: "start" },
    }, layersOutAt);

    return tl;
  }, [position]);


  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const preContainer = preLayersRef.current;
      const icon = iconRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const textInner = textInnerRef.current;

      // refresh prelayers ref on mount/update
      const preLayers = preContainer
        ? (Array.from(preContainer.querySelectorAll(".sm-prelayer")) as HTMLElement[])
        : [];
      preLayerElsRef.current = preLayers;

      // reset visuals (no transforms here)
      if (plusH) gsap.set(plusH, { transformOrigin: "50% 50%", rotate: 0 });
      if (plusV) gsap.set(plusV, { transformOrigin: "50% 50%", rotate: 0 });
      if (icon) gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
      if (textInner) gsap.set(textInner, { yPercent: 0 });

      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position, colors]);





  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback("onComplete", () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback((after?: () => void) => {
    const tl = buildCloseTimeline();
    if (!tl) { after?.(); return; }

    // When done, reset “resting” states so next open anim is clean
    tl.eventCallback("onComplete", () => {
      const panel = panelRef.current;
      if (panel) {
        const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        const numberEls = Array.from(panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item")) as HTMLElement[];
        if (numberEls.length) gsap.set(numberEls, { ["--sm-num-opacity" as any]: 0 });
        const socialTitle = panel.querySelector(".sm-socials-title") as HTMLElement | null;
        const socialLinks = Array.from(panel.querySelectorAll(".sm-socials-link")) as HTMLElement[];
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
      }
      busyRef.current = false;
      after?.();
    });

    busyRef.current = true;
    tl.play(0);
  }, [buildCloseTimeline]);



  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    if (!icon) return;
    spinTweenRef.current?.kill();
    spinTweenRef.current = gsap.to(icon, {
      rotate: opening ? 225 : 0,
      duration: opening ? 0.8 : 0.35,
      ease: opening ? "power4.out" : "power3.inOut",
      overwrite: "auto",
    });
  }, []);

  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, {
          color: targetColor,
          delay: 0.18,
          duration: 0.3,
          ease: "power2.out",
        });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  // ensure initial color matches current state on mount
  useEffect(() => {
    if (!toggleBtnRef.current) return;
    if (changeMenuColorOnOpen) {
      const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
      gsap.set(toggleBtnRef.current, { color: targetColor });
    } else {
      gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? "Menu" : "Close";
    const targetLabel = opening ? "Close" : "Menu";
    const cycles = 3;
    const seq: string[] = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === "Menu" ? "Close" : "Menu";
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);
    setTextLines(seq);

    gsap.set(inner, { yPercent: 0 });
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: "power4.out",
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;

    if (target) {
      setOpen(true);                // open immediately
      onMenuOpen?.();
      playOpen();
      document.documentElement.setAttribute("data-sm-open", "true");
    } else {
      // DO NOT setOpen(false) yet — keep panel visible during the slide-out
      onMenuClose?.();
      playClose(() => {
        setOpen(false);             // hide only after animation ends
        document.documentElement.removeAttribute("data-sm-open");
      });
    }

    // keep these icon/text/color animations as-is
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [onMenuOpen, onMenuClose, playOpen, playClose, animateIcon, animateColor, animateText]);

  /* === define closeMenu AFTER the callbacks it depends on === */
  const closeMenu = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;

    onMenuClose?.();
    playClose(() => {
      setOpen(false);               // flip after slide completes
      document.documentElement.removeAttribute("data-sm-open");
    });

    animateIcon(false);
    animateColor(false);
    animateText(false);
  }, [onMenuClose, playClose, animateIcon, animateColor, animateText]);

  // Optional: ESC to close (defined AFTER closeMenu)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMenu]);

  // global events
  useEffect(() => {
    const onToggle = () => toggleMenu();
    const onClose = () => {
      if (openRef.current) toggleMenu();
    };
    window.addEventListener("sm:toggle", onToggle);
    window.addEventListener("sm:close", onClose);
    return () => {
      window.removeEventListener("sm:toggle", onToggle);
      window.removeEventListener("sm:close", onClose);
    };
  }, [toggleMenu]);

  return (
    <>
      {/* Wrapper holds layers + panel (not the toggle) */}
      <div
        className={
          (className ? className + " " : "") +
          "staggered-menu-wrapper" +
          (isFixed ? " fixed-wrapper" : "")
        }
        style={
          accentColor
            ? ({ ["--sm-accent" as any]: accentColor } as React.CSSProperties)
            : undefined
        }
        data-position={position}
        data-open={open || undefined}
      >
        <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
          {(() => {
            const raw = colors && colors.length ? colors.slice(0, 4) : ["#1e1e22", "#35353c"];
            let arr = [...raw];
            if (arr.length >= 3) {
              const mid = Math.floor(arr.length / 2);
              arr.splice(mid, 1); // remove a middle color to keep 2–3 layers
            }
            return arr.map((c, i) => (
              <div key={i} className="sm-prelayer" style={{ background: c }} />
            ));
          })()}
        </div>

        {open && (
          <div
            className="sm-scrim"
            aria-hidden="true"
            onClick={closeMenu}
          />
        )}

        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel"
          aria-hidden={!open}
          onClick={(e) => e.stopPropagation()}
        >
          {/* prevent outside-close when clicking inside */}
          <div className="sm-panel-inner">
            <ul
              className="sm-panel-list"
              role="list"
              data-numbering={displayItemNumbering || undefined}
            >
              {items && items.length ? (
                items.map((it, idx) => (
                  <li className="sm-panel-itemWrap" key={it.label + idx}>
                    <Link
                      className="sm-panel-item"
                      to={it.link}
                      aria-label={it.ariaLabel}
                      data-index={idx + 1}
                      onClick={() => openRef.current && toggleMenu()}
                    >
                      <span className="sm-panel-itemLabel">{it.label}</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="sm-panel-itemWrap" aria-hidden="true">
                  <span className="sm-panel-item">
                    <span className="sm-panel-itemLabel">No items</span>
                  </span>
                </li>
              )}
            </ul>

            {displaySocials && socialItems && socialItems.length > 0 && (
              <div className="sm-socials" aria-label="Social links">
                <h3 className="sm-socials-title">Socials</h3>
                <ul className="sm-socials-list" role="list">
                  {socialItems.map((s, i) => (
                    <li key={s.label + i} className="sm-socials-item">
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-socials-link"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Portalized toggle pinned above everything (doesn't affect layout) */}
      {createPortal(
        <header
          className="staggered-menu-header sm-portal-toggle"
          aria-label="Main navigation header"
        >
          {/* Keep a logo container if you want spacing; empty by default */}
          <div className="sm-logo" aria-label="Logo">
            {/* <img src={logoUrl} alt="Logo" className="sm-logo-img" width={110} height={24} /> */}
          </div>

          <button
            ref={toggleBtnRef}
            className="sm-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="staggered-menu-panel"
            onClick={toggleMenu}
            type="button"
          >
            <span ref={textWrapRef} className="sm-toggle-textWrap" aria-hidden="true">
              <span ref={textInnerRef} className="sm-toggle-textInner">
                {textLines.map((l, i) => (
                  <span className="sm-toggle-line" key={i}>
                    {l}
                  </span>
                ))}
              </span>
            </span>
            <span ref={iconRef} className="sm-icon" aria-hidden="true">
              <span ref={plusHRef} className="sm-icon-line" />
              <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
            </span>
          </button>
        </header>,
        document.body
      )}
    </>
  );
};

export default StaggeredMenu;
