/**
 * Local price database — estimated average prices in ILS
 * from Israeli supermarkets (Rami Levy, Shufersal, Mega).
 * Prices are approximate and for reference only.
 */

export const DEFAULT_ITEMS = [
  { id: '1',  name: 'בננות בשלות לא רקובות',       quantity: 1, price: 8,  completed: false },
  { id: '2',  name: 'מלפפונים',                      quantity: 1, price: 6,  completed: false },
  { id: '3',  name: 'בטטות בינוניות',                quantity: 1, price: 11, completed: false },
  { id: '4',  name: 'גבינה לבנה 9%',                 quantity: 1, price: 14, completed: false },
  { id: '5',  name: 'קוטג׳ 9%',                      quantity: 1, price: 12, completed: false },
  { id: '6',  name: 'גבינת שמנת',                    quantity: 1, price: 18, completed: false },
  { id: '7',  name: 'אבוקדו בשל',                    quantity: 1, price: 9,  completed: false },
  { id: '8',  name: 'שמנת מתוקה',                    quantity: 1, price: 12, completed: false },
  { id: '9',  name: 'חלב רמת הגולן',                 quantity: 1, price: 8,  completed: false },
  { id: '10', name: 'שוקו יטבתה גדול',               quantity: 1, price: 10, completed: false },
  { id: '11', name: 'מנה חמה שתיים עוף',             quantity: 2, price: 22, completed: false },
  { id: '12', name: 'קופסאות תירס',                  quantity: 1, price: 6,  completed: false },
  { id: '13', name: 'ביצים',                          quantity: 1, price: 26, completed: false },
  { id: '14', name: 'ספגטי דק (לא של 3 דקות)',       quantity: 1, price: 7,  completed: false },
  { id: '15', name: 'כיכר לחם',                      quantity: 1, price: 9,  completed: false },
  { id: '16', name: 'פטריות',                         quantity: 1, price: 16, completed: false },
  { id: '17', name: 'במבה',                           quantity: 1, price: 5,  completed: false },
  { id: '18', name: 'דובונים',                        quantity: 1, price: 8,  completed: false },
  { id: '19', name: 'מלון (אם יש)',                   quantity: 1, price: 22, completed: false },
  { id: '20', name: 'תותים לא רקובים',               quantity: 1, price: 18, completed: false },
  { id: '21', name: 'תפוחים אדומים',                 quantity: 1, price: 12, completed: false },
  { id: '22', name: 'מרגרינה לאפייה',                quantity: 1, price: 10, completed: false },
  { id: '23', name: 'טחינה הר ברכה',                 quantity: 1, price: 23, completed: false },
  { id: '24', name: 'גבינה צהובה',                   quantity: 1, price: 26, completed: false },
  { id: '25', name: 'תפוחי אדמה דוד משה',            quantity: 1, price: 8,  completed: false },
  { id: '26', name: 'בשר טחון',                      quantity: 1, price: 42, completed: false },
  { id: '27', name: 'עוף',                            quantity: 1, price: 36, completed: false },
  { id: '28', name: 'קוקה קולה',                     quantity: 1, price: 7,  completed: false },
];
