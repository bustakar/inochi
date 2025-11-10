"use client";

import * as React from "react";
import { Search as SearchIcon } from "lucide-react";

import { Input } from "@inochi/ui";

// ============================================================================
// Types
// ============================================================================

interface SearchProps {
  initialValue?: string;
  onSearchUpdate: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

// ============================================================================
// Component
// ============================================================================

export function Search({
  initialValue = "",
  onSearchUpdate,
  placeholder = "Search...",
  debounceMs = 500,
}: SearchProps) {
  const [value, setValue] = React.useState(initialValue);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      onSearchUpdate(value);
    }, debounceMs);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, onSearchUpdate, debounceMs]);

  // Sync with initialValue if it changes externally
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className="relative">
      <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
