import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../LanguageContext';

function ItemModal({ item, onSave, onClose }) {
  const { t, isRTL } = useLanguage();
  const isEditing = !!item;

  const [name, setName]         = useState(item?.name     || '');
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [price, setPrice]       = useState(item?.price    ?? 0);
  const [unit, setUnit]         = useState(item?.unit     || 'יח׳');

  const nameRef = useRef(null);

  useEffect(() => { setTimeout(() => nameRef.current?.focus(), 50); }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { nameRef.current?.focus(); return; }
    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const pr  = Math.max(0, parseFloat(price)     || 0);
    onSave({ name: trimmed, quantity: qty, price: pr, unit });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? t('modalEditTitle') : t('modalAddTitle')}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label={t('cancelBtn')}>×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Item name — always RTL since names are Hebrew */}
          <div className="form-group">
            <label className="form-label" htmlFor="item-name">{t('itemNameLabel')}</label>
            <input
              ref={nameRef}
              id="item-name"
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('itemNamePh')}
              required
              dir="rtl"
            />
          </div>

          {/* Unit selector */}
          <div className="form-group">
            <label className="form-label">{t('pricingUnit')}</label>
            <div className="unit-selector">
              <button
                type="button"
                className={`unit-option${unit === 'יח׳' ? ' active' : ''}`}
                onClick={() => setUnit('יח׳')}
              >
                {t('perUnit')}
              </button>
              <button
                type="button"
                className={`unit-option${unit === 'ק"ג' ? ' active' : ''}`}
                onClick={() => setUnit('ק"ג')}
              >
                {t('perKg')}
              </button>
            </div>
          </div>

          {/* Quantity + price */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="item-qty">{t('qtyLabel')}</label>
              <input
                id="item-qty"
                className="form-input"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="item-price">
                {t('priceLabel', { unit })}
              </label>
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

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary">
              {isEditing ? t('saveBtn') : t('addBtn')}
            </button>
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              {t('cancelBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemModal;
