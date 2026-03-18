import React, { useState, useRef } from 'react';

/**
 * רכיב פריט ברשימת הקניות
 * מציג שם, כמות, מחיר ליחידה (ניתן לעריכה ישירה), סה"כ לפריט, וכפתורי פעולה
 */
function GroceryItem({ item, onRemove, onUpdate, onToggle, onEdit }) {
  const subtotal = (item.price * item.quantity).toFixed(2);

  // ─── Inline price editing ────────────────────────────────────
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceVal, setPriceVal] = useState(String(item.price));
  const priceInputRef = useRef(null);

  const startPriceEdit = () => {
    setPriceVal(String(item.price));
    setEditingPrice(true);
    // focus after render
    setTimeout(() => priceInputRef.current?.select(), 30);
  };

  const commitPrice = () => {
    const parsed = parseFloat(priceVal);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdate(item.id, { price: parsed });
    }
    setEditingPrice(false);
  };

  const handlePriceKey = (e) => {
    if (e.key === 'Enter') commitPrice();
    if (e.key === 'Escape') setEditingPrice(false);
  };

  // ─── Quantity controls ───────────────────────────────────────
  const handleQtyChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) onUpdate(item.id, { quantity: val });
  };

  const decrement = () => {
    if (item.quantity > 1) onUpdate(item.id, { quantity: item.quantity - 1 });
  };

  const increment = () => {
    onUpdate(item.id, { quantity: item.quantity + 1 });
  };

  return (
    <div className={`grocery-item${item.completed ? ' completed' : ''}`} role="listitem">
      {/* ── Checkbox ── */}
      <button
        className={`checkbox${item.completed ? ' checked' : ''}`}
        onClick={() => onToggle(item.id)}
        title={item.completed ? 'סמן כלא נקנה' : 'סמן כנקנה'}
        aria-label={item.completed ? 'סמן כלא נקנה' : 'סמן כנקנה'}
      >
        {item.completed && <span className="check-mark">✓</span>}
      </button>

      {/* ── Item details ── */}
      <div className="item-content">
        <div
          className="item-name"
          onClick={() => onEdit(item)}
          title="לחץ לעריכה"
        >
          {item.name}
        </div>

        <div className="item-meta">
          {/* Inline-editable price */}
          {editingPrice ? (
            <span className="price-edit-wrap">
              <span className="price-edit-prefix">₪</span>
              <input
                ref={priceInputRef}
                className="price-edit-input"
                type="number"
                min="0"
                step="0.5"
                value={priceVal}
                onChange={(e) => setPriceVal(e.target.value)}
                onBlur={commitPrice}
                onKeyDown={handlePriceKey}
                aria-label="עריכת מחיר"
                dir="ltr"
              />
              <span className="price-edit-label">/ יח׳</span>
            </span>
          ) : (
            <span
              className="item-unit-price"
              onClick={startPriceEdit}
              title="לחץ לעריכת מחיר"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && startPriceEdit()}
              aria-label={`מחיר: ₪${item.price} — לחץ לעריכה`}
            >
              ₪{item.price.toFixed(2)} / יח׳ ✏️
            </span>
          )}

          <span className="item-subtotal">סה״כ: ₪{subtotal}</span>
        </div>
      </div>

      {/* ── Quantity ── */}
      <div className="qty-controls no-print">
        <button className="qty-btn" onClick={decrement} aria-label="הפחת כמות">−</button>
        <input
          className="qty-input"
          type="number"
          min="1"
          value={item.quantity}
          onChange={handleQtyChange}
          aria-label="כמות"
        />
        <button className="qty-btn" onClick={increment} aria-label="הגדל כמות">+</button>
      </div>

      {/* כמות להדפסה */}
      <div className="qty-print print-only">x{item.quantity}</div>

      {/* ── Actions ── */}
      <div className="item-actions no-print">
        <button
          className="action-btn edit-btn"
          onClick={() => onEdit(item)}
          title="ערוך פריט"
          aria-label="ערוך פריט"
        >
          ✏️
        </button>
        <button
          className="action-btn remove-btn"
          onClick={() => onRemove(item.id)}
          title="הסר פריט"
          aria-label="הסר פריט"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default GroceryItem;
