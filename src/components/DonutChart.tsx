/* eslint-disable @typescript-eslint/no-unused-vars */

interface DonutChartProps {
  principal: number;
  interest: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ principal, interest, size = 160 }) => {
  const total = principal + interest;
  const principalPercent = total > 0 ? (principal / total) * 100 : 0;
  const interestPercent = total > 0 ? (interest / total) * 100 : 0;
  
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const principalStroke = (principalPercent / 100) * circumference;
  const interestStroke = (interestPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 160 160">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="24"
        />
        {/* Principal arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="24"
          strokeDasharray={`${principalStroke} ${circumference}`}
          strokeDashoffset="0"
          transform="rotate(-90 80 80)"
          className="transition-all duration-1000"
        />
        {/* Interest arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#f97316"
          strokeWidth="24"
          strokeDasharray={`${interestStroke} ${circumference}`}
          strokeDashoffset={-principalStroke}
          transform="rotate(-90 80 80)"
          className="transition-all duration-1000"
        />
        {/* Center text */}
        <text x="80" y="74" textAnchor="middle" className="fill-white text-lg font-bold">
          {Math.round(principalPercent)}%
        </text>
        <text x="80" y="92" textAnchor="middle" className="fill-slate-400 text-[10px]">
          Principal
        </text>
      </svg>
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-300">Principal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-slate-300">Interest</span>
        </div>
      </div>
    </div>
  );
};
