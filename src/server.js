const path = require("path");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { db, runMigrations } = require("./db");
const { JWT_SECRET, authRequired, requireRole } = require("./middleware/auth");

runMigrations();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function findParticipantByUserId(userId) {
  return db.prepare("SELECT * FROM participants WHERE user_id = ?").get(userId);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = createToken(user);
  return res.json({ token, user: toPublicUser(user) });
});

app.post("/api/auth/logout", authRequired, (_req, res) => {
  return res.json({ ok: true });
});

app.get("/api/auth/me", authRequired, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const participant = user.role === "participant" ? findParticipantByUserId(user.id) : null;
  return res.json({ user: toPublicUser(user), participant });
});

app.get("/api/participants", authRequired, requireRole("admin"), (_req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, u.name, u.email
       FROM participants p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.id DESC`
    )
    .all();
  return res.json({ data: rows });
});

app.post("/api/participants", authRequired, requireRole("admin"), (req, res) => {
  const { name, email, password, cohort, company_name, industry, status } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const tx = db.transaction(() => {
    const passwordHash = bcrypt.hashSync(password, 10);
    const userResult = db
      .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'participant')")
      .run(name, email.toLowerCase().trim(), passwordHash);

    const participantResult = db
      .prepare(
        "INSERT INTO participants (user_id, cohort, company_name, industry, status) VALUES (?, ?, ?, ?, ?)"
      )
      .run(
        userResult.lastInsertRowid,
        cohort || null,
        company_name || null,
        industry || null,
        status || "active"
      );

    return participantResult.lastInsertRowid;
  });

  const participantId = tx();
  const created = db
    .prepare(
      `SELECT p.*, u.name, u.email
       FROM participants p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`
    )
    .get(participantId);

  return res.status(201).json({ data: created });
});

app.get("/api/participants/:id", authRequired, (req, res) => {
  const participantId = Number(req.params.id);
  if (!Number.isInteger(participantId)) {
    return res.status(400).json({ error: "Invalid participant id" });
  }

  if (req.user.role === "participant") {
    const ownParticipant = findParticipantByUserId(req.user.id);
    if (!ownParticipant || ownParticipant.id !== participantId) {
      return res.status(403).json({ error: "Forbidden" });
    }
  } else if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const participant = db
    .prepare(
      `SELECT p.*, u.name, u.email
       FROM participants p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`
    )
    .get(participantId);

  if (!participant) {
    return res.status(404).json({ error: "Participant not found" });
  }

  return res.json({ data: participant });
});

app.put("/api/participants/:id", authRequired, requireRole("admin"), (req, res) => {
  const participantId = Number(req.params.id);
  if (!Number.isInteger(participantId)) {
    return res.status(400).json({ error: "Invalid participant id" });
  }

  const current = db.prepare("SELECT * FROM participants WHERE id = ?").get(participantId);
  if (!current) {
    return res.status(404).json({ error: "Participant not found" });
  }

  const updates = {
    cohort: req.body.cohort ?? current.cohort,
    company_name: req.body.company_name ?? current.company_name,
    industry: req.body.industry ?? current.industry,
    status: req.body.status ?? current.status,
  };

  db.prepare(
    "UPDATE participants SET cohort = ?, company_name = ?, industry = ?, status = ? WHERE id = ?"
  ).run(updates.cohort, updates.company_name, updates.industry, updates.status, participantId);

  const updated = db
    .prepare(
      `SELECT p.*, u.name, u.email
       FROM participants p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`
    )
    .get(participantId);

  return res.json({ data: updated });
});

app.delete("/api/participants/:id", authRequired, requireRole("admin"), (req, res) => {
  const participantId = Number(req.params.id);
  if (!Number.isInteger(participantId)) {
    return res.status(400).json({ error: "Invalid participant id" });
  }

  const participant = db.prepare("SELECT * FROM participants WHERE id = ?").get(participantId);
  if (!participant) {
    return res.status(404).json({ error: "Participant not found" });
  }

  db.transaction(() => {
    db.prepare("DELETE FROM participants WHERE id = ?").run(participantId);
    db.prepare("DELETE FROM users WHERE id = ?").run(participant.user_id);
  })();

  return res.json({ ok: true });
});

app.get("/api/checkins", authRequired, (req, res) => {
  let rows;
  if (req.user.role === "admin") {
    rows = db
      .prepare(
        `SELECT c.*, p.company_name, u.name AS participant_name
         FROM checkins c
         JOIN participants p ON p.id = c.participant_id
         JOIN users u ON u.id = p.user_id
         ORDER BY c.sent_at DESC`
      )
      .all();
  } else if (req.user.role === "participant") {
    const participant = findParticipantByUserId(req.user.id);
    rows = db
      .prepare(
        `SELECT c.*, p.company_name, u.name AS participant_name
         FROM checkins c
         JOIN participants p ON p.id = c.participant_id
         JOIN users u ON u.id = p.user_id
         WHERE c.participant_id = ?
         ORDER BY c.sent_at DESC`
      )
      .all(participant.id);
  } else {
    rows = [];
  }

  return res.json({ data: rows });
});

app.post("/api/checkins", authRequired, requireRole("admin"), (req, res) => {
  const { participant_id, subject, message, due_at } = req.body;
  if (!participant_id || !subject || !message) {
    return res.status(400).json({ error: "participant_id, subject, and message are required" });
  }

  const participant = db.prepare("SELECT id FROM participants WHERE id = ?").get(participant_id);
  if (!participant) {
    return res.status(404).json({ error: "Participant not found" });
  }

  const result = db
    .prepare(
      "INSERT INTO checkins (participant_id, subject, message, sent_by, due_at, status) VALUES (?, ?, ?, ?, ?, 'sent')"
    )
    .run(participant_id, subject, message, req.user.id, due_at || null);

  db.prepare(
    "INSERT INTO communication_logs (entity_type, entity_id, channel, direction, subject, body, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run("checkin", result.lastInsertRowid, "platform", "outbound", subject, message, req.user.id);

  const created = db.prepare("SELECT * FROM checkins WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json({ data: created });
});

app.put("/api/checkins/:id", authRequired, requireRole("admin"), (req, res) => {
  const checkinId = Number(req.params.id);
  if (!Number.isInteger(checkinId)) {
    return res.status(400).json({ error: "Invalid checkin id" });
  }

  const current = db.prepare("SELECT * FROM checkins WHERE id = ?").get(checkinId);
  if (!current) {
    return res.status(404).json({ error: "Check-in not found" });
  }

  const updates = {
    subject: req.body.subject ?? current.subject,
    message: req.body.message ?? current.message,
    due_at: req.body.due_at ?? current.due_at,
    status: req.body.status ?? current.status,
  };

  db.prepare("UPDATE checkins SET subject = ?, message = ?, due_at = ?, status = ? WHERE id = ?").run(
    updates.subject,
    updates.message,
    updates.due_at,
    updates.status,
    checkinId
  );

  const updated = db.prepare("SELECT * FROM checkins WHERE id = ?").get(checkinId);
  return res.json({ data: updated });
});

app.delete("/api/checkins/:id", authRequired, requireRole("admin"), (req, res) => {
  const checkinId = Number(req.params.id);
  if (!Number.isInteger(checkinId)) {
    return res.status(400).json({ error: "Invalid checkin id" });
  }

  const result = db.prepare("DELETE FROM checkins WHERE id = ?").run(checkinId);
  if (!result.changes) {
    return res.status(404).json({ error: "Check-in not found" });
  }

  return res.json({ ok: true });
});

app.post("/api/checkins/:id/response", authRequired, requireRole("participant"), (req, res) => {
  const checkinId = Number(req.params.id);
  if (!Number.isInteger(checkinId)) {
    return res.status(400).json({ error: "Invalid checkin id" });
  }

  const participant = findParticipantByUserId(req.user.id);
  if (!participant) {
    return res.status(404).json({ error: "Participant profile missing" });
  }

  const checkin = db.prepare("SELECT * FROM checkins WHERE id = ?").get(checkinId);
  if (!checkin || checkin.participant_id !== participant.id) {
    return res.status(403).json({ error: "Cannot respond to this check-in" });
  }

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Response payload required" });
  }

  const result = db
    .prepare("INSERT INTO responses (checkin_id, participant_id, payload_json) VALUES (?, ?, ?)")
    .run(checkinId, participant.id, JSON.stringify(req.body));

  db.prepare("UPDATE checkins SET status = 'responded' WHERE id = ?").run(checkinId);

  db.prepare(
    "INSERT INTO communication_logs (entity_type, entity_id, channel, direction, subject, body, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    "checkin_response",
    result.lastInsertRowid,
    "platform",
    "inbound",
    `Response to check-in ${checkinId}`,
    JSON.stringify(req.body),
    req.user.id
  );

  return res.status(201).json({ ok: true, response_id: result.lastInsertRowid });
});

app.get("/api/responses", authRequired, requireRole("admin"), (_req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, c.subject, p.company_name, u.name AS participant_name
       FROM responses r
       JOIN checkins c ON c.id = r.checkin_id
       JOIN participants p ON p.id = r.participant_id
       JOIN users u ON u.id = p.user_id
       ORDER BY r.submitted_at DESC`
    )
    .all()
    .map((row) => ({ ...row, payload: safeJsonParse(row.payload_json) }));

  return res.json({ data: rows });
});

