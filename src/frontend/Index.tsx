import { useQuery } from '@tanstack/react-query';
import type { Data } from '@/backend/arduino';
import RainIcon from './icons/rain.svg';
import CloudIcon from './icons/cloudy.svg';
import WindIcon from './icons/windy.svg';
import SunIcon from './icons/sunny.svg';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import type { PropsWithChildren } from 'react';

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

	const tempCurrent = data[data.length - 1].temperature;
	let tempDistant = 0;

	if (data.length < 5) {
		tempDistant = data[0].temperature;
	} else {
		tempDistant = data[data.length - 5].temperature;
	}

	const tempChange = tempCurrent - tempDistant;

	const chartConfig = {
		rain: {
			label: 'Rain',
			color: 'var(--chart-1)',
		},
		humidity: {
			label: 'Humidity',
			color: 'var(--chart-2)',
		},
		gas: {
			label: 'Harmful Gases',
			color: 'var(--chart-3)',
		},
		temperature: {
			label: 'Temperature',
			color: 'var(--chart-4)',
		},
	} satisfies ChartConfig;

	function ChartInformation({ children }: PropsWithChildren) {
		return (
			<ChartContainer config={chartConfig} className="size-64">
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
					{children}
				</AreaChart>
			</ChartContainer>
		);
	}

	return (
		<main className="absolute top-0 left-0 min-h-screen min-w-screen overflow-hidden">
			{/* header div */}
			<nav className="top-0 h-13 min-w-screen bg-green-600">
				<div className="relative text-center">
					<Button variant="default" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
						Toggle Theme
					</Button>
				</div>
			</nav>

			{/* current information div */}
			<Card className="w-[60vw] border-[2px] border-solid border-[#202020]">
				<CardHeader>
					<CardTitle>Väderprognos</CardTitle>
					<CardDescription>Card Description</CardDescription>
				</CardHeader>
				<CardContent>
					<img src={RainIcon} height="200" width="200" className="text-sky-600" />
					<p>Current temperature is {data.at(-1).temperature} °C</p>
					<p>Temperature has gone down by {tempChange} °C (since INSERT-TIME-CHANGE ago)</p>
				</CardContent>
				<CardFooter>
					<p>Card Footer</p>
				</CardFooter>
			</Card>

			{/* graphical div */}
			<div className="flex w-screen flex-col items-center">
				<div className="flex h-72 w-2/3 place-content-between">
					{/* for rain and humidity */}
					<ChartInformation>
						<Area
							dataKey="rain"
							type="linear"
							fill="var(--color-rain)"
							fillOpacity={0.4}
							stroke="var(--color-rain)"
							stackId="a"
						/>
						<Area
							dataKey="humidity"
							type="linear"
							fill="var(--color-humidity)"
							fillOpacity={0.4}
							stroke="var(--color-humidity)"
							stackId="a"
						/>
					</ChartInformation>

					{/* for temperature */}
					<ChartInformation>
						<Area
							dataKey="temperature"
							type="linear"
							fill="var(--color-temperature)"
							fillOpacity={0.4}
							stroke="var(--color-temperature)"
							stackId="a"
						/>
					</ChartInformation>
				</div>
				<div className="flex h-72 w-2/3 place-content-between">
					{/* for gas and wind velocity */}
					<ChartInformation>
						<Area
							dataKey="gas"
							type="linear"
							fill="var(--color-gas)"
							fillOpacity={0.4}
							stroke="var(--color-gas)"
							stackId="a"
						/>
						<Area
							dataKey="humidity"
							type="linear"
							fill="var(--color-humidity)"
							fillOpacity={0.4}
							stroke="var(--color-humidity)"
							stackId="a"
						/>
					</ChartInformation>

					{/* for solar voltage */}
					<ChartInformation>
						<Area
							dataKey="temperature"
							type="linear"
							fill="var(--color-temperature)"
							fillOpacity={0.4}
							stroke="var(--color-temperature)"
							stackId="a"
						/>
					</ChartInformation>
				</div>
			</div>
		</main>
	);
}

export default App;
