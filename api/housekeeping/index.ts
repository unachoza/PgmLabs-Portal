import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../_lib/auth.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { ok, fail } from '../_lib/respond.js';

type ItemType = 'overdue_checkin' | 'risk_response' | 'pending_funder_followup' | 'inactive_participant';

type HousekeepingItem = {
  item_key: string;
  type: ItemType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  emailable: boolean;
  participant_id: string | null;
  participant_name: string | null;
  participant_email: string | null;
  suggested_subject: string | null;
  suggested_body: string | null;
  since: string;
};

const SNOOZE_DAYS = 7;
const INACTIVITY_DAYS = 30;

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');

  const caller = await requireRole(req, res, ['admin']);
  if (!caller) return;

  const items: HousekeepingItem[] = [];

  // Overdue check-ins --------------------------------------------------
  const { data: overdueCheckins, error: checkinsError } = await supabaseAdmin
    .from('checkins')
    .select('id, subject, due_at, sent_at, participant_id, participants(id, company_name, profiles(name, email))')
    .eq('status', 'overdue');
  if (checkinsError) return fail(res, 500, checkinsError.message);

  for (const checkin of overdueCheckins ?? []) {
    const participant = checkin.participants as unknown as { id: string; company_name: string | null; profiles: { name: string; email: string } | null } | null;
    const name = participant?.profiles?.name ?? 'This participant';
    const label = participant?.company_name ? `${name} (${participant.company_name})` : name;
    const dueAt = checkin.due_at ?? checkin.sent_at;
    items.push({
      item_key: `overdue_checkin:${checkin.id}`,
      type: 'overdue_checkin',
      priority: 'high',
      title: `${label} — check-in overdue`,
      description: `"${checkin.subject}" was due ${new Date(dueAt).toLocaleDateString()} and hasn't been responded to. Send a follow-up email?`,
      emailable: Boolean(participant?.profiles?.email),
      participant_id: checkin.participant_id,
      participant_name: name,
      participant_email: participant?.profiles?.email ?? null,
      suggested_subject: `Following up: ${checkin.subject}`,
      suggested_body: `Hi ${name},\n\nJust checking in on "${checkin.subject}" — it looks like this is still outstanding. Let us know how things are going or if there's anything blocking you.\n\nThanks,\nProgram Labs`,
      since: dueAt,
    });
  }

  // Risk-tagged responses without a logged follow-up --------------------
  const { data: riskTags, error: tagsError } = await supabaseAdmin
    .from('response_tags')
    .select('response_id')
    .eq('tag', 'risk');
  if (tagsError) return fail(res, 500, tagsError.message);

  const riskResponseIds = (riskTags ?? []).map((t) => t.response_id);
  if (riskResponseIds.length > 0) {
    const { data: riskResponses, error: responsesError } = await supabaseAdmin
      .from('responses')
      .select('id, participant_id, submitted_at, payload_json, participants(id, company_name, profiles(name, email))')
      .in('id', riskResponseIds);
    if (responsesError) return fail(res, 500, responsesError.message);

    const participantIds = [...new Set((riskResponses ?? []).map((r) => r.participant_id))];
    const { data: existingFollowUps, error: logsError } = await supabaseAdmin
      .from('communication_logs')
      .select('entity_id, created_at')
      .eq('entity_type', 'participant')
      .eq('direction', 'outbound')
      .in('entity_id', participantIds.length > 0 ? participantIds : ['00000000-0000-0000-0000-000000000000']);
    if (logsError) return fail(res, 500, logsError.message);

    for (const response of riskResponses ?? []) {
      const alreadyFollowedUp = (existingFollowUps ?? []).some(
        (log) => log.entity_id === response.participant_id && new Date(log.created_at) > new Date(response.submitted_at),
      );
      if (alreadyFollowedUp) continue;

      const participant = response.participants as unknown as { id: string; company_name: string | null; profiles: { name: string; email: string } | null } | null;
      const name = participant?.profiles?.name ?? 'This participant';
      const label = participant?.company_name ? `${name} (${participant.company_name})` : name;
      const challenge = typeof response.payload_json?.challenges === 'string' ? response.payload_json.challenges : null;

      items.push({
        item_key: `risk_response:${response.id}`,
        type: 'risk_response',
        priority: 'high',
        title: `${label} — flagged a risk`,
        description: challenge
          ? `Flagged in their latest response: "${challenge}". Send a follow-up email to check in?`
          : `Their latest response was tagged as a risk. Send a follow-up email to check in?`,
        emailable: Boolean(participant?.profiles?.email),
        participant_id: response.participant_id,
        participant_name: name,
        participant_email: participant?.profiles?.email ?? null,
        suggested_subject: 'Checking in after your last update',
        suggested_body: `Hi ${name},\n\nThanks for the update. We noticed you flagged a challenge and wanted to check in — is there anything the Program Labs team can help with?\n\nThanks,\nProgram Labs`,
        since: response.submitted_at,
      });
    }
  }

  // Pending funder follow-ups -------------------------------------------
  const { data: pendingUpdates, error: updatesError } = await supabaseAdmin
    .from('funder_updates')
    .select('id, title, audience, sent_at')
    .eq('follow_up_status', 'pending');
  if (updatesError) return fail(res, 500, updatesError.message);

  for (const update of pendingUpdates ?? []) {
    items.push({
      item_key: `pending_funder_followup:${update.id}`,
      type: 'pending_funder_followup',
      priority: 'medium',
      title: `${update.audience} — follow-up pending`,
      description: `Funder update "${update.title}" is awaiting follow-up. Handle it from Funder Comms, then mark this resolved.`,
      emailable: false,
      participant_id: null,
      participant_name: null,
      participant_email: null,
      suggested_subject: null,
      suggested_body: null,
      since: update.sent_at,
    });
  }

  // Inactive participants (no check-in or response in 30+ days) --------
  const { data: activeParticipants, error: participantsError } = await supabaseAdmin
    .from('participants')
    .select('id, company_name, joined_at, profiles(name, email)')
    .eq('status', 'active');
  if (participantsError) return fail(res, 500, participantsError.message);

  const { data: allCheckins, error: allCheckinsError } = await supabaseAdmin.from('checkins').select('participant_id, sent_at');
  if (allCheckinsError) return fail(res, 500, allCheckinsError.message);

  const { data: allResponses, error: allResponsesError } = await supabaseAdmin.from('responses').select('participant_id, submitted_at');
  if (allResponsesError) return fail(res, 500, allResponsesError.message);

  const lastActivityByParticipant = new Map<string, string>();
  for (const p of activeParticipants ?? []) lastActivityByParticipant.set(p.id, p.joined_at);
  for (const c of allCheckins ?? []) {
    const current = lastActivityByParticipant.get(c.participant_id);
    if (!current || new Date(c.sent_at) > new Date(current)) lastActivityByParticipant.set(c.participant_id, c.sent_at);
  }
  for (const r of allResponses ?? []) {
    const current = lastActivityByParticipant.get(r.participant_id);
    if (!current || new Date(r.submitted_at) > new Date(current)) lastActivityByParticipant.set(r.participant_id, r.submitted_at);
  }

  for (const participant of activeParticipants ?? []) {
    const lastActivity = lastActivityByParticipant.get(participant.id) ?? participant.joined_at;
    if (daysAgo(lastActivity) < INACTIVITY_DAYS) continue;

    const profile = participant.profiles as unknown as { name: string; email: string } | null;
    const name = profile?.name ?? 'This participant';
    const label = participant.company_name ? `${name} (${participant.company_name})` : name;

    items.push({
      item_key: `inactive_participant:${participant.id}`,
      type: 'inactive_participant',
      priority: 'low',
      title: `${label} — gone quiet`,
      description: `No check-in or response in the last ${daysAgo(lastActivity)} days (since ${new Date(lastActivity).toLocaleDateString()}). Send a check-in nudge?`,
      emailable: Boolean(profile?.email),
      participant_id: participant.id,
      participant_name: name,
      participant_email: profile?.email ?? null,
      suggested_subject: 'Checking in',
      suggested_body: `Hi ${name},\n\nIt's been a little while since we've heard from you. How are things going${participant.company_name ? ` with ${participant.company_name}` : ''}? Let us know if you need any support.\n\nThanks,\nProgram Labs`,
      since: lastActivity,
    });
  }

  // Suppress items the admin already responded to within the snooze window
  const { data: recentResponses, error: recentError } = await supabaseAdmin
    .from('housekeeping_responses')
    .select('item_key, responded_at')
    .gte('responded_at', new Date(Date.now() - SNOOZE_DAYS * 24 * 60 * 60 * 1000).toISOString());
  if (recentError) return fail(res, 500, recentError.message);

  const snoozedKeys = new Set((recentResponses ?? []).map((r) => r.item_key));
  const openItems = items.filter((item) => !snoozedKeys.has(item.item_key));

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  openItems.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || new Date(a.since).getTime() - new Date(b.since).getTime());

  const summary = {
    overdue_checkins: openItems.filter((i) => i.type === 'overdue_checkin').length,
    risk_responses: openItems.filter((i) => i.type === 'risk_response').length,
    pending_funder_followups: openItems.filter((i) => i.type === 'pending_funder_followup').length,
    inactive_participants: openItems.filter((i) => i.type === 'inactive_participant').length,
    total_open: openItems.length,
  };

  return ok(res, { summary, items: openItems });
}
