import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
