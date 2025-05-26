import type { PropsWithChildren } from 'react';
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from './ui/chart';
import { type Data } from '@/backend/arduino';
import { CartesianGrid, LineChart, XAxis, YAxis } from 'recharts';

// The colours can be found in /styles/globals.css.
const chartConfig = {
	rain: {
		label: 'Rain [%]',
		color: 'var(--chart-1)',
	},
	humidity: {
		label: 'Humidity [%]',
		color: 'var(--chart-2)',
	},
	gas: {
		label: 'Hazardous Gases [%]',
		color: 'var(--chart-3)',
	},
	temperature: {
		label: 'Temperature [°C]',
		color: 'var(--chart-4)',
	},
	solar: {
		label: 'Solar Power [V]',
		color: 'var(--chart-5)',
	},
	wind: {
		label: 'Wind [m/s]',
		color: 'var(--chart-2)',
	},
} satisfies ChartConfig;

// Reusable component to create a chart for a specified weather data point.
export default function ChartInformation({ children, data }: PropsWithChildren<{ data: Data[] }>) {
	return (
		<ChartContainer config={chartConfig} className="h-64 w-64 lg:w-96">
			<LineChart accessibilityLayer data={data}>
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
				<YAxis />
				<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
				<ChartLegend content={<ChartLegendContent />} />
				{children}
			</LineChart>
		</ChartContainer>
	);
}
