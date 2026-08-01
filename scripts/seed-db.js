const bcrypt = require("bcryptjs");
const { db, runMigrations } = require("../src/db");

runMigrations();

const passwordHash = bcrypt.hashSync("password123", 10);

function resetData() {
  db.exec(`
    DELETE FROM survey_answers;
    DELETE FROM survey_submissions;
    DELETE FROM survey_questions;
    DELETE FROM surveys;
    DELETE FROM responses;
    DELETE FROM checkins;
    DELETE FROM marketing_campaigns;
    DELETE FROM funder_updates;
    DELETE FROM communication_logs;
    DELETE FROM participants;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);
}

function insertUsers() {
  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
  );

  const admin = insertUser.run("Program Admin", "admin@accelerator.org", passwordHash, "admin");
  const funder = insertUser.run("Funder Liaison", "funder@bank.org", passwordHash, "funder");

  const cohorts = ["Spring 2026", "Summer 2026", "Fall 2026"];
  const industries = ["Retail", "Technology", "Food", "Healthcare", "Education"];

  const participantInsert = db.prepare(
    "INSERT INTO participants (user_id, cohort, company_name, industry, status) VALUES (?, ?, ?, ?, ?)"
  );

  const participantUserIds = [];

  for (let i = 1; i <= 15; i += 1) {
    const participantName = `Participant ${i}`;
    const participantEmail = `participant${i}@example.org`;
    const companyName = `Venture ${i}`;
    const cohort = cohorts[(i - 1) % cohorts.length];
    const industry = industries[(i - 1) % industries.length];

    const user = insertUser.run(participantName, participantEmail, passwordHash, "participant");
    participantUserIds.push(user.lastInsertRowid);
    participantInsert.run(user.lastInsertRowid, cohort, companyName, industry, "active");
  }

  return {
    adminId: admin.lastInsertRowid,
    funderId: funder.lastInsertRowid,
    participantUserIds,
  };
}

function seedCheckinsAndResponses(adminId) {
  const participants = db.prepare("SELECT id FROM participants ORDER BY id ASC").all();
  const insertCheckin = db.prepare(
    "INSERT INTO checkins (participant_id, subject, message, sent_by, due_at, status) VALUES (?, ?, ?, ?, datetime('now', '+7 day'), ?)"
  );

  const insertResponse = db.prepare(
    "INSERT INTO responses (checkin_id, participant_id, payload_json) VALUES (?, ?, ?)"
  );

  participants.forEach((participant, idx) => {
    const checkin = insertCheckin.run(
      participant.id,
      `Weekly check-in #${idx + 1}`,
      "Please share updates on revenue, jobs, and customer growth.",
      adminId,
      idx % 2 === 0 ? "responded" : "sent"
    );

    if (idx % 2 === 0) {
      const payload = {
        revenue: 10000 + idx * 1500,
        jobs_created: 1 + (idx % 4),
        funding_raised: 5000 + idx * 1000,
        milestone: idx % 3 === 0 ? "Launched new product line" : "Signed new customers",
        support_needed: "Marketing strategy support",
      };
      insertResponse.run(checkin.lastInsertRowid, participant.id, JSON.stringify(payload));
    }
  });
}

function seedSurveys(adminId) {
  const insertSurvey = db.prepare(
    "INSERT INTO surveys (title, description, created_by, is_active) VALUES (?, ?, ?, 1)"
  );
  const survey = insertSurvey.run(
    "Monthly Progress Pulse",
    "Capture progress and blockers each month",
    adminId
  );

  const insertQuestion = db.prepare(
    "INSERT INTO survey_questions (survey_id, question_text, question_type, required, sort_order) VALUES (?, ?, ?, ?, ?)"
  );

  insertQuestion.run(survey.lastInsertRowid, "What was your monthly revenue?", "number", 1, 1);
  insertQuestion.run(survey.lastInsertRowid, "How many jobs did you create or retain?", "number", 1, 2);
  insertQuestion.run(survey.lastInsertRowid, "What support do you need?", "text", 0, 3);
}

function seedFunderAndMarketing(adminId) {
  const insertFunderUpdate = db.prepare(
    "INSERT INTO funder_updates (title, summary, audience, sent_by, follow_up_status) VALUES (?, ?, ?, ?, ?)"
  );

  insertFunderUpdate.run(
    "Q2 Program Impact Snapshot",
    "Participants increased median revenue by 14% with strong response rates.",
    "banks-and-funders",
    adminId,
    "scheduled"
  );

  insertFunderUpdate.run(
    "Workshop Engagement Report",
    "Attendance remains above 80% and mentorship completion improved.",
    "program-sponsors",
    adminId,
    "none"
  );

  const insertCampaign = db.prepare(
    "INSERT INTO marketing_campaigns (title, content, audience_segment, created_by, status) VALUES (?, ?, ?, ?, ?)"
  );

  insertCampaign.run(
    "Cohort Story Spotlight",
    "Meet this month's founders and learn how mentorship accelerated growth.",
    "public-newsletter",
    adminId,
    "draft"
  );

  insertCampaign.run(
    "Funder Impact Brief",
    "A concise impact summary for institutional partners.",
    "funder-segment",
    adminId,
    "draft"
  );
}

function main() {
  resetData();
  const { adminId } = insertUsers();
  seedCheckinsAndResponses(adminId);
  seedSurveys(adminId);
  seedFunderAndMarketing(adminId);

  console.log("Database seeded.");
  console.log("Admin login: admin@accelerator.org / password123");
  console.log("Funder login: funder@bank.org / password123");
  console.log("Participant login: participant1@example.org / password123");
}

main();
