import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./SubmissionModal.css";

/* ===== Genre options (names only) ===== */
const GENRE_OPTIONS = [
  "Adventure","Anthology","Balls","Big Juicy Balls","Biography","Bruh","Coming of Age",
  "Contemporary","Crime","Cyberpunk","Detective","Drama","Dystopian","Fantasy","Family Saga",
  "Historical Fiction","Horror","Humor","Literary","Magical Realism","Memoir","Music",
  "Mystery","New Adult","Non-Fiction","Paranormal","Philosophy","Poetry","Post-Apocalyptic",
  "Psychological Thriller","Romance","Science Fiction","Self-Help","Short Stories","Space Opera",
  "Steampunk","Thriller","Time Travel","Urban Fantasy","Young Adult"
];

type SubmitFormData = {
  title: string;
  author: string;
  date: string;
  mainGenre: string;   // single
  subGenres: string;   // comma-separated list, up to 4
  language: string;
  isbn: string;
  copyright: string;
  nsfw: boolean;
  dedication: string;
  summary: string;
  coverFile?: File | null;
  backCoverFile?: File | null;
};

export default function SubmissionModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: SubmitFormData) => void;
  initial?: Partial<SubmitFormData>;
}) {
  // 1) useState
  const [form, setForm] = useState<SubmitFormData>({
    title: "",
    author: "",
    date: "",
    mainGenre: "",
    subGenres: "",
    language: "",
    isbn: "",
    copyright: "",
    nsfw: false,
    dedication: "",
    summary: "",
    coverFile: null,
    backCoverFile: null,
    ...initial,
  });

  // 2) useMemo
  const coverUrl = useMemo(
    () => (form.coverFile instanceof File ? URL.createObjectURL(form.coverFile) : ""),
    [form.coverFile]
  );
  const backUrl = useMemo(
    () => (form.backCoverFile instanceof File ? URL.createObjectURL(form.backCoverFile) : ""),
    [form.backCoverFile]
  );

  // 3) revoke blobs
  useEffect(() => {
    return () => {
      try { if (coverUrl) URL.revokeObjectURL(coverUrl); } catch {}
      try { if (backUrl) URL.revokeObjectURL(backUrl); } catch {}
    };
  }, [coverUrl, backUrl]);

  // 4) esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 5) keep subGenres from containing main
  useEffect(() => {
    if (!form.mainGenre) return;
    const cleaned = (form.subGenres || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((g) => g !== form.mainGenre)
      .join(", ");
    if (cleaned !== form.subGenres) {
      setForm((f) => ({ ...f, subGenres: cleaned }));
    }
  }, [form.mainGenre, form.subGenres]);

  const setField = (k: keyof SubmitFormData, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "coverFile" | "backCoverFile"
  ) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setField(key, file);
    e.target.value = "";
  };

  if (!open) return null;

  return (
    <div className="submodal-overlay" role="dialog" aria-modal="true">
      <div className="submodal">
        <button className="submodal-close" aria-label="Close" onClick={onClose}>×</button>

        <div className="submodal-grid">
          {/* LEFT */}
          <div className="sub-left">
            <div className="chip-title">New Project</div>

            <div className="covers">
              <label className="cover-uploader">
                <div className={`cover-box ${coverUrl ? "has-img" : ""}`}>
                  {coverUrl ? <img src={coverUrl} alt="Cover preview" /> : <span className="cover-hint">Add<br/>Cover</span>}
                </div>
                <input type="file" accept="image/*" onChange={(e) => handleFile(e, "coverFile")} />
              </label>

              <label className="cover-uploader">
                <div className={`cover-box ${backUrl ? "has-img" : ""}`}>
                  {backUrl ? <img src={backUrl} alt="Backcover preview" /> : <span className="cover-hint">Add<br/>Backcover</span>}
                </div>
                <input type="file" accept="image/*" onChange={(e) => handleFile(e, "backCoverFile")} />
              </label>
            </div>

            <div className="summary-block">
              <div className="summary-label">Summary:</div>
              <textarea
                className="summary-input"
                rows={6}
                value={form.summary}
                onChange={(e) => setField("summary", e.target.value)}
                placeholder="Write a short synopsis of your project…"
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="sub-right">
            <div className="sub-right-rows">
              <Field label="Title:" color="--c-orange" value={form.title} onChange={(v) => setField("title", v)} required />
              <Field label="Author:" color="--c-orange" value={form.author} onChange={(v) => setField("author", v)} required />
              <Field label="Date:" color="--c-pink" value={form.date} onChange={(v) => setField("date", v)} type="date" required placeholder="YYYY-MM-DD" />

              <GenreSelect
                label="Main Genre:"
                color="--c-purple"
                mode="single"
                value={form.mainGenre}
                onChange={(v) => {
                  setField("mainGenre", v);
                  if (form.subGenres) {
                    const cleaned = form.subGenres
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .filter((g) => g !== v)
                      .join(", ");
                    if (cleaned !== form.subGenres) setField("subGenres", cleaned);
                  }
                }}
                placeholder="required"
              />

              <GenreSelect
                label="Sub-Genres:"
                color="--c-blue"
                mode="multi"
                max={4}
                value={form.subGenres}
                onChange={(v) => setField("subGenres", v)}
                placeholder="optional"
                exclude={form.mainGenre ? [form.mainGenre] : []}
              />

              <Field
                label="Language:"
                color="--c-orange"
                value={form.language}
                onChange={(v) => setField("language", v)}
                required
              />

              <Field
                label="ISBN:"
                color="--c-purple"
                value={form.isbn}
                onChange={(v) => setField("isbn", v)}
                info={{
                  title: "About ISBN",
                  body:
                    "An ISBN uniquely identifies a published book version. If you’re still drafting or publishing later, you can leave this blank for now.",
                }}
              />

              <Field
                label="Copyright:"
                color="--c-pink"
                value={form.copyright}
                onChange={(v) => setField("copyright", v)}
                info={{
                  title: "Copyright notice",
                  body:
                    "A short line like '© 2025 Your Name'. It’s optional here because you can add or finalize it at publication time.",
                }}
              />

              <Field label="Dedication:" color="--c-blue" value={form.dedication} onChange={(v) => setField("dedication", v)} />
              <Check label="NSFW:" color="--c-blue" checked={form.nsfw} onChange={(v) => setField("nsfw", v)} />
            </div>

            <div className="actions">
              <button className="btn cancel" onClick={onClose}>Cancel</button>
              <button className="btn save" onClick={() => onSave(form)}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function Field({
  label,
  color,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  info,
}: {
  label: string;
  color: "--c-orange" | "--c-pink" | "--c-purple" | "--c-blue";
  value: string;
  placeholder?: string;
  type?: "text" | "date";
  required?: boolean;
  onChange: (v: string) => void;
  info?: { title?: string; body: string };
}) {
  const word = required ? "required" : "optional";
  const ph = placeholder ? `${placeholder} ${word}` : word;

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Info tooltip state + anchors
  const [showInfo, setShowInfo] = useState(false);
  const infoBtnRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [infoPos, setInfoPos] = useState<{top: number; left: number; width: number}>({
    top: 0, left: 0, width: 260
  });

  useEffect(() => {
    if (!showInfo) return;

    const calc = () => {
      const btn = infoBtnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const width = 260;
      const gap = 8;
      setInfoPos({
        top: r.bottom + gap,
        left: Math.max(8, r.right - width),
        width
      });
    };
    const onOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !infoBtnRef.current?.contains(t) &&
        !tooltipRef.current?.contains(t)
      ) {
        setShowInfo(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setShowInfo(false); };

    calc();
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEsc);

    return () => {
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showInfo]);

  return (
    <div className="field">
      <div
        className="field-label"
        style={{
          background: `var(${color})`,
          position: "relative",
          paddingRight: info ? 30 : 12,  // make room for the right-side "i"
        }}
      >
        <span className="field-label-text">{label}</span>

        {info && (
          <>
            {/* Right-aligned circular "i" inside the colored label */}
            <button
              ref={infoBtnRef}
              type="button"
              className="label-info-btn"
              aria-label={`${label} info`}
              aria-expanded={showInfo}
              onClick={() => setShowInfo((v) => !v)}
              style={{
                position: "absolute",
                top: "50%",
                right: 6,
                transform: "translateY(-50%)",
                display: "inline-grid",
                placeItems: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,.95)",
                background: "transparent",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              i
            </button>

            {showInfo && createPortal(
              <div
                ref={tooltipRef}
                role="tooltip"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "fixed",
                  top: infoPos.top,
                  left: infoPos.left,
                  width: infoPos.width,
                  zIndex: 1000000,
                  background: "#1d1d1d",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,.15)",
                  boxShadow: "0 10px 28px rgba(0,0,0,.45)",
                  borderRadius: 0,
                  padding: 10
                }}
              >
                {info.title && (
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>{info.title}</div>
                )}
                <div style={{ opacity: 0.95, lineHeight: 1.35 }}>{info.body}</div>
              </div>,
              document.body
            )}
          </>
        )}
      </div>

      <div className={`field-control ${type === "date" ? "is-date" : ""}`}>
        <input
          ref={inputRef}
          className="field-input"
          type={type}
          value={value}
          placeholder={type === "date" ? undefined : ph}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          aria-required={required}
        />
        {type === "date" && (
          <button
            type="button"
            className="date-icon"
            aria-label="Open calendar"
            onClick={() => inputRef.current?.showPicker?.()}
          />
        )}
      </div>
    </div>
  );
}

