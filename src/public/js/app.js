const state = {
  token: localStorage.getItem("token") || "",
  user: null,
};

const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const activeUser = document.getElementById("activeUser");
const logoutBtn = document.getElementById("logoutBtn");
const roleNav = document.getElementById("roleNav");
const dashboard = document.getElementById("dashboard");

const sectionsByRole = {
  admin: ["Overview", "Participants", "Check-ins", "Responses", "Funders", "Marketing"],
  participant: ["My Overview", "My Check-ins", "Surveys"],
  funder: ["Program Metrics", "Funder Updates"],
};

loginForm.addEventListener("submit", handleLogin);
logoutBtn.addEventListener("click", handleLogout);

boot();

async function boot() {
  if (!state.token) {
    showLogin();
    return;
  }

  try {
    const me = await api("/api/auth/me");
    state.user = me.user;
    renderApp();
    await renderDefaultView();
  } catch {
    showLogin();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  loginError.classList.add("hidden");

  const payload = {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
  };

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || "Login failed");
    }

    state.token = body.token;
    state.user = body.user;
    localStorage.setItem("token", state.token);

    renderApp();
    await renderDefaultView();
  } catch (error) {
    loginError.textContent = error.message;
    loginError.classList.remove("hidden");
  }
}

function handleLogout() {
  state.token = "";
  state.user = null;
  localStorage.removeItem("token");
  showLogin();
}

function showLogin() {
  loginSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  activeUser.classList.add("hidden");
  logoutBtn.classList.add("hidden");
}

function renderApp() {
  loginSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  activeUser.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  activeUser.textContent = `${state.user.name} (${state.user.role})`;
  renderNav();
}

function renderNav() {
  roleNav.innerHTML = "";
  const sections = sectionsByRole[state.user.role] || [];

  sections.forEach((sectionName, index) => {
    const button = document.createElement("button");
    button.textContent = sectionName;
    button.classList.toggle("active", index === 0);
    button.addEventListener("click", async () => {
      [...roleNav.children].forEach((node) => node.classList.remove("active"));
      button.classList.add("active");
      await renderSection(sectionName);
    });
    roleNav.appendChild(button);
  });
}

async function renderDefaultView() {
  const section = sectionsByRole[state.user.role]?.[0];
  if (section) {
    await renderSection(section);
  }
}

async function renderSection(sectionName) {
  if (state.user.role === "admin") {
    return renderAdminSection(sectionName);
  }
  if (state.user.role === "participant") {
    return renderParticipantSection(sectionName);
  }
  if (state.user.role === "funder") {
    return renderFunderSection(sectionName);
  }
}

