// Chart colors resolve from the CSS tokens in index.css, so every chart follows
// light/dark mode with no re-render logic. The series hues are the dataviz
// reference palette (blue / orange), validated for CVD separation and ≥ 3:1
// contrast against the card surface in both modes. Series colors follow the
// entity, never the rank: generated picks are always blue, real draws orange,
// and the uniform/theoretical baseline a neutral gray reference.
export const SLOT = {
  first: "var(--chart-1)",
  second: "var(--chart-2)",
};

export const SERIES = {
  generated: SLOT.first,
  historical: SLOT.second,
  baseline: "var(--chart-reference)",
};

export const CHART_INK = {
  tick: { fill: "var(--chart-axis)", fontSize: 11 },
  axisLine: { stroke: "var(--chart-grid)" },
  grid: "var(--chart-grid)",
  reference: "var(--chart-axis)",
};

export const CHART_MARGIN = { top: 12, right: 12, bottom: 0, left: -8 };

export const BAR_RADIUS = [4, 4, 0, 0];

export const cursorStyle = { fill: "hsl(var(--muted))", opacity: 0.6 };

export const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
};

// Tooltip and legend text wear text tokens, never the series color.
export const tooltipItemStyle = { color: "hsl(var(--popover-foreground))" };

export const legendStyle = { fontSize: 12 };

export const legendFormatter = (value) => (
  <span style={{ color: "hsl(var(--muted-foreground))" }}>{value}</span>
);
