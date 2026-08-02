import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const objectTypes = ['contacts', 'companies', 'deals', 'tickets'];
const argv = new Set(process.argv.slice(2));
const dryRun = argv.has('--dry-run') || argv.has('-n');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

function parseEnvFile(text) {
    const env = {};

    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex === -1) continue;

        const key = trimmed.slice(0, equalsIndex).trim();
        const value = trimmed.slice(equalsIndex + 1).trim();
        env[key] = value;
    }

    return env;
}

async function loadEnv() {
    const envFile = await fs.readFile(envPath, 'utf8');
    const env = parseEnvFile(envFile);

    for (const [key, value] of Object.entries(env)) {
        if (!(key in process.env)) process.env[key] = value;
    }
}

async function hubspotRequest(token, url) {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`HubSpot request failed (${response.status}): ${await response.text()}`);
    }

    return response.json();
}

async function fetchAllPages(token, url) {
    const results = [];
    let after;

    do {
        const requestUrl = new URL(url);
        requestUrl.searchParams.set('limit', '100');
        if (after) requestUrl.searchParams.set('after', after);

        const page = await hubspotRequest(token, requestUrl.toString());
        results.push(...page.results);
        after = page.paging?.next?.after;
    } while (after);

    return results;
}

async function fetchPropertyNames(token, objectType) {
    const properties = await fetchAllPages(token, `https://api.hubapi.com/crm/v3/properties/${objectType}?archived=false`);
    return properties.map((property) => property.name).filter(Boolean);
}

async function fetchHubSpotRecords(token, objectType) {
    const propertyNames = await fetchPropertyNames(token, objectType);
    const propertyParam = propertyNames.length > 0 ? `&properties=${encodeURIComponent(propertyNames.join(','))}` : '';

    const active = await fetchAllPages(token, `https://api.hubapi.com/crm/v3/objects/${objectType}?archived=false${propertyParam}`);

    const archived = await fetchAllPages(token, `https://api.hubapi.com/crm/v3/objects/${objectType}?archived=true${propertyParam}`);

    return [...active, ...archived];
}

function getStringProperty(record, key) {
    const value = record.properties?.[key];
    return typeof value === 'string' ? value : null;
}

function getNumberProperty(record, key) {
    const value = record.properties?.[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

function toRow(objectType, record) {
    const base = {
        hubspot_id: record.id,
        archived: record.archived ?? false,
        properties: record.properties ?? {},
        raw: record,
        created_at: record.createdAt ?? null,
        updated_at: record.updatedAt ?? null,
        synced_at: new Date().toISOString(),
    };

    if (objectType === 'contacts') {
        return {
            ...base,
            email: getStringProperty(record, 'email'),
            firstname: getStringProperty(record, 'firstname'),
            lastname: getStringProperty(record, 'lastname'),
            phone: getStringProperty(record, 'phone'),
            jobtitle: getStringProperty(record, 'jobtitle'),
            lifecyclestage: getStringProperty(record, 'lifecyclestage'),
        };
    }

    if (objectType === 'companies') {
        return {
            ...base,
            name: getStringProperty(record, 'name'),
            domain: getStringProperty(record, 'domain'),
            industry: getStringProperty(record, 'industry'),
            phone: getStringProperty(record, 'phone'),
            city: getStringProperty(record, 'city'),
            state: getStringProperty(record, 'state'),
            country: getStringProperty(record, 'country'),
        };
    }

    if (objectType === 'deals') {
        return {
            ...base,
            dealname: getStringProperty(record, 'dealname'),
            amount: getNumberProperty(record, 'amount'),
            dealstage: getStringProperty(record, 'dealstage'),
            pipeline: getStringProperty(record, 'pipeline'),
            closedate: getStringProperty(record, 'closedate'),
            dealtype: getStringProperty(record, 'dealtype'),
            hubspot_owner_id: getStringProperty(record, 'hubspot_owner_id'),
        };
    }

    return {
        ...base,
        subject: getStringProperty(record, 'subject'),
        content: getStringProperty(record, 'content'),
        hs_pipeline: getStringProperty(record, 'hs_pipeline'),
        hs_pipeline_stage: getStringProperty(record, 'hs_pipeline_stage'),
        hs_ticket_category: getStringProperty(record, 'hs_ticket_category'),
        hs_ticket_priority: getStringProperty(record, 'hs_ticket_priority'),
    };
}

async function upsertBatches(client, tableName, rows) {
    for (let index = 0; index < rows.length; index += 100) {
        const batch = rows.slice(index, index + 100);
        const { error } = await client.from(tableName).upsert(batch, { onConflict: 'hubspot_id' });
        if (error) throw new Error(`${tableName}: ${error.message}`);
    }
}

async function main() {
    await loadEnv();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hubspotToken = process.env.HUBSPOT_TOKEN;

    if (!supabaseUrl || !supabaseServiceRoleKey || !hubspotToken) {
        throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and HUBSPOT_TOKEN must be set in .env');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const tableMap = {
        contacts: 'hubspot_contacts',
        companies: 'hubspot_companies',
        deals: 'hubspot_deals',
        tickets: 'hubspot_tickets',
    };

    const summary = [];
    let totalRecords = 0;

    if (dryRun) {
        console.log('Dry run: no rows will be written to Supabase.');
    }

    for (const objectType of objectTypes) {
        const records = await fetchHubSpotRecords(hubspotToken, objectType).catch((error) => {
            throw new Error(`${objectType}: ${error instanceof Error ? error.message : String(error)}`);
        });
        const rows = records.map((record) => toRow(objectType, record));
        summary.push({ objectType, records: rows.length });
        totalRecords += rows.length;

        if (!dryRun) {
            await upsertBatches(supabase, tableMap[objectType], rows);
        }
    }

    const summaryText = summary.map(({ objectType, records }) => `${objectType}=${records}`).join(', ');

    if (dryRun) {
        console.log(`Dry run summary: ${summaryText}. Total=${totalRecords}.`);
        return;
    }

    const run = {
        started_at: new Date().toISOString(),
        status: 'running',
        triggered_by: 'manual-script',
        object_count: objectTypes.length,
        record_count: totalRecords,
        summary,
    };

    const { data: runRow, error: runError } = await supabase.from('hubspot_sync_runs').insert(run).select('id').single();
    if (runError) throw new Error(`hubspot_sync_runs: ${runError.message}`);

    try {
        const finishedAt = new Date().toISOString();
        const { error: updateError } = await supabase
            .from('hubspot_sync_runs')
            .update({
                status: 'success',
                finished_at: finishedAt,
                record_count: totalRecords,
                summary,
            })
            .eq('id', runRow.id);

        if (updateError) throw new Error(`hubspot_sync_runs update: ${updateError.message}`);

        console.log(`Success summary: ${summaryText}. Total=${totalRecords}. Run id: ${runRow.id}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await supabase.from('hubspot_sync_runs').update({ status: 'failed', finished_at: new Date().toISOString(), error: message }).eq('id', runRow.id);
        throw error;
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});