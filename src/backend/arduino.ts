import { fileURLToPath, spawn, spawnSync } from 'bun';
import chalk from 'chalk';

// This boolean checks if we should treat the code as if a real Arduino Uno is present.
const RUNNING_ARDUINO = process.env.NODE_ENV === 'production';
const weatherFile = fileURLToPath(import.meta.resolve('./weather/weather.ino'));

if (RUNNING_ARDUINO) {
	console.log(chalk.green('Compiling the weather code...'));
	const compileArguments = ['arduino-cli', 'compile', '--fqbn', 'arduino:avr:uno', weatherFile];
	const compileProcess = spawnSync(compileArguments, { stdout: 'pipe' });

	// Print the raw output of the compilation to terminal.
	process.stdout.write(compileProcess.stdout.toString());
}

if (RUNNING_ARDUINO) {
	console.log(chalk.green('Uploading the weather code...'));
	const uploadArguments = ['arduino-cli', 'upload', '-p', '/dev/ttyACM0', '--fqbn', 'arduino:avr:uno', weatherFile];
	const uploadProcess = spawnSync(uploadArguments, { stdio: ['ignore', 'pipe', 'pipe'] });

	process.stdout.write(uploadProcess.stdout.toString());
	const uploadStderr = uploadProcess.stderr.toString();
	process.stdout.write(uploadStderr);

	if (uploadStderr.search('exit status 1') !== -1) {
		console.error('Failed to compile the Arduino weather code!');
		process.exit(1);
	}
}

const monitorArguments = RUNNING_ARDUINO
	? ['arduino-cli', 'monitor', '-p', 'COM6', '--fqbn', 'arduino:avr:uno']
	: [
			'powershell.exe',
			'-Command',
			'While ($true) { Write-Host "This text will be printed every 2 seconds."; Start-Sleep -Seconds 2 }',
		];
const monitorProcess = spawn(monitorArguments, {
	// stdin, stdout, stderr.
	stdio: ['inherit', 'pipe', 'pipe'],
	onExit(subprocess, exitCode, signalCode, error) {
		console.log(`Subprocess exited with exit code ${exitCode}, signal code ${signalCode}, and error ${error}.`);
	},
});

export interface Data {
	temperature: number;
	humidity: number;
	gas: number;
	rain: number;
	initialTime: number;
	secondsPassed: number;
}

export const data: Data[] = [];

// This anonymous async function runs the for await loop in its own async task
// so that it does not block the rest of the script below it.
(async () => {
	for await (const chunk of monitorProcess.stdout) {
		const line = new TextDecoder().decode(chunk);
		process.stdout.write(line);

		if (RUNNING_ARDUINO) {
			try {
				const incomingData = JSON.parse(line) as Data;
				incomingData.secondsPassed = Math.floor((Date.now() - incomingData.initialTime) / 1000);

				data.push(incomingData);
			} catch {
				console.error('JSON parsing error!');
			} finally {
				if (data.length > 10) {
					data.shift();
				}
			}
		} else {
			// Fake data:
			data.push({
				gas: Math.floor(Math.random() * 100),
				humidity: Math.floor(Math.random() * 100),
				initialTime: new Date('2025-05-02 13:20:00').getTime(),
				rain: Math.floor(Math.random() * 100),
				temperature: Math.floor(Math.random() * 100),
				secondsPassed: (Date.now() - new Date('2025-05-02 13:20:00').getTime()) / 1000,
			});
		}
	}
})();

(async () => {
	for await (const chunk of monitorProcess.stderr) {
		const line = new TextDecoder().decode(chunk);
		console.error('ERROR!', line);
		process.exit(1);
	}
})();
