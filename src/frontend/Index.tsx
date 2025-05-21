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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

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
	const DisTimeChange = new Date(currData.at(-1).logDate).getTime() - new Date(currData.at(index).logDate).getTime();
	const DisRain = ((currData.at(-1).rain - currData.at(index).rain) / DisTimeChange) * 1000;
	const DisSol = ((currData.at(-1).solar - currData.at(index).solar) / DisTimeChange) * 1000;
	const DisWind = ((currData.at(-1).wind - currData.at(index).wind) / DisTimeChange) * 1000 * 5;
	const DisTemp = ((currData.at(-1).temperature - currData.at(index).temperature) / DisTimeChange) * 1000;
	const DisHumidity = ((currData.at(-1).humidity - currData.at(index).humidity) / DisTimeChange) * 1000;

	// momentary change
	const ChTimeChange = new Date(currData.at(-1).logDate).getTime() - new Date(currData.at(-3).logDate).getTime();
	const ChRain = ((currData.at(-1).rain - currData.at(-3).rain) / ChTimeChange) * 1000;
	const ChSol = ((currData.at(-1).solar - currData.at(-3).solar) / ChTimeChange) * 1000;
	const ChWind = ((currData.at(-1).wind - currData.at(-3).wind) / ChTimeChange) * 1000;
	const ChTemp = ((currData.at(-1).temperature - currData.at(-3).temperature) / ChTimeChange) * 1000;
	const ChHumidity = ((currData.at(-1).humidity - currData.at(-3).humidity) / ChTimeChange) * 1000;

	// average the change for a more accurate prediction
	const AvgRain = Math.round(ChRain + DisRain) / 2;
	const AvgSol = Math.round(ChSol + DisSol) / 2;
	const AvgWind = Math.round(ChWind + DisWind) / 2;
	const AvgTemp = Math.round(ChTemp + DisTemp) / 2;
	const AvgHumidity = Math.round(ChHumidity + DisHumidity) / 2;

	console.log(AvgWind, ChWind, DisWind, ChTimeChange, DisTimeChange);

	// predict for the forecoming minutes
	let forecasted: ForecastedDataObj[] = [];
	// new Date(new Date().getTime() + secondsIncrement*1000);
	for (let i = 1; i < 6; i++) {
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
		queryFn: () => fetch(`${window.location.origin}/api/arduino-data`).then((res) => res.json()) as Promise<Data[]>,
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

	function raining(rain: Data['rain']) {
		return data.length > 0 && rain > 30;
	}

	function cloudy({ rain, solar }: Pick<Data, 'rain' | 'solar'>) {
		return data.length > 0 && !raining(rain) && solar > 300;
	}

	function windy({ rain, wind }: Pick<Data, 'rain' | 'wind'>) {
		return data.length > 0 && !raining(rain) && wind > 400;
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

	function Forecast({
		data: { humidity, rain, solar, wind, temperature },
		date,
	}: {
		data: ForecastedDataObj;
		date: Data['logDate'];
	}) {
		const dateObj = new Date(date);
		const diff = Math.round((dateObj.getTime() - new Date().getTime()) / (1000 * 60));
		const formattedDate = new Intl.RelativeTimeFormat('sv-SE', { numeric: 'auto' }).format(diff, 'minute');

		return (
			<CarouselItem className="md:basis-1/2 lg:basis-1/3">
				<Card className="m-3 w-fit border-[2px] border-solid border-[#202020] p-1">
					<CardHeader>
						<CardTitle className="text-center text-xl">{formattedDate}</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center text-center">
						<WeatherIcon cloudy={cloudy({ rain, solar })} raining={raining(rain)} windy={windy({ rain, wind })} />
						<p className="mx-2">Temperatur:</p>
						<p className="mx-2">{temperature.toFixed(1) ?? 'NaN'} °C</p>
						<p className="m-2">Luftfuktighet: {humidity.toFixed(1) ?? 'NaN'}%</p>
						<p className="m-2">Regn: {rain.toFixed(1) ?? 'NaN'}%</p>
						<p className="m-2">Vind: {wind.toFixed(1) ?? 'NaN'} m/s</p>
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

			<div className="my-8 flex flex-row justify-evenly">
				{/* current weather div */}
				<Card className="m-3 w-fit border-[2px] border-solid border-[#202020]">
					<CardHeader>
						<CardTitle className="text-center text-xl">Väderprognos</CardTitle>
						<CardDescription className="text-center text-2xl text-red-600">
							{data.at(-1)?.alarming ? 'VÄDER VARNING' : ''}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center text-center">
						<WeatherIcon
							cloudy={cloudy({ rain: data.at(-1).rain, solar: data.at(-1).solar })}
							raining={raining(data.at(-1).rain)}
							windy={windy({ rain: data.at(-1).rain, wind: data.at(-1).wind })}
						/>
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
				{/* weather forecast */}
				<Carousel opts={{ align: 'start' }} className="w-full max-w-2xl">
					<CarouselContent>
						{[...(forecastedData.length > 0 ? forecastedData : []).slice(0, 5)].map((data, index) => (
							<Forecast key={index} data={data} date={data.logDate} />
						))}
					</CarouselContent>
					<CarouselPrevious />
					<CarouselNext />
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
