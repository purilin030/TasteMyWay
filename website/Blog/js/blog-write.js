document.addEventListener("DOMContentLoaded", () => {
  // Short query helper for readability
  const $ = (sel, root = document) => root.querySelector(sel);

  // ---- Page elements
  const titleInput = $("#titleInput");
  const dateInput = $("#dateInput");
  const paraList = $("#paragraphInputs");
  const addParaBtn = $("#addParaBtn");
  const submitBtn = $("#submitBtn");

  // ===== Load food.json → build index + datalist + (optional) sidebar list =====
  // Keeps a quick lookup of Food by id, e.g. foodIndex["food-001"] => {id,name,...}
  const foodListEl = document.getElementById("foodItems");
  const datalistEl = document.getElementById("foodIdOptions");
  let foodIndex = {}; // { id -> {id,name,...} }

   /**
   * Fetch the master food list and render helpers (datalist / sidebar).
   * Safe to call at startup; silently fails if the file isn’t found.
   */
  async function loadFoods() {
    try {
      const res = await fetch("../../FoodDetail/json/food.json");
      const data = await res.json();
      
      // Build a dictionary: id -> item
      foodIndex = Object.fromEntries((data || []).map(f => [String(f.id), f]));
      
      // Populate <datalist> so typing a Food ID can autocomplete with the name
      if (datalistEl) {
        datalistEl.innerHTML = (data || [])
          .map(f => `<option value="${String(f.id)}">${f.name || ""}</option>`).join("");
      }
      // // (Optional) Sidebar list—if present in HTML, CANCELED
      // if (foodListEl) {
      //   foodListEl.innerHTML = (data || [])
      //     .map(f => `
      //       <li>
      //         <div class="id">${String(f.id)}</div>
      //         <div class="name">${f.name || ""}</div>
      //         <div class="place">${f.place || ""}</div>
      //       </li>
      //     `).join("");
      // }
      
      // After loading, refresh all Food ID hints in the form
      refreshAllFoodHints();
    } catch (e) {
      console.warn("Failed to load /Blog/json/food.json", e);
    }
  }
  
  /** Update every Food ID hint under each row (name or “not found”). */
  function refreshAllFoodHints() {
    document.querySelectorAll("#paragraphInputs .para-row").forEach(row => {
      const input = row.querySelector(".food-id");
      const hint = row.querySelector(".food-id-hint");
      if (input && hint) updateFoodHint(input, hint);
    });
  }
  
  /** Show a friendly hint under the Food ID field. */
  function updateFoodHint(input, hint) {
    const id = String((input.value || "").trim());
    if (!id) { hint.textContent = ""; hint.className = "food-id-hint"; return; }
    const f = foodIndex[id];
    if (f) { hint.textContent = `${f.name || ""}${f.place ? " · " + f.place : ""}`; hint.className = "food-id-hint ok"; }
    else { hint.textContent = "ID not found in food.json"; hint.className = "food-id-hint err"; }
  }
  // Kick off food list loading
  loadFoods();

   // ---------------------------------------------------------------------------
  // 1) Wiring a paragraph row: map binding + Food ID hint + label text
  // ---------------------------------------------------------------------------

   // Attach event listeners to a row that already exists in the DOM.
   // Also updates its “Paragraph n” label.
   // @param {HTMLElement} row - The .para-row element
   // @param {number} index  - 1-based paragraph index for display

  function wireRow(row, index = 1) {
    // Location → live map preview
    const locInput = row.querySelector(".loc-input");
    const mapFrame = row.querySelector(".map");
    const updateMap = () => {
      const v = (locInput?.value || "").trim();
      if (!v) { mapFrame?.removeAttribute("src"); return; }
      if (mapFrame) mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
    };
    if (locInput) {
      locInput.addEventListener("input", updateMap);
      updateMap(); // render once if it has a value
    }

    // Food ID → live hint
    const foodIdInput = row.querySelector(".food-id");
    const hint = row.querySelector(".food-id-hint");
    if (foodIdInput && hint) {
      const onFoodIdChange = () => updateFoodHint(foodIdInput, hint);
      foodIdInput.addEventListener("input", onFoodIdChange);
      onFoodIdChange();
    }

    // Paragraph label text
    const label = row.querySelector(".text-col > label");
    if (label) label.textContent = `Paragraph ${ index }:` ;
  }

   // Create a brand-new paragraph row (HTML structure) and wire it up.
   // @param {number} index - 1-based display index
   // @returns {HTMLElement} the created .para-row
  function createRow(index) {
    const row = document.createElement("div");
    row.className = "para-row";
    row.innerHTML = `
      <div class="map-col">
        <input class="loc-input" type="text"
               placeholder="Location / Address (e.g. 'Restoran Tauge Ayam, Ipoh')">
        <iframe class="map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>

      <div class="text-col">
        <label>Paragraph ${index}:</label>
        <textarea class="para-text" placeholder="Please share your experience story"></textarea>

        <div class="foodid-row">
          <label>Food ID</label>
          <input class="food-id" type="text" placeholder="e.g. food-001" list="foodIdOptions">
          <small class="food-id-hint"></small>
        </div>

        <div class="review-struct">
          <div class="rs-grid">
            <label>Rating</label>
            <select class="f-rating">
              <option value="">—</option>
              <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
            </select>

            <label>Price (MYR)</label>
            <input class="f-price-myr" type="number" step="0.01" min="0" placeholder="e.g. 12.50" />

            <label>Wait</label>
            <select class="f-wait">
              <option value="">—</option>
              <option>Short</option><option>Medium</option><option>Long</option>
            </select>

            <label>Recommend</label>
            <select class="f-reco">
              <option value="">—</option>
              <option value="no">Not recommend</option>
              <option value="ok">Neutral</option>
              <option value="yes">Recommend</option>
              <option value="strong">Strongly recommend</option>
            </select>
          </div>

          <label>Tags (CSV)</label>
          <input class="f-tags" type="text" placeholder="e.g. Halal, Spicy, Breakfast">
        </div>
      </div>
    `;

   // Map preview for this new row
    const locInput = row.querySelector(".loc-input");
    const mapFrame = row.querySelector(".map");
    const updateMap = () => {
      const v = (locInput.value || "").trim();
      if (!v) { mapFrame.removeAttribute("src"); return; }
      mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
    };
    locInput.addEventListener("input", updateMap);

    // Food ID hint for this new row
    const foodIdInput = row.querySelector(".food-id");
    const hint = row.querySelector(".food-id-hint");
    function onFoodIdChange() { updateFoodHint(foodIdInput, hint); }
    foodIdInput.addEventListener("input", onFoodIdChange);
    onFoodIdChange();

    // Finalize wiring & return
    wireRow(row, index);
    return row;
  }

 // ---------------------------------------------------------------------------
  // 2) Initialization: make sure we have at least 1 row and wire the first one
  // ---------------------------------------------------------------------------
  // The first .para-row exists in HTML; wire it now so typing updates the map.
  
  document.querySelectorAll("#paragraphInputs .para-row")
    .forEach((r, i) => wireRow(r, i + 1));

  // Safety: if no rows exist (HTML changed), create one.
  if (!paraList.querySelector(".para-row")) {
    paraList.appendChild(createRow(1));
  }

  // ---------------------------------------------------------------------------
  // 3) Draft autosave (sessionStorage)
  // ---------------------------------------------------------------------------
  const DRAFT_KEY = "write_draft_v1";

  /** Collects the entire form state; used by autosave & submit. */
  function collectForm() {
    return {
      title: titleInput?.value || "",
      date: dateInput?.value || "",
      rows: [...document.querySelectorAll("#paragraphInputs .para-row")].map(row => ({
        location: row.querySelector(".loc-input")?.value || "",
        text: row.querySelector(".para-text")?.value || "",
        food_id: row.querySelector(".food-id")?.value || "",
        rating: parseInt(row.querySelector(".f-rating")?.value || "0", 10) || null,
        price_myr: (() => {
          const v = parseFloat(row.querySelector(".f-price-myr")?.value || "");
          return Number.isFinite(v) && v >= 0 ? v : null;
        })(),
        wait: row.querySelector(".f-wait")?.value || "",
        reco: row.querySelector(".f-reco")?.value || "",
        tags: row.querySelector(".f-tags")?.value || ""
      }))
    };
  }

  /** Save the draft to sessionStorage; called on input/change and beforeunload. */
  function saveDraft() {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(collectForm())); } catch { }
  }

  /**
   * Restore a previously saved draft:
   * - Ensures the number of rows matches the draft
   * - Restores inputs per row
   * - Triggers a map refresh and Food ID hint refresh
   */
  function restoreDraft() {
    let raw = null;
    try { raw = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null"); } catch { }
    if (!raw) return;

    // Title / Date
    if (titleInput) titleInput.value = raw.title || "";
    if (dateInput && raw.date) dateInput.value = raw.date;

    // Ensure row count
    const need = Math.max(1, (raw.rows || []).length);
    const cur = document.querySelectorAll("#paragraphInputs .para-row").length;
    for (let i = cur; i < need; i++) addParaBtn?.click();

    // Restore per-row values (including map URL)
    const rows = document.querySelectorAll("#paragraphInputs .para-row");
    (raw.rows || []).forEach((seg, i) => {
      const row = rows[i]; if (!row) return;
      const loc = row.querySelector(".loc-input");
      const map = row.querySelector(".map");
      const ta = row.querySelector(".para-text");
      const fid = row.querySelector(".food-id");
      const fr = row.querySelector(".f-rating");
      const fp = row.querySelector(".f-price-myr");
      const fw = row.querySelector(".f-wait");
      const re = row.querySelector(".f-reco");
      const tg = row.querySelector(".f-tags");

      if (loc) {
        loc.value = seg.location || "";
        const v = (loc.value || "").trim();
        if (map) {
          if (!v) map.removeAttribute("src");
          else map.src = `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
        }
      }
      if (ta) ta.value = seg.text || "";
      if (fid) fid.value = seg.food_id || "";
      if (fr) fr.value = seg.rating || "";
      if (fp) fp.value = (typeof seg.price_myr === "number" ? seg.price_myr.toFixed(2) : "");
      if (fw) fw.value = seg.wait || "";
      if (re) re.value = seg.reco || "";
      if (tg) tg.value = (seg.tags || "");
    });


    // Refresh Food ID hints after restore
    refreshAllFoodHints();
  }

  // Bind autosave on any relevant input/change
  ["input", "change"].forEach(evt => {
    document.addEventListener(evt, (e) => {
      if (e.target.closest("#paragraphInputs") || e.target === titleInput || e.target === dateInput) {
        saveDraft();
      }
    });
  });
  window.addEventListener("beforeunload", saveDraft);

  // Actually restore (after rows exist)
  restoreDraft();

  // ---------------------------------------------------------------------------
  // 4) Buttons: add paragraph + submit
  // ---------------------------------------------------------------------------

  // Add another paragraph row
  addParaBtn?.addEventListener("click", () => {
    const count = paraList.querySelectorAll(".para-row").length;
    paraList.appendChild(createRow(count + 1));
    saveDraft();
    refreshAllFoodHints();
  });

  // Build a post object and persist to localStorage, then open view page
  submitBtn?.addEventListener("click", () => {
    const id = "post-" + Date.now();
    const post = {
      id,
      title: titleInput?.value || "",
      date: dateInput?.value || "",
      // View page reads .segments (fallback .paragraphs for older data)
      segments: Array.from(paraList.querySelectorAll(".para-row")).map((row, idx) => {
        const location = row.querySelector(".loc-input")?.value || "";
        const raw_experience = row.querySelector(".para-text")?.value || "";
        const food_id = row.querySelector(".food-id")?.value || "";
        const display_mode = "user";

        const rating = parseInt(row.querySelector(".f-rating")?.value || "0", 10) || null;
        const price_myr = (() => {
          const v = parseFloat(row.querySelector(".f-price-myr")?.value || "");
          return Number.isFinite(v) && v >= 0 ? v : null;
        })();
        const wait = row.querySelector(".f-wait")?.value || "";
        const reco = row.querySelector(".f-reco")?.value || "";
        const tags = (row.querySelector(".f-tags")?.value || "")
          .split(",").map(s => s.trim()).filter(Boolean);

        return {
          id: `para-${idx + 1}`,
          location,
          display_mode,
          text: raw_experience,   // 与旧字段保持兼容
          raw_experience,
          food_id,
          rating, price_myr, wait, reco, tags
        };
      })
    };

    const posts = JSON.parse(localStorage.getItem("posts") || "[]");
    posts.push(post);
    localStorage.setItem("posts", JSON.stringify(posts));

    // Clear draft and move to the View page of the new post
    sessionStorage.removeItem(DRAFT_KEY);
    location.href = `blog-view.html?id=${encodeURIComponent(id)}`;
  });
});



