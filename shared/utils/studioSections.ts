/**
 * The blocks a studio owner can move around their page.
 *
 * Mirrors App\Enums\StudioSection. The banner, the studio header, the
 * announcement band and the portfolio are absent on purpose: they are the
 * page's structure rather than widgets, so they stay where they are.
 */
export type SectionKey = 'artists' | 'location' | 'hours' | 'guides' | 'contact' | 'spotlight';

/**
 * Order matters. This reproduces the arrangement every layout shipped with, so
 * a studio that never touches the drag handles sees no change.
 */
export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'artists',
  'location',
  'hours',
  'guides',
  'contact',
  'spotlight',
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  artists: 'Artists',
  location: 'Location',
  hours: 'Hours',
  guides: 'Guides',
  contact: 'Contact',
  spotlight: 'Spotlight',
};

/**
 * A section only moves within the band it already lives in, and which band
 * that is still belongs to the layout. Storefront leads with whether you are
 * open, team leads with the people, so those sections sit in the feature band
 * and drop out of the info grid.
 */
export type Lane = 'feature' | 'info';

export function defaultBandFor(key: SectionKey, template?: string): Lane | null {
  switch (key) {
    case 'spotlight':
      return 'feature';
    case 'artists':
      // Only the team layout leads with the people. Otherwise the artist list
      // is pinned to the portfolio sidebar and belongs to no band at all.
      return template === 'team' ? 'feature' : null;
    case 'hours':
    case 'contact':
      return template === 'storefront' ? 'feature' : 'info';
    default:
      return 'info';
  }
}

/**
 * Which band a section sits in, or null when it is pinned somewhere outside
 * both - which today means the artist list on any layout but team.
 */
export function bandOf(
  key: SectionKey,
  template?: string,
  bands: Record<string, Lane> = {},
): Lane | null {
  const moved = bands[key];

  return moved === 'feature' || moved === 'info' ? moved : defaultBandFor(key, template);
}

export function laneMembers(
  lane: Lane,
  template?: string,
  bands: Record<string, Lane> = {},
): SectionKey[] {
  return DEFAULT_SECTION_ORDER.filter((key) => bandOf(key, template, bands) === lane);
}

/** Keep only real band moves. Sparse, so the layout still decides the rest. */
export function resolveSectionBands(stored?: Record<string, string> | null): Record<string, Lane> {
  const moved: Record<string, Lane> = {};

  Object.entries(stored || {}).forEach(([key, value]) => {
    if ((value === 'feature' || value === 'info') && key in DEFAULT_SECTION_WIDTHS) {
      moved[key] = value;
    }
  });

  return moved;
}

/**
 * Both bands are two-column grids, so a section is either one column or the
 * whole width. Mirrors App\Enums\StudioSectionWidth.
 */
export type SectionWidth = 'half' | 'full';

/**
 * Where a section starts before anyone drags its edge. Mirrors
 * StudioSection::defaultWidth(): spotlight and the artist list are lists of
 * their own and read badly in one column; the rest are short cards that pair
 * up.
 */
export const DEFAULT_SECTION_WIDTHS: Record<SectionKey, SectionWidth> = {
  artists: 'full',
  location: 'half',
  hours: 'half',
  guides: 'half',
  contact: 'half',
  spotlight: 'full',
};

export const columnsFor = (width: SectionWidth): number => (width === 'full' ? 2 : 1);

export const WIDTH_LABELS: Record<SectionWidth, string> = {
  half: 'Half width',
  full: 'Full width',
};

/**
 * The API sends a complete map, so this is a guard for a studio loaded from a
 * response that predates the field, and for the editor's own in-progress
 * widths. Stored overrides are sparse; anything absent keeps its default.
 */
export function resolveSectionWidths(
  stored?: Record<string, string> | null,
): Record<SectionKey, SectionWidth> {
  const resolved = { ...DEFAULT_SECTION_WIDTHS };

  Object.entries(stored || {}).forEach(([key, value]) => {
    if (key in resolved && (value === 'half' || value === 'full')) {
      resolved[key as SectionKey] = value;
    }
  });

  return resolved;
}

/**
 * The API already reconciles a stored order against the current section list.
 * This repeats it for a studio loaded from a response that predates the field,
 * and for the editor's own in-progress order.
 */
export function resolveSectionOrder(stored?: string[] | null): SectionKey[] {
  const known = new Set<string>(DEFAULT_SECTION_ORDER);
  const saved = Array.from(new Set((stored || []).filter((key): key is SectionKey => known.has(key))));

  return [...saved, ...DEFAULT_SECTION_ORDER.filter((key) => !saved.includes(key))];
}

