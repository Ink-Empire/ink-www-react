import React, { useRef, useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSortable } from '@dnd-kit/sortable';
import { colors } from '@/styles/colors';
import { SectionWidth, WIDTH_LABELS } from '@inkedin/shared/utils/studioSections';

interface SortableSectionProps {
  id: string;
  label: string;
  width: SectionWidth;
  onResize?: (width: SectionWidth) => void;
  children: React.ReactNode;
}

/** How far the edge has to travel before the section snaps to the other width. */
const SNAP_DISTANCE = 56;

/** Clears the grip row, so neither handle sits on a section's own heading. */
const GRIP_ROW = 32;

/**
 * One draggable, resizable block in the studio editor.
 *
 * Only the grip starts a move and only the right edge starts a resize, never
 * the card. The card holds its own Edit button, form fields and links, and
 * making the whole thing a drag target would swallow every one of those
 * clicks. It also keeps `touch-action: none` confined to the two handles, so
 * the page still scrolls normally on a phone.
 */
const SortableSection: React.FC<SortableSectionProps> = ({
  id,
  label,
  width,
  onResize,
  children,
}) => {
  // transform is deliberately unused: the card being carried is drawn in the
  // arranger's overlay, so this one stays exactly where it is and only fades.
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id });

  const [resizing, setResizing] = useState(false);
  const resizeStart = useRef<{ x: number; width: SectionWidth } | null>(null);

  const applyWidth = (next: SectionWidth) => {
    if (onResize && next !== width) {
      onResize(next);
    }
  };

  const handleResizeDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!onResize) return;

    event.preventDefault();
    event.stopPropagation();

    // Capture keeps the gesture alive when the pointer leaves the handle,
    // which it immediately does. It throws if the pointer is already gone, and
    // that must not strand the drag before it starts.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Carry on uncaptured; the move handler still tracks the pointer.
    }

    resizeStart.current = { x: event.clientX, width };
    setResizing(true);
  };

  const handleResizeMove = (event: React.PointerEvent<HTMLElement>) => {
    const start = resizeStart.current;
    if (!start) return;

    // Measured from where the drag began rather than from the last frame, so
    // pulling back past the start undoes the snap without letting go.
    const travelled = event.clientX - start.x;

    applyWidth(start.width === 'half'
      ? (travelled > SNAP_DISTANCE ? 'full' : 'half')
      : (travelled < -SNAP_DISTANCE ? 'half' : 'full'));
  };

  const handleResizeUp = (event: React.PointerEvent<HTMLElement>) => {
    resizeStart.current = null;
    setResizing(false);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Already released, which is the outcome we wanted anyway.
    }
  };

  // The edge is a pointer gesture, so give it arrow keys too rather than
  // leaving width unreachable without a mouse.
  const handleResizeKey = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      applyWidth('full');
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      applyWidth('half');
    }
  };

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: 'relative',
        // Fills the row the run gave it, so every card in a run is the same
        // height whatever its content.
        height: '100%',
        zIndex: resizing ? 5 : 'auto',
        // Faded rather than hidden, so the space it will vacate stays visible
        // and the rest of the band does not collapse while dragging.
        opacity: isDragging ? 0.35 : 1,
        transition: 'opacity 0.15s',
        '&:hover .section-resize': { opacity: 1 },
      }}
    >
      <Tooltip title={`Drag to move ${label.toLowerCase()}`} placement="left">
        <Box
          {...attributes}
          {...listeners}
          aria-label={`Move ${label}`}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 0.75,
            py: 0.5,
            borderRadius: '8px',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            bgcolor: colors.surface,
            border: `1px solid ${isDragging ? colors.accent : colors.border}`,
            color: isDragging ? colors.accent : colors.textSecondary,
            '&:hover': { borderColor: colors.accent, color: colors.accent },
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Move
          </Typography>
        </Box>
      </Tooltip>

      {onResize && (
        <Box
          className="section-resize"
          role="separator"
          tabIndex={0}
          aria-label={`Resize ${label}, currently ${WIDTH_LABELS[width].toLowerCase()}`}
          aria-orientation="vertical"
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          onPointerCancel={handleResizeUp}
          onKeyDown={handleResizeKey}
          sx={{
            position: 'absolute',
            top: `${GRIP_ROW}px`,
            bottom: 0,
            right: -10,
            width: 14,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'col-resize',
            touchAction: 'none',
            opacity: resizing ? 1 : 0.45,
            transition: 'opacity 0.15s',
            '&:focus-visible': { opacity: 1, outline: 'none' },
          }}
        >
          <Box sx={{
            width: 4,
            height: 44,
            borderRadius: '999px',
            bgcolor: resizing ? colors.accent : colors.border,
          }} />
        </Box>
      )}

      {resizing && (
        <Typography sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 4,
          px: 1,
          py: 0.5,
          borderRadius: '8px',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          bgcolor: colors.accent,
          color: colors.background,
        }}>
          {WIDTH_LABELS[width]}
        </Typography>
      )}

      <Box sx={{ pt: `${GRIP_ROW}px`, height: '100%', boxSizing: 'border-box' }}>
        {children}
      </Box>
    </Box>
  );
};

export default SortableSection;
