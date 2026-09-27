(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TaskGraphLayout = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const geometry = { width: 760, cardWidth: 220, cardHeight: 176, axis: 164, columnGap: 52, rowGap: 78 };
  const palette = [
    {id:"gold",label:"魔神任务",kinds:["main"]},
    {id:"purple",label:"传说 · 邀约 · 部族",kinds:["story","hangout","tribal"]},
    {id:"blue",label:"世界任务",kinds:["world"]},
    {id:"green",label:"活动 · 其他",kinds:["event","other"]},
  ];
  const colorIndex = kind => { const index=palette.findIndex(group=>group.kinds.includes(kind));return index<0?3:index; };

  function layout(nodes, relations, versions, collapsed = new Set(), options = {}) {
    const g = {...geometry, ...options.geometry};
    // Schedule the full graph before filtering, retaining hidden ancestors'
    // ordering influence without inventing shortcuts between visible nodes.
    const universe = options.universe || nodes;
    const byId = new Map(universe.map(n => [n.id, n]));
    if (byId.size !== universe.length) throw new Error("任务ID重复");
    const versionRank = new Map(versions.map((v, i) => [v.id, v.id === "unknown" ? 99999 : v.rank ?? i]));
    const edges = relations.filter(r => byId.has(r.from) && byId.has(r.to));
    const incoming = new Map(universe.map(n => [n.id, []]));
    const outgoing = new Map(universe.map(n => [n.id, []]));
    for (const edge of edges) { incoming.get(edge.to).push(edge.from); outgoing.get(edge.from).push(edge.to); }
    const remaining = new Map(universe.map(n => [n.id, incoming.get(n.id).length]));
    const pending = new Map(byId);
    const stages = [];
    const timeCompare = (a, b) => (versionRank.get(a.release.anchorVersion) ?? 99999) - (versionRank.get(b.release.anchorVersion) ?? 99999)
      || Number(!a.release.taskDate) - Number(!b.release.taskDate)
      || ((a.chronology?.adventureRank?.layoutHint ?? 9999) - (b.chronology?.adventureRank?.layoutHint ?? 9999));
    const periodKey = n => n.release.taskDate ? `date/${n.release.taskDate}` : `version/${n.release.anchorVersion}`;
    const isLocated = n => incoming.get(n.id).length || outgoing.get(n.id).length || n.chronology?.chapterOrder != null || n.chronology?.adventureRank?.layoutHint != null;
    while (pending.size) {
      const frontier = [...pending.values()].filter(n => remaining.get(n.id) === 0);
      if (!frontier.length) throw new Error("任务关系存在循环，不能生成剧情层级");
      // Among evidenced dates, earlier dates win even if version labels disagree.
      // Undated tasks remain comparable only by version; dates are never guessed.
      const earliestDate = frontier.map(n=>n.release.taskDate).filter(Boolean).sort()[0];
      const ready = frontier.filter(n=>!n.release.taskDate || n.release.taskDate===earliestDate);
      ready.sort((a, b) => timeCompare(a, b) || Number(!!isLocated(b)) - Number(!!isLocated(a)) || a.id.localeCompare(b.id, "en", {numeric:true}));
      const first = ready[0], located = !!isLocated(first);
      const cohort = ready.filter(n => periodKey(n)===periodKey(first) && (n.chronology?.adventureRank?.layoutHint ?? null)===(first.chronology?.adventureRank?.layoutHint ?? null) && !!isLocated(n) === located);
      // Same row means an available parallel frontier, not proven simultaneity.
      stages.push({id: `stage-${stages.length}`, nodes: cohort, pending: !located,
        basis: located ? "story" : first.release.taskDate ? "release-date" : "version-only"});
      for (const n of cohort) pending.delete(n.id);
      for (const n of cohort) for (const child of outgoing.get(n.id)) remaining.set(child, remaining.get(child) - 1);
    }
    const visible = new Set(nodes.filter(n => !collapsed.has(n.release.anchorVersion)).map(n => n.id));
    const placed = new Map(), rows = [];
    let top = 24, width = g.width;
    for (const stage of stages) {
      const list = stage.nodes.filter(n => visible.has(n.id));
      if (!list.length) continue;
      const parentColumn = n => {
        const parents = incoming.get(n.id).map(id => placed.get(id)).filter(Boolean);
        return parents.length ? parents.reduce((sum, p) => sum + p.column, 0) / parents.length : 0;
      };
      list.sort((a, b) => colorIndex(a.kind) - colorIndex(b.kind) || parentColumn(a) - parentColumn(b) || a.id.localeCompare(b.id, "en", {numeric:true}));
      let nextColumn = 0;
      const row = {...stage, nodes:list, y:top, height:g.cardHeight+g.rowGap, versionIds:[...new Set(list.map(n=>n.release.anchorVersion))]};
      rows.push(row);
      for (const node of list) {
        // Keep absent earlier colors' slots empty. Multiple peers of one color
        // extend that group horizontally and push later colors right as needed.
        const column = Math.max(colorIndex(node.kind),nextColumn);
        nextColumn = column + 1;
        const p = {id:node.id,node,stage:stage.id,pending:stage.pending,column,x:g.axis+column*(g.cardWidth+g.columnGap),y:top+36,width:g.cardWidth,height:g.cardHeight};
        placed.set(node.id,p); width=Math.max(width,p.x+p.width+g.columnGap);
      }
      top+=row.height;
    }
    const visibleEdges = edges.filter(r=>placed.has(r.from)&&placed.has(r.to));
    // Allocate separate ports and channels before finalizing spacing. Crossing
    // lines may still intersect, but unrelated edges never share a segment.
    const routed = routeEdges([...placed.values()], rows, visibleEdges, g);
    width = Math.max(g.width, ...[...placed.values()].map(p=>p.x+p.width+g.columnGap), routed.width);
    top = rows.length ? rows[rows.length-1].y + rows[rows.length-1].height : 24;
    // Versions are navigation anchors, not hard boundaries that override story.
    const bands=versions.map(v=>{
      const list=nodes.filter(n=>n.release.anchorVersion===v.id);
      if(!list.length)return null;
      const positions=list.map(n=>placed.get(n.id)).filter(Boolean);
      const y=positions.length?Math.min(...positions.map(p=>p.y))-36:top;
      if(!positions.length)top+=106;
      return {id:v.id,nodes:list,y,height:106,collapsed:collapsed.has(v.id)};
    }).filter(Boolean);
    return {width,height:top+24,positions:[...placed.values()],rows,bands,edges:routed.edges};
  }

  function routeEdges(positions, rows, edges, g) {
    const byId = new Map(positions.map(p=>[p.id,p]));
    const rowIndex = new Map(rows.map((row,i)=>[row.id,i]));
    const outgoing = new Map(positions.map(p=>[p.id,[]]));
    const incoming = new Map(positions.map(p=>[p.id,[]]));
    const channels = rows.map(()=>[]), gutters = new Map();
    const routes = edges.map(edge=>({...edge})).sort((a,b)=>a.from.localeCompare(b.from,'en',{numeric:true})||a.to.localeCompare(b.to,'en',{numeric:true}));
    for (const edge of routes) {
      const from=byId.get(edge.from),to=byId.get(edge.to);
      const start=rowIndex.get(from.stage),end=rowIndex.get(to.stage)-1;
      outgoing.get(edge.from).push(edge); incoming.get(edge.to).push(edge);
      edge.departureChannel=channels[start].length; channels[start].push(edge);
      edge.arrivalChannel=start===end?edge.departureChannel:channels[end].length;
      if(start!==end) {
        channels[end].push(edge);
        if(!gutters.has(from.column))gutters.set(from.column,[]);
        const lanes=gutters.get(from.column);
        // Reuse a gutter lane only when its row intervals are disjoint.
        let lane=lanes.findIndex(intervals=>intervals.every(([a,b])=>end<a||start>b));
        if(lane<0){lane=lanes.length;lanes.push([]);}
        lanes[lane].push([start,end]); edge.gutterLane=lane;
      }
    }
    const step=9,padding=18;
    const maxPorts=Math.max(0,...[...outgoing.values(),...incoming.values()].map(list=>list.length));
    const cardWidth=Math.max(g.cardWidth,(maxPorts+1)*20);
    const columns=Math.max(-1,...positions.map(p=>p.column))+1;
    const columnX=[]; let x=g.axis;
    for(let column=0;column<columns;column++) {
      columnX.push(x);
      x+=cardWidth+Math.max(g.columnGap,padding*2+((gutters.get(column)?.length||0)-1)*step);
    }
    let top=24;
    for(let i=0;i<rows.length;i++) {
      rows[i].y=top;
      rows[i].height=g.cardHeight+Math.max(g.rowGap,padding*2+(channels[i].length-1)*step);
      top+=rows[i].height;
    }
    for(const position of positions) {
      position.x=columnX[position.column];position.width=cardWidth;
      position.y=rows[rowIndex.get(position.stage)].y+36;
    }
    const port=(id,edge,map,endpoint)=>{
      const list=map.get(id);
      list.sort((a,b)=>byId.get(a[endpoint]).column-byId.get(b[endpoint]).column||a[endpoint].localeCompare(b[endpoint],'en',{numeric:true}));
      const position=byId.get(id);
      // Different halves prevent an outgoing port of one row from sharing a
      // vertical segment with an incoming port on the next row's same column.
      return position.x+position.width*((map===outgoing?0:0.55)+0.45*(list.indexOf(edge)+1)/(list.length+1));
    };
    for(const edge of routes) {
      const from=byId.get(edge.from),to=byId.get(edge.to);
      const x1=port(edge.from,edge,outgoing,'to'),x2=port(edge.to,edge,incoming,'from');
      const y1=from.y+from.height,y2=to.y-5;
      const departure=y1+padding+edge.departureChannel*step;
      const previous=rows[rowIndex.get(to.stage)-1];
      const arrival=previous.y+36+g.cardHeight+padding+edge.arrivalChannel*step;
      const gutter=from.x+from.width+padding+(edge.gutterLane||0)*step;
      edge.points=edge.gutterLane===undefined
        ? [[x1,y1],[x1,departure],[x2,departure],[x2,y2]]
        : [[x1,y1],[x1,departure],[gutter,departure],[gutter,arrival],[x2,arrival],[x2,y2]];
      edge.path=edge.points.map(([x,y],i)=>`${i?'L':'M'} ${x} ${y}`).join(' ');
    }
    return {edges:routes,width:x};
  }

  function edgePath(from, to, route) {
    if(route?.path)return route.path;
    const x1 = from.x + from.width / 2, y1 = from.y + from.height;
    const x2 = to.x + to.width / 2, y2 = to.y;
    if (from.column === to.column && y2 - y1 <= 100) return `M ${x1} ${y1} L ${x2} ${y2 - 5}`;
    const gutter = from.x + from.width + 24;
    return `M ${x1} ${y1} L ${x1} ${y1 + 14} L ${gutter} ${y1 + 14} L ${gutter} ${y2 - 20} L ${x2} ${y2 - 20} L ${x2} ${y2 - 5}`;
  }
  return { layout, edgePath, geometry, palette, colorIndex };
});