app.get("/api/surveys", authRequired, (req, res) => {
  let rows;
  if (req.user.role === "admin") {
    rows = db.prepare("SELECT * FROM surveys ORDER BY created_at DESC").all();
  } else {
    rows = db.prepare("SELECT * FROM surveys WHERE is_active = 1 ORDER BY created_at DESC").all();
  }

  const withQuestions = rows.map((survey) => {
    const questions = db
      .prepare("SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY sort_order ASC")
      .all(survey.id);
    return { ...survey, questions };
  });

  return res.json({ data: withQuestions });
});

app.post("/api/surveys", authRequired, requireRole("admin"), (req, res) => {
  const { title, description, is_active, questions } = req.body;
  if (!title || !Array.isArray(questions) || !questions.length) {
    return res.status(400).json({ error: "title and questions are required" });
  }

  const createdId = db.transaction(() => {
    const surveyResult = db
      .prepare("INSERT INTO surveys (title, description, created_by, is_active) VALUES (?, ?, ?, ?)")
      .run(title, description || null, req.user.id, is_active ? 1 : 0);

    const insertQuestion = db.prepare(
      "INSERT INTO survey_questions (survey_id, question_text, question_type, required, sort_order) VALUES (?, ?, ?, ?, ?)"
    );

    questions.forEach((question, index) => {
      insertQuestion.run(
        surveyResult.lastInsertRowid,
        question.question_text,
        question.question_type || "text",
        question.required ? 1 : 0,
        index + 1
      );
    });

    return surveyResult.lastInsertRowid;
  })();

  const created = db.prepare("SELECT * FROM surveys WHERE id = ?").get(createdId);
  return res.status(201).json({ data: created });
});

