import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  icon: LucideIcon;
  title: string;
  originalValue: string;
  modifiedValue: string;
  saved?: string;
  savedType?: 'positive' | 'negative';
  gradient: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  icon: Icon,
  title,
  originalValue,
  modifiedValue,
  saved,
  savedType = 'positive',
  gradient,
}) => {
  return (
    <div className={`relative overflow-hidden rounded-xl p-5 ${gradient} border border-white/5`}>
      <div className="absolute top-3 right-3 opacity-10">
        <Icon size={48} />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className="text-slate-300" />
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-xs text-slate-400">Original</span>
          <p className="text-lg font-bold text-white">{originalValue}</p>
        </div>
        <div>
          <span className="text-xs text-slate-400">With Prepayment</span>
          <p className="text-lg font-bold text-emerald-400">{modifiedValue}</p>
        </div>
        {saved && (
          <div className="pt-2 border-t border-white/10">
            <span className={`text-sm font-semibold ${savedType === 'positive' ? 'text-emerald-400' : 'text-orange-400'}`}>
              {savedType === 'positive' ? '↓' : '↑'} {saved}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
