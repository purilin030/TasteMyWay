document.addEventListener("DOMContentLoaded", () => {
  // —— 简易选择器
  const $ = (sel, root = document) => root.querySelector(sel);

  // —— 基础节点
  const titleInput = $("#titleInput");
  const dateInput = $("#dateInput");
  const paraList = $("#paragraphInputs");
  const addParaBtn = $("#addParaBtn");
  const submitBtn = $("#submitBtn");

  // ====== food.json：加载 + 右侧列表 + datalist ======
  const foodListEl = document.getElementById("foodItems");
  const datalistEl = document.getElementById("foodIdOptions");
  let foodIndex = {}; // { id -> {id,name,place,...} }

  async function loadFoods() {
    try {
      const res = await fetch("../../FoodDetail/json/food.json");
      const data = await res.json();
      foodIndex = Object.fromEntries((data || []).map(f => [String(f.id), f]));
      if (datalistEl) {
        datalistEl.innerHTML = (data || [])
          .map(f => `<option value="${String(f.id)}">${f.name || ""}</option>`).join("");
      }
      if (foodListEl) {
        foodListEl.innerHTML = (data || [])
          .map(f => `
            <li>
              <div class="id">${String(f.id)}</div>
              <div class="name">${f.name || ""}</div>
              <div class="place">${f.place || ""}</div>
            </li>
          `).join("");
      }
      // 初次加载后刷新每一行的 hint
      refreshAllFoodHints();
    } catch (e) {
      console.warn("Failed to load /Blog/json/food.json", e);
    }
  }
  function refreshAllFoodHints() {
    document.querySelectorAll("#paragraphInputs .para-row").forEach(row => {
      const input = row.querySelector(".food-id");
      const hint = row.querySelector(".food-id-hint");
      if (input && hint) updateFoodHint(input, hint);
    });
  }
  function updateFoodHint(input, hint) {
    const id = String((input.value || "").trim());
    if (!id) { hint.textContent = ""; hint.className = "food-id-hint"; return; }
    const f = foodIndex[id];
    if (f) { hint.textContent = `${f.name || ""}${f.place ? " · " + f.place : ""}`; hint.className = "food-id-hint ok"; }
    else { hint.textContent = "ID not found in food.json"; hint.className = "food-id-hint err"; }
  }
  loadFoods();

  // ------------------------------------------------------------
  // 1) 工具：创建一行段落（含地图联动 & 结构化字段）
  // ------------------------------------------------------------

  function wireRow(row, index = 1) {
    // 地图联动
    const locInput = row.querySelector(".loc-input");
    const mapFrame = row.querySelector(".map");
    const updateMap = () => {
      const v = (locInput?.value || "").trim();
      if (!v) { mapFrame?.removeAttribute("src"); return; }
      if (mapFrame) mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
    };
    if (locInput) {
      locInput.addEventListener("input", updateMap);
      updateMap(); // 初始有值的话立即渲染一次
    }

    // Food ID 提示
    const foodIdInput = row.querySelector(".food-id");
    const hint = row.querySelector(".food-id-hint");
    if (foodIdInput && hint) {
      const onFoodIdChange = () => updateFoodHint(foodIdInput, hint);
      foodIdInput.addEventListener("input", onFoodIdChange);
      onFoodIdChange();
    }

    // 同步“Paragraph n”标签（可选）
    const label = row.querySelector(".text-col > label");
    if (label) label.textContent = `Paragraph ${ index }:` ;
  }

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

    // —— 地址输入 → 地图预览
    const locInput = row.querySelector(".loc-input");
    const mapFrame = row.querySelector(".map");
    const updateMap = () => {
      const v = (locInput.value || "").trim();
      if (!v) { mapFrame.removeAttribute("src"); return; }
      mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
    };
    locInput.addEventListener("input", updateMap);

    // —— Food ID 即时校验（依赖已加载的 foodIndex）
    const foodIdInput = row.querySelector(".food-id");
    const hint = row.querySelector(".food-id-hint");
    function onFoodIdChange() { updateFoodHint(foodIdInput, hint); }
    foodIdInput.addEventListener("input", onFoodIdChange);
    // 初始触发一次
    onFoodIdChange();

    wireRow(row, index);
    return row;
  }

  // ------------------------------------------------------------
  // 2) 初始化：至少一行
  // ------------------------------------------------------------
  document.querySelectorAll("#paragraphInputs .para-row")
    .forEach((r, i) => wireRow(r, i + 1));

  if (!paraList.querySelector(".para-row")) {
    paraList.appendChild(createRow(1));
  }

  // ------------------------------------------------------------
  // 3) 自动草稿（sessionStorage）
  // ------------------------------------------------------------
  const DRAFT_KEY = "write_draft_v1";

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

  function saveDraft() {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(collectForm())); } catch { }
  }

  function restoreDraft() {
    let raw = null;
    try { raw = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null"); } catch { }
    if (!raw) return;

    // 标题/日期
    if (titleInput) titleInput.value = raw.title || "";
    if (dateInput && raw.date) dateInput.value = raw.date;

    // 段落数量对齐
    const need = Math.max(1, (raw.rows || []).length);
    const cur = document.querySelectorAll("#paragraphInputs .para-row").length;
    for (let i = cur; i < need; i++) addParaBtn?.click();

    // 逐行恢复（含地图刷新）
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


    // 恢复后刷一遍 Food ID 提示
    refreshAllFoodHints();
  }

  // —— 绑定自动保存
  ["input", "change"].forEach(evt => {
    document.addEventListener(evt, (e) => {
      if (e.target.closest("#paragraphInputs") || e.target === titleInput || e.target === dateInput) {
        saveDraft();
      }
    });
  });
  window.addEventListener("beforeunload", saveDraft);

  // —— 现在恢复草稿（确保已存在 .para-row）
  restoreDraft();

  // ------------------------------------------------------------
  // 4) 按钮事件
  // ------------------------------------------------------------
  addParaBtn?.addEventListener("click", () => {
    const count = paraList.querySelectorAll(".para-row").length;
    paraList.appendChild(createRow(count + 1));
    saveDraft();
    refreshAllFoodHints();
  });

  submitBtn?.addEventListener("click", () => {
    const id = "post-" + Date.now();
    const post = {
      id,
      title: titleInput?.value || "",
      date: dateInput?.value || "",
      // 查看页会读取 segments 或 paragraphs，这里用 segments
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

    // 清理草稿并跳转
    sessionStorage.removeItem(DRAFT_KEY);
    location.href = `blog-view.html?id=${encodeURIComponent(id)}`;
  });
});


