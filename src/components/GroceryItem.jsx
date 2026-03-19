import React, { useState, useRef } from 'react';
import { useLanguage } from '../LanguageContext';

function GroceryItem({ item, onRemove, onUpdate, onEdit }) {
  const { t, isRTL } = useLanguage();
  const unit     = item.unit || 'יח׳';
  const subtotal = (item.price * item.quantity).toFixed(2);

  // ─── Inline price editing ────────────────────────────────────
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceVal, setPriceVal]         = useState(String(item.price));
  const priceInputRef                   = useRef(null);

  const startPriceEdit = () => {
    setPriceVal(String(item.price));
    setEditingPrice(true);
    setTimeout(() => priceInputRef.current?.select(), 30);
  };

  const commitPrice = () => {
    const parsed = parseFloat(priceVal);
    if (!isNaN(parsed) && parsed >= 0) onUpdate(item.id, { price: parsed });
    setEditingPrice(false);
  };

  const handlePriceKey = (e) => {
    if (e.key === 'Enter') commitPrice();
    if (e.key === 'Escape') setEditingPrice(false);
  };

  // ─── Unit toggle ─────────────────────────────────────────────
  const toggleUnit = () => {
    const next = unit === 'יח׳' ? 'ק"ג' : 'יח׳';
    onUpdate(item.id, { unit: next });
  };

  // ─── Quantity controls ───────────────────────────────────────
  const handleQtyChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0) onUpdate(item.id, { quantity: val });
  };

  return (
    <div className={`grocery-item${item.quantity === 0 ? ' qty-zero' : ''}`} role="listitem">

      {/* ── Item details ── */}
      <div className="item-content">
        <div
          className="item-name"
          onClick={() => onEdit(item)}
          title={t('editItem')}
          /* item names are always Hebrew regardless of UI lang */
          dir="rtl"
        >
          {item.name}
        </div>

        <div className="item-meta">
          {/* Unit toggle pill */}
          <button
            className={`unit-toggle unit-toggle--${unit === 'ק"ג' ? 'kg' : 'unit'}`}
            onClick={toggleUnit}
            title={t('unitToggleTitle')}
            aria-label={`${t('unitToggleTitle')}: ${unit}`}
          >
            {unit}
          </button>

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
                aria-label={t('priceLabel', { unit })}
                dir="ltr"
              />
              <span className="price-edit-label">/ {unit}</span>
            </span>
          ) : (
            <span
              className="item-unit-price"
              onClick={startPriceEdit}
              title={t('editItem')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && startPriceEdit()}
            >
              ₪{item.price.toFixed(2)} / {unit} ✏️
            </span>
          )}

          <span className="item-subtotal">{t('subtotal')} ₪{subtotal}</span>
        </div>
      </div>

      {/* ── Quantity ── */}
      <div className="qty-controls no-print">
        <button
          className="qty-btn"
          onClick={() => item.quantity > 0 && onUpdate(item.id, { quantity: item.quantity - 1 })}
          aria-label={t('decreaseQty')}
        >−</button>
        <input
          className="qty-input"
          type="number"
          min="0"
          value={item.quantity}
          onChange={handleQtyChange}
          aria-label={t('qty')}
          dir="ltr"
        />
        <button
          className="qty-btn"
          onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}
          aria-label={t('increaseQty')}
        >+</button>
      </div>

      {/* כמות להדפסה */}
      <div className="qty-print print-only">x{item.quantity} {unit}</div>

      {/* ── Actions ── */}
      <div className="item-actions no-print">
        <button className="action-btn edit-btn"   onClick={() => onEdit(item)}     title={t('editItem')}   aria-label={t('editItem')}>✏️</button>
        <button className="action-btn remove-btn" onClick={() => onRemove(item.id)} title={t('removeItem')} aria-label={t('removeItem')}>🗑️</button>
      </div>
    </div>
  );
}

export default GroceryItem;
