import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an Ethereum address to a shortened form (0x1234...5678)
 * @param address The full Ethereum address to format
 * @param fullLength Whether to show the full address without shortening
 * @returns The formatted address string
 */
export function formatAddress(address: string, fullLength = false): string {
  if (!address) return "";
  if (fullLength) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Validates an Ethereum address
 * @param address The address to validate
 * @returns True if the address is valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Formats a date object to a simple date and time string
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDateTime(date: Date): string {
  if (!date) return "Unknown";
  
  // For recent dates (within the last 24 hours), show relative time
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  
  // For older dates, show the date and time
  return date.toLocaleString();
}

/**
 * Formats a number as a currency string with a given number of decimal places
 * @param value The number to format
 * @param decimals The number of decimal places to show
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string, decimals = 2): string {
  if (value === undefined || value === null) return "0.00";
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "0.00";
  
  return numValue.toFixed(decimals);
}

/**
 * Copies text to the clipboard
 * @param text The text to copy
 * @returns A promise that resolves when the text is copied
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
    
    document.body.removeChild(textArea);
  }
}

/**
 * Converts a hex string to a byte array
 * @param hex The hex string to convert
 * @returns The byte array
 */
export function hexToBytes(hex: string): Uint8Array {
  if (!hex || hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  
  hex = hex.startsWith("0x") ? hex.substring(2) : hex;
  const bytes = new Uint8Array(hex.length / 2);
  
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  
  return bytes;
}

/**
 * Truncates a string to a maximum length and adds an ellipsis if truncated
 * @param str The string to truncate
 * @param maxLength The maximum length of the string
 * @returns The truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}
