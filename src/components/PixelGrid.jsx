import { useState, useEffect } from "react";
import { usePixelStore } from "../store/pixelStore";
import styles from "./PixelGrid.module.css";

export const PixelGrid = () => {
  const { cells, colors, activeColorId, fillCell } = usePixelStore();
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Listener global para asegurar que mouseUp se detecte en cualquier lugar
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

  return (
    <div className={styles.grid}>
      {cells.map((cell) => {
        const isTransparent = cell.colorId === 0;
        const isHighlighted = !cell.filled && cell.colorId === activeColorId;
        const filledColor = cell.filled
          ? colors.find((c) => c.id === cell.colorId)?.color
          : undefined;

        return (
          <div
            key={cell.id}
            className={`
              ${styles.cell}
              ${isTransparent ? styles.transparent : ""}
              ${isHighlighted ? styles.highlighted : ""}
              ${cell.filled ? styles.filled : ""}
            `}
            style={{ backgroundColor: filledColor }}
            onMouseDown={() => handleMouseDown(cell.id)}
            onMouseEnter={() => handleMouseEnter(cell.id)}
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