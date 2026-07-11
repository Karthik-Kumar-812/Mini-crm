
if (!getToken()) {
  window.location.href = "login.html";
}

const state = {
  page: 1,
  limit: 10,
  status: "",
  search: "",
  totalPages: 1,
  currentModalLeadId: null,
};

let searchDebounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  const admin = getStoredAdmin();
  if (admin) {
    document.getElementById("sidebar-admin-name").textContent = admin.fullName || admin.username;
  }

  initLogout();
  initMobileMenu();
  initFilters();
  initPagination();
  initModal();

  loadAnalytics();
  loadLeads();
});

// LOGOUT
function initLogout() {
  document.getElementById("logout-btn").addEventListener("click", () => {
    clearSession();
    window.location.href = "login.html";
  });
}

// MOBILE SIDEBAR TOGGLE
function initMobileMenu() {
  const toggle = document.getElementById("mobile-menu-toggle");
  const sidebar = document.getElementById("sidebar");
  toggle.addEventListener("click", () => sidebar.classList.toggle("open"));

  sidebar.querySelectorAll("[data-scroll]").forEach((link) => {
    link.addEventListener("click", () => sidebar.classList.remove("open"));
  });
}

// TOAST NOTIFICATIONS
let toastTimer = null;
function showToast(type, message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast visible ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 3500);
}

// ANALYTICS
async function loadAnalytics() {
  try {
    const { ok, data } = await apiFetch("/api/leads/analytics");
    if (!ok || !data.success) return;

    const a = data.data;
    document.getElementById("stat-total").textContent = a.totalLeads;
    document.getElementById("stat-new").textContent = a.newCount;
    document.getElementById("stat-contacted").textContent = a.contactedCount;
    document.getElementById("stat-converted").textContent = a.convertedCount;
    document.getElementById("stat-conversion").textContent = `${a.conversionRate}%`;

    renderTrendChart(a.dailyTrend || []);
  } catch (err) {
    console.error("Failed to load analytics:", err);
  }
}

function renderTrendChart(dailyTrend) {
  const container = document.getElementById("trend-bars");
  const maxCount = Math.max(...dailyTrend.map((d) => d.count), 1);

  container.innerHTML = dailyTrend
    .map((d) => {
      const heightPct = Math.round((d.count / maxCount) * 100);
      const label = new Date(d.date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "short",
      });
      return `
        <div class="trend-bar-col">
          <div class="trend-bar" style="height:${heightPct}%;" title="${d.count} lead(s) on ${d.date}"></div>
          <div class="trend-bar-label">${label}</div>
        </div>`;
    })
    .join("");
}

// FILTERS (search + status)
function initFilters() {
  document.getElementById("search-input").addEventListener("input", (e) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.search = e.target.value.trim();
      state.page = 1;
      loadLeads();
    }, 350);
  });

  document.getElementById("status-filter").addEventListener("change", (e) => {
    state.status = e.target.value;
    state.page = 1;
    loadLeads();
  });

  document.getElementById("refresh-btn").addEventListener("click", () => {
    loadLeads();
    loadAnalytics();
  });
}
// PAGINATION
function initPagination() {
  document.getElementById("prev-page-btn").addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      loadLeads();
    }
  });
  document.getElementById("next-page-btn").addEventListener("click", () => {
    if (state.page < state.totalPages) {
      state.page += 1;
      loadLeads();
    }
  });
}

// LOAD + RENDER LEADS TABLE
async function loadLeads() {
  const tbody = document.getElementById("leads-tbody");
  const emptyState = document.getElementById("empty-state");

  const params = new URLSearchParams({
    page: state.page,
    limit: state.limit,
  });
  if (state.status) params.set("status", state.status);
  if (state.search) params.set("search", state.search);

  try {
    const { ok, data } = await apiFetch(`/api/leads?${params.toString()}`);

    if (!ok || !data.success) {
      showToast("error", data.message || "Failed to load leads.");
      return;
    }

    const { leads, pagination } = data.data;
    state.totalPages = pagination.totalPages;

    if (leads.length === 0) {
      tbody.innerHTML = "";
      emptyState.style.display = "block";
    } else {
      emptyState.style.display = "none";
      tbody.innerHTML = leads.map(renderLeadRow).join("");
      attachRowHandlers();
    }

    updatePaginationUI(pagination);
  } catch (err) {
    console.error("Failed to load leads:", err);
  }
}

