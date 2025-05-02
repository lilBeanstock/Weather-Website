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

export function App() {
	const { isPending, error, data } = useQuery({
		queryKey: ['arduino-data'],
		queryFn: () => fetch('http://localhost:3000/api/arduino-data').then((res) => res.json()) as Promise<Data[]>,
		refetchInterval: 5 * 1000,
	});

	if (isPending) return 'Loading...';

	if (error) return 'An error has occurred: ' + error.message;

	const chartConfig = {
		rain: {
			label: 'Rain',
			color: '#2563eb',
		},
		humidity: {
			label: 'Humidity',
			color: '#60a5fa',
		},
	} satisfies ChartConfig;

	return (
		<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
			<AreaChart accessibilityLayer data={data}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="secondsPassed"
					tickLine={false}
					tickMargin={10}
					axisLine={false}
					tickFormatter={(value) => value}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<ChartLegend content={<ChartLegendContent />} />
				<Area dataKey="rain" fill="var(--color-rain)" radius={4} />
			</AreaChart>
		</ChartContainer>
	);
}

export default App;
