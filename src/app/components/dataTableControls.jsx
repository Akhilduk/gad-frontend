'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-500 dark:text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-10 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
      />
    </div>
  );
}

export function ExportButtons({ onCSV, onPDF, onExcel }) {
  return (
    <div className="flex justify-end gap-1">
      <button onClick={onCSV} className="bg-cyan-300 text-cyan-900 px-3 py-1 hover:bg-cyan-400 rounded hover:text-cyan-900 text-sm">
        CSV
      </button>
      <button onClick={onPDF} className="bg-cyan-300 text-cyan-900 px-3 py-1 hover:bg-cyan-400 rounded hover:text-cyan-900 text-sm">
        PDF
      </button>
      <button onClick={onExcel} className="bg-cyan-300 text-cyan-900 px-3 py-1 hover:bg-cyan-400 rounded hover:text-cyan-900 text-sm">
        Excel
      </button>
    </div>
  );
}

// CSV Export - supports both patterns
export function exportToCSV(filename, data, rows) {
  let headers, actualData;
  
  // Pattern detection
  if (Array.isArray(data) && rows === undefined) {
    // New pattern: exportToCSV(filename, dataArray)
    actualData = data;
    headers = data.length > 0 ? Object.keys(data[0]) : [];
  } else if (Array.isArray(data) && Array.isArray(rows)) {
    // Old pattern: exportToCSV(filename, headersArray, rowsArray)
    headers = data;
    actualData = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } else {
    console.error('Invalid parameters for CSV export');
    return;
  }

  if (!Array.isArray(actualData) || actualData.length === 0) {
    console.error('No data to export to CSV');
    alert('No data available to export');
    return;
  }

  try {
    const csvHeaders = headers.join(',');
    const csvRows = actualData.map(row => 
      headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    alert('Error exporting to CSV');
  }
}

// PDF Export - supports both patterns
export function exportToPDF(title, data, rows, filename) {
  let headers, actualData, actualFilename;
  
  // Pattern detection
  if (Array.isArray(data) && rows === undefined) {
    // New pattern: exportToPDF(title, dataArray)
    console.error('PDF export requires filename parameter');
    return;
  } else if (Array.isArray(data) && typeof rows === 'string') {
    // New pattern: exportToPDF(title, dataArray, filename)
    actualData = data;
    headers = data.length > 0 ? Object.keys(data[0]) : [];
    actualFilename = rows;
  } else if (Array.isArray(data) && Array.isArray(rows) && typeof filename === 'string') {
    // Old pattern: exportToPDF(title, headersArray, rowsArray, filename)
    headers = data;
    actualData = rows;
    actualFilename = filename;
  } else {
    console.error('Invalid parameters for PDF export');
    return;
  }

  if (!Array.isArray(actualData) || actualData.length === 0) {
    console.error('No data to export to PDF');
    alert('No data available to export');
    return;
  }

  try {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Prepare table data
    const tableData = actualData.map(row => {
      if (Array.isArray(row)) {
        // Old pattern: row is already an array
        return row.map(cell => String(cell || ''));
      } else {
        // New pattern: row is an object, extract values in header order
        return headers.map(header => String(row[header] || ''));
      }
    });
    
    autoTable(doc, {
      startY: 25,
      head: [headers],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(actualFilename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('Error exporting to PDF');
  }
}

// Excel Export - unchanged (already works with new pattern)
export function exportToExcel(sheetName, data, filename) {
  if (!Array.isArray(data) || data.length === 0) {
    console.error('No data to export to Excel');
    alert('No data available to export');
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Error exporting to Excel');
  }
}

export function PaginationControls({ currentPage, totalPages, onPrevious, onNext }) {
  return (
    <div className="flex justify-between items-center mt-4 px-4">
      <span className="text-sm text-gray-700 dark:text-white">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="inline-flex items-center rounded border border-gray-300 bg-gray-300 hover:bg-gray-200 px-2 py-1 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="inline-flex items-center rounded border border-gray-300 bg-gray-300 hover:bg-gray-200 px-2 py-1 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}