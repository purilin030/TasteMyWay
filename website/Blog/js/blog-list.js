document.addEventListener("DOMContentLoaded", () => {
  //Elements
  const listEl   = document.getElementById("list");
  const emptyEl  = document.getElementById("empty");
  const searchEl = document.getElementById("searchInput");
  const clearAll = document.getElementById("clearAllBtn");
  const tpl      = document.getElementById("cardTpl");

   // --- Storage helpers ---
  function loadPosts() {
    try { return JSON.parse(localStorage.getItem("posts") || "[]"); }
    catch { return []; }
  }
  function savePosts(posts) {
    localStorage.setItem("posts", JSON.stringify(posts));
  }

  /**
   * Normalize a segment’s display text; matches the View page rule.
   * We prefer seg.raw_experience (legacy) and fallback to seg.text.
   */
  function pickDisplayText(seg) {
    if (!seg || typeof seg !== "object") return "";
    return (seg.raw_experience || seg.text || "").trim();
  }
  
  /** Format an ISO date or plain string to yyyy-mm-dd (basic). */
  function fmtDate(d) {
    return d ? String(d).slice(0, 10) : "";
  }

  /**
   * Pick a short excerpt from the first paragraph.
   * Uses segments (new data model); falls back to paragraphs.
   */
  function excerptFrom(post, maxLen = 120) {
    const segs = Array.isArray(post.segments) ? post.segments : (post.paragraphs || []);
    const firstSeg = segs[0] || null;
    const text = pickDisplayText(firstSeg);
    const oneLine = text.replace(/\s+/g, " ").trim();
    return oneLine.length > maxLen ? oneLine.slice(0, maxLen - 1) + "…" : oneLine;
  }

  /**
   * Render a list of posts:
   * - Sort by date (desc), fallback createdAt if you add it later
   * - Filter by query across title + segment text
   * - Build cards from the <template>
   */
  function render(posts, query = "") {
    listEl.innerHTML = "";

    // Sort newest → oldest. If you later store createdAt, it will be used as fallback.
    const sorted = posts.slice().sort((a, b) => {
      const A = a.date || a.createdAt || "";
      const B = b.date || b.createdAt || "";
      return A < B ? 1 : A > B ? -1 : 0;
    });

   // Filter by lowercase query in title or any segment text
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

    // Empty state toggle
    emptyEl.hidden = filtered.length > 0;

    // Build each card from the <template>
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

      // Link into the view page with this post id
      link.href = `../html/blog-view.html?id=${encodeURIComponent(post.id)}`;

      // Per-card delete flow
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
  
  // Initial render
  render(loadPosts());

  // Live search
  searchEl?.addEventListener("input", () => render(loadPosts(), searchEl.value));

  // clear all
  clearAll?.addEventListener("click", () => {
    
    if (!confirm("Clear ALL posts? This cannot be undone.")) return;
    localStorage.removeItem("posts");
    render([], "");
  });

});


