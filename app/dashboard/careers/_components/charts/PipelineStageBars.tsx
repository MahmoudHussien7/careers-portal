"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/Components/ui";
import type { HrApplication } from "@/types/careers";
import { tallyApplications } from "../pipeline";

interface Props {
  applications: HrApplication[];
}

const config: ChartConfig = {
  passed: { label: "Passed", color: "var(--color-chart-2)" },
  shortlisted: { label: "Shortlisted", color: "var(--color-chart-4)" },
  rejected: { label: "Rejected", color: "var(--color-chart-5)" },
  accepted: { label: "Accepted", color: "var(--color-chart-1)" },
  pending: { label: "In review", color: "var(--color-chart-3)" },
};

export function PipelineStageBars({ applications }: Props) {
  const data = useMemo(() => tallyApplications(applications), [applications]);
  const hasData = data.some((stage) => stage.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidates by stage</CardTitle>
        <CardDescription>
          How many candidates sit at each phase of the funnel.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        {!hasData ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            No candidate data yet
          </div>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="passed" stackId="a" fill="var(--color-chart-2)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="shortlisted" stackId="a" fill="var(--color-chart-4)" />
              <Bar dataKey="accepted" stackId="a" fill="var(--color-chart-1)" />
              <Bar dataKey="pending" stackId="a" fill="var(--color-chart-3)" />
              <Bar dataKey="rejected" stackId="a" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
