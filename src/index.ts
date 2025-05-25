// The code to start the web server begins here.

import { file, fileURLToPath, serve } from 'bun';
import index from './index.html';
import { data } from './backend/arduino';
// Package to print out to terminal in colour.
import chalk from 'chalk';

// Determine if we should treat the website as if a real Arduino is present.
// Used to either provide the real data incoming from the weather station or fake data generated.
const production = process.env.NODE_ENV === 'production';

const server = serve({
	routes: {
		// Serve index.html for all unmatched routes.
		'/*': index,
		// Return our weather station data when this route is called.
		'/api/arduino-data': () => {
			return Response.json(data);
		},
		// Return all our weather station data saved.
		'/api/arduino-data-all': async () => {
			const fileContent = await file(fileURLToPath(import.meta.resolve('./backend/data.txt'))).text();
			const splitted = fileContent.split('\n');
			// Remove the last line from the array as it's only a break line, not a JSON object.
			splitted.pop();

			// Return all data as an array of objects.
			return Response.json(JSON.parse(`[${splitted.join(',')}]`));
		},
	},
	// For hot reloading.
	development: !production,
	port: production ? 3000 : 3001,
});

console.log(chalk.green(`🚀 Server running at ${server.url}`));
