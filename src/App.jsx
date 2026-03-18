import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_ITEMS } from './data/items';
import GroceryItem from './components/GroceryItem';
import ItemModal from './components/ItemModal';
import { exportToWord } from './utils/wordExport';
import { apiGetItems, apiUpsertItem, apiDeleteItem, apiSeedItems } from './api';

const STORAGE_KEY = 'grocery-items-v2'; // localStorage cache (fast load)

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * האפליקציה הראשית — רשימת קניות חכמה
 * שומרת ב-PostgreSQL (דרך Express API) + localStorage כ-cache
 */
function App() {
  // ─── State ───────────────────────────────────────────────────
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_ITEMS;
    } catch {
      return DEFAULT_ITEMS;
    }
  });

  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [wordLoading, setWordLoading] = useState(false);
  // 'idle' | 'loading' | 'ok' | 'offline'
  const [dbStatus, setDbStatus]     = useState('idle');

  // Track which IDs have pending sync so we don't race
  const pendingRef = useRef(new Set());

  // ─── Load from DB on mount ───────────────────────────────────
  useEffect(() => {
    setDbStatus('loading');
    apiGetItems()
      .then((rows) => {
        if (rows.length > 0) {
          setItems(rows);
        } else {
          // DB is empty — seed with defaults
          const fresh = DEFAULT_ITEMS.map((i) => ({ ...i }));
          setItems(fresh);
          apiSeedItems(fresh).catch(console.error);
        }
        setDbStatus('ok');
      })
      .catch((err) => {
        console.warn('DB unavailable, using localStorage:', err.message);
        setDbStatus('offline');
      });
  }, []);

  // ─── Persist to localStorage (fast cache) ────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // ─── DB helpers ───────────────────────────────────────────────
  const dbUpsert = useCallback((item) => {
    if (dbStatus === 'offline') return;
    apiUpsertItem(item).catch(console.error);
  }, [dbStatus]);

  const dbDelete = useCallback((id) => {
    if (dbStatus === 'offline') return;
    apiDeleteItem(id).catch(console.error);
  }, [dbStatus]);

  // ─── Derived values ───────────────────────────────────────────
  const doneCount    = useMemo(() => items.filter((i) => i.completed).length, [items]);
  const pendingCount = items.length - doneCount;

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'pending' && !item.completed) ||
      (filter === 'done'    &&  item.completed);
    const matchSearch = search === '' || item.name.includes(search);
    return matchFilter && matchSearch;
  }), [items, filter, search]);

  // סה"כ: פריטים עם כמות 0 לא נספרים
  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  // ─── CRUD ─────────────────────────────────────────────────────
  const addItem = (data) => {
    const newItem = {
      id: genId(),
      name: data.name,
      quantity: data.quantity,
      price: data.price,
      unit: data.unit || 'יח׳',
      completed: false,
    };
    setItems((prev) => [...prev, newItem]);
    dbUpsert(newItem);
  };

  const updateItem = (id, updates) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        dbUpsert(updated);
        return updated;
      })
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    dbDelete(id);
  };

  const toggleCompleted = (id) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, completed: !item.completed };
        dbUpsert(updated);
        return updated;
      })
    );
  };

  // ─── Modal handlers ───────────────────────────────────────────
  const openAdd    = () => { setEditingItem(null); setShowModal(true); };
  const openEdit   = (item) => { setEditingItem(item); setShowModal(true); };

  const handleModalSave = (data) => {
    // בדיקת כפילות שם (לא תלוי רישיות, ללא רווחים מיותרים)
    const newName = data.name.trim().toLowerCase();
    const duplicate = items.find((i) => {
      if (editingItem && i.id === editingItem.id) return false; // לא לבדוק את הפריט עצמו בעריכה
      return i.name.trim().toLowerCase() === newName;
    });
    if (duplicate) {
      const proceed = window.confirm(
        `⚠️ הפריט "${duplicate.name}" כבר קיים ברשימה.\nהאם להוסיף אותו בכל זאת?`
      );
      if (!proceed) return;
    }
    if (editingItem) updateItem(editingItem.id, data);
    else addItem(data);
    setShowModal(false);
    setEditingItem(null);
  };

  const handleModalClose = () => { setShowModal(false); setEditingItem(null); };

  // ─── Print & Word ─────────────────────────────────────────────
  const handlePrint = () => window.print();

  const handleWordExport = async () => {
    setWordLoading(true);
    try   { await exportToWord(items); }
    catch (err) { console.error(err); alert('שגיאה ביצירת קובץ Word:\n' + err.message); }
    finally { setWordLoading(false); }
  };

  // ─── Reset ────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!window.confirm('האם לאפס את הרשימה לרשימה המקורית? פעולה זו תמחק שינויים.')) return;
    const fresh = DEFAULT_ITEMS.map((i) => ({ ...i }));
    setItems(fresh);
    apiSeedItems(fresh).catch(console.error);
  };

  // ─── Status label ─────────────────────────────────────────────
  const statusLabel = {
    idle:    '',
    loading: ' · ⏳ מתחבר...',
    ok:      ' · 🟢 מחובר',
    offline: ' · 🔴 לא מחובר',
  }[dbStatus];

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="app">
      {/* ───── Header ───── */}
      <header className="header no-print">
        <div className="header-content">
          <div className="header-title">
            <span className="header-emoji">🛒</span>
            <div>
              <h1 className="header-h1">רשימת קניות חכמה</h1>
              <p className="header-sub">
                {items.length} פריטים &middot; ✅ {doneCount} נקנו &middot; 📋 {pendingCount} נותרו
                <span className="db-badge">{statusLabel}</span>
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-ghost" onClick={handlePrint} title="הדפס רשימה">
              <span>🖨️</span><span className="btn-label">הדפס</span>
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleWordExport}
              disabled={wordLoading}
              title="הורד מסמך Word"
            >
              <span>📄</span><span className="btn-label">{wordLoading ? '...' : 'Word'}</span>
            </button>
            <button className="btn btn-white" onClick={openAdd}>
              <span>+</span><span className="btn-label">הוסף פריט</span>
            </button>
          </div>
        </div>
      </header>

      {/* ───── Print-only header ───── */}
      <div className="print-header print-only">
        <h1 className="print-title">🛒 רשימת קניות</h1>
        <p className="print-date">
          תאריך: {new Date().toLocaleDateString('he-IL')} &nbsp;|&nbsp; {items.length} פריטים
        </p>
      </div>

      <main className="main">
        {/* Banner */}
        <div className="price-banner no-print">
          <span>ℹ️</span>
          <span>המחירים משוערים בלבד לפי ממוצע סופרמרקטים בישראל. ייתכנו שינויים בין חנויות.</span>
        </div>

        {/* ───── Filter bar ───── */}
        <div className="filter-bar no-print">
          <input
            className="search-input"
            type="text"
            placeholder="🔍 חפש פריט..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            dir="rtl"
            aria-label="חיפוש פריט"
          />
          <div className="filter-tabs" role="group" aria-label="סינון רשימה">
            <button className={`filter-tab${filter === 'all'     ? ' active' : ''}`} onClick={() => setFilter('all')}>הכל ({items.length})</button>
            <button className={`filter-tab${filter === 'pending' ? ' active' : ''}`} onClick={() => setFilter('pending')}>לא נקנה ({pendingCount})</button>
            <button className={`filter-tab${filter === 'done'    ? ' active' : ''}`} onClick={() => setFilter('done')}>נקנה ({doneCount})</button>
          </div>
        </div>

        {/* ───── Items list ───── */}
        <div className="items-list" role="list" aria-label="רשימת קניות">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-emoji">🛒</div>
              <p className="empty-text">
                {search
                  ? `לא נמצאו פריטים עבור "${search}"`
                  : filter === 'done'
                  ? 'אין פריטים שנקנו עדיין'
                  : 'הרשימה ריקה — הוסף פריט!'}
              </p>
              {items.length === 0 && (
                <button className="btn btn-outline" onClick={handleReset}>
                  אפס לרשימה המקורית
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => (
              <GroceryItem
                key={item.id}
                item={item}
                onRemove={removeItem}
                onUpdate={updateItem}
                onToggle={toggleCompleted}
                onEdit={openEdit}
              />
            ))
          )}
        </div>
      </main>

      {/* ───── Total bar ───── */}
      <div className="total-bar no-print">
        <div className="total-bar-inner">
          <div className="total-info">
            <span className="total-label">סה״כ משוער</span>
            <span className="total-amount">₪{total.toFixed(2)}</span>
            <span className="total-note">* הערכה בלבד</span>
          </div>
          <button className="btn btn-primary btn-add-main" onClick={openAdd}>
            + הוסף פריט
          </button>
        </div>
      </div>

      {/* Print total */}
      <div className="print-total print-only">
        <strong>סה״כ משוער לרשימה: ₪{total.toFixed(2)}</strong>
        <div className="print-note">* המחירים משוערים בלבד</div>
      </div>

      {/* ───── Modal ───── */}
      {showModal && (
        <ItemModal
          item={editingItem}
          onSave={handleModalSave}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default App;
