(function () {
  const items = window.ITEMS;
  const eras = window.ERAS;
  const params = new URLSearchParams(location.search);
  const state = { era: params.get("era") || "all", type: params.get("type") || "all", q: params.get("q") || "" };

  const grid = document.getElementById("grid");
  const count = document.getElementById("count");
  const empty = document.getElementById("empty");
  const qInput = document.getElementById("q");
  const headerQ = document.querySelector(".header-search input");
  const dialog = document.getElementById("item-dialog");

  const types = [...new Set(items.map((it) => it.type))];
  const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function chips(el, entries, key) {
    el.innerHTML = '<span>' + el.dataset.label + '</span>' + entries
      .map(([value, label]) => `<button class="chip" data-value="${value}" aria-pressed="${state[key] === value}">${label}</button>`)
      .join("");
    el.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      state[key] = b.dataset.value;
      el.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
      render();
    });
  }
  chips(document.getElementById("era-chips"), [["all", "전체"], ...Object.entries(eras)], "era");
  chips(document.getElementById("type-chips"), [["all", "전체"], ...types.map((t) => [t, t])], "type");

  function matches(it) {
    if (state.era !== "all" && it.era !== state.era) return false;
    if (state.type !== "all" && it.type !== state.type) return false;
    const q = state.q.trim().toLowerCase();
    if (!q) return true;
    const hay = [it.title, it.date, it.source, it.desc, it.type, eras[it.era], ...it.tags].join(" ").toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }

  function render() {
    const list = items.filter(matches).sort((a, b) => a.year - b.year);
    grid.innerHTML = list.map((it) => `
      <button class="card" data-id="${it.id}">
        <figure><img src="${it.images[0]}" alt="${escape(it.title)}" loading="lazy"></figure>
        <p class="meta">${it.date} · ${it.type} · ${eras[it.era]}</p>
        <h3>${escape(it.title)}</h3>
      </button>`).join("");
    count.innerHTML = state.q
      ? `‘${escape(state.q)}’ 검색 결과 <b>${list.length}</b>건`
      : `자료 <b>${list.length}</b>건`;
    empty.hidden = list.length > 0;

    const url = new URL(location);
    ["era", "type", "q"].forEach((k) => (state[k] && state[k] !== "all" ? url.searchParams.set(k, state[k]) : url.searchParams.delete(k)));
    history.replaceState(null, "", url);
  }

  function open(id) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    dialog.querySelector(".media").innerHTML = it.images.map((src) => `<img src="${src}" alt="${escape(it.title)}">`).join("");
    dialog.querySelector(".type").textContent = `${it.type} · ${eras[it.era]}`;
    dialog.querySelector("h2").textContent = it.title;
    dialog.querySelector(".desc").textContent = it.desc;
    dialog.querySelector("dl").innerHTML = `
      <dt>연도</dt><dd>${it.date}</dd>
      <dt>유형</dt><dd>${it.type}</dd>
      <dt>시대</dt><dd>${eras[it.era]}</dd>
      <dt>출처</dt><dd>${escape(it.source)}</dd>
      <dt>수록</dt><dd>『수원시의원으로 살다』 ${it.page}쪽</dd>`;
    dialog.showModal();
    const url = new URL(location);
    url.searchParams.set("item", id);
    history.replaceState(null, "", url);
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card) open(card.dataset.id);
  });
  dialog.querySelector(".close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    const url = new URL(location);
    url.searchParams.delete("item");
    history.replaceState(null, "", url);
  });

  qInput.value = state.q;
  if (headerQ) headerQ.value = state.q;
  qInput.addEventListener("input", () => { state.q = qInput.value; render(); });
  document.getElementById("search-form").addEventListener("submit", (e) => e.preventDefault());

  render();
  if (params.get("item")) open(params.get("item"));
})();
