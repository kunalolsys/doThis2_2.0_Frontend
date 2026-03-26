import * as React from "react"
import { Dot, TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card"
import {
    //   ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "../ui/chart"

export const description = "A donut chart with text"

const chartData = [
    { browser: "Overdue tasks ", visitors: 3, fill: "var(--color-chrome)" },
    { browser: "Pending tasks ", visitors: 12, fill: "var(--color-safari)" },
    { browser: "Completed tasks", visitors: 45, fill: "var(--color-firefox)" },
    //   { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    //   { browser: "other", visitors: 190, fill: "var(--color-other)" },
]

const chartConfig = {
    visitors: {
        label: "Visitors",
    },
    chrome: {
        label: "Overdue Tasks",
        color: "red",
    },
    safari: {
        label: "Pendings Tasks",
        color: "orange",
    },
    firefox: {
        label: "Completed Tasks",
        color: "green",
    },
}

export function ChartPieDonutText() {
    const totalVisitors = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.visitors, 0)
    }, [])

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-md font-semibold">My Task Status</CardTitle>
            </CardHeader>
            <CardContent className="pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[200px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="visitors"
                            nameKey="browser"
                            innerRadius={55}
                            strokeWidth={2}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {totalVisitors.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground text-lg font-bold"
                                                >
                                                    Total Tasks
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between w-full py-1 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="font-semibold text-green-600">Completed</span>
                    </div>
                    <span className="font-bold text-green-700">45</span>
                </div>
                <div className="flex items-center justify-between w-full py-1 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        <span className="font-semibold text-orange-600">Pending</span>
                    </div>
                    <span className="font-bold text-orange-700">12</span>
                </div>
                <div className="flex items-center justify-between w-full py-1">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        <span className="font-semibold text-red-600">Overdue</span>
                    </div>
                    <span className="font-bold text-red-700">3</span>
                </div>
            </CardFooter>
        </Card>
    )
}
