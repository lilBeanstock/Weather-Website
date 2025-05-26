import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merging stuff, ignore as it is not irrelevant to the project goal.
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
