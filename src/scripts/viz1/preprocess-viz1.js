import { exportRowsToCsv, safeTrim } from '../helper.js';
import {
  MEDAL_COLORS,
  MEDAL_TYPES,
  VIZ1_COUNTRY_COLORS,
  VIZ1_FALLBACK_PALETTE,
  VIZ1_TOP_N
} from '../config.js';

function cityFromSlug(slug) {
  const parts = String(slug).split('-');
  const last = parts[parts.length - 1];
  if (/^\d{4}$/.test(last)) {
    return parts
      .slice(0, -1)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }
  return String(slug);
}

function countryColor(code, fallbackIndex) {
  return (
    VIZ1_COUNTRY_COLORS[code] ??
    VIZ1_FALLBACK_PALETTE[fallbackIndex % VIZ1_FALLBACK_PALETTE.length]
  );
}

export function prepareViz1Data(medals, filters = {}) {
  const continentFilter = safeTrim(filters.continent ?? 'all');
  const filtered =
    continentFilter === 'all'
      ? medals
      : medals.filter((row) => safeTrim(row.continent) === continentFilter);

  const performanceData = buildViz1PerformanceData(filtered);
  const diversityData = buildViz1DiversityData(filtered);
  const topCountries = performanceData
    .filter((s) => s.country_code !== '__OTHERS__')
    .map((s) => s.country_code);

  return { performanceData, diversityData, topCountries };
}

function buildViz1PerformanceData(medals) {
  const byCountryEdition = new Map();
  const byEdition = new Map();
  const byCountryTotal = new Map();
  const countryNameMap = new Map();

  for (const row of medals) {
    const cc = safeTrim(row.country_code);
    const slug = safeTrim(row.game_slug);
    if (!cc || !slug) continue;

    const key = `${cc}|${slug}`;
    if (!byCountryEdition.has(key)) {
      byCountryEdition.set(key, {
        country_code: cc,
        game_slug: slug,
        year: Number(row.year),
        saison: safeTrim(row.saison),
        city: cityFromSlug(slug),
        is_host: Boolean(row.is_host),
        gold: 0,
        silver: 0,
        bronze: 0
      });
    }

    const entry = byCountryEdition.get(key);
    const mt = safeTrim(row.medal_type);
    if (mt === 'GOLD') entry.gold++;
    else if (mt === 'SILVER') entry.silver++;
    else if (mt === 'BRONZE') entry.bronze++;

    if (!byEdition.has(slug)) {
      byEdition.set(slug, {
        year: Number(row.year),
        saison: safeTrim(row.saison),
        city: cityFromSlug(slug),
        total: 0
      });
    }
    byEdition.get(slug).total++;

    byCountryTotal.set(cc, (byCountryTotal.get(cc) ?? 0) + 1);
    if (!countryNameMap.has(cc)) {
      countryNameMap.set(cc, safeTrim(row.country) || cc);
    }
  }

  const topN = [...byCountryTotal.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, VIZ1_TOP_N)
    .map(([cc]) => cc);
  const topNSet = new Set(topN);

  const countryPoints = new Map(topN.map((cc) => [cc, []]));
  const otherPoints = new Map();

  for (const entry of byCountryEdition.values()) {
    const { country_code: cc, game_slug: slug } = entry;
    const editionTotal = byEdition.get(slug)?.total ?? 1;
    const total = entry.gold + entry.silver + entry.bronze;
    const share_pct = editionTotal > 0 ? (total / editionTotal) * 100 : 0;

    const point = {
      year: entry.year,
      game_slug: slug,
      city: entry.city,
      saison: entry.saison,
      is_host: entry.is_host,
      gold: entry.gold,
      silver: entry.silver,
      bronze: entry.bronze,
      total_medals: total,
      share_pct
    };

    if (topNSet.has(cc)) {
      countryPoints.get(cc).push(point);
    } else {
      if (!otherPoints.has(slug)) {
        const edition = byEdition.get(slug);
        otherPoints.set(slug, {
          year: edition.year,
          game_slug: slug,
          city: edition.city,
          saison: edition.saison,
          is_host: false,
          gold: 0,
          silver: 0,
          bronze: 0,
          total_medals: 0,
          share_pct: 0
        });
      }
      const other = otherPoints.get(slug);
      other.gold += entry.gold;
      other.silver += entry.silver;
      other.bronze += entry.bronze;
      other.total_medals += total;
      other.share_pct =
        editionTotal > 0 ? (other.total_medals / editionTotal) * 100 : 0;
    }
  }

  const result = [];
  let fallbackIdx = 0;

  for (const cc of topN) {
    result.push({
      country_code: cc,
      country: countryNameMap.get(cc) ?? cc,
      color: countryColor(cc, fallbackIdx++),
      total_historical_medals: byCountryTotal.get(cc) ?? 0,
      series: (countryPoints.get(cc) ?? []).sort((a, b) => a.year - b.year)
    });
  }

  const othersSeries = [...otherPoints.values()].sort((a, b) => a.year - b.year);
  const othersTotal = [...byCountryTotal.entries()]
    .filter(([cc]) => !topNSet.has(cc))
    .reduce((sum, [, v]) => sum + v, 0);

  result.push({
    country_code: '__OTHERS__',
    country: 'Autres nations',
    color: '#94a3b8',
    total_historical_medals: othersTotal,
    series: othersSeries
  });

  return result;
}

function buildViz1DiversityData(medals) {
  const byMedalEdition = new Map();

  for (const row of medals) {
    const mt = safeTrim(row.medal_type);
    const slug = safeTrim(row.game_slug);
    const cc = safeTrim(row.country_code);
    if (!mt || !slug || !cc) continue;

    const key = `${mt}|${slug}`;
    if (!byMedalEdition.has(key)) {
      byMedalEdition.set(key, {
        medal_type: mt,
        game_slug: slug,
        year: Number(row.year),
        saison: safeTrim(row.saison),
        city: cityFromSlug(slug),
        countries: new Set()
      });
    }
    byMedalEdition.get(key).countries.add(cc);
  }

  return MEDAL_TYPES.map((mt) => ({
    medal_type: mt,
    color: MEDAL_COLORS[mt],
    series: [...byMedalEdition.values()]
      .filter((e) => e.medal_type === mt)
      .map((e) => ({
        year: e.year,
        game_slug: e.game_slug,
        city: e.city,
        saison: e.saison,
        country_count: e.countries.size
      }))
      .sort((a, b) => a.year - b.year)
  }));
}

export function exportViz1Csv(viz1Data, filename = 'viz1-output.csv') {
  const rows = [];
  for (const country of viz1Data?.performanceData ?? []) {
    for (const pt of country.series ?? []) {
      rows.push({
        country_code: country.country_code,
        country: country.country,
        year: pt.year,
        saison: pt.saison,
        city: pt.city,
        gold: pt.gold,
        silver: pt.silver,
        bronze: pt.bronze,
        total_medals: pt.total_medals,
        share_pct: Number(pt.share_pct).toFixed(2),
        is_host: pt.is_host
      });
    }
  }
  exportRowsToCsv(rows, filename);
}
