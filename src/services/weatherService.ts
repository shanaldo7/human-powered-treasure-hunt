/**
 * Weather Service for Human-Powered Treasure Hunt
 * 
 * Provides real-time weather observations and forecasts using Open-Meteo API
 * (completely free, no API key required, highly reliable global coverage).
 * Integrates into hunt generation logic to avoid outdoor/exposed stops during extreme weather
 * and produce safety advisories for explorers.
 */

export interface WeatherData {
  temperatureC: number;
  temperatureF: number;
  condition: string;
  isExtreme: boolean;
  extremeReason?: string;
  isOutdoorSafe: boolean;
  advisoryMessage: string;
  windSpeedKmh: number;
  precipitationMm: number;
  source: string;
}

// Map WMO Weather Interpretation Codes to readable descriptions & safety flags
function interpretWmoCode(code: number, windSpeedKmh: number, tempC: number): { condition: string; isExtreme: boolean; extremeReason?: string; advisory: string } {
  let condition = 'Clear';
  let isExtreme = false;
  let extremeReason: string | undefined = undefined;

  // Severe temperature checks
  if (tempC >= 38) {
    isExtreme = true;
    extremeReason = 'Extreme Heat Warning (>= 38°C / 100°F). High risk of heat exhaustion.';
  } else if (tempC <= -15) {
    isExtreme = true;
    extremeReason = 'Severe Freezing Warning (<= -15°C / 5°F). Frostbite danger during prolonged exposure.';
  }

  // Severe wind checks
  if (windSpeedKmh >= 60) {
    isExtreme = true;
    extremeReason = (extremeReason ? extremeReason + ' | ' : '') + `Gale Force Winds (${Math.round(windSpeedKmh)} km/h). Hazard from falling branches or debris.`;
  }

  if (code === 0) {
    condition = 'Clear Sky';
  } else if (code === 1 || code === 2 || code === 3) {
    condition = code === 1 ? 'Mainly Clear' : code === 2 ? 'Partly Cloudy' : 'Overcast';
  } else if (code === 45 || code === 48) {
    condition = 'Foggy';
  } else if (code >= 51 && code <= 55) {
    condition = 'Light Drizzle';
  } else if (code >= 61 && code <= 65) {
    condition = code === 61 ? 'Slight Rain' : code === 63 ? 'Moderate Rain' : 'Heavy Rain';
    if (code === 65) {
      isExtreme = true;
      extremeReason = (extremeReason ? extremeReason + ' | ' : '') + 'Heavy Torrential Rain. Slippery footpaths and reduced visibility.';
    }
  } else if (code >= 71 && code <= 77) {
    condition = code === 71 ? 'Light Snow' : code === 73 ? 'Moderate Snow' : 'Heavy Snow / Snow Flurries';
    if (code >= 75) {
      isExtreme = true;
      extremeReason = (extremeReason ? extremeReason + ' | ' : '') + 'Heavy Snowfall. Hazardous walking conditions.';
    }
  } else if (code >= 80 && code <= 82) {
    condition = code === 82 ? 'Violent Rain Showers' : 'Rain Showers';
    if (code === 82) {
      isExtreme = true;
      extremeReason = (extremeReason ? extremeReason + ' | ' : '') + 'Violent Rain Showers. Seek indoor or covered arcades.';
    }
  } else if (code >= 95 && code <= 99) {
    condition = code >= 96 ? 'Severe Thunderstorm with Hail' : 'Thunderstorm';
    isExtreme = true;
    extremeReason = (extremeReason ? extremeReason + ' | ' : '') + 'Severe Thunderstorm / Lightning Hazard. Outdoor pedestrian hunt unsafe.';
  } else {
    condition = 'Fair';
  }

  const advisory = isExtreme 
    ? `⚠️ WEATHER ADVISORY: ${extremeReason || 'Adverse weather conditions detected.'} Prefer sheltered, indoor-accessible, or arcade-based observation points.`
    : `🌤️ CURRENT WEATHER: ${condition}, ${Math.round(tempC)}°C (${Math.round((tempC * 9/5) + 32)}°F). Suitable for pedestrian hunt.`;

  return { condition, isExtreme, extremeReason, advisory };
}

/**
 * Geocode a location string into lat/long using Open-Meteo Geocoding API
 */
async function geocodeLocation(location: string): Promise<{ latitude: number; longitude: number; name: string } | null> {
  try {
    const encoded = encodeURIComponent(location.trim());
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=1&language=en&format=json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.results) && data.results.length > 0) {
      const match = data.results[0];
      return {
        latitude: match.latitude,
        longitude: match.longitude,
        name: `${match.name}, ${match.country || ''}`
      };
    }
  } catch (err) {
    console.warn('[WeatherService] Geocoding lookup error:', err);
  }
  return null;
}

/**
 * Fetch current weather for given location name or coordinates
 */
export async function fetchCurrentWeather(locationName: string, coordinates?: { latitude: number; longitude: number }): Promise<WeatherData | null> {
  try {
    let lat: number | undefined = coordinates?.latitude;
    let lon: number | undefined = coordinates?.longitude;

    if (lat === undefined || lon === undefined) {
      const geo = await geocodeLocation(locationName);
      if (geo) {
        lat = geo.latitude;
        lon = geo.longitude;
      }
    }

    if (lat === undefined || lon === undefined) {
      return null;
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;

    const data = await res.json();
    const current = data.current;
    if (!current) return null;

    const tempC = Number(current.temperature_2m) || 20;
    const tempF = Math.round((tempC * 9/5) + 32);
    const code = Number(current.weather_code) || 0;
    const windSpeedKmh = Number(current.wind_speed_10m) || 0;
    const precipitationMm = Number(current.precipitation) || 0;

    const interpretation = interpretWmoCode(code, windSpeedKmh, tempC);

    return {
      temperatureC: Math.round(tempC),
      temperatureF: tempF,
      condition: interpretation.condition,
      isExtreme: interpretation.isExtreme,
      extremeReason: interpretation.extremeReason,
      isOutdoorSafe: !interpretation.isExtreme,
      advisoryMessage: interpretation.advisory,
      windSpeedKmh: Math.round(windSpeedKmh),
      precipitationMm: Math.round(precipitationMm * 10) / 10,
      source: 'Open-Meteo Realtime Service'
    };
  } catch (err) {
    console.warn('[WeatherService] Failed to retrieve weather data:', err);
    return null;
  }
}