function renderLeadRow(lead) {
  const date = new Date(lead.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return `
    <tr data-id="${lead._id}">
      <td>
        <div class="lead-name">${escapeHtml(lead.name)}</div>
        <div class="lead-email">${escapeHtml(lead.email)}</div>
      </td>
      <td>${escapeHtml(lead.source)}</td>
      <td>
        <select class="status-select" data-id="${lead._id}">
          ${["new", "contacted", "converted", "lost"]
            .map(
              (s) =>
                `<option value="${s}" ${s === lead.status ? "selected" : ""}>${capitalize(s)}</option>`
            )
            .join("")}
        </select>
      </td>
      <td>${date}</td>
      <td>${lead.notesCount || 0}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn view-btn" data-id="${lead._id}" title="View details & notes" aria-label="View details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="icon-btn danger delete-btn" data-id="${lead._id}" title="Delete lead" aria-label="Delete lead">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
}

function attachRowHandlers() {
  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      handleStatusChange(e.target.dataset.id, e.target.value);
    });
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => openLeadModal(btn.dataset.id));
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteLead(btn.dataset.id));
  });
}

function updatePaginationUI(pagination) {
  const { page, totalPages, totalCount, limit } = pagination;
  const start = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalCount);

  document.getElementById(
    "pagination-info"
  ).textContent = `Showing ${start}–${end} of ${totalCount} lead(s) — page ${page} of ${totalPages}`;

  document.getElementById("prev-page-btn").disabled = page <= 1;
  document.getElementById("next-page-btn").disabled = page >= totalPages;
}

// STATUS UPDATE
async function handleStatusChange(id, newStatus) {
  try {
    const { ok, data } = await apiFetch(`/api/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });

    if (ok && data.success) {
      showToast("success", "Lead status updated.");
      loadAnalytics(); // counts changed
    } else {
      showToast("error", data.message || "Failed to update status.");
      loadLeads(); // revert the dropdown to the real value
    }
  } catch (err) {
    console.error("Failed to update status:", err);
  }
}

// DELETE LEAD
async function handleDeleteLead(id) {
  const confirmed = window.confirm(
    "Delete this lead permanently? This cannot be undone."
  );
  if (!confirmed) return;

  try {
    const { ok, data } = await apiFetch(`/api/leads/${id}`, { method: "DELETE" });

    if (ok && data.success) {
      showToast("success", "Lead deleted.");
      loadLeads();
      loadAnalytics();
    } else {
      showToast("error", data.message || "Failed to delete lead.");
    }
  } catch (err) {
    console.error("Failed to delete lead:", err);
  }
}

// LEAD DETAIL + NOTES MODAL
function initModal() {
  document.getElementById("modal-close-btn").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  document.getElementById("add-note-form").addEventListener("submit", handleAddNote);
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  state.currentModalLeadId = null;
}

async function openLeadModal(id) {
  try {
    const { ok, data } = await apiFetch(`/api/leads/${id}`);
    if (!ok || !data.success) {
      showToast("error", data.message || "Failed to load lead.");
      return;
    }

    state.currentModalLeadId = id;
    renderModal(data.data);
    document.getElementById("modal-overlay").classList.add("open");
  } catch (err) {
    console.error("Failed to open lead:", err);
  }
}

function renderModal(lead) {
  document.getElementById("modal-lead-name").textContent = lead.name;

  const statusBadge = document.getElementById("modal-lead-status");
  statusBadge.textContent = capitalize(lead.status);
  statusBadge.className = `badge badge-${lead.status}`;

  const emailLink = document.getElementById("modal-lead-email");
  emailLink.textContent = lead.email;
  emailLink.href = `mailto:${lead.email}`;

  document.getElementById("modal-lead-phone").textContent = lead.phone || "—";
  document.getElementById("modal-lead-source").textContent = lead.source;
  document.getElementById("modal-lead-date").textContent = new Date(
    lead.createdAt
  ).toLocaleString();
  document.getElementById("modal-lead-message").textContent =
    lead.message || "(No message provided)";

  renderNotesList(lead.notes || []);
}

function renderNotesList(notes) {
  const container = document.getElementById("modal-notes-list");

  if (notes.length === 0) {
    container.innerHTML = `<p class="note-empty">No follow-up notes yet. Add the first one below.</p>`;
    return;
  }

  const sorted = [...notes].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  container.innerHTML = sorted
    .map(
      (n) => `
      <div class="note-item">
        <div class="note-meta">${escapeHtml(n.createdBy || "admin")} &middot; ${new Date(
        n.createdAt
      ).toLocaleString()}</div>
        <div class="note-text">${escapeHtml(n.note)}</div>
      </div>`
    )
    .join("");
}

async function handleAddNote(e) {
  e.preventDefault();
  const textarea = document.getElementById("new-note-text");
  const note = textarea.value.trim();

  if (!note || note.length < 2) {
    showToast("error", "Please write a note before adding it.");
    return;
  }
  if (!state.currentModalLeadId) return;

  try {
    const { ok, data } = await apiFetch(
      `/api/leads/${state.currentModalLeadId}/notes`,
      { method: "POST", body: JSON.stringify({ note }) }
    );

    if (ok && data.success) {
      textarea.value = "";
      showToast("success", "Note added.");
      // Refresh the modal's note list + the table's note count
      openLeadModal(state.currentModalLeadId);
      loadLeads();
    } else {
      showToast("error", data.message || "Failed to add note.");
    }
  } catch (err) {
    console.error("Failed to add note:", err);
  }
}

// SMALL HELPERS
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
