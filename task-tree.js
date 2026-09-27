(() => {
  "use strict";
  let data = window.TASK_TREE_DATA;
  if (!data) throw new Error("任务树数据未加载，请先运行 build-task-tree.mjs");
  const $ = id => document.getElementById(id);
  const {escape, detail, stats, card} = window.TaskTreeView;
  const kindNames = new Map(data.kinds.map(x => [x.id, x.label]));
  let byId = new Map(data.nodes.map(x => [x.id, x]));
  let predecessors = new Map(data.nodes.map(x => [x.id, []]));
  for (const relation of data.relations) {
    const previous = predecessors.get(relation.to);
    if (previous && !previous.includes(relation.from)) previous.push(relation.from);
  }
  let recordingCount = data.nodes.filter(n => n.videos.pinned?.some(v => v.verifiedMatch || v.userProvided)).length;
  let versions = [...data.versions, { id: "unknown", date: null }];
  const versionNames = id => id === "unknown" ? "其他版本" : /^\d/.test(id) ? `版本 ${id}` : id;
  const contentTitles = entries => (entries||[]).flatMap(e=>[e.title,...e.steps.map(s=>s.title),...contentTitles(e.children)]);
  let searchTexts = new Map(data.nodes.map(x => [x.id, [x.title, x.character, x.series, ...x.regions, ...x.members.flatMap(m => [m.title, m.summary]),...contentTitles(x.seriesContents)].join(" ").toLocaleLowerCase()]));
  const resolveId = id => byId.has(id) ? id : data.legacySeries?.[id]?.[0] || id;
  const hashId = () => { try { return resolveId(decodeURIComponent(location.hash.slice(1))); } catch { return ""; } };
  const progressKey = "teyvat-archive:task-progress:v1";
  const themeKey = "teyvat-archive:theme:v1";
  let lightTheme = false;
  try { lightTheme = localStorage.getItem(themeKey) === 'light'; } catch { /* Theme remains usable without storage. */ }
  function applyTheme() {
    document.body.classList.toggle('light', lightTheme);
    $("treeTheme").setAttribute('aria-pressed', String(lightTheme));
    $("treeTheme").setAttribute('aria-label', lightTheme ? '切换至星夜主题' : '切换至晨光主题');
    $("treeTheme").title = lightTheme ? '切换至星夜主题' : '切换至晨光主题';
  }
  applyTheme();
  let completed = new Set();
  let storageWarning = "";
  try {
    const saved = JSON.parse(localStorage.getItem(progressKey) || "[]");
    if (!Array.isArray(saved) || !saved.every(id => typeof id === "string")) throw new Error("Invalid progress data");
    completed = new Set(saved.flatMap(id => data.legacySeries?.[id] || [id]));
  } catch {
    storageWarning = "无法读取本地进度；本次仍可勾选，但请勿依赖刷新后保留。";
  }
  const state = { query: "", kind: "all", region: "all", progress: "all", selected: byId.has(hashId()) ? hashId() : "mys-399", collapsed: new Set(), zoom: .85 };
  let graph;
  if (!byId.has(state.selected)) state.selected = data.nodes[0]?.id;
  function renderProgress() {
    const count = data.nodes.filter(x => completed.has(x.id)).length;
    $("treeStats").innerHTML = stats(data.stats.nodes, count, recordingCount);
    $("progressStorageNote").textContent = storageWarning || "进度仅存于当前浏览器，清除数据后丢失。";
  }
  $("treeKind").insertAdjacentHTML("beforeend", data.kinds.map(x => `<option value="${escape(x.id)}">${escape(x.label)}</option>`).join(""));
  const regions = [...new Set(data.nodes.flatMap(x => x.regions))];
  $("treeRegion").insertAdjacentHTML("beforeend", regions.map(x => `<option value="${escape(x)}">${escape(x)}</option>`).join(""));
  $("questLegend").innerHTML = window.TaskGraphLayout.palette.map(x => `<span data-color="${escape(x.id)}"><i aria-hidden="true"></i>${escape(x.label)}</span>`).join("");

  function row(position) {
    const node = position.node;
    const color=window.TaskGraphLayout.palette[window.TaskGraphLayout.colorIndex(node.kind)].id;
    return card(position, {completed: completed.has(node.id), selected: node.id === state.selected, kindName: kindNames.get(node.kind), color});
  }
  function applyZoom() {
    if (!graph) return;
    const viewport = $("graphViewport");
    const fitZoom = Math.min(1, (viewport.clientWidth - 24) / Math.max(graph.width, 1), (viewport.clientHeight - 24) / Math.max(graph.height, 1));
    const minZoom = Math.max(0.01, Math.min(1, Math.floor(fitZoom * 100) / 100));
    const slider = $("graphZoom");
    slider.min = String(Math.max(1, Math.round(minZoom * 100)));
    if (state.zoom < minZoom) state.zoom = minZoom;
    slider.value = String(Math.round(state.zoom * 100));
    $("questTree").style.transform = `scale(${state.zoom})`;
    $("graphExtent").style.width = `${graph.width * state.zoom}px`;
    $("graphExtent").style.height = `${graph.height * state.zoom}px`;
    $("graphZoomValue").textContent = `${Math.round(state.zoom * 100)}%`;
  }
  function fitGraph() {
    if (!graph) return;
    const viewport = $("graphViewport");
    state.zoom = Math.min(1, (viewport.clientWidth - 24) / Math.max(graph.width, 1), (viewport.clientHeight - 24) / Math.max(graph.height, 1));
    applyZoom();
    viewport.scrollTo({top: 0, left: 0, behavior: scrollBehavior()});
  }
  function zoomAt(clientX, clientY, nextZoom) {
    if (!graph) return;
    const viewport = $("graphViewport");
    const rect = viewport.getBoundingClientRect();
    const pointX = (clientX - rect.left + viewport.scrollLeft) / state.zoom;
    const pointY = (clientY - rect.top + viewport.scrollTop) / state.zoom;
    const minZoom = Number($("graphZoom").min || 1) / 100;
    state.zoom = Math.max(minZoom, Math.min(1.25, nextZoom));
    applyZoom();
    viewport.scrollTo({left: pointX * state.zoom - (clientX - rect.left), top: pointY * state.zoom - (clientY - rect.top), behavior: 'instant'});
  }
  function revealPosition(position) {
    if (!position) return;
    $("graphViewport").scrollTo({ left: Math.max(0, (position.x || 0) * state.zoom - 160), top: Math.max(0, position.y * state.zoom - 48), behavior: scrollBehavior() });
  }
  function renderTree() {
    const nodes = data.nodes.filter(x => (!state.query || searchTexts.get(x.id).includes(state.query)) && (state.kind === "all" || x.kind === state.kind) && (state.region === "all" || x.regions.includes(state.region)) && (state.progress === "all" || completed.has(x.id) === (state.progress === "done")));
    $("treeResultCount").textContent = `${nodes.length} 个任务`;
    $("collapseTree").textContent = state.collapsed.size ? "展开全部" : "收起全部";
    $("versionNav").innerHTML = '<option value="">选择版本…</option>' + versions.map(v => {
      const count = nodes.filter(x => x.release.anchorVersion === v.id).length;
      return count ? `<option value="${escape(v.id)}">${escape(versionNames(v.id))} · ${count}</option>` : "";
    }).join("");
    graph = window.TaskGraphLayout.layout(nodes, data.relations, versions, state.collapsed, {universe:data.nodes});
    if (!nodes.length) { graph.width = 700; graph.height = 180; }
    const positions = new Map(graph.positions.map(p => [p.id, p]));
    const edgeHTML = graph.edges.map(r => {
      const path=window.TaskGraphLayout.edgePath(positions.get(r.from),positions.get(r.to),r);
      const main = byId.get(r.from).kind === 'main' && byId.get(r.to).kind === 'main';
      const dependency = ['prerequisite','series-order'].includes(r.type);
      const arrow = main || !dependency ? 'chapter' : 'prerequisite';
      return `<g class="graph-connection" data-from="${escape(r.from)}" data-to="${escape(r.to)}"><path class="graph-edge-halo" d="${path}"/><path class="graph-edge ${dependency ? "is-prerequisite" : "is-chapter"}${main ? ' is-main' : ''}" data-from="${escape(r.from)}" data-to="${escape(r.to)}" d="${path}" marker-end="url(#arrow-${arrow})"><title>${escape(r.label)}：${escape(byId.get(r.from).title)} → ${escape(byId.get(r.to).title)}</title></path></g>`;
    }).join("");
    const markers = graph.bands.map(b => {
      const v = versions.find(v => v.id === b.id);
      return `<div class="version-guide" style="top:${b.y}px" aria-hidden="true"></div><section class="version-marker" data-version-id="${escape(b.id)}" style="top:${b.y+12}px"><button type="button" data-version-toggle="${escape(b.id)}" aria-expanded="${!b.collapsed}">${b.collapsed ? '+' : '−'} ${escape(versionNames(b.id))}</button>${b.collapsed ? `<span>已收起 · ${b.nodes.length} 个入口</span>` : v.date ? `<span>${escape(v.date)}</span>` : ''}<span class="version-progress">已完成 ${b.nodes.filter(n=>completed.has(n.id)).length} / ${b.nodes.length}</span></section>`;
    }).join('');
    $("questTree").style.width = `${graph.width}px`;
    $("questTree").style.height = `${graph.height}px`;
    $("questTree").innerHTML = nodes.length ? `${markers}<svg class="graph-edges" width="${graph.width}" height="${graph.height}" aria-label="任务关系连线"><defs><marker id="arrow-chapter" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--gold)"/></marker><marker id="arrow-prerequisite" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--teal)"/></marker></defs>${edgeHTML}</svg>${graph.positions.map(row).join("")}` : '<p class="tree-empty">没有匹配的任务。试试系列名称，或清除筛选。</p>';
    applyZoom(); highlightEdges();
  }
  function highlightEdges() {
    $("questTree").querySelectorAll(".graph-edge").forEach(el => el.classList.toggle("is-selected", el.dataset.from === state.selected || el.dataset.to === state.selected));
    // Draw selected routes last, including their halo, so crossings do not hide
    // the relationship currently being followed.
    $("questTree").querySelectorAll(".graph-connection").forEach(el => {
      if(el.dataset.from===state.selected || el.dataset.to===state.selected)el.parentNode.appendChild(el);
    });
  }
  function renderDetail() {
    const node = byId.get(state.selected);
    const previous=(predecessors.get(state.selected)||[]).map(id=>({...byId.get(id),requiredTitles:[...new Set(data.relations.filter(r=>r.from===id&&r.to===state.selected).flatMap(r=>r.requirementText?[r.requirementText]:(r.requiredMembers||[]).map(m=>m.title)))]}));
    $("questDetail").innerHTML = detail(node, previous, state.query);
    $("questDetail").scrollTop = 0;
  }
  function select(id, reveal = false) {
    if (!byId.has(id)) return;
    state.selected = id;
    history.replaceState(null, "", `#${encodeURIComponent(id)}`);
    if (reveal) { resetFilters(false); state.collapsed.delete(byId.get(id).release.anchorVersion); renderTree(); }
    $("questTree").querySelectorAll(".quest-row").forEach(el => el.setAttribute("aria-current", String(el.dataset.node === id)));
    renderDetail();
    highlightEdges();
    if (reveal) revealPosition(graph.positions.find(p => p.id === id));
    if (window.matchMedia("(max-width: 900px)").matches) { $("questDetail").scrollIntoView({ behavior: scrollBehavior() }); $("questDetail").focus({ preventScroll: true }); }
  }
  function resetFilters(render = true) {
    state.query = ""; state.kind = "all"; state.region = "all"; state.progress = "all"; state.collapsed.clear();
    $("treeSearch").value = ""; $("treeKind").value = "all"; $("treeRegion").value = "all"; $("treeProgress").value = "all";
    if (render) renderTree();
  }
  $("treeSearch").addEventListener("input", e => { state.query = e.target.value.trim().toLocaleLowerCase(); state.collapsed.clear(); renderTree(); $("graphViewport").scrollTo(0, 0); });
  for (const [id, field] of [["treeKind", "kind"], ["treeRegion", "region"], ["treeProgress", "progress"]]) $(id).addEventListener("change", e => { state[field] = e.target.value; state.collapsed.clear(); renderTree(); $("graphViewport").scrollTo(0, 0); });
  $("treeReset").addEventListener("click", () => resetFilters());
  $("treeTheme").addEventListener("click", () => {
    lightTheme = !lightTheme; applyTheme();
    try { localStorage.setItem(themeKey, lightTheme ? 'light' : 'dark'); } catch { /* An optional preference must not block the map. */ }
  });
  $("collapseTree").addEventListener("click", () => {
    state.collapsed = state.collapsed.size ? new Set() : new Set(versions.map(v => v.id));
    renderTree(); $("graphViewport").scrollTo(0, 0);
  });
  $("questTree").addEventListener("click", e => {
    const target = e.target.closest("[data-node]"); if (target) select(target.dataset.node);
    const toggle = e.target.closest("[data-version-toggle]");
    if (toggle) { const id = toggle.dataset.versionToggle; if (state.collapsed.has(id)) state.collapsed.delete(id); else state.collapsed.add(id); renderTree(); revealPosition(graph.bands.find(b => b.id === id)); }
  });
  $("questDetail").addEventListener("click", e => { const target = e.target.closest("[data-related]"); if (target) select(target.dataset.related, true); });
  $("versionNav").addEventListener("change", e => {
    const version = e.target.value; if (!version) return;
    state.collapsed.delete(version); renderTree(); revealPosition(graph.bands.find(b => b.id === version));
  });
  function changeCompletion(e) {
    const input = e.target.closest("[data-complete]");
    if (!input || !byId.has(input.dataset.complete)) return;
    const id = input.dataset.complete;
    if (input.checked) completed.add(id); else completed.delete(id);
    try { localStorage.setItem(progressKey, JSON.stringify([...completed])); storageWarning = ""; }
    catch { storageWarning = "浏览器未能保存进度，本次勾选仅在当前页面有效。"; }
    renderProgress();
    // Update in place to retain keyboard focus while checking multiple cards.
    document.querySelectorAll("[data-complete]").forEach(el => { if (el.dataset.complete === id) el.checked = completed.has(id); });
    document.querySelectorAll("[data-card]").forEach(el => { if (el.dataset.card === id) el.classList.toggle("is-complete", completed.has(id)); });
    if (state.progress !== "all") renderTree();
    else $("questTree").querySelectorAll("[data-version-id]").forEach(el => {
      const nodes = graph.bands.find(b => b.id === el.dataset.versionId).nodes;
      el.querySelector(".version-progress").textContent = `已完成 ${nodes.filter(x => completed.has(x.id)).length} / ${nodes.length}`;
    });
  }
  $("questTree").addEventListener("change", changeCompletion);
  $("graphZoom").addEventListener("input", e => {
    const viewport = $("graphViewport");
    const center = { x: (viewport.scrollLeft + viewport.clientWidth / 2) / state.zoom, y: (viewport.scrollTop + viewport.clientHeight / 2) / state.zoom };
    state.zoom = Number(e.target.value) / 100; applyZoom();
    viewport.scrollTo(center.x * state.zoom - viewport.clientWidth / 2, center.y * state.zoom - viewport.clientHeight / 2);
  });
  $("graphViewport").addEventListener("wheel", e => {
    // Trackpad pinch gestures are reported as Ctrl+wheel by Chromium. The
    // modifier also gives mouse users an explicit zoom gesture while leaving
    // an ordinary wheel available for scrolling the large task tree.
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.002);
    zoomAt(e.clientX, e.clientY, state.zoom * factor);
  }, {passive: false});
  $("graphFit").addEventListener("click", fitGraph);
  window.addEventListener("resize", () => { if (graph) applyZoom(); });
  function scrollBehavior() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'; }
  $("graphHome").addEventListener("click", () => $("graphViewport").scrollTo({top: 0, left: 0, behavior: 'instant'}));
  let pan = null;
  $("graphViewport").addEventListener("pointerdown", e => {
    if (e.button !== 0 || e.pointerType === "touch" || e.target.closest("button, input, label, a, .quest-card")) return;
    const viewport = $("graphViewport");
    pan = {x: e.clientX, y: e.clientY, left: viewport.scrollLeft, top: viewport.scrollTop};
    viewport.setPointerCapture(e.pointerId); viewport.classList.add("is-panning"); e.preventDefault();
  });
  $("graphViewport").addEventListener("pointermove", e => { if (pan) $("graphViewport").scrollTo(pan.left - (e.clientX - pan.x), pan.top - (e.clientY - pan.y)); });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) $("graphViewport").addEventListener(event, () => { pan = null; $("graphViewport").classList.remove("is-panning"); });
  window.addEventListener("hashchange", () => { if (byId.has(hashId())) select(hashId(), true); });
  const liveUpdates=document.documentElement?.dataset?.liveUpdates!=='off'&&/^https?:$/.test(location.protocol);
  let liveRevision='', refreshing=false;
  async function refreshData(){
    if(refreshing||!liveUpdates)return;
    refreshing=true;
    try{
      const status=await fetch('/api/revision',{cache:'no-store'});
      if(!status.ok)return;
      const {revision}=await status.json();
      if(revision===liveRevision)return;
      const response=await fetch('/api/tree',{cache:'no-store'});
      if(!response.ok)return;
      const result=await response.json();
      data=result.tree;window.TASK_TREE_DATA=data;liveRevision=result.revision;
      byId=new Map(data.nodes.map(n=>[n.id,n]));
      predecessors=new Map(data.nodes.map(n=>[n.id,[]]));
      for(const r of data.relations)predecessors.get(r.to)?.push(r.from);
      versions=[...data.versions,{id:'unknown',date:null}];
      recordingCount=data.nodes.filter(n=>n.videos.pinned?.some(v=>v.verifiedMatch||v.userProvided)).length;
      searchTexts=new Map(data.nodes.map(n=>[n.id,[n.title,n.character,n.series,...n.regions,...n.members.flatMap(m=>[m.title,m.summary]),...contentTitles(n.seriesContents)].join(' ').toLocaleLowerCase()]));
      if(!byId.has(state.selected))state.selected=data.nodes[0]?.id;
      const viewport=$('graphViewport'), left=viewport.scrollLeft, top=viewport.scrollTop;
      renderProgress();renderTree();renderDetail();viewport.scrollTo({left,top,behavior:'instant'});
    }catch { /* Static file previews and temporary server restarts remain usable. */ }
    finally{refreshing=false;}
  }
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin)return;
    if(e.data?.type==='tasks-updated')refreshData();
    if(e.data?.type==='task-select')select(e.data.id,true);
  });
  if(liveUpdates){
    refreshData();window.setInterval(refreshData,2000);
    window.addEventListener('focus',refreshData);
  }
  renderProgress(); renderTree(); renderDetail();
  if (hashId()) revealPosition(graph.positions.find(p => p.id === state.selected));
})();