app.put("/api/surveys/:id", authRequired, requireRole("admin"), (req, res) => {
  const surveyId = Number(req.params.id);
  if (!Number.isInteger(surveyId)) {
    return res.status(400).json({ error: "Invalid survey id" });
  }

  const current = db.prepare("SELECT * FROM surveys WHERE id = ?").get(surveyId);
  if (!current) {
    return res.status(404).json({ error: "Survey not found" });
  }

  const title = req.body.title ?? current.title;
  const description = req.body.description ?? current.description;
  const isActive = req.body.is_active === undefined ? current.is_active : req.body.is_active ? 1 : 0;

  db.prepare("UPDATE surveys SET title = ?, description = ?, is_active = ? WHERE id = ?").run(
    title,
    description,
    isActive,
    surveyId
  );

  const updated = db.prepare("SELECT * FROM surveys WHERE id = ?").get(surveyId);
  return res.json({ data: updated });
});

app.delete("/api/surveys/:id", authRequired, requireRole("admin"), (req, res) => {
  const surveyId = Number(req.params.id);
  if (!Number.isInteger(surveyId)) {
    return res.status(400).json({ error: "Invalid survey id" });
  }

  const result = db.prepare("DELETE FROM surveys WHERE id = ?").run(surveyId);
  if (!result.changes) {
    return res.status(404).json({ error: "Survey not found" });
  }

  return res.json({ ok: true });
});

