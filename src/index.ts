import { serve } from 'bun';
import index from './index.html';
import { data } from './backend/arduino';
import chalk from 'chalk';

const server = serve({
	routes: {
		// Serve index.html for all unmatched routes.
		'/*': index,
		'/api/arduino-data': () => {
			return Response.json(data);
		},
	},
	development: process.env.NODE_ENV !== 'production',
});

console.log(chalk.green(`🚀 Server running at ${server.url}`));
