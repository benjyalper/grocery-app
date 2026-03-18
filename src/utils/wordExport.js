/**
 * ייצוא רשימת קניות לקובץ Word (.docx) בעברית RTL
 * משתמש בספריית docx v8
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * יוצר תא טבלה עם טקסט בעברית RTL
 */
function makeCell(text, { bold = false, width } = {}) {
  const cellOptions = {
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold,
            rightToLeft: true,
            font: 'David',
          }),
        ],
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
      }),
    ],
  };
  if (width) {
    cellOptions.width = { size: width, type: WidthType.DXA };
  }
  return new TableCell(cellOptions);
}

/**
 * מייצא את רשימת הקניות לקובץ Word
 * @param {Array} items - מערך הפריטים
 */
export async function exportToWord(items) {
  const dateStr = new Date().toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // פריטים עם כמות 0 לא נכללים במסמך
  const activeItems = items.filter((item) => item.quantity > 0);

  // שורת כותרת — שם פריט + כמות בלבד
  const headerRow = new TableRow({
    children: [
      makeCell('שם פריט', { bold: true }),
      makeCell('כמות', { bold: true }),
    ],
  });

  // שורות פריטים (רק פריטים עם כמות > 0)
  const itemRows = activeItems.map((item) => {
    const status = item.completed ? ' ✓' : '';
    return new TableRow({
      children: [
        makeCell(item.name + status),
        makeCell(String(item.quantity) + ' ' + (item.unit || 'יח׳')),
      ],
    });
  });

  const table = new Table({
    rows: [headerRow, ...itemRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [
      {
        children: [
          // כותרת ראשית
          new Paragraph({
            children: [
              new TextRun({
                text: 'רשימת קניות',
                bold: true,
                size: 40,
                rightToLeft: true,
                font: 'David',
              }),
            ],
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 200 },
          }),

          // תאריך
          new Paragraph({
            children: [
              new TextRun({
                text: `תאריך: ${dateStr}`,
                size: 22,
                color: '6b7280',
                rightToLeft: true,
                font: 'David',
              }),
            ],
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 400 },
          }),

          // טבלת פריטים
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'רשימת-קניות.docx');
}
