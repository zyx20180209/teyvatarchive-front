(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TaskTreeView = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const external = (url, label) => `<a href="${escape(/^https?:\/\//.test(url) ? url : '#')}" target="_blank" rel="noopener noreferrer"><span>${escape(label)}</span><span class="link-arrow" aria-hidden="true">↗</span></a>`;
  function synopsis(node) {
    if (node.synopsisEdited) return node.synopsis || '';
    if (node.synopsis) return node.synopsis;
    const summary = node.members.length === 1 ? node.members[0].summary.trim() : '';
    return summary.length >= 20 && /[。！？]/.test(summary) && !summary.startsWith('新手引导') ? summary : '';
  }
  function contents(entries, query) {
    const matches=entry=>[entry.title,...entry.steps.map(s=>s.title)].some(t=>t.toLocaleLowerCase().includes(query))||entry.children.some(matches);
    return entries.map(entry=>`<details class="series-member" data-member="${entry.contentId}" ${query&&matches(entry)?'open':''}>
      <summary>${escape(entry.title)}</summary>
      <div class="member-searches">${entry.searches.map(s=>external(s.url,s.label)).join('')}</div>
      ${entry.steps.length?`<ul class="member-steps">${entry.steps.map(step=>`<li><span>${escape(step.title)}</span><span class="member-searches">${step.searches.map(s=>external(s.url,s.label)).join('')}</span></li>`).join('')}</ul>`:''}
      ${entry.children.length?`<div class="member-children"><h4>相关支线</h4>${contents(entry.children,query)}</div>`:''}</details>`).join('');
  }
  function detail(node, predecessors, query = '') {
    if (!node) return '<p>请选择一个任务。</p>';
    const summary = synopsis(node);
    const pinned = (node.videos.pinned || []).filter(x => x.verifiedMatch === true || x.userProvided === true);
    return `${node.seriesGroupId?`<p class="detail-series">${escape(node.series)}</p>`:''}<h2>${escape(node.displayTitle||node.title)}</h2><div class="detail-rule" aria-hidden="true"><span>◆</span></div>
      ${summary ? `<p class="detail-summary">${escape(summary)}</p>` : ''}
      ${pinned.length ? `<h3><span aria-hidden="true">▷</span> 观看实录</h3><div class="pinned-videos video-searches">${pinned.map(x => external(x.url, x.part ? `P${x.part.page} · ${x.part.title}` : x.title)).join('')}</div>` : ''}
      <div class="video-searches">${node.videos.searches.map(x => external(x.url, x.label)).join('')}</div>
      ${node.seriesContents?.length?`<section class="series-contents"><h3>任务流程</h3>${contents(node.seriesContents,query===node.title.toLocaleLowerCase()?'':query)}</section>`:''}
      ${predecessors.length ? `<h3>前序任务</h3>${predecessors.map(n => `<button type="button" class="chapter-link" data-related="${escape(n.id)}"><span aria-hidden="true">◇</span><span>${escape(n.title)}${n.requiredTitles?.length?`<small>所需：${escape(n.requiredTitles.join('、'))}</small>`:''}</span><span aria-hidden="true">›</span></button>`).join('')}` : ''}`;
  }
  function stats(total, count, recordings) {
    return [[total, '收录任务'], [recordings, '实录入口'], [`${count} / ${total}`, '已看过 / 已完成']].map(([value,label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join('');
  }
  function card(position, {completed, selected, kindName, color}) {
    const node = position.node;
    return `<article class="quest-card ${completed ? 'is-complete' : ''}" data-kind="${escape(node.kind)}" data-color="${color}" data-card="${escape(node.id)}" style="left:${position.x}px;top:${position.y}px;width:${position.width}px;height:${position.height}px">
      <div class="quest-type">${escape(node.seriesGroupId?node.series:kindName)}<span>${escape(node.release.versions.join(' / '))}</span></div>
      <button type="button" class="quest-row" data-node="${escape(node.id)}" aria-current="${selected}" title="${escape(node.title)}"><span><strong>${escape(node.displayTitle||node.title)}</strong>${node.character ? `<small>${escape(node.character)}</small>` : ''}</span><span class="row-arrow" aria-hidden="true">↗</span></button>
      <label class="completion-control"><input type="checkbox" data-complete="${escape(node.id)}" ${completed ? 'checked' : ''} aria-label="已看过或已完成：${escape(node.title)}"><span>已看过 / 已完成</span></label></article>`;
  }
  return {escape, synopsis, detail, stats, card};
});
