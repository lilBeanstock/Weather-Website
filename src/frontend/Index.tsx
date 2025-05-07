import { useQuery } from '@tanstack/react-query';
import type { Data } from '@/backend/arduino';
import RainIcon from './icons/rain.svg';
import CloudIcon from './icons/cloudy.svg';
import WindIcon from './icons/windy.svg';
import SunIcon from './icons/sunny.svg';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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

	// evaluate temperature and changes in temp
	const tempCurrent = data.at(-1)?.temperature ?? 21;
	let tempDistant = 0;

	if (data.length < 5) {
		tempDistant = data[0]?.temperature ?? 21;
	} else {
		tempDistant = data[data.length - 5].temperature;
	}

	const tempChange = tempCurrent - tempDistant;

	// evaluate if it's raining
	let isRaining = false;
	if (data.length > 0 && data.at(-1).rain > 300) {
		isRaining = true;
	}

	// evaluate if it's cloudy
	// let isCloudy = false;
	// if (data.length > 0 && !isRaining && data.at(-1).solar > 300) {
	// 	isCloudy = true;
	// }

	// evaluate if it's windy (no rain or clouds)
	// let isWindy = false
	// if (data.length > 0 && !isRaining && data.at(-1).wind > 400) {
	// 	isWindy = true
	// }

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
		solar: {
			label: 'Solar Power',
			color: 'var(--chart-5)',
		},
	} satisfies ChartConfig;

	function ChartInformation({ children }: PropsWithChildren) {
		return (
			<ChartContainer config={chartConfig} className="size-64">
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

	return (
		<main className="absolute top-0 left-0 flex min-h-screen min-w-screen flex-col items-center overflow-hidden">
			{/* header div */}
			<nav className="top-0 h-13 min-w-screen border-[2px] border-solid border-[#202020]">
				<div className="relative text-center">
					<Button variant="default" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
						Toggle Theme
					</Button>
				</div>
			</nav>

			{/* current information div */}
			<Card className="m-3 w-fit border-[2px] border-solid border-[#202020]">
				<CardHeader>
					<CardTitle className="text-center">Väderprognos</CardTitle>
					<CardDescription></CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col items-center text-center">
					<img
						src={RainIcon}
						height="200"
						width="200"
						className={(theme === 'dark' ? 'svgtowhite ' : '') + (isRaining ? 'block' : 'hidden')}
					/>
					{/* <img src={CloudIcon} height="200" width="200" className={'svgtowhite' + isCloudy ? 'block' : 'hidden'} /> */}
					{/* <img src={WindIcon} height="200" width="200" className={'svgtowhite' + isWindy ? 'block' : 'hidden'} /> */}
					<img
						src={SunIcon}
						height="200"
						width="200"
						className={(theme === 'dark' ? 'svgtowhite ' : '') + (isRaining ? 'hidden' : 'block')}
					/>
					<p className="m-2">Nuvarande temperatur är {data.at(-1)?.temperature ?? 'Unknown'} °C</p>
					<p className="m-2">
						Temperaturen har gått {tempChange < 0 ? 'ned' : 'upp'} med {Math.abs(tempChange)} °C <br />
						(INSERT-TIME-CHANGE sedan){' '}
						<span className="text-[#D0D080]">
							({tempDistant}-{tempCurrent} °C)
						</span>
					</p>
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
						<Line
							dataKey="rain"
							type="monotone"
							fill="var(--color-rain)"
							fillOpacity={0.4}
							stroke="var(--color-rain)"
							dot={false}
						/>
					</ChartInformation>

					{/* for temperature */}
					<ChartInformation>
						<Line
							dataKey="temperature"
							type="monotone"
							fill="var(--color-temperature)"
							fillOpacity={0.4}
							stroke="var(--color-temperature)"
							dot={false}
						/>
					</ChartInformation>
				</div>
				<div className="flex h-72 w-2/3 place-content-between">
					{/* for gas and wind velocity */}
					<ChartInformation>
						<Line
							dataKey="gas"
							type="monotone"
							fill="var(--color-gas)"
							fillOpacity={0.4}
							stroke="var(--color-gas)"
							dot={false}
						/>
						<Line
							dataKey="humidity"
							type="monotone"
							fill="var(--color-humidity)"
							fillOpacity={0.4}
							stroke="var(--color-humidity)"
							dot={false}
						/>
					</ChartInformation>
					{/* for solar voltage */}
					<ChartInformation>
						<Line
							dataKey="solar"
							type="monotone"
							fill="var(--color-solar)"
							fillOpacity={0.4}
							stroke="var(--color-solar)"
							dot={false}
						/>
					</ChartInformation>
				</div>
			</div>
		</main>
	);
}

export default App;
