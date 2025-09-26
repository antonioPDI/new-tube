import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(duration: number | null) {
  const seconds = duration ? Math.floor((duration % 60000) / 1000) : 0;
  const minutes = duration ? Math.floor((duration % 3600000) / 60000) : 0;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}



export const snakeCaseToTitle = (str: string) => {
  return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};