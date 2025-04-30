import './index.css';
import { Card, CardContent } from '@/components/ui/card';

import type { Data } from './arduino';
import { Button } from './components/ui/button';
import { useQuery } from '@tanstack/react-query';

export function App() {
	const { isPending, error, data } = useQuery({
		queryKey: ['arduino-data'],
		queryFn: () => fetch('http://localhost:3000/api/arduino-data').then((res) => res.json())
	});

	if (isPending) return 'Loading...';

	if (error) return 'An error has occurred: ' + error.message;

	return (
		<div>
			{data.map((d, i) => (
				<h1 key={i}>
					<Button>Gas button {d.gas}</Button>, {d.humidity}, {d.initialTime}, {d.rain},{' '}
					{d.temperature}cc
				</h1>
			))}
		</div>
	);
}

export default App;
