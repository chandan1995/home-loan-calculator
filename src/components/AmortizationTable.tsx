import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download, Search } from 'lucide-react';
import { MonthlyPayment } from '../types/loan';
import { formatCurrency, formatNumber } from '../utils/loanCalculations';

interface AmortizationTableProps {
  schedule: MonthlyPayment[];
  title: string;
  emi: number;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule, title, emi }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchMonth, setSearchMonth] = useState('');
  const rowsPerPage = 12;

  const filteredSchedule = useMemo(() => {
    if (!searchMonth) return schedule;
    const month = parseInt(searchMonth);
    return schedule.filter((p) => p.month === month);
  }, [schedule, searchMonth]);

  const totalPages = Math.ceil(filteredSchedule.length / rowsPerPage);
  const displayedRows = filteredSchedule.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const exportCSV = () => {
    const headers = ['Month', 'Opening Balance', 'EMI', 'Principal', 'Interest', 'Prepayment', 'Closing Balance', 'Total Interest'];
    const rows = schedule.map((p) => [
      p.month,
      Math.round(p.openingBalance),
      Math.round(p.emi),
      Math.round(p.principalPaid),
      Math.round(p.interestPaid),
      Math.round(p.prepayment),
      Math.round(p.closingBalance),
      Math.round(p.totalInterestPaid),
    ]);
    
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s/g, '_')}_schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
            {schedule.length} months
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">EMI: {formatCurrency(emi)}</span>
          {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-700/50">
          {/* Table Controls */}
          <div className="flex items-center justify-between p-3 bg-slate-800/30">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  placeholder="Go to month..."
                  value={searchMonth}
                  onChange={(e) => {
                    setSearchMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg py-1.5 pl-8 pr-3 text-sm text-white w-36
                    focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                exportCSV();
              }}
              className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-emerald-400 
                bg-slate-700/50 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/60">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Month</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Opening</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">EMI</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Principal</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Interest</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-400 uppercase tracking-wider">Prepay</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Closing</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Int.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {displayedRows.map((row) => (
                  <tr
                    key={row.month}
                    className={`${row.prepayment > 0 ? 'bg-emerald-900/10' : ''} hover:bg-slate-800/40 transition-colors`}
                  >
                    <td className="px-3 py-2 text-slate-300 font-medium">{row.month}</td>
                    <td className="px-3 py-2 text-right text-slate-300">{formatNumber(row.openingBalance)}</td>
                    <td className="px-3 py-2 text-right text-white">{formatNumber(row.emi)}</td>
                    <td className="px-3 py-2 text-right text-blue-400">{formatNumber(row.principalPaid)}</td>
                    <td className="px-3 py-2 text-right text-orange-400">{formatNumber(row.interestPaid)}</td>
                    <td className="px-3 py-2 text-right text-emerald-400 font-medium">
                      {row.prepayment > 0 ? formatNumber(row.prepayment) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300">{formatNumber(row.closingBalance)}</td>
                    <td className="px-3 py-2 text-right text-slate-400">{formatNumber(row.totalInterestPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 bg-slate-800/30 border-t border-slate-700/50">
              <span className="text-xs text-slate-400">
                Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredSchedule.length)} of {filteredSchedule.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 text-sm rounded ${
                        currentPage === page
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
