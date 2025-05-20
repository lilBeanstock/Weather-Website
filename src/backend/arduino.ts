/**
 * arduino-cli is required to be able to run the server code.
 * Make sure the port (-p option) and FQBN (--fqbn option) matches your
 * board listed in "arduino-cli board list".
 */

import { fileURLToPath, readableStreamToText, spawn, spawnSync } from 'bun';
import chalk from 'chalk';
import { appendFile } from 'node:fs/promises';

// This boolean checks if we should treat the code as if a real Arduino Uno is present.
const RUNNING_ARDUINO = process.env.NODE_ENV === 'production';
const weatherFile = fileURLToPath(import.meta.resolve('./weather/weather.ino'));

if (RUNNING_ARDUINO) {
	console.log(chalk.green('Compiling the weather code...'));
	const compileArguments = ['arduino-cli', 'compile', '--fqbn', 'arduino:avr:uno', weatherFile];
	// Spawn a child process which runs the arguments above (which compiles the Arduino code).
	// stdio array: [stdin, stdout, stderr].
	const compileProcess = spawnSync(compileArguments, { stdio: ['ignore', 'pipe', 'pipe'] });

	// Print the raw output of the compilation to the terminal.
	process.stdout.write(compileProcess.stdout.toString());
	const stderr = compileProcess.stderr.toString();
	process.stdout.write(stderr);

	// Stop the process/code from running as we have hit an error.
	if (stderr.length > 0) {
		console.error('Failed to compile the Arduino weather code!');
		process.exit(1);
	}
}

if (RUNNING_ARDUINO) {
	console.log(chalk.green('Uploading the weather code...'));
	// const uploadArguments = ['arduino-cli', 'upload', '-p', '/dev/ttyACM0', '--fqbn', 'arduino:avr:uno', weatherFile];
	const uploadArguments = ['arduino-cli', 'upload', '-p', 'COM6', '--fqbn', 'arduino:avr:uno', weatherFile];
	const uploadProcess = spawnSync(uploadArguments, { stdio: ['ignore', 'pipe', 'pipe'] });

	process.stdout.write(uploadProcess.stdout.toString());
	const stderr = uploadProcess.stderr.toString();
	process.stdout.write(stderr);

	if (stderr.length > 0) {
		console.error('Failed to upload the Arduino weather code!');
		process.exit(1);
	}
}

const monitorArguments = RUNNING_ARDUINO
	? ['arduino-cli', 'monitor', '-p', 'COM6', '--fqbn', 'arduino:avr:uno']
	: [
			'powershell.exe',
			'-Command',
			'While ($true) { Write-Host "Simulating incoming text from the Arduino Uno every 2 seconds."; Start-Sleep -Seconds 2 }',
		];
const monitorProcess = spawn(monitorArguments, {
	stdio: ['inherit', 'pipe', 'pipe'],
	onExit({ pid }, exitCode, signalCode, error) {
		console.log(`Subprocess #${pid} exited with the code ${exitCode}, signal code ${signalCode}, and error ${error}.`);
	},
});

export interface Data {
	temperature: number;
	humidity: number;
	gas: number;
	rain: number;
	solar: number;
	wind: number;
	initialTime: number;
	logDate: string;
}

export const data: Data[] = [];

async function* streamLines(stream: AsyncIterable<Uint8Array>) {
	const decoder = new TextDecoder();
	let leftover = '';

	for await (const chunk of stream) {
		leftover += decoder.decode(chunk, { stream: true });
		const lines = leftover.split('\n');
		leftover = lines.pop() ?? '';

		for (const line of lines) {
			yield line;
		}
	}

	if (leftover.trim()) {
		yield leftover;
	}
}

// This anonymous async function runs the for await loop in its own async task
// so that it does not block the rest of the script below it.
(async () => {
	// https://stackoverflow.com/a/76296855
	for await (const line of streamLines(monitorProcess.stdout)) {
		const logDate = new Date().toUTCString();
		if (RUNNING_ARDUINO) {
			try {
				let incomingData = JSON.parse(line) as Data;
				incomingData.logDate = logDate;

				data.push(incomingData);
				appendFile(fileURLToPath(import.meta.resolve('./data.txt')), `${JSON.stringify(incomingData)}\n`);
			} catch {
				console.error('JSON parsing error!');
			}
		} else {
			// Fake data:
			const initialTime = new Date('2025-05-02 13:20:00').getTime();
			data.push({
				gas: Math.floor(Math.random() * 100),
				humidity: Math.floor(Math.random() * 100),
				rain: Math.floor(Math.random() * 100),
				temperature: Math.floor(Math.random() * 100),
				solar: Math.floor(Math.random() * 100),
				wind: Math.floor(Math.random() * 100),
				initialTime,
				logDate,
			});
		}

		if (data.length > 30) {
			data.shift();
		}

		console.log(JSON.stringify(data.at(-1)));
	}
})();

(async () => {
	// https://bun.sh/guides/process/spawn-stderr
	const error = await readableStreamToText(monitorProcess.stderr);

	if (error) {
		console.error('ERROR!', error);
		process.exit(1);
	}
})();