app.post("/api/surveys/:id/submissions", authRequired, requireRole("participant"), (req, res) => {
  const surveyId = Number(req.params.id);
  if (!Number.isInteger(surveyId)) {
    return res.status(400).json({ error: "Invalid survey id" });
  }

  if (!Array.isArray(req.body.answers) || !req.body.answers.length) {
    return res.status(400).json({ error: "answers are required" });
  }

  const hasInvalidAnswer = req.body.answers.some(
    (answer) => !answer || !Number.isInteger(Number(answer.question_id))
  );
  if (hasInvalidAnswer) {
    return res.status(400).json({ error: "Each answer must include a numeric question_id" });
  }

  const participant = findParticipantByUserId(req.user.id);
  if (!participant) {
    return res.status(404).json({ error: "Participant profile missing" });
  }

  const createdId = db.transaction(() => {
    const submission = db
      .prepare("INSERT INTO survey_submissions (survey_id, participant_id) VALUES (?, ?)")
      .run(surveyId, participant.id);

    const insertAnswer = db.prepare(
      "INSERT INTO survey_answers (submission_id, question_id, answer_text) VALUES (?, ?, ?)"
    );

    req.body.answers.forEach((answer) => {
      insertAnswer.run(submission.lastInsertRowid, answer.question_id, String(answer.answer_text || ""));
    });

    return submission.lastInsertRowid;
  })();

  return res.status(201).json({ ok: true, submission_id: createdId });
});

function calculateMetrics(filters = {}) {
  const { cohort, start, end } = filters;

  let participantWhere = "1=1";
  const participantParams = [];
  if (cohort) {
    participantWhere += " AND cohort = ?";
    participantParams.push(cohort);
  }

  let checkinWhere = "1=1";
  const checkinParams = [];
  if (start) {
    checkinWhere += " AND sent_at >= ?";
    checkinParams.push(start);
  }
  if (end) {
    checkinWhere += " AND sent_at <= ?";
    checkinParams.push(end);
  }
  if (cohort) {
    checkinWhere += " AND participant_id IN (SELECT id FROM participants WHERE cohort = ?)";
    checkinParams.push(cohort);
  }

  const totalParticipants = db
    .prepare(`SELECT COUNT(*) AS count FROM participants WHERE ${participantWhere}`)
    .get(...participantParams).count;
  const activeParticipants = db
    .prepare(`SELECT COUNT(*) AS count FROM participants WHERE status = 'active' AND ${participantWhere}`)
    .get(...participantParams).count;
  const totalCheckins = db
    .prepare(`SELECT COUNT(*) AS count FROM checkins WHERE ${checkinWhere}`)
    .get(...checkinParams).count;
  const respondedCheckins = db
    .prepare(`SELECT COUNT(*) AS count FROM checkins WHERE status = 'responded' AND ${checkinWhere}`)
    .get(...checkinParams).count;

  const responseRate = totalCheckins > 0 ? (respondedCheckins / totalCheckins) * 100 : 0;

  let responsesQuery =
    "SELECT r.payload_json FROM responses r JOIN participants p ON p.id = r.participant_id WHERE 1=1";
  const responseParams = [];
  if (cohort) {
    responsesQuery += " AND p.cohort = ?";
    responseParams.push(cohort);
  }
  if (start) {
    responsesQuery += " AND r.submitted_at >= ?";
    responseParams.push(start);
  }
  if (end) {
    responsesQuery += " AND r.submitted_at <= ?";
    responseParams.push(end);
  }

  const responses = db.prepare(responsesQuery).all(...responseParams);
  let jobsCreated = 0;
  let fundingRaised = 0;
  let revenueTotal = 0;

  responses.forEach((row) => {
    const payload = safeJsonParse(row.payload_json) || {};
    jobsCreated += Number(payload.jobs_created || 0);
    fundingRaised += Number(payload.funding_raised || 0);
    revenueTotal += Number(payload.revenue || 0);
  });

  const avgRevenue = responses.length > 0 ? revenueTotal / responses.length : 0;

  return {
    total_participants: totalParticipants,
    active_participants: activeParticipants,
    checkins_sent: totalCheckins,
    response_rate: Number(responseRate.toFixed(2)),
    jobs_created: jobsCreated,
    funding_raised: fundingRaised,
    avg_reported_revenue: Number(avgRevenue.toFixed(2)),
  };
}

