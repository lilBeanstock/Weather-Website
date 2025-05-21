import { useQuery } from '@tanstack/react-query';
import type { Data } from '@/backend/arduino';
import RainIcon from './icons/rain.svg';
import CloudIcon from './icons/cloudy.svg';
import WindIcon from './icons/windy.svg';
import SunIcon from './icons/sunny.svg';
import { Download } from 'lucide-react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import type { PropsWithChildren } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

type ForecastedDataObj = Omit<Data, 'alarming' | 'initialTime' | 'gas'>;
interface ForecastedData extends ForecastedDataObj {}

function forecastWeather(secondsIncrement: number, currData: Data[]): ForecastedData[] | null {
	let index = -currData.length;
	if (index >= -3) {
		return null;
	} else if (index <= -15) {
		index = -15;
	}

	// distant change
	const DisRain = currData.at(-1).rain - currData.at(index).rain;
	const DisSol = currData.at(-1).solar - currData.at(index).solar;
	const DisWind = currData.at(-1).wind - currData.at(index).wind;
	const DisTemp = currData.at(-1).temperature - currData.at(index).temperature;
	const DisHumidity = currData.at(-1).humidity - currData.at(index).humidity;

	// momentary change
	const ChRain = currData.at(-1).rain - currData.at(-3).rain;
	const ChSol = currData.at(-1).solar - currData.at(-3).solar;
	const ChWind = currData.at(-1).wind - currData.at(-3).wind;
	const ChTemp = currData.at(-1).temperature - currData.at(-3).temperature;
	const ChHumidity = currData.at(-1).humidity - currData.at(-3).humidity;

	// average the change for a more accurate prediction
	const AvgRain = (ChRain + DisRain) / 2;
	const AvgSol = (ChSol + DisSol) / 2;
	const AvgWind = (ChWind + DisWind) / 2;
	const AvgTemp = (ChTemp + DisTemp) / 2;
	const AvgHumidity = (ChHumidity + DisHumidity) / 2;

	// predict for the forecoming minutes
	let forecasted: ForecastedDataObj[] = [];
	// new Date(new Date().getTime() + secondsIncrement*1000);
	for (let i = 1; i < 4; i++) {
		// current + AvgChange * index
		forecasted.push({
			logDate: new Date(new Date().getTime() + secondsIncrement * 1000 * i).toUTCString(),
			rain: currData.at(-1).rain + AvgRain * i,
			solar: currData.at(-1).solar + AvgSol * i,
			temperature: currData.at(-1).temperature + AvgTemp * i,
			wind: currData.at(-1).wind + AvgWind * i,
			humidity: currData.at(-1).humidity + AvgHumidity * i,
		});
	}

	return forecasted;
}

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
		tempDistant = data.at(-5).temperature;
	}

	const tempChange = tempCurrent - tempDistant;

	// evaluate if it's raining
	let isRaining = false;
	if (data.length > 0 && data.at(-1).rain > 300) {
		isRaining = true;
	}

	// evaluate if it's cloudy
	let isCloudy = false;
	if (data.length > 0 && !isRaining && data.at(-1).solar > 300) {
		isCloudy = true;
	}

	// evaluate if it's windy (no rain or clouds)
	let isWindy = false;
	if (data.length > 0 && !isRaining && data.at(-1).wind > 400) {
		isWindy = true;
	}

	const forecastedData = forecastWeather(60, data);

	const before = new Date(data.at(-2)?.logDate).getTime();
	const after = new Date(data.at(-1)?.logDate).getTime();
	const timeChange = (after - before) / 1000;
	const timeUnit = 'sekund(er)';

	function WeatherIcon({ cloudy, raining, windy }: { cloudy: boolean; raining: boolean; windy: boolean }) {
		return (
			<>
				<img
					src={RainIcon}
					height="200"
					width="200"
					className={(theme === 'dark' ? 'svgtowhite ' : '') + (raining ? 'block' : 'hidden')}
				/>
				<img
					src={CloudIcon}
					height="200"
					width="200"
					className={(theme === 'dark' ? 'svgtowhite ' : '') + (cloudy ? 'block' : 'hidden')}
				/>
				<img
					src={WindIcon}
					height="200"
					width="200"
					className={(theme === 'dark' ? 'svgtowhite ' : '') + (windy ? 'block' : 'hidden')}
				/>
				<img
					src={SunIcon}
					height="200"
					width="200"
					className={(theme === 'dark' ? 'svgtowhite ' : '') + (raining || windy || cloudy ? 'hidden' : 'block')}
				/>
			</>
		);
	}

	function Forecast({ data }: { data: ForecastedDataObj }) {
		return (
			<CarouselItem className="basis-1/3">
				<Card className="m-3 w-fit border-[2px] border-solid border-[#202020]">
					<CardHeader>
						<CardTitle className="text-center text-xl">DAG ?</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center text-center">
						<WeatherIcon cloudy={isCloudy} raining={isRaining} windy={isWindy} />
						<p className="m-2">Temperatur: {data.temperature ?? 'NaN'} °C</p>
						<p className="m-2">Luftfuktighet: {data.humidity ?? 'NaN'}%</p>
						<p className="m-2">Regn: {data.rain ?? 'NaN'}%</p>
						<p className="m-2">Vind: {data.wind ?? 'NaN'} m/s</p>
					</CardContent>
				</Card>
			</CarouselItem>
		);
	}

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

	function ChartInformation({ children }: PropsWithChildren) {
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

	return (
		<main className="absolute top-0 left-0 flex min-h-screen min-w-screen flex-col overflow-hidden">
			{/* header div */}
			<nav className="top-0 h-13 min-w-screen border-[2px] border-solid border-[#202020]">
				<div className="align-center flex h-full flex-row items-center justify-center gap-x-4">
					<Button variant="default" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
						Toggle Theme
					</Button>
					<Button variant="secondary" asChild>
						<a href="/api/arduino-data-all" download>
							<Download /> Download Data
						</a>
					</Button>
				</div>
			</nav>

			<div className="flex flex-row justify-around">
				{/* current weather div */}
				<Card className="m-3 w-fit border-[2px] border-solid border-[#202020]">
					<CardHeader>
						<CardTitle className="text-center text-xl">Väderprognos</CardTitle>
						<CardDescription className="text-center text-2xl text-red-600">
							{data.at(-1)?.alarming ? 'VÄDER VARNING' : ''}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center text-center">
						<WeatherIcon cloudy={isCloudy} raining={isRaining} windy={isWindy} />
						<p className="m-2">Nuvarande temperatur är {data.at(-1)?.temperature ?? 'Unknown'} °C</p>
						<p className="m-2">
							Temperaturen har gått {tempChange < 0 ? 'ned' : 'upp'} med {Math.abs(tempChange)} °C <br />(
							{timeChange + ' ' + timeUnit} sedan){' '}
							<span className="text-[#D0D080]">
								({tempDistant}-{tempCurrent} °C)
							</span>
						</p>
					</CardContent>
				</Card>
				<Carousel>
					<CarouselContent>
						{...Array(5).map((i) => <Forecast data={forecastedData.at(i)} />)}
						<Card>HII</Card>
					</CarouselContent>
				</Carousel>
			</div>

			{/* graphical div */}
			<div className="flex w-screen flex-col items-center">
				<div className="flex h-72 w-2/3 place-content-between">
					{/* for rain */}
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
					{/* for gas and humidity */}
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
					{/* for solar voltage and wind velocity, 600 = 2V, 632 = 2.42V 200 = 0.19V */}
					<ChartInformation>
						<Line
							dataKey="solar"
							type="monotone"
							fill="var(--color-solar)"
							fillOpacity={0.4}
							stroke="var(--color-solar)"
							dot={false}
						/>
						<Line
							dataKey="wind"
							type="monotone"
							fill="var(--color-wind)"
							fillOpacity={0.4}
							stroke="var(--color-wind)"
							dot={false}
						/>
					</ChartInformation>
				</div>
			</div>
		</main>
	);
}

export default App;
