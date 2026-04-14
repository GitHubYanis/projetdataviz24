/**
 * Légende de la visualisation 3 — continents.
 */

import { CONTINENT_COLORS } from '../config.js';
import { createDomNode, resolveNode } from '../helper.js';

/**
 * Rend la légende continents.
 * @param {{ container: string|HTMLElement }} payload
 */
export function renderViz3Legend({ container }) {
  const host = resolveNode(container);

  const box = createDomNode('div', 'viz3-legend-box');
  const title = createDomNode('p', 'viz3-legend-title', 'Continents');
  const list = createDomNode('div', 'viz3-legend-list');

  const LABELS = {
    'Africa':        'Afrique',
    'North America': 'Amér. du Nord',
    'South America': 'Amér. du Sud',
    'Asia':          'Asie',
    'Europe':        'Europe',
    'Oceania':       'Océanie',
    'Other':         'Autre'
  };

  for (const [key, color] of Object.entries(CONTINENT_COLORS)) {
    if (key === 'Other') continue;
    const row = createDomNode('div', 'viz3-legend-row');
    const swatch = createDomNode('span', 'viz3-legend-swatch');
    swatch.style.backgroundColor = color;
    const text = createDomNode('span', 'viz3-legend-text', LABELS[key] ?? key);
    row.append(swatch, text);
    list.append(row);
  }

  box.append(title, list);
  host.append(box);
}