/**
 * The sections of one band, in the studio's order.
 */
export function orderedLane(
  lane: Lane,
  order: SectionKey[],
  template?: string,
  bands: Record<string, Lane> = {},
): SectionKey[] {
  const members = new Set(laneMembers(lane, template, bands));

  return order.filter((key) => members.has(key));
}

/**
 * Everything about how a studio has arranged its page.
 *
 * Passed around as one value because every part of the layout needs most of
 * it, and because order, width, column and band only make sense together.
 */
export interface Arrangement {
  /** Seeds the default packing, and nothing else once cells are explicit. */
  order: SectionKey[];
  widths: Record<SectionKey, SectionWidth>;
  columns: Record<string, SectionColumn>;
  rows: Record<string, number>;
  bands: Record<string, Lane>;
  template?: string;
}

/** Build the arrangement from whatever the API returned. */
export function resolveArrangement(studio: any): Arrangement {
  return {
    order: resolveSectionOrder(studio?.section_order),
    widths: resolveSectionWidths(studio?.section_widths),
    columns: resolveSectionColumns(studio?.section_columns),
    rows: resolveSectionRows(studio?.section_rows),
    bands: resolveSectionBands(studio?.section_bands),
    template: studio?.template || 'portfolio',
  };
}

/**
 * Which of a band's two stacks a half-width section sits in. Mirrors
 * App\Enums\StudioSectionColumn.
 */
export type SectionColumn = 'left' | 'right';

/**
 * Keep only real placements.
 *
 * Sparse by design: a section with no entry falls back to its position in the
 * band, so filling the gaps here would erase the distinction between "placed
 * left" and "never touched".
 */
export function resolveSectionColumns(
  stored?: Record<string, string> | null,
): Record<string, SectionColumn> {
  const placed: Record<string, SectionColumn> = {};

  Object.entries(stored || {}).forEach(([key, value]) => {
    if ((value === 'left' || value === 'right') && key in DEFAULT_SECTION_WIDTHS) {
      placed[key] = value;
    }
  });

  return placed;
}

/**
 * Where a section sits in its band: a row, and one of the two columns.
 *
 * A position is a cell rather than a place in a queue, which is the whole
 * point - a queue packs from the top, so a column could never hold a gap and
 * "put this one in the second row while the first stays empty" was
 * inexpressible. A full-width section owns both columns of its row.
 */
export interface Cell {
  row: number;
  column: SectionColumn;
}

/** One row of a band: either a single full-width section, or up to two cells. */
export interface BandRow {
  full?: SectionKey;
  left?: SectionKey;
  right?: SectionKey;
}

const at = (row: number, column: SectionColumn) => `${row}:${column}`;

/**
 * Resolve every section in a band to a cell.
 *
 * Sections the studio has actually placed are seated first, because that is
 * the arrangement they asked for; everything else is packed into the first
 * free cell in band order, which reproduces exactly what an untouched page has
 * always looked like. Two sections can never end up in one cell: a collision
 * moves the later one down.
 */
export function bandCells(
  keys: SectionKey[],
  widths: Record<SectionKey, SectionWidth>,
  rows: Record<string, number>,
  columns: Record<string, SectionColumn>,
): Record<string, Cell> {
  const cells: Record<string, Cell> = {};
  const taken = new Set<string>();
  const isFull = (key: SectionKey) => widths[key] === 'full';

  const free = (key: SectionKey, row: number, column: SectionColumn) => (isFull(key)
    ? !taken.has(at(row, 'left')) && !taken.has(at(row, 'right'))
    : !taken.has(at(row, column)));

  const seat = (key: SectionKey, row: number, column: SectionColumn) => {
    cells[key] = { row, column: isFull(key) ? 'left' : column };

    if (isFull(key)) {
      taken.add(at(row, 'left'));
      taken.add(at(row, 'right'));
    } else {
      taken.add(at(row, column));
    }
  };

  const placed = keys.filter((key) => rows[key] !== undefined);
  const rest = keys.filter((key) => rows[key] === undefined);

  placed.forEach((key) => {
    const column = columns[key] === 'right' ? 'right' : 'left';
    let row = Math.max(0, rows[key]);

    while (!free(key, row, column)) {
      row += 1;
    }

    seat(key, row, column);
  });

  rest.forEach((key) => {
    const prefer: SectionColumn[] = isFull(key) || columns[key]
      ? [columns[key] === 'right' ? 'right' : 'left']
      : ['left', 'right'];

    for (let row = 0; ; row += 1) {
      const column = prefer.find((candidate) => free(key, row, candidate));

      if (column) {
        seat(key, row, column);
        break;
      }
    }
  });

  return compact(cells);
}

