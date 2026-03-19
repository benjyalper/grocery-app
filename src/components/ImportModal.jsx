import React, { useState } from 'react';
import { DEFAULT_ITEMS } from '../data/items';

/**
 * מודאל לייבוא רשימה מטקסט חופשי
 * כל שורה = פריט אחד.
 * מנסה לחלץ כמות ממספר בתחילת/סוף השורה.
 * מחפש מחיר מסד הנתונים המקומי לפי שם דומה.
 */

// Build a quick name→price/unit lookup from DEFAULT_ITEMS
const PRICE_MAP = {};
DEFAULT_ITEMS.forEach((item) => {
  // normalise: lowercase, strip nikud & punctuation
  const key = item.name.replace(/[^\u05D0-\u05EAa-z0-9 ]/gi, '').toLowerCase().trim();
  PRICE_MAP[key] = { price: item.price, unit: item.unit };
});

function lookupPrice(name) {
  const normalised = name.replace(/[^\u05D0-\u05EAa-z0-9 ]/gi, '').toLowerCase().trim();
  // Exact match first
  if (PRICE_MAP[normalised]) return PRICE_MAP[normalised];
  // Partial match — check if any key is contained in the name or vice versa
  for (const [key, val] of Object.entries(PRICE_MAP)) {
    if (normalised.includes(key) || key.includes(normalised)) return val;
  }
  return { price: 0, unit: 'יח׳' };
}

/**
 * Parse a raw text line into { name, quantity }.
 * Handles patterns like:
 *   "2 בננות", "בננות x3", "בננות - 4", "בננות", "3. בננות"
 */
function parseLine(raw) {
  const line = raw.trim();
  if (!line) return null;

  let name = line;
  let quantity = 1;

  // Leading number: "2 בננות", "3. בננות", "3- בננות"
  const leadMatch = line.match(/^(\d+)[.\-\s]+(.+)/);
  if (leadMatch) {
    quantity = parseInt(leadMatch[1], 10) || 1;
    name     = leadMatch[2].trim();
  } else {
    // Trailing number: "בננות 2", "בננות x3", "בננות ×2"
    const trailMatch = line.match(/^(.+?)[\sx×\-]+(\d+)$/i);
    if (trailMatch) {
      name     = trailMatch[1].trim();
      quantity = parseInt(trailMatch[2], 10) || 1;
    }
  }

  // Strip common bullet chars
  name = name.replace(/^[-•*–]\s*/, '').trim();

  return name ? { name, quantity } : null;
}

function ImportModal({ onImport, onClose }) {
  const [text, setText]       = useState('');
  const [preview, setPreview] = useState(null);

  const handlePreview = () => {
    const lines   = text.split('\n');
    const parsed  = lines.map(parseLine).filter(Boolean);
    const enriched = parsed.map((p) => {
      const { price, unit } = lookupPrice(p.name);
      return { ...p, price, unit };
    });
    setPreview(enriched);
  };

  const handleImport = () => {
    if (!preview || preview.length === 0) return;
    onImport(preview);
    onClose();
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className="modal import-modal">
        <div className="modal-header">
          <h2 className="modal-title">📋 ייבוא רשימה מטקסט</h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור">×</button>
        </div>

        <p className="import-hint">
          הדבק רשימה — כל שורה תהפוך לפריט.<br />
          ניתן לציין כמות: <strong>2 בננות</strong> או <strong>בננות x3</strong>
        </p>

        {/* Text input */}
        <textarea
          className="import-textarea"
          value={text}
          onChange={(e) => { setText(e.target.value); setPreview(null); }}
          placeholder={`לדוגמה:\nחלב\n3 ביצים\nלחם x2\nגבינה צהובה`}
          dir="rtl"
          rows={8}
        />

        {/* Preview button */}
        {!preview && (
          <button
            className="btn btn-primary import-preview-btn"
            onClick={handlePreview}
            disabled={!text.trim()}
          >
            🔍 הצג תצוגה מקדימה
          </button>
        )}

        {/* Preview table */}
        {preview && preview.length > 0 && (
          <>
            <div className="import-preview">
              <p className="import-preview-title">נמצאו {preview.length} פריטים:</p>
              <ul className="import-preview-list">
                {preview.map((item, i) => (
                  <li key={i} className="import-preview-item">
                    <span className="import-item-name">{item.name}</span>
                    <span className="import-item-meta">
                      {item.quantity} {item.unit}
                      {item.price > 0 && ` · ₪${item.price.toFixed(2)}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleImport}>
                ✅ ייבא {preview.length} פריטים לרשימה
              </button>
              <button className="btn btn-cancel" onClick={() => setPreview(null)}>
                ← ערוך מחדש
              </button>
            </div>
          </>
        )}

        {preview && preview.length === 0 && (
          <p className="import-empty">לא זוהו פריטים — נסה לכתוב כל פריט בשורה נפרדת</p>
        )}
      </div>
    </div>
  );
}

export default ImportModal;
