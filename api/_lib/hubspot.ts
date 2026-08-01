export const HUBSPOT_OBJECT_TYPES = ['contacts', 'companies', 'deals', 'tickets'] as const;

export type HubSpotObjectType = (typeof HUBSPOT_OBJECT_TYPES)[number];

export type HubSpotRecord = {
    id: string;
    archived?: boolean;
    createdAt?: string;
    updatedAt?: string;
    properties?: Record<string, unknown>;
    associations?: Record<string, unknown>;
    [key: string]: unknown;
};

type HubSpotListResponse<T> = {
    results: T[];
    paging?: {
        next?: {
            after?: string;
        };
    };
};

async function hubspotRequest<T>(token: string, path: string): Promise<T> {
    const response = await fetch(`https://api.hubapi.com${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`HubSpot request failed for ${path}: ${response.status} ${await response.text()}`);
    }

    return (await response.json()) as T;
}

async function fetchAllPages<T>(token: string, path: string): Promise<T[]> {
    const results: T[] = [];
    let after: string | undefined;

    do {
        const url = new URL(`https://api.hubapi.com${path}`);
        url.searchParams.set('limit', '100');
        if (after) url.searchParams.set('after', after);

        const page = await hubspotRequest<HubSpotListResponse<T>>(token, `${url.pathname}${url.search}`);
        results.push(...page.results);
        after = page.paging?.next?.after;
    } while (after);

    return results;
}

async function fetchPropertyNames(token: string, objectType: HubSpotObjectType): Promise<string[]> {
    const activeProperties = await fetchAllPages<{ name?: string }>(
        token,
        `/crm/v3/properties/${objectType}?archived=false`,
    );

    return activeProperties
        .map((property) => property.name)
        .filter((name): name is string => typeof name === 'string' && name.length > 0);
}

async function fetchObjectPage(
    token: string,
    objectType: HubSpotObjectType,
    archived: boolean,
    propertyNames: string[],
): Promise<HubSpotRecord[]> {
    const results: HubSpotRecord[] = [];
    let after: string | undefined;

    do {
        const url = new URL(`https://api.hubapi.com/crm/v3/objects/${objectType}`);
        url.searchParams.set('limit', '100');
        url.searchParams.set('archived', archived ? 'true' : 'false');
        if (propertyNames.length > 0) {
            url.searchParams.set('properties', propertyNames.join(','));
        }
        if (after) url.searchParams.set('after', after);

        const page = await hubspotRequest<HubSpotListResponse<HubSpotRecord>>(token, `${url.pathname}${url.search}`);
        results.push(...page.results);
        after = page.paging?.next?.after;
    } while (after);

    return results;
}

export async function fetchHubSpotRecords(token: string, objectType: HubSpotObjectType): Promise<HubSpotRecord[]> {
    const propertyNames = await fetchPropertyNames(token, objectType).catch(() => [] as string[]);
    const activeRecords = await fetchObjectPage(token, objectType, false, propertyNames).catch(() => [] as HubSpotRecord[]);
    const archivedRecords = await fetchObjectPage(token, objectType, true, propertyNames).catch(() => [] as HubSpotRecord[]);

    return [...activeRecords, ...archivedRecords];
}

export async function fetchAllHubSpotRecords(token: string): Promise<Record<HubSpotObjectType, HubSpotRecord[]>> {
    const entries = await Promise.all(
        HUBSPOT_OBJECT_TYPES.map(async (objectType) => [objectType, await fetchHubSpotRecords(token, objectType)] as const),
    );

    return Object.fromEntries(entries) as Record<HubSpotObjectType, HubSpotRecord[]>;
}