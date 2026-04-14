/**
 * Tooltips de la visualisation 3.
 * Deux instances séparées : une pour le line chart, une pour le bubble chart.
 */

import { createDomNode } from '../helper.js';

const LINE_TOOLTIP_ID   = 'viz3-line-tooltip';
const BUBBLE_TOOLTIP_ID = 'viz3-bubble-tooltip';

function makeTooltip(id) {
  let node = document.getElementById(id);

  if (!node) {
    node = createDomNode('div', 'tooltip viz3-tooltip hidden');
    node.id = id;
    document.body.append(node);
  }

  return {
    node,

    show(html, x, y) {
      node.innerHTML = html;
      node.classList.remove('hidden');
      this._place(x, y);
    },

    move(x, y) {
      if (!node.classList.contains('hidden')) {
        this._place(x, y);
      }
    },

    hide() {
      node.classList.add('hidden');
    },

    _place(x, y) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w  = node.offsetWidth  || 260;
      const h  = node.offsetHeight || 120;
      const pad = 14;

      let left = x + pad;
      let top  = y + pad;

      if (left + w > vw - pad) left = x - w - pad;
      if (top  + h > vh - pad) top  = y - h - pad;

      node.style.left = `${left}px`;
      node.style.top  = `${top}px`;
    }
  };
}

export function createViz3LineTooltip() {
  return makeTooltip(LINE_TOOLTIP_ID);
}

export function createViz3BubbleTooltip() {
  return makeTooltip(BUBBLE_TOOLTIP_ID);
}
