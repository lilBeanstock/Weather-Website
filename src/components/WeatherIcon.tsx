import { useTheme } from './ThemeProvider';
import RainIcon from '../frontend/icons/rain.svg';
import CloudIcon from '../frontend/icons/cloudy.svg';
import WindIcon from '../frontend/icons/windy.svg';
import SunIcon from '../frontend/icons/sunny.svg';

// The SVG image displayed if it's e.g. raining or sunny.
// We can reuse this function in the current weather and forecasted weather.
export default function WeatherIcon({ cloudy, raining, windy }: { cloudy: boolean; raining: boolean; windy: boolean }) {
	const { theme } = useTheme();

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
