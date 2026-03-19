import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DEFAULT_ITEMS } from './data/items';
import GroceryItem  from './components/GroceryItem';
import ItemModal    from './components/ItemModal';
import AuthPage     from './components/AuthPage';
import ImportModal  from './components/ImportModal';
import { exportToWord } from './utils/wordExport';
import {
  apiGetItems, apiUpsertItem, apiDeleteItem, apiSeedItems,
  getToken, getUsername, clearAuth,
} from './api';

const STORAGE_KEY = 'grocery-items-v2';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function App() {
  // ─── Auth state ──────────────────────────────────────────────
  // username is null when logged out, string when logged in
  const [username, setUsername] = useState(() => getUsername());

  // ─── Items state ─────────────────────────────────────────────
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_ITEMS;
    } catch { return DEFAULT_ITEMS; }
  });

  const [search, setSearch]           = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showImport, setShowImport]   = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [copyLabel, setCopyLabel]     = useState('העתק');
  const [dbStatus, setDbStatus]       = useState('idle');

  // ─── Load from DB whenever user logs in ──────────────────────
  useEffect(() => {
    if (!username) return; // not logged in
    if (!getToken()) return;

    setDbStatus('loading');
    apiGetItems()
      .then((rows) => {
        if (rows.length > 0) {
          setItems(rows);
        } else {
          const fresh = DEFAULT_ITEMS.map((i) => ({ ...i }));
          setItems(fresh);
          apiSeedItems(fresh).catch(console.error);
        }
        setDbStatus('ok');
      })
      .catch((err) => {
        console.warn('DB unavailable:', err.message);
        setDbStatus('offline');
      });
  }, [username]);

  // ─── Persist to localStorage ─────────────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // ─── DB helpers ───────────────────────────────────────────────
  const dbUpsert = useCallback((item) => {
    if (dbStatus === 'offline' || !getToken()) return;
    apiUpsertItem(item).catch(console.error);
  }, [dbStatus]);

  const dbDelete = useCallback((id) => {
    if (dbStatus === 'offline' || !getToken()) return;
    apiDeleteItem(id).catch(console.error);
  }, [dbStatus]);

  // ─── Derived values ───────────────────────────────────────────
  const filteredItems = useMemo(() =>
    items.filter((item) => search === '' || item.name.includes(search)),
    [items, search]
  );

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

  // ─── Import from text ─────────────────────────────────────────
  const handleImport = (parsedItems) => {
    const newItems = parsedItems.map((p) => ({
      id: genId(),
      name: p.name,
      quantity: p.quantity,
      price: p.price,
      unit: p.unit || 'יח׳',
      completed: false,
    }));
    setItems((prev) => {
      const merged = [...prev];
      newItems.forEach((ni) => {
        const exists = merged.find(
          (ex) => ex.name.trim().toLowerCase() === ni.name.trim().toLowerCase()
        );
        if (!exists) {
          merged.push(ni);
          dbUpsert(ni);
        }
      });
      return merged;
    });
  };

  // ─── Modal handlers ───────────────────────────────────────────
  const openAdd  = () => { setEditingItem(null); setShowModal(true); };
  const openEdit = (item) => { setEditingItem(item); setShowModal(true); };

  const handleModalSave = (data) => {
    const newName = data.name.trim().toLowerCase();
    const duplicate = items.find((i) => {
      if (editingItem && i.id === editingItem.id) return false;
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

  // ─── Print & export ───────────────────────────────────────────
  const handlePrint = () => window.print();

  const handleCopy = async () => {
    const activeItems = items.filter((i) => i.quantity > 0);
    const dateStr = new Date().toLocaleDateString('he-IL', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const lines = [
      `🛒 רשימת קניות — ${dateStr}`,
      '',
      ...activeItems.map((i) => `🔲 ${i.name} — ${i.quantity} ${i.unit || 'יח׳'}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
    } catch {
      const ta = document.createElement('textarea');
      ta.value = lines.join('\n');
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopyLabel('✓ הועתק!');
    setTimeout(() => setCopyLabel('העתק'), 2200);
  };

  const handleWordExport = async () => {
    setWordLoading(true);
    try { await exportToWord(items); }
    catch (err) { alert('שגיאה ביצירת קובץ Word:\n' + err.message); }
    finally { setWordLoading(false); }
  };

  // ─── Reset ────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!window.confirm('האם לאפס את הרשימה לרשימה המקורית?')) return;
    const fresh = DEFAULT_ITEMS.map((i) => ({ ...i }));
    setItems(fresh);
    apiSeedItems(fresh).catch(console.error);
  };

  // ─── Auth ─────────────────────────────────────────────────────
  const handleAuth = (uname) => {
    setUsername(uname);
    setItems(DEFAULT_ITEMS.map((i) => ({ ...i }))); // clear stale cache
  };

  const handleLogout = () => {
    clearAuth();
    setUsername(null);
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // ─── Status label ─────────────────────────────────────────────
  const statusLabel = {
    idle:    '',
    loading: ' · ⏳ מתחבר...',
    ok:      ' · 🟢 מחובר',
    offline: ' · 🔴 לא מחובר',
  }[dbStatus];

  // ─── Show auth screen when not logged in ─────────────────────
  if (!username || !getToken()) {
    return <AuthPage onAuth={handleAuth} />;
  }

  // ─── Main app ─────────────────────────────────────────────────
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
                שלום, <strong>{username}</strong> &middot; {items.length} פריטים
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
            <button
              className={`btn ${copyLabel.startsWith('✓') ? 'btn-copied' : 'btn-whatsapp'}`}
              onClick={handleCopy}
              title="העתק רשימה לוואטסאפ"
            >
              <span>📋</span><span className="btn-label">{copyLabel}</span>
            </button>
            <button className="btn btn-ghost" onClick={() => setShowImport(true)} title="ייבא רשימה מטקסט">
              <span>📥</span><span className="btn-label">ייבוא</span>
            </button>
            <button className="btn btn-white" onClick={openAdd}>
              <span>+</span><span className="btn-label">הוסף פריט</span>
            </button>
            <button className="btn btn-logout" onClick={handleLogout} title="התנתק">
              <span>🚪</span><span className="btn-label">יציאה</span>
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

        {/* ───── Search bar ───── */}
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
        </div>

        {/* ───── Items list ───── */}
        <div className="items-list" role="list" aria-label="רשימת קניות">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-emoji">🛒</div>
              <p className="empty-text">
                {search ? `לא נמצאו פריטים עבור "${search}"` : 'הרשימה ריקה — הוסף פריט!'}
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

      {/* ───── Modals ───── */}
      {showModal && (
        <ItemModal
          item={editingItem}
          onSave={handleModalSave}
          onClose={handleModalClose}
        />
      )}
      {showImport && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

export default App;
