"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Bar,
  Cell,
  ComposedChart,
  CartesianGrid,
  Pie,
  PieChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAmount } from "@/lib/format";

export type MonthlyTrendPoint = {
  balance: number;
  date: string;
  income: number;
  expense: number;
};

export type ExpenseCategoryPoint = {
  color: string;
  name: string;
  value: number;
};

export function MonthlyTrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <MeasuredChart>
      {({ height, width }) => (
      <ComposedChart
        data={data}
        height={height}
        margin={{ bottom: 8, left: 0, right: 12, top: 8 }}
        width={width}
      >
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 8" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="date"
          interval="preserveStartEnd"
          minTickGap={20}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickFormatter={formatAxisValue}
          tickLine={false}
          tickMargin={8}
          width={44}
          yAxisId="amount"
        />
        <YAxis
          axisLine={false}
          orientation="right"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickFormatter={formatAxisValue}
          tickLine={false}
          tickMargin={8}
          width={52}
          yAxisId="balance"
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
          }}
          formatter={(value, name) => [
            new Intl.NumberFormat("zh-TW", {
              maximumFractionDigits: 0,
            }).format(Number(value)),
            name,
          ]}
        />
        <Bar
          barSize={5}
          dataKey="income"
          fill="var(--income)"
          name="收入"
          yAxisId="amount"
        />
        <Bar
          barSize={5}
          dataKey="expense"
          fill="var(--expense)"
          name="支出"
          yAxisId="amount"
        />
        <Line
          dataKey="balance"
          dot={false}
          name="餘額"
          stroke="var(--primary)"
          strokeWidth={2}
          type="monotone"
          yAxisId="balance"
        />
      </ComposedChart>
      )}
    </MeasuredChart>
  );
}

export function ExpenseCategoryPieChart({
  centerLabel,
  data,
  totalValue,
}: {
  centerLabel: string;
  data: ExpenseCategoryPoint[];
  totalValue: number;
}) {
  const hasData =
    totalValue > 0 && data.some((entry) => Number(entry.value) > 0);

  if (!hasData) {
    return (
      <div className="flex h-full min-h-48 items-center justify-center text-caption text-muted-foreground">
        尚無支出分類資料
      </div>
    );
  }

  return (
    <MeasuredChart>
      {({ height, width }) => (
      <PieChart
        height={height}
        margin={{ bottom: 12, left: 24, right: 24, top: 12 }}
        width={width}
      >
        <Pie
          cx="50%"
          cy="50%"
          data={data}
          dataKey="value"
          innerRadius="34%"
          label={renderPieLabel}
          labelLine={false}
          nameKey="name"
          outerRadius="72%"
          paddingAngle={1}
        >
          {data.map((entry) => (
            <Cell fill={entry.color} key={entry.name} stroke="var(--card)" strokeWidth={2} />
          ))}
        </Pie>
        <text
          dominantBaseline="middle"
          fill="var(--foreground)"
          className="text-[clamp(1.25rem,5cqw,1.875rem)]"
          fontWeight={500}
          textAnchor="middle"
          x="50%"
          y="50%"
        >
          {centerLabel}
        </text>
        <Tooltip
          content={(props) => (
            <ExpenseCategoryTooltip {...props} totalValue={totalValue} />
          )}
        />
      </PieChart>
      )}
    </MeasuredChart>
  );
}

function MeasuredChart({
  children,
}: {
  children: (size: { height: number; width: number }) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ height: number; width: number } | null>(
    null,
  );

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width > 0 && height > 0) {
        setSize((current) =>
          current?.width === width && current.height === height
            ? current
            : { height, width },
        );
      }
    };
    const resizeObserver = new ResizeObserver(updateSize);

    updateSize();
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="h-full min-h-full min-w-0">
      {size ? children(size) : null}
    </div>
  );
}

type ExpenseCategoryTooltipProps = {
  active?: boolean;
  payload?: readonly {
    payload?: ExpenseCategoryPoint;
    value?: unknown;
  }[];
  totalValue: number;
};

function ExpenseCategoryTooltip({
  active,
  payload,
  totalValue,
}: ExpenseCategoryTooltipProps) {
  const entry = payload?.[0]?.payload;
  const value = Number(payload?.[0]?.value ?? entry?.value ?? 0);

  if (!active || !entry) {
    return null;
  }

  const percent = totalValue > 0 ? (value / totalValue) * 100 : 0;

  return (
    <div className="rounded-card border border-border bg-card px-3 py-2 text-card-foreground shadow-lg">
      <p className="text-label">{entry.name}</p>
      <p className="mt-1 text-caption text-muted-foreground">
        {formatAmount(value)} · {percent.toFixed(1)}%
      </p>
    </div>
  );
}

type PieLabelProps = {
  cx?: number;
  cy?: number;
  fill?: string;
  innerRadius?: number;
  midAngle?: number;
  name?: string;
  outerRadius?: number;
  percent?: number;
};

const RADIAN = Math.PI / 180;

function renderPieLabel({
  cx = 0,
  cy = 0,
  innerRadius = 0,
  midAngle = 0,
  name = "",
  outerRadius = 0,
  percent = 0,
}: PieLabelProps) {
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const showOuterLabel = outerRadius >= 78 && percent >= 0.035;
  const showInnerLabel = outerRadius >= 72 && percent >= 0.055;
  const nameFontSize = Math.max(10, Math.min(14, outerRadius * 0.13));
  const percentFontSize = Math.max(11, Math.min(16, outerRadius * 0.14));
  const nameRadius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const nameX = cx + nameRadius * cos;
  const nameY = cy + nameRadius * sin;
  const lineOffset = Math.max(10, Math.min(18, outerRadius * 0.16));
  const horizontalLine = Math.max(14, Math.min(22, outerRadius * 0.18));
  const lineStartX = cx + (outerRadius + 3) * cos;
  const lineStartY = cy + (outerRadius + 3) * sin;
  const lineEndX = cx + (outerRadius + lineOffset) * cos;
  const lineEndY = cy + (outerRadius + lineOffset) * sin;
  const textEndX = lineEndX + (cos >= 0 ? horizontalLine : -horizontalLine);
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      {showInnerLabel ? (
        <text
          dominantBaseline="middle"
          fill="var(--card)"
          fontSize={nameFontSize}
          fontWeight={700}
          textAnchor="middle"
          x={nameX}
          y={nameY}
        >
          {name}
        </text>
      ) : null}
      {showOuterLabel ? (
        <>
          <path
            d={`M${lineStartX},${lineStartY}L${lineEndX},${lineEndY}L${textEndX},${lineEndY}`}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth={1}
          />
          <text
            dominantBaseline="middle"
            fill="var(--foreground)"
            fontSize={percentFontSize}
            fontWeight={700}
            textAnchor={textAnchor}
            x={textEndX + (cos >= 0 ? 5 : -5)}
            y={lineEndY}
          >
            {`${(percent * 100).toFixed(1)}%`}
          </text>
        </>
      ) : null}
    </g>
  );
}

function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return `${value}`;
}
