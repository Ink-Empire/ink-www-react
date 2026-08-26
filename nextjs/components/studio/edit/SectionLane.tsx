import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import SortableSection from './SortableSection';
import { useArranger, cellId } from './SectionArranger';
import SectionBand, { COLUMNS, FILL_CELL, ROW_LAYOUT } from '../SectionBand';
import { colors } from '@/styles/colors';
import {
  Arrangement,
  BandRow,
  Lane,
  SECTION_LABELS,
  SectionColumn,
  SectionKey,
  bandLayout,
} from '@inkedin/shared/utils/studioSections';

interface SectionLaneProps {
  lane: Lane;
  arrangement: Arrangement;
  /** What each section renders as. A key absent here is simply not shown. */
  nodes: Partial<Record<SectionKey, React.ReactNode>>;
  /** False while previewing, which hands off to the plain renderer. */
  editing: boolean;
}

/** Keeps an empty cell big enough to aim at. */
const EMPTY_CELL_HEIGHT = 112;

/** Leaves every card where it is for the duration of a drag. */
const HOLD_STILL = () => null;

interface CellProps {
  id: string;
  section?: SectionKey;
  node?: React.ReactNode;
  width?: 'half' | 'full';
  onResize: (width: 'half' | 'full') => void;
}

/**
 * One cell of a band. Either it holds a section, or it is an opening a section
 * can be dropped into - and an opening says so rather than being an invisible
 * gutter that only reveals itself once a drag is already underway.
 */
const Cell: React.FC<CellProps> = ({ id, section, node, width, onResize }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  if (section && node !== undefined) {
    return (
      <Box ref={setNodeRef} sx={{
        ...FILL_CELL,
        borderRadius: '12px',
        outline: isOver ? `2px dashed ${colors.accent}` : 'none',
        outlineOffset: 6,
      }}>
        <SortableSection
          id={section}
          label={SECTION_LABELS[section]}
          width={width || 'half'}
          onResize={onResize}
        >
          <Box sx={FILL_CELL}>{node}</Box>
        </SortableSection>
      </Box>
    );
  }

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: EMPTY_CELL_HEIGHT,
        height: '100%',
        borderRadius: '12px',
        border: `1px dashed ${isOver ? colors.accent : colors.border}`,
        bgcolor: isOver ? `${colors.accent}14` : 'transparent',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
    >
      <Typography sx={{ fontSize: '0.8rem', color: isOver ? colors.accent : colors.textMuted }}>
        Drop a section here
      </Typography>
    </Box>
  );
};

/**
 * One band of the studio page with its sections made draggable.
 *
 * The drag surface itself belongs to SectionArranger, which wraps both bands
 * at once so a section can leave the Info tab for the strip above it. This
 * renders the cells and registers each one as a drop target.
 */
const SectionLane: React.FC<SectionLaneProps> = ({ lane, arrangement, nodes, editing }) => {
  const arranger = useArranger();
  const { keys, rows } = bandLayout(lane, arrangement, (key) => nodes[key] !== undefined);

  // Preview hands off to the same renderer the public page uses, so there is
  // no second layout for the two to drift apart on.
  if (!editing || !arranger) {
    return keys.length === 0
      ? null
      : <SectionBand lane={lane} arrangement={arrangement} nodes={nodes} />;
  }

  const cellFor = (row: number, column: SectionColumn, section?: SectionKey) => (
    <Cell
      key={column}
      id={cellId(lane, row, column)}
      section={section}
      node={section ? nodes[section] : undefined}
      width={section ? arrangement.widths[section] : undefined}
      onResize={(next) => section && arranger.onResize(section, next)}
    />
  );

  const renderRow = (row: BandRow, index: number) => {
    if (row.full) {
      return (
        <Box key={`row-${index}`} sx={{ mb: 3 }}>
          {cellFor(index, 'left', row.full)}
        </Box>
      );
    }

    return (
      <Box key={`row-${index}`} sx={ROW_LAYOUT}>
        {COLUMNS.map((column) => cellFor(index, column, row[column]))}
      </Box>
    );
  };

  return (
    <SortableContext id={`lane-${lane}`} items={keys} strategy={HOLD_STILL}>
      {rows.map(renderRow)}

      {/* One spare row, so a section can always be given a place of its own -
          including in a band everything has been dragged out of. */}
      <Box sx={ROW_LAYOUT}>
        {COLUMNS.map((column) => cellFor(rows.length, column, undefined))}
      </Box>
    </SortableContext>
  );
};

export default SectionLane;
