import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";

export interface ContractData {
  contractNumber?: string;
  date: string;
  ourName: string;
  ourStir: string;
  ourDirector: string;
  ourAddress: string;
  ourBank: {
    bank?: string;
    mfo?: string;
    account?: string;
  };
  counterpartyName: string;
  counterpartyStir?: string;
  counterpartyDirector?: string;
  counterpartyAddress?: string;
  counterpartyBank?: string;
  counterpartyMfo?: string;
  counterpartyAccount?: string;
  amount?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  content: string;
}

export async function generatePDF(contract: ContractData, filename: string): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxWidth = pageWidth - 2 * margin;

  // Set font
  pdf.setFont("courier", "normal");
  pdf.setFontSize(10);

  // Split content into lines
  const lines = pdf.splitTextToSize(contract.content, maxWidth);

  let yPosition = margin;
  const lineHeight = 5;

  lines.forEach((line: string) => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.text(line, margin, yPosition);
    yPosition += lineHeight;
  });

  // Save PDF
  pdf.save(filename || "contract.pdf");
}

export async function generateWord(contract: ContractData, filename: string): Promise<void> {
  const lines = contract.content.split("\n");

  const paragraphs = lines.map((line) => {
    // Check if line is a heading (all caps and short)
    const isHeading = line === line.toUpperCase() && line.length > 0 && line.length < 100;

    return new Paragraph({
      alignment: isHeading ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: {
        line: 240,
        lineRule: "auto",
      },
      children: [
        new TextRun({
          text: line || " ",
          bold: isHeading,
          size: isHeading ? 24 : 20,
          font: "Courier New",
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "contract.docx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadAsText(contract: ContractData, filename: string): void {
  const element = document.createElement("a");
  const file = new Blob([contract.content], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = filename || "contract.txt";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function printContract(contract: ContractData): void {
  const printWindow = window.open("", "", "height=600,width=800");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${contract.contractNumber || "Contract"}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 20px;
              line-height: 1.6;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <pre>${contract.content}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}
