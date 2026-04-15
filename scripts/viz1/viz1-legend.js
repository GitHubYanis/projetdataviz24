import { VIZ1_MODES } from '../config.js';
import { createDomNode, resolveNode } from '../helper.js';

export function renderViz1Legend({
  container,
  mode,
  performanceData = [],
  diversityData = []
}) {
  const host = resolveNode(container);
  host.innerHTML = '';

  const box = createDomNode('div', 'viz1-legend-box');
  const title = createDomNode(
    'p',
    'viz1-legend-title',
    mode === VIZ1_MODES.PERFORMANCE ? 'Nations participantes' : 'Types de médaille'
  );
  box.append(title);

  const list = createDomNode('div', 'viz1-legend-list');

  if (mode === VIZ1_MODES.PERFORMANCE) {
    for (const country of performanceData) {
      list.append(
        buildLegendRow(
          country.color,
          country.country,
          country.country_code === '__OTHERS__'
        )
      );
    }
    list.append(buildHostLegendRow());
  } else {
    const LABELS = {
      GOLD: "Médaille d'or",
      SILVER: "Médaille d'argent",
      BRONZE: 'Médaille de bronze'
    };
    for (const ms of diversityData) {
      list.append(buildLegendRow(ms.color, LABELS[ms.medal_type] ?? ms.medal_type, false));
    }
  }

  box.append(list);
  host.append(box);
}

function buildLegendRow(color, label, isOthers) {
  const row = createDomNode('div', 'viz1-legend-row');
  const swatch = createDomNode(
    'span',
    `viz1-legend-swatch${isOthers ? ' viz1-legend-swatch--others' : ''}`
  );
  swatch.style.backgroundColor = color;
  const text = createDomNode('span', 'viz1-legend-text', label);
  row.append(swatch, text);
  return row;
}

function buildHostLegendRow() {
  const row = createDomNode('div', 'viz1-legend-row');
  const swatch = createDomNode(
    'span',
    'viz1-legend-swatch--host'
  );
  swatch.innerHTML =
  `<svg width="12" height="12" viewBox="0 0 12 12" style="display: block; overflow: visible; opacity: 55%;">
    <circle cx="6" cy="6" r="7" fill="white" stroke="#64748b" stroke-width="2.5" />
    <circle cx="6" cy="6" r="3.5" fill="#64748b" />
  </svg>`;
  const text = createDomNode('span', 'viz1-legend-text', 'Édition à domicile (Pays Hôte)');
  row.append(swatch, text);
  return row;
}