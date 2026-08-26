import React from 'react';
import { Box } from '@mui/material';
import {
  Arrangement,
  BandRow,
  Lane,
  SectionColumn,
  SectionKey,
  bandLayout,
} from '@inkedin/shared/utils/studioSections';

interface SectionBandProps {
  lane: Lane;
  arrangement: Arrangement;
  /** What each section renders as. A key absent here is simply not shown. */
  nodes: Partial<Record<SectionKey, React.ReactNode>>;
  /**
   * Whether a section will actually draw something. Defaults to "it has a
   * node", which is right for the editor, where an empty section still shows
   * its own placeholder. The public page knows better and says so: a section
   * that renders nothing must not hold a cell, or it leaves a hole and shifts
   * everything after it.
   */
  present?: (key: SectionKey) => boolean;
}

export const COLUMNS: SectionColumn[] = ['left', 'right'];

/**
 * One row of a band.
 *
 * `1fr` rows in an auto-height grid resolve to the tallest cell, and every
 * cell stretches to fill, so the two cards in a row are always the same height
 * however different their contents. That is not only tidier: dnd-kit sizes its
 * overlay from the card you picked up, and cards of wildly different heights
 * made every drag feel wrong.
 */
export const ROW_LAYOUT = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
  gap: 3,
  mb: 3,
  alignItems: 'stretch',
} as const;

/** Makes a section's own card fill the cell it was given. */
export const FILL_CELL = {
  height: '100%',
  '& > *': { height: '100%' },
} as const;

/**
 * One band of the studio page, laid out as the studio arranged it.
 *
 * A full-width section takes a whole row; otherwise each row holds up to two
 * cards, and a row may legitimately hold only one - a gap is a position a
 * studio chose, not a mistake to be closed up.
 *
 * Deliberately free of any drag machinery. The editor wraps the same rows in
 * handles, but a visitor's page must not carry a drag-and-drop library it can
 * never use.
 */
const SectionBand: React.FC<SectionBandProps> = ({ lane, arrangement, nodes, present }) => {
  const { rows } = bandLayout(
    lane,
    arrangement,
    (key) => nodes[key] !== undefined && (present ? present(key) : true),
  );

  if (rows.length === 0) {
    return null;
  }

  const renderRow = (row: BandRow, index: number) => {
    if (row.full) {
      return (
        <Box key={`row-${index}`} sx={{ mb: 3 }}>
          {nodes[row.full]}
        </Box>
      );
    }

    return (
      <Box key={`row-${index}`} sx={ROW_LAYOUT}>
        {COLUMNS.map((column) => (
          <Box key={column} sx={FILL_CELL}>
            {row[column] ? nodes[row[column] as SectionKey] : null}
          </Box>
        ))}
      </Box>
    );
  };

  return <>{rows.map(renderRow)}</>;
};

export default SectionBand;