async function renderAdminSection(sectionName) {
  if (sectionName === "Overview") {
    const metrics = await api("/api/metrics/dashboard");
    dashboard.innerHTML = `
      <article class="panel span-8">
        <h3>Program Snapshot</h3>
        <div class="kpis">
          ${kpi("Total Participants", metrics.data.total_participants)}
          ${kpi("Active Participants", metrics.data.active_participants)}
          ${kpi("Check-ins Sent", metrics.data.checkins_sent)}
          ${kpi("Response Rate", `${metrics.data.response_rate}%`)}
          ${kpi("Jobs Created", metrics.data.jobs_created)}
          ${kpi("Funding Raised", `$${number(metrics.data.funding_raised)}`)}
        </div>
      </article>
      <article class="panel span-4">
        <h3>Export</h3>
        <p>Download all check-in responses for external reporting.</p>
        <a class="btn ghost" href="/api/exports/responses.csv" target="_blank">Export CSV</a>
      </article>
    `;
    return;
  }

  if (sectionName === "Participants") {
    const participants = await api("/api/participants");
    dashboard.innerHTML = `
      <article class="panel span-6">
        <h3>Add Participant</h3>
        <form id="participantCreate" class="inline-form">
          <input name="name" placeholder="Full name" required />
          <input name="email" placeholder="Email" required />
          <input name="password" placeholder="Temporary password" required />
          <input name="cohort" placeholder="Cohort" />
          <input name="company_name" placeholder="Company" />
          <input name="industry" placeholder="Industry" />
          <button class="btn primary" type="submit">Create Participant</button>
        </form>
      </article>
      <article class="panel span-6">
        <h3>Participant Directory</h3>
        ${participantsTable(participants.data)}
      </article>
    `;

    document.getElementById("participantCreate").addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const payload = Object.fromEntries(formData.entries());
      await api("/api/participants", { method: "POST", body: payload });
      await renderAdminSection("Participants");
    });
    return;
  }

  if (sectionName === "Check-ins") {
    const [participants, checkins] = await Promise.all([api("/api/participants"), api("/api/checkins")]);
    dashboard.innerHTML = `
      <article class="panel span-4">
        <h3>Send Check-in</h3>
        <form id="checkinCreate" class="inline-form">
          <select name="participant_id" required>
            <option value="">Select participant</option>
            ${participants.data
              .map((participant) => `<option value="${participant.id}">${participant.name} - ${participant.company_name || "N/A"}</option>`)
              .join("")}
          </select>
          <input name="subject" placeholder="Subject" required />
          <textarea name="message" placeholder="Message" required></textarea>
          <input name="due_at" type="date" />
          <button class="btn primary" type="submit">Send</button>
        </form>
      </article>
      <article class="panel span-8">
        <h3>Recent Check-ins</h3>
        ${checkinsTable(checkins.data)}
      </article>
    `;

    document.getElementById("checkinCreate").addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const payload = Object.fromEntries(formData.entries());
      await api("/api/checkins", { method: "POST", body: payload });
      await renderAdminSection("Check-ins");
    });
    return;
  }

  if (sectionName === "Responses") {
    const responses = await api("/api/responses");
    dashboard.innerHTML = `
      <article class="panel span-12">
        <h3>Participant Responses</h3>
        <input id="responseSearch" placeholder="Search by participant, subject, or payload..." />
        ${responsesTable(responses.data)}
      </article>
    `;

    const input = document.getElementById("responseSearch");
    input.addEventListener("input", () => {
      const term = input.value.trim().toLowerCase();
      const filtered = responses.data.filter((row) => {
        const payload = JSON.stringify(row.payload || {}).toLowerCase();
        return (
          row.participant_name.toLowerCase().includes(term) ||
          row.subject.toLowerCase().includes(term) ||
          payload.includes(term)
        );
      });
      const container = dashboard.querySelector(".table-wrap");
      container.outerHTML = responsesTable(filtered);
    });
    return;
  }

  if (sectionName === "Funders") {
    const updates = await api("/api/funder-updates");
    dashboard.innerHTML = `
      <article class="panel span-5">
        <h3>Create Funder Update</h3>
        <form id="funderUpdateCreate" class="inline-form">
          <input name="title" placeholder="Title" required />
          <textarea name="summary" placeholder="Summary" required></textarea>
          <input name="audience" placeholder="Audience" required />
          <select name="follow_up_status">
            <option value="none">None</option>
            <option value="scheduled">Scheduled</option>
            <option value="done">Done</option>
          </select>
          <button class="btn primary" type="submit">Publish Update</button>
        </form>
      </article>
      <article class="panel span-7">
        <h3>Funder Communication Feed</h3>
        ${funderUpdatesTable(updates.data)}
      </article>
    `;

    document.getElementById("funderUpdateCreate").addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(event.target).entries());
      await api("/api/funder-updates", { method: "POST", body: payload });
      await renderAdminSection("Funders");
    });
    return;
  }

  if (sectionName === "Marketing") {
    const campaigns = await api("/api/marketing-campaigns");
    dashboard.innerHTML = `
      <article class="panel span-5">
        <h3>Create Campaign</h3>
        <form id="campaignCreate" class="inline-form">
          <input name="title" placeholder="Campaign title" required />
          <textarea name="content" placeholder="Campaign content" required></textarea>
          <input name="audience_segment" placeholder="Audience segment" required />
          <button class="btn primary" type="submit">Save Draft</button>
        </form>
      </article>
      <article class="panel span-7">
        <h3>Campaigns</h3>
        ${campaignTable(campaigns.data)}
      </article>
    `;

    document.getElementById("campaignCreate").addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(event.target).entries());
      await api("/api/marketing-campaigns", { method: "POST", body: payload });
      await renderAdminSection("Marketing");
    });

    document.querySelectorAll("[data-send-campaign]").forEach((button) => {
      button.addEventListener("click", async () => {
        await api(`/api/marketing-campaigns/${button.dataset.sendCampaign}/send`, { method: "POST" });
        await renderAdminSection("Marketing");
      });
    });
  }
}

