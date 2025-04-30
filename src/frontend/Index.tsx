// import { Button } from './components/ui/button';
// import { useQuery } from '@tanstack/react-query';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';

export function App() {
	// const { isPending, error, data } = useQuery({
	// 	queryKey: ['arduino-data'],
	// 	queryFn: () => fetch('http://localhost:3000/api/arduino-data').then((res) => res.json())
	// });

	// if (isPending) return 'Loading...';

	// if (error) return 'An error has occurred: ' + error.message;

	const chartData = [
		{ month: 'January', desktop: 186, mobile: 80 },
		{ month: 'February', desktop: 305, mobile: 200 },
		{ month: 'March', desktop: 237, mobile: 120 },
		{ month: 'April', desktop: 73, mobile: 190 },
		{ month: 'May', desktop: 209, mobile: 130 },
		{ month: 'June', desktop: 214, mobile: 140 },
	];

	const chartConfig = {
		desktop: {
			label: 'Desktop',
			color: '#2563eb',
		},
		mobile: {
			label: 'Mobile',
			color: '#60a5fa',
		},
	} satisfies ChartConfig;

	return (
		<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
			<BarChart accessibilityLayer data={chartData}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="month"
					tickLine={false}
					tickMargin={10}
					axisLine={false}
					tickFormatter={(value) => value.slice(0, 3)}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<ChartLegend content={<ChartLegendContent />} />
				<Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
				<Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
			</BarChart>
		</ChartContainer>
	);
}

export default App;
