import { useQuery } from '@tanstack/react-query';
import type { Data } from '@/backend/arduino';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

export function App() {
	const { setTheme, theme } = useTheme();
	const { isPending, error, data } = useQuery({
		queryKey: ['arduino-data'],
		queryFn: () => fetch('http://localhost:3000/api/arduino-data').then((res) => res.json()) as Promise<Data[]>,
		// Retrieve the Arduino data every 5 seconds.
		refetchInterval: 5 * 1000,
	});

	if (isPending) return 'Loading...';

	if (error) return 'An error has occurred: ' + error.message;

	const chartConfig = {
		rain: {
			label: 'Rain',
			color: 'var(--chart-1)',
		},
		humidity: {
			label: 'Humidity',
			color: 'var(--chart-2)',
		},
	} satisfies ChartConfig;

	return (
		<div className="flex flex-col">
			<div className="text-center">
				<Button variant="default" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
					Toggle Theme
				</Button>
			</div>
			<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
				<AreaChart accessibilityLayer data={data}>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="logDate"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tickFormatter={(value) =>
							new Date(value).toLocaleDateString('en-GB', {
								month: 'short',
								day: 'numeric',
							})
						}
					/>
					<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
					<ChartLegend content={<ChartLegendContent />} />
					<Area
						dataKey="rain"
						type="natural"
						fill="var(--color-rain)"
						fillOpacity={0.4}
						stroke="var(--color-rain)"
						stackId="a"
					/>
					<Area
						dataKey="humidity"
						type="natural"
						fill="var(--color-humidity)"
						fillOpacity={0.4}
						stroke="var(--color-humidity)"
						stackId="a"
					/>
				</AreaChart>
			</ChartContainer>
		</div>
	);
}

export default App;
