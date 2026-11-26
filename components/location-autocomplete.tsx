"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

interface LocationAutocompleteProps {
  name: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string;
}

interface PlaceSuggestion {
  placeId: string;
  text: string;
  secondaryText: string;
  prediction: google.maps.places.PlacePrediction;
}

export default function LocationAutocomplete({
  name,
  required = false,
  disabled = false,
  defaultValue = "",
}: LocationAutocompleteProps) {
  const places = useMapsLibrary("places");

  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const requestId = useRef(0);
  const sessionToken = useRef<
    google.maps.places.AutocompleteSessionToken | undefined
  >(undefined);

  useEffect(() => {
    if (!places) return;

    sessionToken.current = new places.AutocompleteSessionToken();
  }, [places]);

  useEffect(() => {
    if (!places || disabled || value.trim().length < 2 || !isOpen) {
      return;
    }

    const currentRequest = ++requestId.current;

    const timeout = setTimeout(async () => {
      setIsLoading(true);

      try {
        const response =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: value,
            sessionToken: sessionToken.current,
          });

        if (currentRequest !== requestId.current) return;

        const results: PlaceSuggestion[] = (
          response.suggestions as google.maps.places.AutocompleteSuggestion[]
        )
          .filter(
            (
              item,
            ): item is google.maps.places.AutocompleteSuggestion & {
              placePrediction: google.maps.places.PlacePrediction;
            } => item.placePrediction != null,
          )
          .map((item) => {
            const prediction = item.placePrediction;

            return {
              placeId: prediction.placeId,
              text: prediction.mainText?.text ?? prediction.text.text,
              secondaryText: prediction.secondaryText?.text ?? "",
              prediction,
            };
          });

        setSuggestions(results);
      } catch (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
      } finally {
        if (currentRequest === requestId.current) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [value, places, disabled, isOpen]);

  function handleSelect(suggestion: PlaceSuggestion) {
    requestId.current += 1;

    setValue(suggestion.text);
    setSuggestions([]);
    setIsOpen(false);
    setIsLoading(false);

    // Start a new autocomplete session for the next search.
    if (places) {
      sessionToken.current = new places.AutocompleteSessionToken();
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          name={name}
          type="text"
          value={value}
          onChange={(event) => {
            requestId.current += 1;
            setValue(event.target.value);
            setSuggestions([]);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 150);
          }}
          required={required}
          disabled={disabled}
          autoComplete="off"
          placeholder="Search for a place or destination"
          className="w-full rounded-xl border border-input bg-white px-4 py-3 pr-11 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground hover:border-brand-olive focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        {isLoading && (
          <Loader2 className="absolute right-4 top-3.5 h-5 w-5 animate-spin text-brand-olive" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-background shadow-xl">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(suggestion)}
              className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-brand-gold focus:bg-brand-gold focus:outline-none"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {suggestion.text}
                </span>

                {suggestion.secondaryText && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {suggestion.secondaryText}
                  </span>
                )}
              </span>
            </button>
          ))}

          <div className="px-4 py-2 text-right text-xs text-muted-foreground">
            Powered by Google
          </div>
        </div>
      )}
    </div>
  );
}
