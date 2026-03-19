/**
 * i18n — Hebrew / English translations
 * Usage: const { t } = useLanguage();  t('appTitle')
 */

export const translations = {
  he: {
    // ─── Header ───────────────────────────────────────────
    appTitle:       'רשימת קניות חכמה',
    items:          'פריטים',
    connected:      'מחובר',
    disconnected:   'לא מחובר',
    connecting:     'מתחבר...',
    hello:          'שלום',

    // ─── Header buttons ───────────────────────────────────
    btnPrint:       'הדפס',
    btnWord:        'Word',
    btnCopy:        'העתק',
    btnAdd:         'הוסף פריט',
    btnLogout:      'יציאה',
    btnCopied:      '✓ הועתק!',

    // ─── Search / filter ──────────────────────────────────
    searchPlaceholder: '🔍 חפש פריט...',

    // ─── Item card ────────────────────────────────────────
    unitPrice:      '/ {unit}',
    subtotal:       'סה״כ:',
    editItem:       'ערוך פריט',
    removeItem:     'הסר פריט',
    decreaseQty:    'הפחת כמות',
    increaseQty:    'הגדל כמות',
    qty:            'כמות',
    unitToggleTitle:'החלף יחידה',

    // ─── Total bar ────────────────────────────────────────
    grandTotal:     'סה״כ כללי משוער',
    estimatedOnly:  '* הערכה בלבד',
    resetList:      'אפס לרשימה המקורית',

    // ─── Modal — add / edit ───────────────────────────────
    modalAddTitle:  '➕ הוסף פריט חדש',
    modalEditTitle: '✏️ ערוך פריט',
    itemNameLabel:  'שם הפריט *',
    itemNamePh:     'לדוגמה: חלב, לחם, תפוחים...',
    pricingUnit:    'מחיר לפי',
    perUnit:        'יח׳ — ליחידה',
    perKg:          'ק״ג — לקילו',
    qtyLabel:       'כמות',
    priceLabel:     'מחיר משוער (₪ / {unit})',
    saveBtn:        '💾 שמור שינויים',
    addBtn:         '➕ הוסף לרשימה',
    cancelBtn:      'ביטול',

    // ─── Auth ─────────────────────────────────────────────
    loginTitle:     'התחבר לחשבון שלך',
    registerTitle:  'צור חשבון חדש',
    usernameLabel:  'שם משתמש',
    passwordLabel:  'סיסמה',
    loginBtn:       '🔑 התחבר',
    registerBtn:    '📝 הרשם',
    goRegister:     'אין לך חשבון עדיין? הרשם עכשיו',
    goLogin:        'יש לך חשבון? התחבר',
    privacyNote:    'כל משתמש מקבל רשימת קניות נפרדת ופרטית 🔒',

    // ─── Empty state ──────────────────────────────────────
    emptyList:      'הרשימה ריקה — הוסף פריט!',
    noSearchResult: 'לא נמצאו פריטים עבור "{q}"',

    // ─── Price banner ─────────────────────────────────────
    priceBanner:    'המחירים משוערים בלבד לפי ממוצע סופרמרקטים בישראל. ייתכנו שינויים בין חנויות.',

    // ─── Word doc ─────────────────────────────────────────
    wordTitle:      'רשימת קניות',
    wordDate:       'תאריך:',
    wordColName:    'שם פריט',
    wordColQty:     'כמות',

    // ─── Duplicate warning ────────────────────────────────
    duplicateWarning: 'הפריט "{name}" כבר קיים ברשימה.\nהאם להוסיף אותו בכל זאת?',

    // ─── Reset confirm ────────────────────────────────────
    resetConfirm:   'האם לאפס את הרשימה לרשימה המקורית? פעולה זו תמחק שינויים.',

    // ─── Lang toggle ──────────────────────────────────────
    langToggle:     'EN',
  },

  en: {
    // ─── Header ───────────────────────────────────────────
    appTitle:       'Smart Grocery List',
    items:          'items',
    connected:      'connected',
    disconnected:   'offline',
    connecting:     'connecting...',
    hello:          'Hi',

    // ─── Header buttons ───────────────────────────────────
    btnPrint:       'Print',
    btnWord:        'Word',
    btnCopy:        'Copy',
    btnAdd:         'Add Item',
    btnLogout:      'Logout',
    btnCopied:      '✓ Copied!',

    // ─── Search / filter ──────────────────────────────────
    searchPlaceholder: '🔍 Search items...',

    // ─── Item card ────────────────────────────────────────
    unitPrice:      '/ {unit}',
    subtotal:       'Total:',
    editItem:       'Edit item',
    removeItem:     'Remove item',
    decreaseQty:    'Decrease quantity',
    increaseQty:    'Increase quantity',
    qty:            'Quantity',
    unitToggleTitle:'Toggle unit',

    // ─── Total bar ────────────────────────────────────────
    grandTotal:     'Estimated Grand Total',
    estimatedOnly:  '* Estimate only',
    resetList:      'Reset to default list',

    // ─── Modal — add / edit ───────────────────────────────
    modalAddTitle:  '➕ Add New Item',
    modalEditTitle: '✏️ Edit Item',
    itemNameLabel:  'Item name *',
    itemNamePh:     'e.g. Milk, Bread, Apples...',
    pricingUnit:    'Price per',
    perUnit:        'Unit — per item',
    perKg:          'kg — per kilogram',
    qtyLabel:       'Quantity',
    priceLabel:     'Est. price (₪ / {unit})',
    saveBtn:        '💾 Save Changes',
    addBtn:         '➕ Add to List',
    cancelBtn:      'Cancel',

    // ─── Auth ─────────────────────────────────────────────
    loginTitle:     'Sign In',
    registerTitle:  'Create Account',
    usernameLabel:  'Username',
    passwordLabel:  'Password',
    loginBtn:       '🔑 Sign In',
    registerBtn:    '📝 Register',
    goRegister:     "Don't have an account? Register",
    goLogin:        'Already have an account? Sign in',
    privacyNote:    'Every user gets a separate private list 🔒',

    // ─── Empty state ──────────────────────────────────────
    emptyList:      'List is empty — add an item!',
    noSearchResult: 'No items found for "{q}"',

    // ─── Price banner ─────────────────────────────────────
    priceBanner:    'Prices are estimates based on Israeli supermarket averages. Prices may vary between stores.',

    // ─── Word doc ─────────────────────────────────────────
    wordTitle:      'Grocery List',
    wordDate:       'Date:',
    wordColName:    'Item',
    wordColQty:     'Qty',

    // ─── Duplicate warning ────────────────────────────────
    duplicateWarning: '"{name}" is already in the list.\nAdd it anyway?',

    // ─── Reset confirm ────────────────────────────────────
    resetConfirm:   'Reset list to defaults? This will delete your changes.',

    // ─── Lang toggle ──────────────────────────────────────
    langToggle:     'עב',
  },
};

/** Simple interpolation: t('hello {name}', { name: 'World' }) */
export function interpolate(str, vars = {}) {
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}
