interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: ChartData[];
  height?: number;
  formatValue?: (v: number) => string;
  horizontal?: boolean;
}

const DEFAULT_COLORS = ['#166534', '#22C55E', '#2563EB', '#F59E0B', '#DC2626', '#8B5CF6', '#0891B2', '#EA580C'];

export function BarChart({ data, height = 200, formatValue, horizontal }: BarChartProps) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  if (horizontal) {
    return (
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-28 truncate">{d.label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                style={{
                  width: `${(d.value / maxVal) * 100}%`,
                  backgroundColor: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                }}
              >
                <span className="text-xs text-white font-medium whitespace-nowrap">
                  {formatValue ? formatValue(d.value) : d.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatValue ? formatValue(d.value) : d.value}
          </span>
          <div className="w-full flex-1 flex items-end">
            <div
              className="w-full rounded-t-md transition-all duration-700 hover:opacity-80"
              style={{
                height: `${(d.value / maxVal) * 100}%`,
                backgroundColor: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                minHeight: '4px',
              }}
            />
          </div>
          <span className="text-xs text-slate-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export function LineChart({ data, height = 200, color = '#166534' }: LineChartProps) {
  if (data.length === 0) return null;
  const width = 600;
  const padding = 40;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value), 0);
  const range = maxVal - minVal || 1;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: padding + chartH - ((d.value - minVal) / range) * chartH,
  ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding + chartH} L ${points[0].x} ${padding + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line
          key={t}
          x1={padding} y1={padding + chartH * t}
          x2={width - padding} y2={padding + chartH * t}
          stroke="#f1f5f9" strokeWidth="1"
        />
      ))}
      <path d={areaD} fill="url(#lineGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="2" />
          <text x={p.x} y={height - 10} textAnchor="middle" className="text-[10px] fill-slate-400">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

interface DonutChartProps {
  data: ChartData[];
  size?: number;
  formatValue?: (v: number) => string;
}

export function DonutChart({ data, size = 180, formatValue }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = size / 2 - 10;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="-rotate-90">
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * circumference;
          const segment = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return segment;
        })}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 fill-slate-900 text-lg font-bold"
          style={{ transformOrigin: 'center' }}
        >
          {data.length}
        </text>
      </svg>
      <div className="space-y-1.5 flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
            />
            <span className="text-slate-600 flex-1">{d.label}</span>
            <span className="font-medium text-slate-900">
              {formatValue ? formatValue(d.value) : d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
