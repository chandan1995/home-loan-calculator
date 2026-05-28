/* eslint-disable @typescript-eslint/no-unused-vars */

interface ComparisonBarProps {
  label: string;
  originalValue: number;
  modifiedValue: number;
  format: (val: number) => string;
  color?: string;
}

export const ComparisonBar: React.FC<ComparisonBarProps> = ({
  label,
  originalValue,
  modifiedValue,
  format,
  color = 'emerald',
}) => {
  const maxValue = Math.max(originalValue, modifiedValue);
  const originalWidth = maxValue > 0 ? (originalValue / maxValue) * 100 : 0;
  const modifiedWidth = maxValue > 0 ? (modifiedValue / maxValue) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={`text-sm font-semibold ${modifiedValue < originalValue ? 'text-emerald-400' : 'text-orange-400'}`}>
          {modifiedValue < originalValue ? '↓' : '↑'} {format(Math.abs(originalValue - modifiedValue))}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-16">Original</span>
          <div className="flex-1 bg-slate-800 rounded-full h-5 overflow-hidden">
            <div
              className="h-full bg-slate-500 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
              style={{ width: `${originalWidth}%` }}
            >
              <span className="text-[10px] text-white font-medium">{format(originalValue)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-16">Modified</span>
          <div className="flex-1 bg-slate-800 rounded-full h-5 overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
              style={{ width: `${modifiedWidth}%` }}
            >
              <span className="text-[10px] text-white font-medium">{format(modifiedValue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
