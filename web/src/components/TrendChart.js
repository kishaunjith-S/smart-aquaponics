'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';

// Format a UTC ISO timestamp into IST short form for axis ticks.
function formatTick(ts, range) {
  const d = new Date(ts);
  const opts = { timeZone: 'Asia/Kolkata' };
  if (range === '1h' || range === '24h') {
    return d.toLocaleTimeString('en-IN', {
      ...opts,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  return d.toLocaleDateString('en-IN', {
    ...opts,
    month: 'short',
    day: '2-digit',
  });
}

// Long form for tooltip.
function formatTooltipTime(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) + ' IST';
}

export default function TrendChart({
  title,
  dataKey,
  unit,
  color,
  idealMin,
  idealMax,
  data,
  range,
}) {
  // True only if at least one non-null value exists for this parameter.
  const hasData =
    data && data.some((p) => p[dataKey] !== null && p[dataKey] !== undefined);

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{unit}</span>
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
        Ideal: {idealMin}–{idealMax}{unit ? ` ${unit}` : ''}
      </p>

      {!hasData ? (
        <div className="flex items-center justify-center h-40 text-sm text-[hsl(var(--muted-foreground))]">
          No data in this range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 8, left: -10, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="ts"
              tickFormatter={(ts) => formatTick(ts, range)}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              minTickGap={30}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              domain={['auto', 'auto']}
            />
            <ReferenceArea
              y1={idealMin}
              y2={idealMax}
              fill="rgb(16, 185, 129)"
              fillOpacity={0.08}
              stroke="none"
              ifOverflow="extendDomain"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelFormatter={formatTooltipTime}
              formatter={(value) => [
                value !== null && value !== undefined ? Number(value).toFixed(2) : '—',
                title,
              ]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}