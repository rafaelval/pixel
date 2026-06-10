import { useState, useEffect, useRef } from "react";
import { usePixelStore } from "../store/pixelStore";
import styles from "./PixelGrid.module.css";

export const PixelGrid = () => {
  const { cells, colors, activeColorId, fillCell } = usePixelStore();
  const [isMouseDown, setIsMouseDown] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    if (isMouseDown) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMouseDown]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("touchend", handleGlobalMouseUp);
    document.addEventListener("touchcancel", handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchend", handleGlobalMouseUp);
      document.removeEventListener("touchcancel", handleGlobalMouseUp);
    };
  }, []);

  const handleMouseDown = (cellId) => {
    setIsMouseDown(true);
    fillCell(cellId);
  };

  const handleMouseEnter = (cellId) => {
    if (isMouseDown) {
      fillCell(cellId);
    }
  };

  const handleTouchStart = (cellId, e) => {
    e.preventDefault();
    setIsMouseDown(true);
    fillCell(cellId);
  };

  const handleTouchMove = (e) => {
    if (!isMouseDown) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.dataset.cellId) {
      fillCell(parseInt(element.dataset.cellId));
    }
  };

  return (
    <div 
      className={styles.grid}
      ref={gridRef}
      onMouseDown={() => {}}
      onTouchStart={() => {}}
      onTouchMove={handleTouchMove}
    >
      {cells.map((cell) => {
        const isTransparent = cell.colorId === 0;
        const isHighlighted = !cell.filled && cell.colorId === activeColorId;
        const filledColor = cell.filled
          ? colors.find((c) => c.id === cell.colorId)?.color
          : undefined;

        return (
          <div
            key={cell.id}
            data-cell-id={cell.id}
            className={`
              ${styles.cell}
              ${isTransparent ? styles.transparent : ""}
              ${isHighlighted ? styles.highlighted : ""}
              ${cell.filled ? styles.filled : ""}
            `}
            style={{ backgroundColor: filledColor }}
            onMouseDown={() => handleMouseDown(cell.id)}
            onMouseEnter={() => handleMouseEnter(cell.id)}
            onTouchStart={(e) => handleTouchStart(cell.id, e)}
          >
            {!cell.filled && !isTransparent && (
              <span className={styles.number}>{cell.colorId}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};