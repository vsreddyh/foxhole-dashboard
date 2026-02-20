const BASE = 'https://war-service-live.foxholeservices.com/api/worldconquest';

// Format "TheFingersHex" → "The Fingers", "MarbanHollow" → "Marban Hollow"
export function formatMapName(name) {
    return name
        .replace(/Hex$/, '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim();
}

export async function fetchMaps() {
    const res = await fetch(`${BASE}/maps`);
    if (!res.ok) throw new Error('Failed to fetch Foxhole maps');
    const names = await res.json();
    // Sort alphabetically by display name
    return names.sort((a, b) => formatMapName(a).localeCompare(formatMapName(b)));
}

export async function fetchMapLocations(mapName) {
    const res = await fetch(`${BASE}/maps/${mapName}/static`);
    if (!res.ok) throw new Error(`Failed to fetch locations for ${mapName}`);
    const data = await res.json();
    // Return Major locations (named towns/regions) sorted alphabetically
    const locs = (data.mapTextItems ?? [])
        .filter(item => item.mapMarkerType === 'Major')
        .map(item => item.text)
        .filter(Boolean);
    return [...new Set(locs)].sort();
}
