import React, { useCallback, useRef } from 'react';

const MIN_WIDTH = 50;
const MAX_WIDTH = 500;

/**
 * Custom column-resize header cell.
 * Drag the right-edge handle → updates width via onResize(e, { size: { width } }).
 */
const ResizableTitle = props => {
  const { onResize, width, children, ...restProps } = props;
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();

      startXRef.current = e.clientX;
      startWidthRef.current = Number(width) || 0;

      const onMouseMove = moveEvent => {
        const delta = moveEvent.clientX - startXRef.current;
        const nextWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(startWidthRef.current + delta)));
        onResize(moveEvent, { size: { width: nextWidth } });
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      // Prevent text selection / keep resize cursor while dragging outside the handle
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [onResize, width]
  );

  if (!width || !onResize) {
    return <th {...restProps}>{children}</th>;
  }

  return (
    <th {...restProps} style={{ ...restProps.style, position: 'relative', width }}>
      {children}
      <button
        type="button"
        aria-label="Resize column"
        onClick={e => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 1,
          width: 10,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'col-resize',
        }}
      />
    </th>
  );
};

export default ResizableTitle;
