import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
    fs
        .readFileSync('.env', 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
            const index = line.indexOf('=');
            return [line.slice(0, index), line.slice(index + 1)];
        }),
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

for (const tableName of ['hubspot_contacts', 'hubspot_companies', 'hubspot_deals', 'hubspot_tickets', 'hubspot_sync_runs']) {
    const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
    console.log(`${tableName}: ${error ? error.message : count}`);
}
