import { usePixelStore } from "../store/pixelStore";
import styles from "./ColorPalette.module.css";

export const ColorPalette = () => {
  const { colors, activeColorId, setActiveColor, isColorComplete } = usePixelStore();

  return (
    <div className={styles.palette}>
      {colors.map((color) => {
        const complete = isColorComplete(color.id);
        return (
          <div
            key={color.id}
            className={`
              ${styles.dot}
              ${activeColorId === color.id ? styles.active : ""}
              ${complete ? styles.complete : ""}
            `}
            style={{ backgroundColor: color.color }}
            onClick={() => setActiveColor(color.id)}
            title={`Color ${color.id} — ${color.total} celdas`}
          >
            <span className={styles.label}>{color.id}</span>
          </div>
        );
      })}
    </div>
  );
};