app.get("/api/metrics/dashboard", authRequired, requireRole("admin", "funder"), (req, res) => {
  const metrics = calculateMetrics({
    cohort: req.query.cohort,
    start: req.query.start,
    end: req.query.end,
  });
  return res.json({ data: metrics });
});

app.get("/api/funder-updates", authRequired, requireRole("admin", "funder"), (_req, res) => {
  const rows = db
    .prepare(
      `SELECT fu.*, u.name AS sender_name
       FROM funder_updates fu
       JOIN users u ON u.id = fu.sent_by
       ORDER BY fu.sent_at DESC`
    )
    .all();
  return res.json({ data: rows });
});

app.post("/api/funder-updates", authRequired, requireRole("admin"), (req, res) => {
  const { title, summary, audience, follow_up_status } = req.body;
  if (!title || !summary || !audience) {
    return res.status(400).json({ error: "title, summary, and audience are required" });
  }

  const result = db
    .prepare(
      "INSERT INTO funder_updates (title, summary, audience, sent_by, follow_up_status) VALUES (?, ?, ?, ?, ?)"
    )
    .run(title, summary, audience, req.user.id, follow_up_status || "none");

  db.prepare(
    "INSERT INTO communication_logs (entity_type, entity_id, channel, direction, subject, body, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run("funder_update", result.lastInsertRowid, "email", "outbound", title, summary, req.user.id);

  const created = db.prepare("SELECT * FROM funder_updates WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json({ data: created });
});

app.put("/api/funder-updates/:id", authRequired, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  const current = db.prepare("SELECT * FROM funder_updates WHERE id = ?").get(id);
  if (!current) {
    return res.status(404).json({ error: "Funder update not found" });
  }

  const update = {
    title: req.body.title ?? current.title,
    summary: req.body.summary ?? current.summary,
    audience: req.body.audience ?? current.audience,
    follow_up_status: req.body.follow_up_status ?? current.follow_up_status,
  };

  db.prepare(
    "UPDATE funder_updates SET title = ?, summary = ?, audience = ?, follow_up_status = ? WHERE id = ?"
  ).run(update.title, update.summary, update.audience, update.follow_up_status, id);

  const updated = db.prepare("SELECT * FROM funder_updates WHERE id = ?").get(id);
  return res.json({ data: updated });
});

app.delete("/api/funder-updates/:id", authRequired, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare("DELETE FROM funder_updates WHERE id = ?").run(id);
  if (!result.changes) {
    return res.status(404).json({ error: "Funder update not found" });
  }
  return res.json({ ok: true });
});

app.get("/api/marketing-campaigns", authRequired, requireRole("admin"), (_req, res) => {
  const rows = db
    .prepare(
      `SELECT mc.*, u.name AS creator_name
       FROM marketing_campaigns mc
       JOIN users u ON u.id = mc.created_by
       ORDER BY mc.id DESC`
    )
    .all();
  return res.json({ data: rows });
});

