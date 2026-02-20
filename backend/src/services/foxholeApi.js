/**
 * Foxhole War API Service
 *
 * Checks for Warden military presence on a given map hex.
 * Uses the public dynamic endpoint which returns live mapItems:
 *   teamId: 'WARDENS' | 'COLONIALS' | 'NONE'
 *
 * Respects Cache-Control max-age and ETags per API docs.
 */

const fetch = require('node-fetch');

const BASE_URL = 'https://war-service-live.foxholeservices.com/api/worldconquest';

// In-memory cache per hex key { data, etag, expiresAt }
const cache = {};

/**
 * Fetch dynamic map data for a hex name (raw API name, e.g. "TheFingersHex").
 * Returns a threat summary object:
 *   { threatened: bool, wardenCount: int, colonialCount: int, alerts: string[] }
 */
async function getMapEvents(hexName) {
    if (!hexName) {
        return { threatened: false, wardenCount: 0, colonialCount: 0, alerts: ['No map region set for this base.'] };
    }

    const url = `${BASE_URL}/maps/${encodeURIComponent(hexName)}/dynamic/public`;
    const now = Date.now();
    const cached = cache[hexName];

    const headers = { Accept: 'application/json' };
    if (cached?.etag && now < cached.expiresAt) {
        headers['If-None-Match'] = cached.etag;
    }

    const response = await fetch(url, { headers });

    if (response.status === 304) {
        return cached.result;
    }
    if (response.status === 404) {
        return { threatened: false, wardenCount: 0, colonialCount: 0, alerts: [`Map "${hexName}" not found in Foxhole API.`] };
    }
    if (!response.ok) {
        throw new Error(`Foxhole API returned ${response.status}`);
    }

    const cc = response.headers.get('cache-control') || '';
    const maxAgeMatch = cc.match(/max-age=(\d+)/);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 60_000;
    const etag = response.headers.get('etag');

    const data = await response.json();
    const result = parseThreats(data, hexName);

    cache[hexName] = { result, etag, expiresAt: now + maxAge };
    return result;
}

/**
 * Parse map items and return threat summary.
 * Wardens = enemy (the regiment plays Colonials).
 */
function parseThreats(data, hexName) {
    if (!data || !Array.isArray(data.mapItems)) {
        return { threatened: false, wardenCount: 0, colonialCount: 0, alerts: ['No map data available.'] };
    }

    let wardenCount = 0;
    let colonialCount = 0;

    for (const item of data.mapItems) {
        if (item.teamId === 'WARDENS') wardenCount++;
        else if (item.teamId === 'COLONIALS') colonialCount++;
    }

    const threatened = wardenCount > 0;
    const alerts = [];

    if (threatened) {
        alerts.push(`⚠ THREAT: ${wardenCount} Warden structure(s) detected in ${hexName.replace(/Hex$/, '')}`);
    } else {
        alerts.push(`✓ No Warden presence detected in ${hexName.replace(/Hex$/, '')}`);
    }
    if (colonialCount > 0) {
        alerts.push(`Colonial structures present: ${colonialCount}`);
    }

    return { threatened, wardenCount, colonialCount, alerts };
}

module.exports = { getMapEvents };
