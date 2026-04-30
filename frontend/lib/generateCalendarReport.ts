import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { mergeLocalDateFromIsoWithTime } from '@/lib/eventDateTime';

export interface CalendarExportEventRow {
  id: string;
  title: string;
  type?: string;
  status?: string;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  venue?: string | null;
  description?: string | null;
  department?: { name?: string; color?: string } | null;
  branch?: { name?: string } | null;
  color?: string | null;
  allDay?: boolean | null;
}

export interface CalendarReportOptions {
  title?: string;
  subtitle?: string;
  includeDescriptions?: boolean;
  includeVenues?: boolean;
}

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

export async function generateCalendarReport(
  events: CalendarExportEventRow[],
  options: CalendarReportOptions = {}
): Promise<void> {
  const {
    title = 'Church calendar',
    subtitle,
    includeDescriptions = true,
    includeVenues = true,
  } = options;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 18;

  try {
    const logoDataUrl = await loadImageAsBase64('/kipra-logo-report.png');
    doc.addImage(logoDataUrl, 'PNG', margin, 8, 28, 28);
    y = 40;
  } catch {
    y = 18;
  }

  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  if (subtitle) {
    doc.text(subtitle, margin, y);
    y += 6;
  }
  doc.text(`Generated ${format(new Date(), 'PPpp')}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 10;

  const rows = events.map((e) => {
    const startWhen = mergeLocalDateFromIsoWithTime(e.startDate, e.allDay ? null : e.startTime ?? null);
    const when = e.allDay
      ? format(startWhen, 'PPP')
      : `${format(startWhen, 'PPp')}${e.endTime ? ` – ${e.endTime}` : ''}`;
    const place =
      includeVenues && (e.venue || e.location)
        ? [e.venue, e.location].filter(Boolean).join(' · ')
        : e.location || '';
    const desc =
      includeDescriptions && e.description ? String(e.description).slice(0, 200) : '';
    return [
      e.title,
      e.type || '',
      when,
      e.department?.name || '',
      place,
      desc,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Title', 'Type', 'When', 'Department', 'Location / venue', 'Description']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      const footerY = doc.internal.pageSize.getHeight() - 8;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Page ${data.pageNumber}`, pageWidth / 2, footerY, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    },
  });

  doc.save(`calendar-export-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function downloadCalendarIcs(events: CalendarExportEventRow[], calendarName = 'Church Calendar'): void {
  const escape = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//KIPRA//${escape(calendarName)}//EN`, 'CALSCALE:GREGORIAN'];

  for (const e of events) {
    const uid = `${e.id}@kipra`;
    const dtStamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
    const start = mergeLocalDateFromIsoWithTime(e.startDate, e.startTime ?? null);
    const startStr = format(start, "yyyyMMdd'T'HHmmss'Z'");
    const end = e.endDate
      ? mergeLocalDateFromIsoWithTime(e.endDate, e.endTime ?? null)
      : e.endTime
        ? mergeLocalDateFromIsoWithTime(e.startDate, e.endTime)
        : start;
    const endStr = format(end, "yyyyMMdd'T'HHmmss'Z'");
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${escape(e.title)}`,
      e.location ? `LOCATION:${escape(e.location)}` : '',
      e.description ? `DESCRIPTION:${escape(String(e.description).slice(0, 1000))}` : '',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.filter(Boolean).join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCalendarExcel(events: CalendarExportEventRow[]): void {
  const data = events.map((e) => ({
    Title: e.title,
    Type: e.type ?? '',
    Status: e.status ?? '',
    Start: format(mergeLocalDateFromIsoWithTime(e.startDate, e.startTime ?? null), 'yyyy-MM-dd HH:mm'),
    End: e.endDate
      ? format(mergeLocalDateFromIsoWithTime(e.endDate, e.endTime ?? null), 'yyyy-MM-dd HH:mm')
      : e.endTime
        ? format(mergeLocalDateFromIsoWithTime(e.startDate, e.endTime), 'yyyy-MM-dd HH:mm')
        : '',
    'Start time': e.startTime ?? '',
    'End time': e.endTime ?? '',
    Location: e.location ?? '',
    Venue: e.venue ?? '',
    Department: e.department?.name ?? '',
    Branch: e.branch?.name ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Events');
  XLSX.writeFile(wb, `calendar-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
