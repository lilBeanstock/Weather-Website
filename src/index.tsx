import { serve } from 'bun';
import { renderToReadableStream } from 'react-dom/server';
import index from './index.html';
import { data } from './arduino';
import App from './App';

const server = serve({
	routes: {
		// Serve index.html for all unmatched routes.
		'/*': index,
		// The code below works with some adjustments but the UI becomes wack.
		// '/*': async () => {
		// 	const stream = await renderToReadableStream(<App data={data} />);

		// 	return new Response(stream, {
		// 		headers: { 'Content-Type': 'text/html' }
		// 	});
		// },
		'/api/arduino-data': () => {
			return Response.json(data);
		}
	},
	development: process.env.NODE_ENV !== 'production'
});

console.log(`🚀 Server running at ${server.url}`);
