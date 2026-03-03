// src/utils/contractGenerator.js
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType } from "docx";

// ─── HELPERS ───
function formatAmount(amount, currency) {
  const num = Number(amount?.toString().replace(/\s/g, ""));
  if (isNaN(num)) return `${amount || "___"} ${currency}`;
  return `${num.toLocaleString("uz-UZ")} ${currency}`;
}

function getContractTitle(type, language) {
  const titles = {
    uz: { service: "XIZMAT KO'RSATISH SHARTNOMASI", sale: "OLDI-SOTDI SHARTNOMASI", rent: "IJARA SHARTNOMASI", custom: "SHARTNOMA" },
    ru: { service: "ДОГОВОР ОКАЗАНИЯ УСЛУГ", sale: "ДОГОВОР КУПЛИ-ПРОДАЖИ", rent: "ДОГОВОР АРЕНДЫ", custom: "ДОГОВОР" }
  };
  return titles[language]?.[type] || "SHARTNOMA";
}

// ─── PDF GENERATOR ───
export async function generatePDF(form, userProfile) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Font setup (basic latin only — for Cyrillic use custom font)
  doc.setFont("helvetica");

  const title = getContractTitle(form.type, form.language);
  const ourName = userProfile?.companyName || userProfile?.fullName || "—";
  const ourStir = userProfile?.stir || userProfile?.jshshir || "—";
  const ourBank = form.ourRekvizit === "main"
    ? { account: userProfile?.bankAccount, bank: userProfile?.bankName, mfo: userProfile?.mfo }
    : userProfile?.secondaryRekvizits?.[form.ourRekvizit];

  let y = 20;
  const lm = 20; // left margin
  const rm = 190; // right margin
  const cw = rm - lm; // content width

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 105, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`№ ${form.contractNumber || "___"}   |   ${form.date}   |   Toshkent sh.`, 105, y, { align: "center" });
  y += 12;

  doc.setTextColor(0);

  // Section helper
  function section(title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setFillColor(245, 245, 255);
    doc.rect(lm, y - 4, cw, 8, "F");
    doc.text(title, lm + 3, y + 1);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  }

  function line(label, value) {
    doc.setFont("helvetica", "bold");
    doc.text(label + ": ", lm, y);
    doc.setFont("helvetica", "normal");
    const labelW = doc.getTextWidth(label + ": ");
    const lines = doc.splitTextToSize(value || "—", cw - labelW);
    doc.text(lines, lm + labelW, y);
    y += lines.length * 6;
  }

  function paragraph(text) {
    const lines = doc.splitTextToSize(text || "", cw);
    doc.text(lines, lm, y);
    y += lines.length * 6 + 2;
  }

  // 1. Parties
  section("1. TOMONLAR / СТОРОНЫ");
  line("Ijrochi", `${ourName}, STIR: ${ourStir}, manzil: ${userProfile?.address || "—"}, direktor: ${userProfile?.director || userProfile?.fullName || "—"}`);
  y += 2;
  line("Buyurtmachi", `${form.counterpartyName || "—"}, STIR: ${form.counterpartyStiр || "—"}, manzil: ${form.counterpartyAddress || "—"}`);
  y += 6;

  // 2. Subject
  section("2. SHARTNOMA PREDMETI");
  paragraph(form.description || "Ijrochi Buyurtmachiga quyidagi xizmatlarni ko'rsatishni o'z zimmasiga oladi.");
  y += 4;

  // 3. Price
  section("3. NARX VA TO'LOV TARTIBI");
  paragraph(`Shartnoma summasi: ${formatAmount(form.amount, form.currency)}. To'lov bank o'tkazmasi orqali amalga oshiriladi.`);
  y += 4;

  // 4. Term
  section("4. AMAL QILISH MUDDATI");
  paragraph(`Shartnoma ${form.startDate || form.date} dan ${form.endDate || "___"} gacha amal qiladi.`);
  y += 4;

  // 5. Rekvizits
  section("5. TOMONLAR REKVIZITLARI");
  line("Ijrochi", `${ourName}, STIR: ${ourStir}, h/r: ${ourBank?.account || "—"}, bank: ${ourBank?.bank || "—"}, MFO: ${ourBank?.mfo || "—"}`);
  y += 2;
  line("Buyurtmachi", `${form.counterpartyName || "—"}, STIR: ${form.counterpartyStiр || "—"}, h/r: ${form.counterpartyAccount || "—"}, bank: ${form.counterpartyBank || "—"}, MFO: ${form.counterpartyMfo || "—"}`);
  y += 10;

  // Signatures
  if (y > 240) { doc.addPage(); y = 20; }
  const midX = lm + cw / 2;
  doc.line(lm, y, midX - 5, y);
  doc.line(midX + 5, y, rm, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("IJROCHI:", lm, y);
  doc.text("BUYURTMACHI:", midX + 5, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  const lines1 = doc.splitTextToSize(ourName, midX - lm - 10);
  doc.text(lines1, lm, y);
  const lines2 = doc.splitTextToSize(form.counterpartyName || "—", rm - midX - 5);
  doc.text(lines2, midX + 5, y);
  y += Math.max(lines1.length, lines2.length) * 6 + 14;

  doc.text("___________________________", lm, y);
  doc.text("___________________________", midX + 5, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("(imzo / podpis)     M.O.", lm, y);
  doc.text("(imzo / podpis)     M.O.", midX + 5, y);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(`Shartnoma No: ${form.contractNumber || "___"} | ${form.date} | Sahifa ${i}/${pageCount}`, 105, 290, { align: "center" });
  }

  // Save
  const fileName = `Shartnoma No_${form.contractNumber || "0"} - ${form.counterpartyName || "kontragent"} - ${form.date}.pdf`;
  doc.save(fileName);
}

// ─── WORD GENERATOR ───
export async function generateWord(form, userProfile) {
  const title = getContractTitle(form.type, form.language);
  const ourName = userProfile?.companyName || userProfile?.fullName || "—";
  const ourStir = userProfile?.stir || userProfile?.jshshir || "—";

  const B = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: B, bottom: B, left: B, right: B };

  function h(text, level = 1) {
    return new Paragraph({
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text, bold: true, size: level === 1 ? 26 : 22, allCaps: level === 1 })]
    });
  }

  function p(text) {
    return new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text: text || "—", size: 21 })]
    });
  }

  function row(label, value) {
    return new TableRow({
      children: [
        new TableCell({ borders, width: { size: 3000, type: WidthType.DXA }, shading: { fill: "F0F0F0", type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })] }),
        new TableCell({ borders, width: { size: 6360, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: value || "—", size: 20 })] })] }),
      ]
    });
  }

  const doc = new Document({
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1134, bottom: 1134, left: 1701 } } },
      children: [
        // Title
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: title, bold: true, size: 28, allCaps: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 }, children: [new TextRun({ text: `№ ${form.contractNumber || "___"}   |   ${form.date}   |   Toshkent sh.`, size: 20, color: "666666" })] }),

        h("1. TOMONLAR"),
        p(`Ijrochi: ${ourName}, STIR: ${ourStir}, manzil: ${userProfile?.address || "—"}, direktor: ${userProfile?.director || userProfile?.fullName || "—"}`),
        p(`Buyurtmachi: ${form.counterpartyName || "—"}, STIR: ${form.counterpartyStiр || "—"}, manzil: ${form.counterpartyAddress || "—"}`),

        h("2. SHARTNOMA PREDMETI"),
        p(form.description || "Ijrochi Buyurtmachiga quyidagi xizmatlarni ko'rsatishni o'z zimmasiga oladi."),

        h("3. NARX VA TO'LOV"),
        p(`Shartnoma summasi: ${formatAmount(form.amount, form.currency)}. To'lov bank o'tkazmasi orqali amalga oshiriladi.`),

        h("4. MUDDAT"),
        p(`Shartnoma ${form.startDate || form.date} dan ${form.endDate || "___"} gacha amal qiladi.`),

        h("5. REKVIZITLAR"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3000, 6360],
          rows: [
            row("Ijrochi nomi", ourName),
            row("STIR", ourStir),
            row("Hisob raqam", userProfile?.bankAccount || "—"),
            row("Bank / MFO", `${userProfile?.bankName || "—"} / ${userProfile?.mfo || "—"}`),
            row("Buyurtmachi nomi", form.counterpartyName || "—"),
            row("STIR", form.counterpartyStiр || "—"),
            row("Hisob raqam", form.counterpartyAccount || "—"),
            row("Bank / MFO", `${form.counterpartyBank || "—"} / ${form.counterpartyMfo || "—"}`),
          ]
        }),

        // Signatures
        new Paragraph({ spacing: { before: 400, after: 80 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } }, children: [new TextRun("")] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [
                new Paragraph({ children: [new TextRun({ text: "IJROCHI:", bold: true, size: 21 })] }),
                new Paragraph({ children: [new TextRun({ text: ourName, size: 20 })] }),
                new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "___________________________", size: 21 })] }),
                new Paragraph({ children: [new TextRun({ text: "(imzo)     M.O.", size: 18, color: "888888" })] }),
              ]}),
              new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [
                new Paragraph({ children: [new TextRun({ text: "BUYURTMACHI:", bold: true, size: 21 })] }),
                new Paragraph({ children: [new TextRun({ text: form.counterpartyName || "—", size: 20 })] }),
                new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "___________________________", size: 21 })] }),
                new Paragraph({ children: [new TextRun({ text: "(imzo)     M.O.", size: 18, color: "888888" })] }),
              ]}),
            ]})
          ]
        }),
      ]
    }]
  });

  const buffer = await Packer.toBlob(doc);
  const fileName = `Shartnoma No_${form.contractNumber || "0"} - ${form.counterpartyName || "kontragent"} - ${form.date}.docx`;
  saveAs(buffer, fileName);
}
