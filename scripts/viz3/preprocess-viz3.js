/**
 * Prétraitement spécifique à la visualisation 3.
 *
 * Sorties :
 * 1. lineData  : résumé par édition — nb épreuves, disciplines, pays participants
 * 2. bubbleData: détail par pays / édition — athlètes vs médailles
 */

import { exportRowsToCsv, matchSharedFilters, sortByMany, safeTrim } from '../helper.js';

/**
 * Prépare les sorties line + bubble de la visualisation 3.
 * @param {Array<Record<string, unknown>>} medals
 * @param {Array<Record<string, unknown>>} athletesCount
 * @param {{ year?: string|number, saison?: string, continent?: string, discipline?: string }} filters
 * @param {Array<Record<string, unknown>>} [hosts]
 * @returns {{ lineData: Array<Record<string, unknown>>, bubbleData: Array<Record<string, unknown>> }}
 */
export function prepareViz3Data(medals, athletesCount, filters = {}, hosts = []) {
  const filteredMedals = medals.filter((row) => matchSharedFilters(row, filters));
  const filteredAthletesCount = athletesCount.filter((row) => matchSharedFilters(row, filters));

  const medalsByCountryEdition = new Map();

  for (const row of filteredMedals) {
    const key = [row.year, row.game_slug, row.country_code].join('|');

    if (!medalsByCountryEdition.has(key)) {
      medalsByCountryEdition.set(key, {
        year: row.year,
        game_slug: row.game_slug,
        saison: row.saison,
        continent: row.continent,
        country_code: row.country_code,
        country: row.country,
        is_host: row.is_host,
        medals_total: 0,
        gold: 0,
        silver: 0,
        bronze: 0
      });
    }

    const target = medalsByCountryEdition.get(key);
    target.medals_total += 1;

    if (row.medal_type === 'GOLD') {
      target.gold += 1;
    } else if (row.medal_type === 'SILVER') {
      target.silver += 1;
    } else if (row.medal_type === 'BRONZE') {
      target.bronze += 1;
    }
  }

  const bubbleData = [];

  for (const row of filteredAthletesCount) {
    const key = [row.year, row.game_slug, row.country_code].join('|');
    const medalsSummary = medalsByCountryEdition.get(key);

    bubbleData.push({
      year: row.year,
      game_slug: row.game_slug,
      saison: row.saison,
      continent: row.continent,
      country_code: row.country_code,
      country: row.country,
      nb_athletes: row.nb_athletes,
      medals_total: medalsSummary?.medals_total ?? 0,
      gold: medalsSummary?.gold ?? 0,
      silver: medalsSummary?.silver ?? 0,
      bronze: medalsSummary?.bronze ?? 0,
      medals_per_athlete:
        Number(row.nb_athletes) > 0
          ? Number((Number(medalsSummary?.medals_total ?? 0) / Number(row.nb_athletes)).toFixed(4))
          : 0,
      is_host: medalsSummary?.is_host ?? false
    });
  }

  const allMedalsForLine = medals.filter((row) => {
    const saisonOk = !filters.saison || filters.saison === 'all' || safeTrim(row.saison).toLowerCase() === filters.saison;
    return saisonOk;
  });

  const lineAggregation = new Map();

  for (const row of allMedalsForLine) {
    const key = [row.year, row.game_slug, row.saison].join('|');

    if (!lineAggregation.has(key)) {
      lineAggregation.set(key, {
        year: row.year,
        game_slug: row.game_slug,
        saison: row.saison,
        events: new Set(),
        disciplines: new Set(),
        countries: new Set()
      });
    }

    const target = lineAggregation.get(key);

    if (safeTrim(row.event)) {
      target.events.add([row.game_slug, row.discipline, row.event, row.event_gender].join('|'));
    }
    if (safeTrim(row.discipline)) {
      target.disciplines.add(safeTrim(row.discipline));
    }
    if (safeTrim(row.country_code)) {
      target.countries.add(safeTrim(row.country_code));
    }
  }

  const allAthletesForLine = athletesCount.filter((row) => {
    const saisonOk = !filters.saison || filters.saison === 'all' || safeTrim(row.saison).toLowerCase() === filters.saison;
    return saisonOk;
  });

  for (const row of allAthletesForLine) {
    const key = [row.year, row.game_slug, row.saison].join('|');
    if (lineAggregation.has(key)) {
      lineAggregation.get(key).countries.add(safeTrim(row.country_code));
    } else {
      lineAggregation.set(key, {
        year: row.year,
        game_slug: row.game_slug,
        saison: row.saison,
        events: new Set(),
        disciplines: new Set(),
        countries: new Set([safeTrim(row.country_code)])
      });
    }
  }

  const hostBySlug = new Map(hosts.map((h) => [safeTrim(h.game_slug), h]));

  const lineData = [...lineAggregation.values()].map((row) => {
    const host = hostBySlug.get(safeTrim(row.game_slug));
    return {
      year: row.year,
      game_slug: row.game_slug,
      saison: row.saison,
      host_city: host?.host_country ?? '',
      nb_events: row.events.size,
      nb_disciplines: row.disciplines.size,
      nb_countries: row.countries.size
    };
  });

  return {
    lineData: sortByMany(lineData, [(row) => Number(row.year)]),
    bubbleData: sortByMany(bubbleData, [
      (row) => Number(row.year),
      (row) => safeTrim(row.country_code)
    ])
  };
}

/**
 * Exporte les deux sorties de la visualisation 3.
 * Un clic = deux fichiers, car la viz 3 alimente deux sous-composantes.
 * @param {{ lineData: Array<Record<string, unknown>>, bubbleData: Array<Record<string, unknown>> }} viz3Data
 * @param {{ lineFilename?: string, bubbleFilename?: string }} filenames
 */
export function exportViz3Csv(viz3Data, filenames = {}) {
  exportRowsToCsv(viz3Data.lineData ?? [], filenames.lineFilename ?? 'viz3-line-output.csv');
  exportRowsToCsv(viz3Data.bubbleData ?? [], filenames.bubbleFilename ?? 'viz3-bubble-output.csv');
}
