/**
 * ייצוא רשימת קניות לקובץ Word (.docx)
 * תומך בעברית (RTL) ואנגלית (LTR) בהתאם לפונקציית התרגום t()
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

function makeCell(text, { bold = false, rtl = true } = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, bold, rightToLeft: rtl, font: rtl ? 'David' : 'Calibri' }),
        ],
        alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
        bidirectional: rtl,
      }),
    ],
  });
}

/**
 * @param {Array}    items  - רשימת הפריטים
 * @param {Function} t      - פונקציית תרגום מה-i18n
 */
export async function exportToWord(items, t) {
  // fallback if called without t (e.g. tests)
  const tr = t || ((k) => k);

  const isHe = tr('langToggle') === 'EN'; // if toggle says "EN" → currently Hebrew
  const locale = isHe ? 'he-IL' : 'en-US';
  const rtl    = isHe;

  const dateStr = new Date().toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const activeItems = items.filter((item) => item.quantity > 0);

  const headerRow = new TableRow({
    children: [
      makeCell(tr('wordColName'), { bold: true, rtl }),
      makeCell(tr('wordColQty'),  { bold: true, rtl }),
    ],
  });

  const itemRows = activeItems.map((item) =>
    new TableRow({
      children: [
        makeCell(item.name, { rtl: true }), // names always RTL (Hebrew)
        makeCell(`${item.quantity} ${item.unit || 'יח׳'}`, { rtl }),
      ],
    })
  );

  const align = rtl ? AlignmentType.RIGHT : AlignmentType.LEFT;

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({
            text: tr('wordTitle'),
            bold: true, size: 40,
            rightToLeft: rtl,
            font: rtl ? 'David' : 'Calibri',
          })],
          alignment: align,
          bidirectional: rtl,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({
            text: `${tr('wordDate')} ${dateStr}`,
            size: 22, color: '6b7280',
            rightToLeft: rtl,
            font: rtl ? 'David' : 'Calibri',
          })],
          alignment: align,
          bidirectional: rtl,
          spacing: { after: 400 },
        }),
        new Table({
          rows: [headerRow, ...itemRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = isHe ? 'רשימת-קניות.docx' : 'grocery-list.docx';
  saveAs(blob, filename);
}
