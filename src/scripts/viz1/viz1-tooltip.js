import { createDomNode } from '../helper.js';

const TOOLTIP_ID = 'viz1-tooltip';

export function createViz1Tooltip() {
  let node = document.getElementById(TOOLTIP_ID);

  if (!node) {
    node = createDomNode('div', 'tooltip viz1-tooltip hidden');
    node.id = TOOLTIP_ID;
    document.body.append(node);
  }

  return {
    node,
    show(html, clientX, clientY) {
      node.innerHTML = html;
      node.classList.remove('hidden');
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tw = node.offsetWidth || 260;
      const th = node.offsetHeight || 160;
      node.style.left = `${Math.min(clientX + 14, vw - tw - 12)}px`;
      node.style.top = `${Math.min(clientY + 14, vh - th - 12)}px`;
    },
    hide() {
      node.classList.add('hidden');
    }
  };
}

export function buildPerformanceTooltipHtml(point, country) {
  const city = point.city ?? '';
  const year = point.year ?? '';
  const saisonLabel = point.saison === 'winter' ? 'Jeux d\'hiver' : 'Jeux d\'été';
  const hostBadge = point.is_host
    ? '<span class="viz1-tooltip-host-badge">🏠 Nation hôte</span>'
    : '';

  return `
    <div class="viz1-tooltip-header">
      <span class="viz1-tooltip-city">${city.toUpperCase()} ${year}</span>
      <span class="viz1-tooltip-saison">${saisonLabel}</span>
    </div>
    <div class="viz1-tooltip-country-row">
      <span class="viz1-tooltip-swatch" style="background:${country.color}"></span>
      <span class="viz1-tooltip-country-name">${country.country}</span>
      ${hostBadge}
    </div>
    <div class="viz1-tooltip-medals">
      <div class="viz1-tooltip-medal-row">
        <span class="viz1-medal-dot viz1-medal-gold"></span>
        <span class="viz1-tooltip-label">Médailles d'or</span>
        <span class="viz1-tooltip-value">${point.gold}</span>
      </div>
      <div class="viz1-tooltip-medal-row">
        <span class="viz1-medal-dot viz1-medal-silver"></span>
        <span class="viz1-tooltip-label">Médailles d'argent</span>
        <span class="viz1-tooltip-value">${point.silver}</span>
      </div>
      <div class="viz1-tooltip-medal-row">
        <span class="viz1-medal-dot viz1-medal-bronze"></span>
        <span class="viz1-tooltip-label">Médailles de bronze</span>
        <span class="viz1-tooltip-value">${point.bronze}</span>
      </div>
    </div>
    <div class="viz1-tooltip-share">
      <span class="viz1-tooltip-label">Part totale</span>
      <strong class="viz1-tooltip-share-value">${point.share_pct.toFixed(1)}%</strong>
    </div>
  `;
}

export function buildDiversityTooltipHtml(point, items) {
  const city = point.city ?? '';
  const year = point.year ?? '';
  const saisonLabel = point.saison === 'winter' ? 'Jeux d\'hiver' : 'Jeux d\'été';

  const LABELS = { GOLD: 'Or', SILVER: 'Argent', BRONZE: 'Bronze' };

  const rows = items
    .map(
      ({ medalSeries, point: pt }) => `
    <div class="viz1-tooltip-medal-row">
      <span class="viz1-medal-dot" style="background:${medalSeries.color}"></span>
      <span class="viz1-tooltip-label">${LABELS[medalSeries.medal_type] ?? medalSeries.medal_type}</span>
      <span class="viz1-tooltip-value">${pt.country_count}</span>
    </div>`
    )
    .join('');

  return `
    <div class="viz1-tooltip-header">
      <span class="viz1-tooltip-city">${city.toUpperCase()} ${year}</span>
      <span class="viz1-tooltip-saison">${saisonLabel}</span>
    </div>
    <div class="viz1-tooltip-subtitle">Pays ayant remporté au moins une médaille</div>
    <div class="viz1-tooltip-medals">${rows}</div>
  `;
}
