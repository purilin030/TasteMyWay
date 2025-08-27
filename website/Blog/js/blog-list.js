document.addEventListener("DOMContentLoaded", () => {
  const listEl   = document.getElementById("list");
  const emptyEl  = document.getElementById("empty");
  const searchEl = document.getElementById("searchInput");
  const clearAll = document.getElementById("clearAllBtn");
  const tpl      = document.getElementById("cardTpl");

  function loadPosts() {
    try { return JSON.parse(localStorage.getItem("posts") || "[]"); }
    catch { return []; }
  }
  function savePosts(posts) {
    localStorage.setItem("posts", JSON.stringify(posts));
  }

  // —— 与 view 页一致的“选择显示文本”逻辑（暂不依赖 food.json）
  function pickDisplayText(seg) {
    if (!seg || typeof seg !== "object") return "";
    return (seg.raw_experience || seg.text || "").trim();
  }

  function fmtDate(d) {
    return d ? String(d).slice(0, 10) : "";
  }

  // —— 摘要：优先从 segments 取首段，没有时回退 paragraphs
  function excerptFrom(post, maxLen = 120) {
    const segs = Array.isArray(post.segments) ? post.segments : (post.paragraphs || []);
    const firstSeg = segs[0] || null;
    const text = pickDisplayText(firstSeg);
    const oneLine = text.replace(/\s+/g, " ").trim();
    return oneLine.length > maxLen ? oneLine.slice(0, maxLen - 1) + "…" : oneLine;
  }

  function render(posts, query = "") {
    listEl.innerHTML = "";

    // 排序：按日期倒序（无日期时按创建时间）
    const sorted = posts.slice().sort((a, b) => {
      const A = a.date || a.createdAt || "";
      const B = b.date || b.createdAt || "";
      return A < B ? 1 : A > B ? -1 : 0;
    });

    // 过滤：标题/内容匹配（segments 优先）
    const q = query.trim().toLowerCase();
    const filtered = q
      ? sorted.filter(p => {
          const title = (p.title || "").toLowerCase();
          const inTitle = title.includes(q);
          const segs2 = p.segments || p.paragraphs || [];
          const inAnySeg = segs2.some(seg =>
            pickDisplayText(seg).toLowerCase().includes(q)
          );
          return inTitle || inAnySeg;
        })
      : sorted;

    emptyEl.hidden = filtered.length > 0;

    filtered.forEach(post => {
      const node  = tpl.content.cloneNode(true);
      const link  = node.querySelector(".card-link");
      const title = node.querySelector(".card-title");
      const meta  = node.querySelector(".meta");
      const exc   = node.querySelector(".excerpt");
      const del   = node.querySelector(".delete-btn");

      title.textContent = post.title || "Untitled";
      meta.textContent  = `${fmtDate(post.date || post.createdAt)} · ${(Array.isArray(post.segments) ? post.segments : (post.paragraphs || [])).length} paragraphs`;

      exc.textContent   = excerptFrom(post);

      link.href = `../html/blog-view.html?id=${encodeURIComponent(post.id)}`;

      del.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Delete this post?")) return;
        const all = loadPosts().filter(p => p.id !== post.id);
        savePosts(all);
        render(all, searchEl.value.trim());
      });

      listEl.appendChild(node);
    });
  }
  
  // init
  render(loadPosts());

  // search
  searchEl?.addEventListener("input", () => render(loadPosts(), searchEl.value));

  // clear all
  clearAll?.addEventListener("click", () => {
    if (!confirm("Clear ALL posts? This cannot be undone.")) return;
    localStorage.removeItem("posts");
    render([], "");
  });

});
