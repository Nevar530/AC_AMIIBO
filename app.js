const DATA_URL = "accards.json";
const STORAGE_KEY = "ac-amiibo-owned";

const state = {
  cards: [],
  filteredCards: [],
  ownedMap: loadOwnedMap(),
  filters: {
    search: "",
    owned: "all",
    series: "",
    species: "",
    gender: "",
    personality: "",
    hobby: "",
    month: ""
  }
};

const els = {
  filterPanel: document.getElementById("filterPanel"),
  toggleFiltersBtn: document.getElementById("toggleFiltersBtn"),
  searchInput: document.getElementById("searchInput"),
  ownedFilter: document.getElementById("ownedFilter"),
  seriesFilter: document.getElementById("seriesFilter"),
  speciesFilter: document.getElementById("speciesFilter"),
  genderFilter: document.getElementById("genderFilter"),
  personalityFilter: document.getElementById("personalityFilter"),
  hobbyFilter: document.getElementById("hobbyFilter"),
  monthFilter: document.getElementById("monthFilter"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  cardsTableBody: document.getElementById("cardsTableBody"),
  showingCount: document.getElementById("showingCount"),
  ownedCount: document.getElementById("ownedCount"),
  totalCount: document.getElementById("totalCount"),
  cardModal: document.getElementById("cardModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  modalImage: document.getElementById("modalImage"),
  modalTitle: document.getElementById("modalTitle"),
  modalMeta: document.getElementById("modalMeta")
};

init();

async function init() {
  wireEvents();

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Could not load ${DATA_URL}`);
    const cards = await response.json();

    state.cards = cards.map(normalizeCard);
    populateFilters(state.cards);
    applyFilters();
  } catch (error) {
    console.error(error);
    els.cardsTableBody.innerHTML = `
      <tr>
        <td colspan="13" class="empty-row">Could not load accards.json.</td>
      </tr>
    `;
  }
}

function wireEvents() {
  els.toggleFiltersBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSidebar();
  });

  els.clearFiltersBtn.addEventListener("click", () => {
    clearFilters();
    closeSidebarOnMobile();
  });

  els.searchInput.addEventListener("input", (e) => {
    state.filters.search = e.target.value.trim().toLowerCase();
    applyFilters();
  });

  [
    ["ownedFilter", "owned"],
    ["seriesFilter", "series"],
    ["speciesFilter", "species"],
    ["genderFilter", "gender"],
    ["personalityFilter", "personality"],
    ["hobbyFilter", "hobby"],
    ["monthFilter", "month"]
  ].forEach(([elementKey, filterKey]) => {
    els[elementKey].addEventListener("change", (e) => {
      state.filters[filterKey] = e.target.value;
      applyFilters();
      closeSidebarOnMobile();
    });
  });

  els.cardsTableBody.addEventListener("change", (e) => {
    const checkbox = e.target.closest(".owned-checkbox");
    if (!checkbox) return;

    const cardId = checkbox.dataset.id;
    state.ownedMap[cardId] = checkbox.checked;
    saveOwnedMap(state.ownedMap);
    applyFilters(false);
  });

  els.cardsTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".view-btn");
    if (!btn) return;

    const cardId = btn.dataset.id;
    const card = state.cards.find((item) => item.ID === cardId);
    if (card) openModal(card);
  });

  els.closeModalBtn.addEventListener("click", closeModal);

  els.cardModal.addEventListener("click", (e) => {
    if (e.target.dataset.close === "true") closeModal();
  });

  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("sidebar-open")) return;

    const clickedInsideSidebar = els.filterPanel.contains(e.target);
    const clickedToggle = els.toggleFiltersBtn.contains(e.target);

    if (!clickedInsideSidebar && !clickedToggle) {
      closeSidebar();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeSidebar();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobileView()) {
      closeSidebar();
    }
  });
}

function normalizeCard(card) {
  return {
    ...card,
    ID: String(card.ID || ""),
    SERIES: String(card.SERIES ?? ""),
    Number: String(card.Number ?? "").padStart(3, "0"),
    Day: Number(card.Day),
    _birthdaySort: makeBirthdaySortValue(card.Month, Number(card.Day))
  };
}

function populateFilters(cards) {
  fillSelect(els.seriesFilter, getUnique(cards, "SERIES"), "All");
  fillSelect(els.speciesFilter, getUnique(cards, "Species"), "All");
  fillSelect(els.genderFilter, getUnique(cards, "Gender"), "All");
  fillSelect(els.personalityFilter, getUnique(cards, "Personality"), "All");
  fillSelect(els.hobbyFilter, getUnique(cards, "Hobby"), "All");
  fillSelect(els.monthFilter, monthSort(getUnique(cards, "Month")), "All");

  els.totalCount.textContent = cards.length.toLocaleString();
}

function fillSelect(select, values, allLabel) {
  select.innerHTML = `<option value="">${allLabel}</option>`;
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value || "—";
    select.appendChild(option);
  });
}

function getUnique(cards, key) {
  return [...new Set(cards.map((card) => (card[key] ?? "").toString().trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function monthSort(months) {
  const order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return [...months].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function applyFilters(render = true) {
  const f = state.filters;

  state.filteredCards = state.cards
    .filter((card) => {
      const isOwned = !!state.ownedMap[card.ID];

      if (f.owned === "owned" && !isOwned) return false;
      if (f.owned === "missing" && isOwned) return false;
      if (f.series && card.SERIES !== f.series) return false;
      if (f.species && card.Species !== f.species) return false;
      if (f.gender && card.Gender !== f.gender) return false;
      if (f.personality && card.Personality !== f.personality) return false;
      if (f.hobby && card.Hobby !== f.hobby) return false;
      if (f.month && card.Month !== f.month) return false;

      if (f.search) {
        const haystack = [
          card.ID,
          card.SERIES,
          card.Number,
          card["English name"],
          card.Species,
          card.Gender,
          card.Personality,
          card.Hobby,
          card.Birthday,
          card.Month,
          card.Catchphrase,
          card["Favorite Song"],
          card["Favorite Saying"]
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(f.search)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.SERIES !== b.SERIES) {
        return a.SERIES.localeCompare(b.SERIES, undefined, { numeric: true });
      }
      return a.Number.localeCompare(b.Number, undefined, { numeric: true });
    });

  updateStats();

  if (render) {
    renderTable();
  } else {
    renderTable();
  }
}

function renderTable() {
  if (!state.filteredCards.length) {
    els.cardsTableBody.innerHTML = `
      <tr>
        <td colspan="13" class="empty-row">No cards match these filters.</td>
      </tr>
    `;
    return;
  }

  const rows = state.filteredCards.map((card) => {
    const isOwned = !!state.ownedMap[card.ID];

    return `
      <tr class="${isOwned ? "is-owned" : ""}">
        <td>
          <input
            class="owned-checkbox"
            type="checkbox"
            data-id="${escapeHtml(card.ID)}"
            ${isOwned ? "checked" : ""}
            aria-label="Mark ${escapeHtml(card["English name"])} as owned"
          />
        </td>
        <td><span class="id-badge">${escapeHtml(card.ID)}</span></td>
        <td>${escapeHtml(card.SERIES)}</td>
        <td>${escapeHtml(card.Number)}</td>
        <td class="name-cell">${escapeHtml(card["English name"])}</td>
        <td>${escapeHtml(card.Species || "—")}</td>
        <td>${escapeHtml(card.Gender || "—")}</td>
        <td>${escapeHtml(card.Personality || "—")}</td>
        <td>${escapeHtml(card.Hobby || "—")}</td>
        <td>${escapeHtml(card.Birthday || "—")}</td>
        <td>${escapeHtml(card.Month || "—")}</td>
        <td>${Number.isFinite(card.Day) ? card.Day : "—"}</td>
        <td>
          <button class="view-btn" type="button" data-id="${escapeHtml(card.ID)}">Show Card</button>
        </td>
      </tr>
    `;
  });

  els.cardsTableBody.innerHTML = rows.join("");
}

function updateStats() {
  els.showingCount.textContent = state.filteredCards.length.toLocaleString();
  els.ownedCount.textContent = Object.values(state.ownedMap).filter(Boolean).length.toLocaleString();
  els.totalCount.textContent = state.cards.length.toLocaleString();
}

function clearFilters() {
  state.filters = {
    search: "",
    owned: "all",
    series: "",
    species: "",
    gender: "",
    personality: "",
    hobby: "",
    month: ""
  };

  els.searchInput.value = "";
  els.ownedFilter.value = "all";
  els.seriesFilter.value = "";
  els.speciesFilter.value = "";
  els.genderFilter.value = "";
  els.personalityFilter.value = "";
  els.hobbyFilter.value = "";
  els.monthFilter.value = "";

  applyFilters();
}

function openModal(card) {
  els.modalImage.src = card.Image;
  els.modalImage.alt = `${card["English name"]} amiibo card`;
  els.modalTitle.textContent = `${card["English name"]} (${card.ID})`;

  const meta = [
    ["Series", card.SERIES],
    ["Number", card.Number],
    ["Species", card.Species],
    ["Gender", card.Gender],
    ["Personality", card.Personality || "—"],
    ["Hobby", card.Hobby || "—"],
    ["Birthday", card.Birthday || "—"],
    ["Month", card.Month || "—"],
    ["Day", Number.isFinite(card.Day) ? String(card.Day) : "—"],
    ["Catchphrase", card.Catchphrase || "—"],
    ["Favorite Song", card["Favorite Song"] || "—"],
    ["Favorite Saying", card["Favorite Saying"] || "—"]
  ];

  els.modalMeta.innerHTML = meta
    .map(
      ([label, value]) => `
        <div class="meta-row">
          <div class="meta-label">${escapeHtml(label)}</div>
          <div class="meta-value">${escapeHtml(value)}</div>
        </div>
      `
    )
    .join("");

  els.cardModal.classList.add("is-open");
  els.cardModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  els.cardModal.classList.remove("is-open");
  els.cardModal.setAttribute("aria-hidden", "true");
  els.modalImage.src = "";
}

function toggleSidebar() {
  const isOpen = els.filterPanel.classList.toggle("is-open");
  document.body.classList.toggle("sidebar-open", isOpen);
}

function closeSidebar() {
  els.filterPanel.classList.remove("is-open");
  document.body.classList.remove("sidebar-open");
}

function closeSidebarOnMobile() {
  if (isMobileView()) {
    closeSidebar();
  }
}

function isMobileView() {
  return window.innerWidth <= 960;
}

function loadOwnedMap() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveOwnedMap(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function makeBirthdaySortValue(month, day) {
  const monthMap = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12
  };

  return (monthMap[month] || 0) * 100 + (day || 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