async function renderParticipantSection(sectionName) {
  if (sectionName === "My Overview") {
    const me = await api("/api/auth/me");
    const checkins = await api("/api/checkins");
    dashboard.innerHTML = `
      <article class="panel span-6">
        <h3>Profile</h3>
        <p><strong>Name:</strong> ${me.user.name}</p>
        <p><strong>Email:</strong> ${me.user.email}</p>
        <p><strong>Cohort:</strong> ${me.participant?.cohort || "N/A"}</p>
        <p><strong>Company:</strong> ${me.participant?.company_name || "N/A"}</p>
      </article>
      <article class="panel span-6">
        <h3>Check-in Status</h3>
        <p>Total check-ins: ${checkins.data.length}</p>
        <p>Responded: ${checkins.data.filter((item) => item.status === "responded").length}</p>
      </article>
    `;
    return;
  }

  if (sectionName === "My Check-ins") {
    const checkins = await api("/api/checkins");
    dashboard.innerHTML = `
      <article class="panel span-12">
        <h3>My Check-ins</h3>
        ${participantCheckinsTable(checkins.data)}
      </article>
    `;

    document.querySelectorAll("[data-respond-checkin]").forEach((button) => {
      button.addEventListener("click", async () => {
        const checkinId = button.dataset.respondCheckin;
        const textArea = document.querySelector(`[data-response-body='${checkinId}']`);
        const payload = {
          milestone: textArea.value,
          revenue: 0,
          jobs_created: 0,
          funding_raised: 0,
          support_needed: ""
        };
        await api(`/api/checkins/${checkinId}/response`, { method: "POST", body: payload });
        await renderParticipantSection("My Check-ins");
      });
    });
    return;
  }

  if (sectionName === "Surveys") {
    const surveys = await api("/api/surveys");
    dashboard.innerHTML = `
      <article class="panel span-12">
        <h3>Available Surveys</h3>
        ${surveys.data
          .map(
            (survey) => `
          <div class="card" style="margin-top:10px;">
            <h4>${survey.title}</h4>
            <p>${survey.description || "No description"}</p>
            <small>Questions: ${survey.questions.length}</small>
            <form class="inline-form" data-survey-submit="${survey.id}">
              ${survey.questions
                .map(
                  (question) =>
                    `<label>${question.question_text}<input name="q_${question.id}" ${
                      question.required ? "required" : ""
                    } /></label>`
                )
                .join("")}
              <button class="btn primary" type="submit">Submit Survey</button>
            </form>
          </div>
        `
          )
          .join("")}
      </article>
    `;

    document.querySelectorAll("[data-survey-submit]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const surveyId = form.dataset.surveySubmit;
        const formData = new FormData(form);
        const answers = [];
        for (const [key, value] of formData.entries()) {
          if (key.startsWith("q_")) {
            answers.push({
              question_id: Number(key.slice(2)),
              answer_text: value,
            });
          }
        }

        await api(`/api/surveys/${surveyId}/submissions`, {
          method: "POST",
          body: { answers },
        });

        form.reset();
        alert("Survey submitted.");
      });
    });
  }
}

