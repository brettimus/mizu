import { format } from "date-fns";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"


export function formatDate(d: Date | string) {
  return format(new Date(d), 'HH:mm:ss.SSS');
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function objectWithKey<T extends string>(value: unknown, key: T): value is { [K in T]: unknown } {
  return typeof value === "object" && value !== null && key in value;
}


export function objectWithKeyAndValue<T extends string, V>(value: unknown, key: T, expectedValue: V): value is { [K in T]: V } {
  return objectWithKey(value, key) && value[key] === expectedValue;
}