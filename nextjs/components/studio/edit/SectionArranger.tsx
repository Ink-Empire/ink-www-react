import React, { createContext, useContext, useState } from 'react';
import { Box } from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  Arrangement,
  Cell,
  Lane,
  SectionColumn,
  SectionKey,
  SectionWidth,
  bandLayout,
  moveToCell,
} from '@inkedin/shared/utils/studioSections';

export interface ArrangerValue {
  arrangement: Arrangement;
  onResize: (key: SectionKey, width: SectionWidth) => void;
  /** The section currently being carried, if any. */
  activeKey: SectionKey | null;
}

const ArrangerContext = createContext<ArrangerValue | null>(null);

/** Null while previewing or on the public page, which turns the handles off. */
export const useArranger = () => useContext(ArrangerContext);

interface SectionArrangerProps {
  arrangement: Arrangement;
  /** Present sections, so a drop never targets something that is not rendered. */
  present: (key: SectionKey) => boolean;
  /** Needed here as well as in the bands, to draw the card being carried. */
  nodes: Partial<Record<SectionKey, React.ReactNode>>;
  /**
   * Positions are written for the whole band, not just the section that moved.
   * A drop has to mean what it looked like, and leaving the others to be packed
   * from defaults would shuffle them out from under the one being placed.
   */
  onChange: (change: {
    cells: Record<string, Cell>;
    band?: [SectionKey, Lane];
  }) => void;
  onResize: (key: SectionKey, width: SectionWidth) => void;
  children: React.ReactNode;
}

export const LANES: Lane[] = ['feature', 'info'];

export const cellId = (lane: Lane, row: number, column: SectionColumn) =>
  `${lane}-r${row}-${column}`;

/**
 * One drag surface across the whole editable page.
 *
 * Both bands live inside a single DndContext because a section has to be able
 * to leave the Info tab and join the strip above it - dnd-kit cannot drag
 * between separate contexts. Which band a drop landed in is read back off the
 * stack it hit, so the bands themselves stay dumb.
 */
const SectionArranger: React.FC<SectionArrangerProps> = ({
  arrangement,
  present,
  nodes,
  onChange,
  onResize,
  children,
}) => {
  // What is currently being carried, so it can be drawn in the overlay.
  const [activeKey, setActiveKey] = useState<SectionKey | null>(null);
  const sensors = useSensors(
    // A short travel threshold, so a tap on a handle is still a tap and only a
    // deliberate drag moves anything.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** The cell a drop landed on, across either band. */
  const resolveTarget = (overId: string) => {
    for (const lane of LANES) {
      const { rows } = bandLayout(lane, arrangement, present);

      // A spare row is rendered past the last one, so a section can always be
      // given a place of its own.
      for (let row = 0; row <= rows.length; row += 1) {
        for (const column of ['left', 'right'] as SectionColumn[]) {
          if (cellId(lane, row, column) === overId) {
            return { lane, cell: { row, column } as Cell };
          }
        }
      }
    }

    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveKey(null);

    if (!over) {
      return;
    }

    const activeKey = active.id as SectionKey;
    const target = resolveTarget(String(over.id));

    if (!target) {
      return;
    }

    // The band has to change before the cells are worked out, or the section
    // is placed against the band it is leaving.
    const bands = { ...arrangement.bands, [activeKey]: target.lane };
    const { cells } = bandLayout(target.lane, { ...arrangement, bands }, present);

    onChange({
      cells: moveToCell(cells, activeKey, target.cell),
      band: [activeKey, target.lane],
    });
  };

  return (
    // The id has to be given rather than generated. Without it dnd-kit numbers
    // each context from a global counter, which starts in a different place on
    // the server than in the browser, and the aria-describedby it hangs off
    // every handle then fails hydration.
    <DndContext
      id="studio-sections"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event: DragStartEvent) => setActiveKey(event.active.id as SectionKey)}
      onDragCancel={() => setActiveKey(null)}
      onDragEnd={handleDragEnd}
    >
      <ArrangerContext.Provider value={{ arrangement, onResize, activeKey }}>
        {children}
      </ArrangerContext.Provider>

      {/* The card being carried is drawn here, in a layer above the page,
          rather than by moving the card that is still in the layout. Nothing
          in the bands shifts until the drop lands, which is what stopped the
          page lurching around mid-drag. */}
      <DragOverlay>
        {activeKey ? (
          <Box sx={{ opacity: 0.95, cursor: 'grabbing' }}>{nodes[activeKey]}</Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SectionArranger;
