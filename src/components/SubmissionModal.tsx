import { useEffect, useMemo, useRef, useState } from "react";
import "./SubmissionModal.css";

type SubmitFormData = {
  title: string;
  author: string;
  date: string;
  mainGenre: string;
  subGenres: string;
  language: string;
  isbn: string;
  copyright: string;
  nsfw: boolean;
  allowComments: boolean;
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
    allowComments: true,
    summary: "",
    coverFile: null,
    backCoverFile: null,
    ...initial,
  });

  const coverUrl = useMemo(
    () => (form.coverFile ? URL.createObjectURL(form.coverFile) : ""),
    [form.coverFile]
  );
  const backUrl = useMemo(
    () => (form.backCoverFile ? URL.createObjectURL(form.backCoverFile) : ""),
    [form.backCoverFile]
  );

  // Reclaim blob URLs
  useEffect(() => {
    return () => {
      if (coverUrl) URL.revokeObjectURL(coverUrl);
      if (backUrl) URL.revokeObjectURL(backUrl);
    };
  }, [coverUrl, backUrl]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (k: keyof SubmitFormData, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "coverFile" | "backCoverFile"
  ) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    set(key, file);
    // allow re-selecting the same file
    e.target.value = "";
  };

  return (
    <div className="submodal-overlay" role="dialog" aria-modal="true">
      <div className="submodal">
        {/* close 'X' */}
        <button
          className="submodal-close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="submodal-grid">
          {/* LEFT COLUMN */}
          <div className="sub-left">
            <div className="chip-title">New Project</div>

            <div className="covers">
              <label className="cover-uploader">
                {/* cover preview / slot */}
                <div className={`cover-box ${coverUrl ? "has-img" : ""}`}>
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover preview" />
                  ) : (
                    <span className="cover-hint">Add<br/>Cover</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e, "coverFile")}
                />
              </label>

              <label className="cover-uploader">
                <div className={`cover-box ${backUrl ? "has-img" : ""}`}>
                  {backUrl ? (
                    <img src={backUrl} alt="Backcover preview" />
                  ) : (
                    <span className="cover-hint">Add<br/>Backcover</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e, "backCoverFile")}
                />
              </label>
            </div>

            <div className="summary-block">
              <div className="summary-label">Summary:</div>
              <textarea
                className="summary-input"
                rows={6}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                placeholder="Write a short synopsis of your project…"
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="sub-right">
            <Field
              label="Title:"
              color="--c-orange"
              value={form.title}
              onChange={(v) => set("title", v)}
            />
            <Field
              label="Author:"
              color="--c-orange"
              value={form.author}
              onChange={(v) => set("author", v)}
            />
            <Field
              label="Date:"
              color="--c-pink"
              value={form.date}
              onChange={(v) => set("date", v)}
              placeholder="YYYY-MM-DD"
            />
            <Field
              label="Main Genre:"
              color="--c-purple"
              value={form.mainGenre}
              onChange={(v) => set("mainGenre", v)}
            />
            <Field
              label="Sub-Genres:"
              color="--c-blue"
              value={form.subGenres}
              onChange={(v) => set("subGenres", v)}
              placeholder="Comma separated"
            />
            <Field
              label="Language:"
              color="--c-orange"
              value={form.language}
              onChange={(v) => set("language", v)}
            />
            <Field
              label="ISBN:"
              color="--c-purple"
              value={form.isbn}
              onChange={(v) => set("isbn", v)}
            />
            <Field
              label="Copyright:"
              color="--c-pink"
              value={form.copyright}
              onChange={(v) => set("copyright", v)}
            />

            <div className="checks-row">
              <Check
                label="NSFW:"
                color="--c-blue"
                checked={form.nsfw}
                onChange={(v) => set("nsfw", v)}
              />
              <Check
                label="Allow comments:"
                color="--c-pink"
                checked={form.allowComments}
                onChange={(v) => set("allowComments", v)}
              />
            </div>

            <div className="actions">
              <button className="btn cancel" onClick={onClose}>
                Cancel
              </button>
              <button className="btn save" onClick={() => onSave(form)}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Tiny subcomponents ---------- */

function Field({
  label,
  color,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  color:
    | "--c-orange"
    | "--c-pink"
    | "--c-purple"
    | "--c-blue";
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <div className="field-label" style={{ background: `var(${color})` }}>
        {label}
      </div>
      <input
        className="field-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
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
  color:
    | "--c-orange"
    | "--c-pink"
    | "--c-purple"
    | "--c-blue";
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
