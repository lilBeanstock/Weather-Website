import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const command = 'arduino-cli';
// const args = ['monitor', '-p', 'COM6', '--fqbn', 'arduino:avr:uno'];
const args: string[] = [];

const process = spawn(command, args);
const rl = createInterface({
	input: process.stdout,
	output: process.stdin,
	terminal: false, // Set to false as we're not interacting with a user terminal.
});

let collectedStdout = '';
let collectedStderr = '';

export interface Data {
	temperature: number;
	humidity: number;
	gas: number;
	rain: number;
	initialTime: number;
}

export const data: Data[] = [];

// Listen for each complete line of output from stdout
rl.on('line', (line) => {
	console.log('big data', data);
	data.push({ gas: 0, humidity: 1, initialTime: 2, rain: 3, temperature: 4 });

	try {
		data.push(JSON.parse(line));
	} catch (error) {
		// console.error('ERROR!!', error);
	}
});

// Listen for data on stderr (still chunk by chunk as it's less likely to be line-oriented for errors)
process.stderr.on('data', (data) => {
	const dataString = data.toString();
	console.error(`[stderr] ${dataString.trim()}`); // Print stderr in real-time
	collectedStderr += dataString; // Collect stderr data
});

// Listen for the process to exit
process.on('close', (code) => {
	console.log(`Child process exited with code ${code}`);

	// Close the readline interface when the process closes
	rl.close();

	if (code === 0) {
		console.log('\n--- Full Collected Stdout ---');
		console.log(collectedStdout.trim()); // Print the full collected stdout
	} else {
		console.error(`\n--- Command Failed ---`);
		console.error(`Exit Code: ${code}`);
		console.error(`Collected Stderr:\n${collectedStderr.trim()}`);
	}
});

// Listen for errors during process spawning (e.g., command not found)
process.on('error', (err) => {
	console.error(`Failed to start child process: ${err.message}`);
	// Close the readline interface in case of a process error
	rl.close();
});
