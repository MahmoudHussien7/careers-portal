"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/Components/ui";
import type { HrDirectoryUser } from "@/types/careers";
import { HR_ROLE_OPTIONS } from "@/types/careers";

interface Props {
  hrUsers: HrDirectoryUser[];
}

const config: ChartConfig = {
  count: { label: "Users", color: "var(--color-chart-1)" },
};

const CHART_HEIGHT = 220;
const Y_AXIS_WIDTH = 116;

export function UsersByRoleBars({ hrUsers }: Props) {
  const data = useMemo(() => {
    const counts = new Map<string, number>(
      HR_ROLE_OPTIONS.map((role) => [role.slug, 0]),
    );
    for (const user of hrUsers) {
      counts.set(user.role_slug, (counts.get(user.role_slug) ?? 0) + 1);
    }
    return HR_ROLE_OPTIONS.map((role) => ({
      slug: role.slug,
      label: role.label,
      count: counts.get(role.slug) ?? 0,
    }));
  }, [hrUsers]);

  const totalUsers = useMemo(
    () => data.reduce((sum, row) => sum + row.count, 0),
    [data],
  );

  const hasData = totalUsers > 0;
  const maxCount = Math.max(...data.map((row) => row.count), 1);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle>HR users by role</CardTitle>
        <CardDescription>
          Team size across each role in the hierarchy.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pb-6">
        {!hasData ? (
          <div
            className="flex flex-1 items-center justify-center text-sm text-muted-foreground"
            style={{ minHeight: CHART_HEIGHT }}
          >
            No HR users yet
          </div>
        ) : (
          <>
            <p className="mb-3 text-center text-2xl font-semibold tabular-nums text-foreground">
              {totalUsers}
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                total
              </span>
            </p>

            <ChartContainer
              config={config}
              className="aspect-auto w-full"
              style={{ height: CHART_HEIGHT }}
            >
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 4, right: 28, left: 4, bottom: 4 }}
                barCategoryGap="20%"
                barSize={22}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  domain={[0, maxCount]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={Y_AXIS_WIDTH}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12, textAnchor: "end" }}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--color-muted-background)", opacity: 0.6 }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-chart-1)"
                  radius={[0, 4, 4, 0]}
                  minPointSize={4}
                >
                  <LabelList
                    dataKey="count"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>

            <dl className="mt-4 grid grid-cols-1 gap-2 border-t border-border-color pt-4">
              {data.map((row) => {
                const share =
                  totalUsers > 0
                    ? Math.round((row.count / totalUsers) * 100)
                    : 0;
                return (
                  <div
                    key={row.slug}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <dt className="min-w-0 truncate text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="flex shrink-0 items-baseline gap-2 tabular-nums">
                      <span className="font-semibold text-foreground">
                        {row.count}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {share}%
                      </span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}
