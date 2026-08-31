"use client";

import { useMemo } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/Components/ui";
import type { HrApplication } from "@/types/careers";
import { tallyByOutcome } from "../pipeline";

interface Props {
  applications: HrApplication[];
}

const baseConfig: ChartConfig = {
  accepted: { label: "Accepted", color: "var(--color-chart-1)" },
  passed: { label: "Passed", color: "var(--color-chart-2)" },
  shortlisted: { label: "Shortlisted", color: "var(--color-chart-4)" },
  rejected: { label: "Rejected", color: "var(--color-chart-5)" },
  neutral: { label: "In review", color: "var(--color-chart-3)" },
};

const PIE_HEIGHT = 200;

export function CandidateOutcomePie({ applications }: Props) {
  const slices = useMemo(() => tallyByOutcome(applications), [applications]);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Candidates by outcome</CardTitle>
        <CardDescription>
          Distribution of the current pipeline state across all visible
          applications.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pb-6">
        {total === 0 ? (
          <EmptyChart />
        ) : (
          <>
            <ChartContainer
              config={baseConfig}
              className="mx-auto aspect-auto w-full max-w-[260px]"
              style={{ height: PIE_HEIGHT }}
            >
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent nameKey="outcome" hideLabel />}
                />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="outcome"
                  cx="50%"
                  cy="50%"
                  innerRadius="52%"
                  outerRadius="78%"
                  strokeWidth={2}
                  paddingAngle={1}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.outcome} fill={slice.color} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                        return null;
                      }
                      const { cx, cy } = viewBox;
                      return (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={cx}
                            y={cy}
                            className="fill-foreground text-2xl font-semibold"
                          >
                            {total}
                          </tspan>
                          <tspan
                            x={cx}
                            y={(cy ?? 0) + 18}
                            className="fill-muted-foreground text-xs"
                          >
                            candidates
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <ul
              className="mt-4 flex flex-col gap-2 border-t border-border-color pt-4"
              aria-label="Outcome legend"
            >
              {slices.map((slice) => {
                const share = Math.round((slice.value / total) * 100);
                return (
                  <li
                    key={slice.outcome}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: slice.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 whitespace-nowrap text-muted-foreground">
                      {slice.label}
                    </span>
                    <span className="shrink-0 tabular-nums font-semibold text-foreground">
                      {slice.value}
                    </span>
                    <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {share}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div
      className="flex flex-1 items-center justify-center text-sm text-muted-foreground"
      style={{ minHeight: PIE_HEIGHT + 80 }}
    >
      No candidate data yet
    </div>
  );
}
