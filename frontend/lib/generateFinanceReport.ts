import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinancialSummary {
  totalIncome: number | string;
  totalExpenses: number | string;
  netAmount: number | string;
  offerings?: { total: number | string; count: number };
  tithes?: { total: number | string; count: number };
  pledges?: { totalPaid: number | string };
  expenses?: { total: number | string; count: number };
}

interface Offering {
  id: string;
  category: string;
  amount: number | string;
  date: string;
  serviceType?: string;
  paymentMethod?: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number | string;
  date: string;
  paymentMethod?: string;
  vendor?: string;
}

const toMoney = (value: number | string | undefined): string => {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number.isFinite(num) ? num : 0
  );
};

function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export async function generateFinanceReport(
  summary: FinancialSummary | null,
  offerings: Offering[],
  expenses: Expense[]
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 20;

  // Load and add logo
  try {
    const logoDataUrl = await loadImageAsBase64('/kipra-logo-report.png');
    const logoWidth = 30;
    const logoHeight = 30;
    doc.addImage(logoDataUrl, 'PNG', margin, 8, logoWidth, logoHeight);
    y = 42;
  } catch {
    // If logo fails to load, continue without it
  }

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Kingdom Power Royal Assembly', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60);
  doc.text('Financial Report', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });

  y += 12;

  // Summary Section
  if (summary) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Financial Summary', margin, y);
    y += 8;

    const summaryData = [
      ['Total Income', toMoney(summary.totalIncome)],
      ['Total Expenses', toMoney(summary.totalExpenses)],
      ['Net Balance', toMoney(summary.netAmount)],
    ];

    if (summary.offerings) {
      summaryData.push(['Offerings Total', toMoney(summary.offerings.total)]);
      summaryData.push(['Offerings Count', String(summary.offerings.count)]);
    }
    if (summary.tithes) {
      summaryData.push(['Tithes Total', toMoney(summary.tithes.total)]);
      summaryData.push(['Tithes Count', String(summary.tithes.count)]);
    }
    if (summary.pledges) {
      summaryData.push(['Pledges Paid', toMoney(summary.pledges.totalPaid)]);
    }
    if (summary.expenses) {
      summaryData.push(['Expenses Total', toMoney(summary.expenses.total)]);
      summaryData.push(['Expenses Count', String(summary.expenses.count)]);
    }

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Offerings Section
  if (offerings.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Recent Offerings', margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Date', 'Category', 'Service Type', 'Amount']],
      body: offerings.map((o) => [
        new Date(o.date).toLocaleDateString(),
        o.category || '-',
        o.serviceType || '-',
        toMoney(o.amount),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        3: { halign: 'right' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Expenses Section
  if (expenses.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Recent Expenses', margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: expenses.map((e) => [
        new Date(e.date).toLocaleDateString(),
        e.category,
        e.description,
        toMoney(e.amount),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        3: { halign: 'right' },
      },
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Kingdom Power Royal Assembly - Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`finance-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

