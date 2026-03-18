import React, { useState, useEffect, useRef } from 'react';

/**
 * מודאל להוספה ועריכה של פריט
 * אם item !== null → מצב עריכה; אחרת → מצב הוספה
 */
function ItemModal({ item, onSave, onClose }) {
  const isEditing = !!item;

  const [name, setName] = useState(item?.name || '');
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [price, setPrice] = useState(item?.price ?? 0);

  const nameRef = useRef(null);

  // Focus on name input when modal opens
  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 50);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      nameRef.current?.focus();
      return;
    }
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const pr = Math.max(0, parseFloat(price) || 0);
    onSave({ name: trimmed, quantity: qty, price: pr });
  };

  // Close when clicking the backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="modal">
        {/* כותרת */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? '✏️ ערוך פריט' : '➕ הוסף פריט חדש'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* שם הפריט */}
          <div className="form-group">
            <label className="form-label" htmlFor="item-name">שם הפריט *</label>
            <input
              ref={nameRef}
              id="item-name"
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: חלב, לחם, תפוחים..."
              required
              dir="rtl"
            />
          </div>

          {/* כמות ומחיר */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="item-qty">כמות</label>
              <input
                id="item-qty"
                className="form-input"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="item-price">מחיר משוער (₪)</label>
              <input
                id="item-price"
                className="form-input"
                type="number"
                min="0"
                step="0.5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                dir="ltr"
              />
            </div>
          </div>

          {/* כפתורים */}
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary">
              {isEditing ? '💾 שמור שינויים' : '➕ הוסף לרשימה'}
            </button>
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemModal;
