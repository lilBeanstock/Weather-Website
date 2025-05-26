// Import the components and libraries we need to display the data.
import { useQuery } from '@tanstack/react-query';
import type { Data } from '@/backend/arduino';
import { Download } from 'lucide-react';
import { Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import ChartInformation from '@/components/ChartInformation';
import WeatherIcon from '@/components/WeatherIcon';

// Forecast data type for the weather forecast in the next several minutes.
// Do not include data points we do not want such as the ones below.
type ForecastedData = Omit<Data, 'alarming' | 'initialTime' | 'gas'>;

// This is where we return the predicted weather forecast in the next few minutes.
function forecastWeather(secondsIncrement: number, currData: Data[]): ForecastedData[] {
	const forecasted: ForecastedData[] = [];

	let index = -currData.length;
	// Return nothing if we have less than 3 data points.
	if (index >= -2) {
		return [];
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

	// predict for the forecoming 5 minutes.
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

// Our app component where all of the main graphical interface is.
export default function App() {
	// Utility to toggle between light and dark theme.
	const { setTheme, theme } = useTheme();
	// We use TanStack Query to regularly refetch the incoming weather data.
	const { isPending, error, data } = useQuery({
		queryKey: ['arduino-data'],
		queryFn: () => fetch(`${window.location.origin}/api/arduino-data`).then((res) => res.json()) as Promise<Data[]>,
		// Retrieve the Arduino data array every 5 seconds.
		refetchInterval: 5 * 1000,
	});

	if (isPending) return 'Loading...';

	if (error) return 'An error has occurred: ' + error.message;

	// evaluate temperature and changes in temp
	const tempCurrent = data.at(-1)?.temperature ?? 21;
	// The temperature before.
	let tempDistant = 0;

	if (data.length < 5) {
		tempDistant = data[0]?.temperature ?? 21;
	} else {
		tempDistant = data.at(-5).temperature;
	}

	// The temperature difference/range.
	const tempChange = tempCurrent - tempDistant;

	// Boolean functions to determine the weather conditions.
	function raining(rain: Data['rain']) {
		return data.length > 0 && rain > 30;
	}

	function cloudy({ rain, solar }: Pick<Data, 'rain' | 'solar'>) {
		return data.length > 0 && !raining(rain) && solar > 300;
	}

	function windy({ rain, wind }: Pick<Data, 'rain' | 'wind'>) {
		return data.length > 0 && !raining(rain) && wind > 400;
	}

	// Our predicted weather forecast.
	const forecastedData = forecastWeather(60, data);

	const before = new Date(data.at(-2)?.logDate).getTime();
	const after = new Date(data.at(-1)?.logDate).getTime();
	// Time change between the last and penultimate data point.
	const timeChange = (after - before) / 1000;
	const timeUnit = 'sekund(er)';

	// Each individual card of the weather forecast carousel.
	function Forecast({
		data: { humidity, rain, solar, wind, temperature },
		date,
	}: {
		data: ForecastedData;
		date: Data['logDate'];
	}) {
		const dateObj = new Date(date);
		// In how many minutes.
		const diff = Math.round((dateObj.getTime() - new Date().getTime()) / (1000 * 60));
		// Displays in how many minutes instead of just the time or date.
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

	// The UI shown to the user.
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

			<div className="my-8 flex flex-col items-center xl:flex-row xl:justify-evenly">
				{/* current weather div */}
				<Card className="m-3 w-fit border-[2px] border-solid border-[#202020]">
					<CardHeader>
						<CardTitle className="text-center text-xl">Väderprognos</CardTitle>
						<CardDescription className="text-center text-2xl text-red-600">
							{/* Display a weather warning if there is one according to the weather station. */}
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
				{/* weather forecast. If no forecasted data, show no weather forecast. */}
				{forecastedData.length > 0 ? (
					<Carousel opts={{ align: 'start' }} className="w-full max-w-2xl">
						<CarouselContent>
							{/* Only show up to the next 5 minutes. */}
							{[...forecastedData.slice(0, 5)].map((data, index) => (
								<Forecast key={index} data={data} date={data.logDate} />
							))}
						</CarouselContent>
						<CarouselPrevious />
						<CarouselNext />
					</Carousel>
				) : (
					<h1 className="text-2xl">Ingen väderprognos än...</h1>
				)}
			</div>

			{/* graphical div (charts) */}
			<div className="flex w-screen flex-col items-center">
				<div className="flex h-72 w-2/3 place-content-between">
					{/* for rain */}
					<ChartInformation data={data}>
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
					<ChartInformation data={data}>
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
					<ChartInformation data={data}>
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
					<ChartInformation data={data}>
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
