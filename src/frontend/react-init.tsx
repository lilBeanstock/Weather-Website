/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import '../index.css';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
// The library we use to fetch our data provided by the server/Arduino.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './Index';
// Ability to switch between light and dark mode.
import { ThemeProvider } from '@/components/ThemeProvider';

const queryClient = new QueryClient();
// The React app we serve to the user.
// This is where the webpage actually gets rendered.
const app = (
	<StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="bun-ui-theme">
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</ThemeProvider>
	</StrictMode>
);

const elem = document.getElementById('root')!;

if (import.meta.hot) {
	// With hot module reloading, `import.meta.hot.data` is persisted.
	const root = (import.meta.hot.data.root ??= createRoot(elem));
	// Render the React webpage.
	root.render(app);
} else {
	// The hot module reloading API is not available in production.
	createRoot(elem).render(app);
}
