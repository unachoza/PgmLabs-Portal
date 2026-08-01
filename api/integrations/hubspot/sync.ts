import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../_lib/supabaseAdmin';
import { fail, ok } from '../../_lib/respond';
import { fetchAllHubSpotRecords, HUBSPOT_OBJECT_TYPES, type HubSpotRecord, type HubSpotObjectType } from '../../_lib/hubspot';

type SyncSummary = {
    objectType: HubSpotObjectType;
    records: number;
};

const HUBSPOT_TABLES: Record<HubSpotObjectType, string> = {
    contacts: 'hubspot_contacts',
    companies: 'hubspot_companies',
    deals: 'hubspot_deals',
    tickets: 'hubspot_tickets',
};

type HubSpotRow = {
    hubspot_id: string;
    archived: boolean;
    properties: Record<string, unknown>;
    raw: HubSpotRecord;
    created_at: string | null;
    updated_at: string | null;
    synced_at: string;
    [key: string]: unknown;
};

function getProperty(record: HubSpotRecord, key: string) {
    const value = record.properties?.[key];
    return typeof value === 'string' ? value : null;
}

function getNumberProperty(record: HubSpotRecord, key: string) {
    const value = record.properties?.[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

function normalizeRecord(objectType: HubSpotObjectType, record: HubSpotRecord, syncedAt: string): HubSpotRow {
    const base = {
        hubspot_id: record.id,
        archived: record.archived ?? false,
        properties: record.properties ?? {},
        raw: record,
        created_at: record.createdAt ?? null,
        updated_at: record.updatedAt ?? null,
        synced_at: syncedAt,
    };

    if (objectType === 'contacts') {
        return {
            ...base,
            email: getProperty(record, 'email'),
            firstname: getProperty(record, 'firstname'),
            lastname: getProperty(record, 'lastname'),
            phone: getProperty(record, 'phone'),
            jobtitle: getProperty(record, 'jobtitle'),
            lifecyclestage: getProperty(record, 'lifecyclestage'),
        };
    }

    if (objectType === 'companies') {
        return {
            ...base,
            name: getProperty(record, 'name'),
            domain: getProperty(record, 'domain'),
            industry: getProperty(record, 'industry'),
            phone: getProperty(record, 'phone'),
            city: getProperty(record, 'city'),
            state: getProperty(record, 'state'),
            country: getProperty(record, 'country'),
        };
    }

    if (objectType === 'deals') {
        return {
            ...base,
            dealname: getProperty(record, 'dealname'),
            amount: getNumberProperty(record, 'amount'),
            dealstage: getProperty(record, 'dealstage'),
            pipeline: getProperty(record, 'pipeline'),
            closedate: getProperty(record, 'closedate'),
            dealtype: getProperty(record, 'dealtype'),
            hubspot_owner_id: getProperty(record, 'hubspot_owner_id'),
        };
    }

    return {
        ...base,
        subject: getProperty(record, 'subject'),
        content: getProperty(record, 'content'),
        hs_pipeline: getProperty(record, 'hs_pipeline'),
        hs_pipeline_stage: getProperty(record, 'hs_pipeline_stage'),
        hs_ticket_category: getProperty(record, 'hs_ticket_category'),
        hs_ticket_priority: getProperty(record, 'hs_ticket_priority'),
    };
}

async function upsertInBatches(tableName: string, rows: HubSpotRow[], batchSize = 100) {
    for (let index = 0; index < rows.length; index += batchSize) {
        const batch = rows.slice(index, index + batchSize);
        const { error } = await supabaseAdmin.from(tableName).upsert(batch, {
            onConflict: 'hubspot_id',
        });

        if (error) throw new Error(error.message);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return fail(res, 405, 'Method not allowed.');
    }

    if (process.env.NODE_ENV === 'production' && req.headers['x-vercel-cron'] !== '1') {
        return fail(res, 403, 'This endpoint is reserved for the Vercel cron job.');
    }

    const hubspotToken = process.env.HUBSPOT_TOKEN;
    if (!hubspotToken) {
        return fail(res, 500, 'HUBSPOT_TOKEN must be set.');
    }

    const startedAt = new Date().toISOString();
    const runId = crypto.randomUUID();

    const { error: runInsertError } = await supabaseAdmin.from('hubspot_sync_runs').insert({
        id: runId,
        status: 'running',
        started_at: startedAt,
        triggered_by: req.headers['x-vercel-cron'] === '1' ? 'vercel-cron' : 'manual',
        summary: {},
    });
    if (runInsertError) return fail(res, 500, runInsertError.message);

    try {
        const fetched = await fetchAllHubSpotRecords(hubspotToken);
        const summary: SyncSummary[] = [];

        for (const objectType of HUBSPOT_OBJECT_TYPES) {
            const syncedAt = new Date().toISOString();
            const records = fetched[objectType].map((record) => normalizeRecord(objectType, record, syncedAt));
            await upsertInBatches(HUBSPOT_TABLES[objectType], records);
            summary.push({ objectType, records: records.length });
        }

        const finishedAt = new Date().toISOString();
        await supabaseAdmin
            .from('hubspot_sync_runs')
            .update({
                status: 'success',
                finished_at: finishedAt,
                object_count: HUBSPOT_OBJECT_TYPES.length,
                record_count: summary.reduce((total, item) => total + item.records, 0),
                summary,
            })
            .eq('id', runId);

        return ok(res, { runId, startedAt, finishedAt, summary });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'HubSpot sync failed.';

        await supabaseAdmin
            .from('hubspot_sync_runs')
            .update({
                status: 'failed',
                finished_at: new Date().toISOString(),
                error: message,
            })
            .eq('id', runId);

        return fail(res, 500, message);
    }
}