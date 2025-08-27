document.addEventListener("DOMContentLoaded", () => {
  // ===== 基础工具 =====
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const escapeHTML = (s) =>
    (s ?? "").toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const safeMode = (seg) => (seg && seg.display_mode) ? seg.display_mode : "user";

  // ===== 读取当前文章 =====
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const posts = JSON.parse(localStorage.getItem("posts") || "[]");
  const post = id ? posts.find(p => p.id === id) : posts.at(-1);
  if (!post) { alert("No post found."); return; }
  window.post = post;  // 给下面的函数用

  // ===== 标题 / 元信息 =====
  $("#title").textContent = post.title || "Untitled";
  $("#meta").textContent = post.date ? `Date: ${post.date}` : "";

  // ===== 渲染段落（地图 + 正文 + 小字）=====
  const segs = post.segments || post.paragraphs || [];
  const paraWrap = $("#paragraph");
  paraWrap.innerHTML = "";
  segs.forEach((seg, i) => {
    const row = document.createElement("div");
    row.className = "entry";

    // 地图
    let mapSrc = "";
    if (seg.location) {
      const q = encodeURIComponent(seg.location);
      mapSrc = `https://www.google.com/maps?q=${q}&output=embed`;
    }

    const displayText = seg.text || seg.raw_experience || "";
    const modeText = safeMode(seg);

    row.innerHTML = `
      <div class="map-col">
        ${mapSrc
        ? `<iframe class="map" src="${mapSrc}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
        : `<span class="nomap">No location</span>`}
      </div>
      <div class="text-col">
        <h3>Paragraph ${i + 1}</h3>
        <p>${escapeHTML(displayText)}</p>
        ${seg?.food_id
        ? `<small style="color:#64748b">Food ID: ${escapeHTML(seg.food_id)} · Mode: ${escapeHTML(modeText)}</small>`
        : `<small style="color:#64748b">Mode: ${escapeHTML(modeText)}</small>`}
      </div>
    `;
    paraWrap.appendChild(row);
  });

  // ===== 简评卡片（只在卡片里包 .mr-amount，用于气泡提示）=====
  function renderStructuredSummary(seg = {}) {
    const star = (n) => !n ? "" : "★".repeat(n) + "☆".repeat(5 - n);
    // 这里返回 <span class="mr-amount" data-myr="...">RM xx.xx</span>
    const myr = (v) =>
      (typeof v === "number" && isFinite(v))
        ? `<span class="mr-amount" data-myr="${v.toFixed(2)}">RM ${v.toFixed(2)}</span>`
        : "";

    const waitZh = { Short: "Short", Medium: "Medium", Long: "Long" }[seg.wait] || "";
    const recoMap = { no: "Not recommend", ok: "Neutral", yes: "Recommend", strong: "Strongly recommend" };
    const recoTxt = recoMap[seg.reco] || "";

    const line1 = [
      seg.rating ? `Taste ${star(seg.rating)} (${seg.rating}/5)` : "",
      myr(seg.price_myr) ? `Price ${myr(seg.price_myr)}` : "",
      waitZh ? `Wait ${waitZh}` : "",
      recoTxt ? `Recommend:${recoTxt}` : ""
    ].filter(Boolean).join(" ｜ ");

    const tags = Array.isArray(seg.tags) ? seg.tags : [];
    const tagsHtml = tags.map(t => `<span class="tag-badge">${escapeHTML(t)}</span>`).join("");

    if (!line1 && !tagsHtml) return "";
    return `
      <div class="review-card">
        ${line1 ? `<div class="rc-line">${line1}</div>` : ""}
        ${tagsHtml ? `<div class="rc-tags">${tagsHtml}</div>` : ""}
      </div>
    `;
  }

  // 把卡片插入到每个段落的文字列后
  (function injectStructuredCards() {
    const container = $("#paragraph");
    const entries = $$(".entry", container);
    entries.forEach((entry, i) => {
      const seg = segs[i] || {};
      const textCol = $(".text-col", entry) || entry;
      const html = renderStructuredSummary(seg);
      if (html) textCol.insertAdjacentHTML("beforeend", html);
    });
  })();

  // ===== jQuery 版汇率函数（供挂件与“卡片气泡”共用）=====
  async function getMYRRates() {
    const CKEY = "fx_rates_myr";
    const cached = sessionStorage.getItem(CKEY);
    if (cached) { try { return JSON.parse(cached); } catch { } }

    try {
      const r = await window.jQuery.getJSON("https://api.exchangerate.host/latest?base=MYR");
      if (r && r.rates) { sessionStorage.setItem(CKEY, JSON.stringify(r.rates)); return r.rates; }
      throw new Error("bad");
    } catch {
      const r2 = await window.jQuery.getJSON("https://api.frankfurter.app/latest?from=MYR");
      if (r2 && r2.rates) { sessionStorage.setItem(CKEY, JSON.stringify(r2.rates)); return r2.rates; }
      throw new Error("bad2");
    }
  }
  const readCookie = (name) => {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : "";
  };

  // ===== 只给“卡片里的Price”加气泡（正文不处理）=====
  async function updateCardPriceTooltips() {
    const cur = readCookie("fx_currency") || "USD";
    let rates = null;
    try { rates = await getMYRRates(); } catch { }
    $$(".review-card .mr-amount").forEach(el => {
      const myr = parseFloat(el.getAttribute("data-myr") || "NaN");
      if (!rates || !rates[cur] || !isFinite(myr)) { el.removeAttribute("title"); return; }
      el.setAttribute("title", (myr * rates[cur]).toFixed(2) + " " + cur);
    });
  }

  // 初次更新卡片气泡
  updateCardPriceTooltips();

  // ===== 汇率挂件（MYR -> 其它）=====
  (function mountFxWidget() {
    const box = $("#fx-widget");
    if (!box) return;

    const firstPrice = (segs.find(s => typeof s?.price_myr === "number") || {})?.price_myr;

    box.innerHTML = `
      <label>Amount (MYR)</label>
      <input id="fx-amount" type="number" step="0.01" min="0" placeholder="100.00" ${firstPrice ? `value="${firstPrice.toFixed(2)}"` : ""} />
      <label>Convert to</label>
      <select id="fx-currency">
        <option>USD</option><option>SGD</option><option>EUR</option>
        <option>JPY</option><option>CNY</option><option>AUD</option>
      </select>
      <button id="fx-convert" type="button">Convert</button>
      <span class="fx-out" id="fx-out"></span>
    `;

    const writeCookie = (name, value, days) => {
      const d = new Date(); d.setTime(d.getTime() + days * 864e5);
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/`;
    };

    // 恢复上次选择
    const saved = readCookie("fx_currency");
    if (saved) $("#fx-currency", box).value = saved;

    // 点击Convert
    $("#fx-convert", box).addEventListener("click", async () => {
      const amt = parseFloat($("#fx-amount", box).value || "0");
      const cur = $("#fx-currency", box).value;
      if (!(amt > 0)) { $("#fx-out", box).textContent = "Please enter amount"; return; }
      try {
        const rates = await getMYRRates();
        if (!rates || !rates[cur]) throw new Error("no rate");
        $("#fx-out", box).textContent = (amt * rates[cur]).toFixed(2) + " " + cur;
        writeCookie("fx_currency", cur, 365);
        // 目标币种变了 -> 同步更新卡片气泡
        updateCardPriceTooltips();
      } catch {
        $("#fx-out", box).textContent = "Convert失败，请稍后再试";
      }
    });

    // 仅切换下拉不点按钮时，也更新卡片气泡
    $("#fx-currency", box).addEventListener("change", updateCardPriceTooltips);
  })();

  // ===== 分享栏（Facebook / X / WhatsApp / Copy）=====
  (function mountShareBar() {
    const wrap = $("#share");
    if (!wrap) return;
    const u = encodeURIComponent(location.href);
    const t = encodeURIComponent(window.post.title || "My Post");
    wrap.innerHTML = `
      <iframe src="https://www.facebook.com/plugins/share_button.php?href=${u}&layout=button_count&size=small&appId"
              width="120" height="20" style="border:none;overflow:hidden" scrolling="no"
              frameborder="0" allow="encrypted-media"></iframe>
      <a class="share-x" href="https://twitter.com/intent/tweet?url=${u}&text=${t}" target="_blank" rel="noopener">Share on X</a>
      <a class="share-wa" href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener">WhatsApp</a>
      <button id="copyLink" type="button">Copy Link</button>
    `;
    $("#copyLink")?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(location.href); alert("Link copied"); } catch { }
    });
  })();
});