app.post("/api/marketing-campaigns", authRequired, requireRole("admin"), (req, res) => {
  const { title, content, audience_segment, status } = req.body;
  if (!title || !content || !audience_segment) {
    return res.status(400).json({ error: "title, content, and audience_segment are required" });
  }

  const result = db
    .prepare(
      "INSERT INTO marketing_campaigns (title, content, audience_segment, created_by, status) VALUES (?, ?, ?, ?, ?)"
    )
    .run(title, content, audience_segment, req.user.id, status || "draft");

  const created = db.prepare("SELECT * FROM marketing_campaigns WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json({ data: created });
});

app.put("/api/marketing-campaigns/:id", authRequired, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  const current = db.prepare("SELECT * FROM marketing_campaigns WHERE id = ?").get(id);
  if (!current) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const update = {
    title: req.body.title ?? current.title,
    content: req.body.content ?? current.content,
    audience_segment: req.body.audience_segment ?? current.audience_segment,
    status: req.body.status ?? current.status,
    sent_at: req.body.sent_at ?? current.sent_at,
  };

  db.prepare(
    "UPDATE marketing_campaigns SET title = ?, content = ?, audience_segment = ?, status = ?, sent_at = ? WHERE id = ?"
  ).run(update.title, update.content, update.audience_segment, update.status, update.sent_at, id);

  const updated = db.prepare("SELECT * FROM marketing_campaigns WHERE id = ?").get(id);
  return res.json({ data: updated });
});

app.post("/api/marketing-campaigns/:id/send", authRequired, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  const current = db.prepare("SELECT * FROM marketing_campaigns WHERE id = ?").get(id);
  if (!current) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  db.prepare("UPDATE marketing_campaigns SET status = 'sent', sent_at = datetime('now') WHERE id = ?").run(id);

  db.prepare(
    "INSERT INTO communication_logs (entity_type, entity_id, channel, direction, subject, body, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run("marketing_campaign", id, "email", "outbound", current.title, current.content, req.user.id);

  const updated = db.prepare("SELECT * FROM marketing_campaigns WHERE id = ?").get(id);
  return res.json({ data: updated });
});

app.delete("/api/marketing-campaigns/:id", authRequired, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare("DELETE FROM marketing_campaigns WHERE id = ?").run(id);
  if (!result.changes) {
    return res.status(404).json({ error: "Campaign not found" });
  }
  return res.json({ ok: true });
});

app.get("/api/communication-logs", authRequired, requireRole("admin"), (_req, res) => {
  const rows = db
    .prepare(
      `SELECT cl.*, u.name AS actor_name
       FROM communication_logs cl
       JOIN users u ON u.id = cl.created_by
       ORDER BY cl.created_at DESC
       LIMIT 200`
    )
    .all();
  return res.json({ data: rows });
});

app.get("/api/exports/responses.csv", authRequired, requireRole("admin"), (_req, res) => {
  const rows = db
    .prepare(
      `SELECT r.id, r.submitted_at, u.name AS participant_name, p.company_name, c.subject, r.payload_json
       FROM responses r
       JOIN participants p ON p.id = r.participant_id
       JOIN users u ON u.id = p.user_id
       JOIN checkins c ON c.id = r.checkin_id
       ORDER BY r.submitted_at DESC`
    )
    .all();

  const header = ["id", "submitted_at", "participant_name", "company_name", "subject", "payload_json"];
  const lines = [header.join(",")];

  for (const row of rows) {
    const values = [
      row.id,
      row.submitted_at,
      row.participant_name,
      row.company_name,
      row.subject,
      row.payload_json,
    ].map((value) => {
      const raw = String(value ?? "").replaceAll('"', '""');
      return `"${raw}"`;
    });
    lines.push(values.join(","));
  }

  db.prepare(
    "INSERT INTO communication_logs (entity_type, entity_id, channel, direction, subject, body, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    "report_export",
    0,
    "platform",
    "outbound",
    "responses.csv export",
    `Exported ${rows.length} rows`,
    _req.user.id
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=responses.csv");
  return res.send(lines.join("\n"));
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