async function renderFunderSection(sectionName) {
  if (sectionName === "Program Metrics") {
    const metrics = await api("/api/metrics/dashboard");
    dashboard.innerHTML = `
      <article class="panel span-4">
        <h3>Filters</h3>
        <form id="metricsFilterForm" class="inline-form">
          <input name="cohort" placeholder="Cohort (optional)" />
          <label>Start date<input name="start" type="date" /></label>
          <label>End date<input name="end" type="date" /></label>
          <button class="btn primary" type="submit">Apply</button>
        </form>
      </article>
      <article class="panel span-8" id="metricsPanel">
        <h3>Program Performance Dashboard</h3>
        <div class="kpis">
          ${kpi("Total Participants", metrics.data.total_participants)}
          ${kpi("Active Participants", metrics.data.active_participants)}
          ${kpi("Check-ins Sent", metrics.data.checkins_sent)}
          ${kpi("Response Rate", `${metrics.data.response_rate}%`)}
          ${kpi("Jobs Created", metrics.data.jobs_created)}
          ${kpi("Capital Raised", `$${number(metrics.data.funding_raised)}`)}
        </div>
      </article>
    `;

    document.getElementById("metricsFilterForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const params = new URLSearchParams();
      const values = Object.fromEntries(new FormData(event.target).entries());
      if (values.cohort) {
        params.set("cohort", values.cohort);
      }
      if (values.start) {
        params.set("start", values.start);
      }
      if (values.end) {
        params.set("end", values.end);
      }

      const filtered = await api(`/api/metrics/dashboard?${params.toString()}`);
      document.getElementById("metricsPanel").innerHTML = `
        <h3>Program Performance Dashboard</h3>
        <div class="kpis">
          ${kpi("Total Participants", filtered.data.total_participants)}
          ${kpi("Active Participants", filtered.data.active_participants)}
          ${kpi("Check-ins Sent", filtered.data.checkins_sent)}
          ${kpi("Response Rate", `${filtered.data.response_rate}%`)}
          ${kpi("Jobs Created", filtered.data.jobs_created)}
          ${kpi("Capital Raised", `$${number(filtered.data.funding_raised)}`)}
        </div>
      `;
    });

    return;
  }

  if (sectionName === "Funder Updates") {
    const updates = await api("/api/funder-updates");
    dashboard.innerHTML = `
      <article class="panel span-12">
        <h3>Program Updates</h3>
        ${funderUpdatesTable(updates.data)}
      </article>
    `;
  }
}

async function api(url, options = {}) {
  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    },
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || "Request failed");
  }

  return body;
}

function kpi(label, value) {
  return `<div class="kpi"><span>${label}</span><strong>${value}</strong></div>`;
}

function participantsTable(rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Cohort</th><th>Company</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr><td>${row.name}</td><td>${row.email}</td><td>${row.cohort || "-"}</td><td>${row.company_name || "-"}</td><td>${row.status}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function checkinsTable(rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Participant</th><th>Subject</th><th>Status</th><th>Due</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr><td>${row.participant_name}</td><td>${row.subject}</td><td>${row.status}</td><td>${row.due_at || "-"}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function responsesTable(rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Submitted</th><th>Participant</th><th>Subject</th><th>Payload</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr><td>${row.submitted_at}</td><td>${row.participant_name}</td><td>${row.subject}</td><td><pre>${JSON.stringify(row.payload, null, 2)}</pre></td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function funderUpdatesTable(rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Date</th><th>Title</th><th>Audience</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr><td>${row.sent_at}</td><td>${row.title}</td><td>${row.audience}</td><td>${row.follow_up_status}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function campaignTable(rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Title</th><th>Audience</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr><td>${row.title}</td><td>${row.audience_segment}</td><td>${row.status}</td><td>${
                  row.status === "draft"
                    ? `<button class="btn ghost" data-send-campaign="${row.id}">Send</button>`
                    : "Sent"
                }</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function participantCheckinsTable(rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Subject</th><th>Message</th><th>Status</th><th>Reply</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
              <tr>
                <td>${row.subject}</td>
                <td>${row.message}</td>
                <td>${row.status}</td>
                <td>
                  ${
                    row.status === "responded"
                      ? "Responded"
                      : `<textarea data-response-body='${row.id}' placeholder='Add your update'></textarea><button class='btn primary' data-respond-checkin='${row.id}'>Submit</button>`
                  }
                </td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function number(value) {
  return Number(value || 0).toLocaleString();
}