function Check({
  label,
  color,
  checked,
  onChange,
}: {
  label: string;
  color: "--c-orange" | "--c-pink" | "--c-purple" | "--c-blue";
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="check">
      <span className="check-label" style={{ background: `var(${color})` }}>
        {label}
      </span>
      <button
        type="button"
        className={`check-box ${checked ? "is-on" : ""}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-label={label}
      >
        <span className="check-tick">✓</span>
      </button>
    </label>
  );
}

/* ===== GenreSelect (portal popover; equal height as inputs) ===== */

function GenreSelect({
  label,
  color,
  mode,
  max = 4,
  value,
  onChange,
  placeholder,
  exclude = [],
}: {
  label: string;
  color: "--c-orange" | "--c-pink" | "--c-purple" | "--c-blue";
  mode: "single" | "multi";
  max?: number;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  exclude?: string[];
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0, left: 0, width: 280
  });

  const selected = useMemo(() => {
    if (mode === "single") return value ? [value.trim()] : [];
    return value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }, [mode, value]);

  const visibleOptions = useMemo(() => {
    if (exclude && exclude.length > 0) {
      const excl = new Set(exclude);
      return GENRE_OPTIONS.filter((g) => !excl.has(g));
    }
    return GENRE_OPTIONS.slice();
  }, [exclude]);

  const display =
    selected.length > 0 ? selected.join(", ")
    : (placeholder ?? (mode === "single" ? "required" : "optional"));

  useEffect(() => {
    if (!open) return;

    const calc = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.max(260, r.width);
      const gap = 8;
      setPos({
        top: r.bottom + gap,
        left: Math.max(8, r.right - width),
        width
      });
    };

    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(t)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };

    calc();
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);

    return () => {
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const toggleOption = (name: string) => {
    if (mode === "single") {
      onChange(name);
      setOpen(false);
      return;
    }
    const bag = new Set(selected);
    bag.has(name) ? bag.delete(name) : bag.size < (max ?? 4) && bag.add(name);
    onChange(Array.from(bag).join(", "));
  };

  return (
    <div className="field">
      <div className="field-label" style={{ background: `var(${color})` }}>
        <span className="field-label-text">{label}</span>
      </div>

      <div className="field-control" style={{ position: "relative", minWidth: 0 }}>
        <button
          ref={triggerRef}
          type="button"
          className="field-input genre-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            padding: "0 12px",
            textAlign: "left",
            cursor: "pointer",
            background: "#111",
            color: "#fff",
            border: "none",
            outline: "none",
            width: "100%",
          }}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: selected.length === 0 ? 0.8 : 1 }}>
            {display}
          </span>
          <span aria-hidden style={{ opacity: 0.9 }}>▾</span>
        </button>

        {open && createPortal(
          <div
            role="listbox"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: 260,
              overflow: "auto",
              zIndex: 1000000,
              background: "#1d1d1d",
              color: "#fff",
              border: "1px solid rgba(255,255,255,.15)",
              boxShadow: "0 10px 28px rgba(0,0,0,.45)",
              borderRadius: 0,
            }}
          >
            {visibleOptions.map((name) => {
              const sel = selected.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleOption(name)}
                  aria-selected={sel}
                  className={sel ? "genre-opt is-selected" : "genre-opt"}
                  style={{
                    width: "100%",
                    display: "block",
                    padding: "10px 12px",
                    textAlign: "left",
                    border: "none",
                    background: sel ? "#1e88e5" : "transparent",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