/**
 * Close up rows nothing sits in.
 *
 * A row with one section and one gap is deliberate and stays. A row with
 * nothing in it at all is just a mystery band of empty page, which happens
 * whenever the last section leaves a row.
 */
function compact(cells: Record<string, Cell>): Record<string, Cell> {
  const used = Array.from(new Set(Object.values(cells).map((cell) => cell.row))).sort((a, b) => a - b);
  const renumbered = new Map(used.map((row, index) => [row, index]));
  const out: Record<string, Cell> = {};

  Object.entries(cells).forEach(([key, cell]) => {
    out[key] = { row: renumbered.get(cell.row) ?? cell.row, column: cell.column };
  });

  return out;
}

/** The band as rows, ready to render. */
export function toRows(
  cells: Record<string, Cell>,
  widths: Record<SectionKey, SectionWidth>,
): BandRow[] {
  const count = Object.values(cells).reduce((max, cell) => Math.max(max, cell.row + 1), 0);
  const rows: BandRow[] = Array.from({ length: count }, () => ({}));

  Object.entries(cells).forEach(([key, cell]) => {
    const section = key as SectionKey;

    if (widths[section] === 'full') {
      rows[cell.row].full = section;
    } else {
      rows[cell.row][cell.column] = section;
    }
  });

  return rows;
}

/**
 * A band's sections and their layout, from the raw stored arrangement.
 *
 * Both the public page and the editor start here, so neither can drift from
 * the other about which sections a band holds or where they sit.
 */
export function bandLayout(
  lane: Lane,
  arrangement: Arrangement,
  present: (key: SectionKey) => boolean,
): { keys: SectionKey[]; cells: Record<string, Cell>; rows: BandRow[] } {
  const keys = orderedLane(lane, arrangement.order, arrangement.template, arrangement.bands)
    .filter(present);

  const cells = bandCells(keys, arrangement.widths, arrangement.rows, arrangement.columns);

  return { keys, cells, rows: toRows(cells, arrangement.widths) };
}

/**
 * Move a section into a cell.
 *
 * Landing on an occupied cell swaps the two, which is the only behaviour that
 * never silently displaces something the studio put there on purpose. Landing
 * on an empty one just moves, leaving a gap behind - that gap being the thing
 * the queue model could not represent.
 */
export function moveToCell(
  cells: Record<string, Cell>,
  key: SectionKey,
  target: Cell,
): Record<string, Cell> {
  const from = cells[key];

  if (!from) {
    return cells;
  }

  const occupant = Object.keys(cells).find((other) => other !== key
    && cells[other].row === target.row
    && cells[other].column === target.column);

  const next = { ...cells, [key]: { ...target } };

  if (occupant) {
    next[occupant] = { ...from };
  }

  return next;
}

/** Keep only real row placements. */
export function resolveSectionRows(stored?: Record<string, number> | null): Record<string, number> {
  const placed: Record<string, number> = {};

  Object.entries(stored || {}).forEach(([key, value]) => {
    const row = Number(value);

    if (Number.isInteger(row) && row >= 0 && key in DEFAULT_SECTION_WIDTHS) {
      placed[key] = row;
    }
  });

  return placed;
}

/**
 * Drop anything that merely matches the default before saving.
 *
 * The point of storing overrides sparsely is that a section nobody deliberately
 * changed keeps following its layout. Publishing a complete map would freeze
 * today's defaults into every row the first time an owner drags anything - and
 * for bands it is worse than cosmetic: a section pinned to the band it was
 * already in stops moving when the owner switches layout.
 */
export function sparseWidths(
  widths: Record<SectionKey, SectionWidth>,
): Record<string, SectionWidth> {
  const changed: Record<string, SectionWidth> = {};

  (Object.keys(widths) as SectionKey[]).forEach((key) => {
    if (widths[key] !== DEFAULT_SECTION_WIDTHS[key]) {
      changed[key] = widths[key];
    }
  });

  return changed;
}

export function sparseBands(
  bands: Record<string, Lane>,
  template?: string,
): Record<string, Lane> {
  const changed: Record<string, Lane> = {};

  Object.entries(bands).forEach(([key, band]) => {
    if (band !== defaultBandFor(key as SectionKey, template)) {
      changed[key] = band;
    }
  });

  return changed;
}
