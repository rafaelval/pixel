import { useEffect, useState } from "react";
import { usePixelStore, GRID_SIZE } from "./store/pixelStore";
import { PixelGrid } from "./components/PixelGrid";
import { ColorPalette } from "./components/ColorPalette";
import { SearchPokemon } from "./components/SearchPokemon";
import { PokemonPreview } from "./components/PokemonPreview";
import { ProgressBar } from "./components/ProgressBar";
import styles from "./App.module.css";

export const App = () => {
  const {
    loadRandomPokemon,
    loading,
    completed,
    getProgress,
    activeColorId,
    colors,
    currentPokemon,
  } = usePixelStore();

  // Cálculo dinámico del ancho del grid según el tamaño de la pantalla
  const [cellSize, setCellSize] = useState(12);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      let newCellSize;
      if (width <= 480) {
        // En móviles, usar 10px para que quepa bien el grid de 64x64
        newCellSize = 10;
      } else if (width <= 768) {
        newCellSize = 10;
      } else {
        newCellSize = 12;
      }
      setCellSize(newCellSize);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const gap = 0; // px (sin gaps para evitar líneas blancas)
  const gridWidth = GRID_SIZE * cellSize + (GRID_SIZE - 1) * gap;

  // Carga un Pokémon aleatorio al montar la app
  useEffect(() => {
    loadRandomPokemon();
  }, []);

  const { done, total } = getProgress();
  const activeColor = colors.find((c) => c.id === activeColorId);

  return (
    <div 
      className={styles.page} 
      style={{ 
        "--grid-width": `${gridWidth}px`,
        "--grid-size": GRID_SIZE
      }}
    >
      <h1 className={styles.title}>Pokémon Pixel Art</h1>

      <div className={styles.topBar}>
        <div className={styles.leftSection}>
          <SearchPokemon />
        </div>
        <div className={styles.rightSection}>
          <PokemonPreview />
        </div>
      </div>

      <div className={styles.mainContainer}>
        <div className={styles.sidebar}>
          <ColorPalette />
        </div>

        <div className={styles.content}>
          <div className={styles.controls}>
            {currentPokemon && (
              <span className={styles.pokemonName}>
                #{currentPokemon.id} {currentPokemon.name}
              </span>
            )}
            <button
              className={styles.randomBtn}
              onClick={loadRandomPokemon}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Aleatorio"}
            </button>
          </div>

          <div className={styles.progressWrap}>
            <ProgressBar done={done} total={total} />
          </div>

          {loading ? (
            <p className={styles.loading}>Cargando sprite...</p>
          ) : (
            <div className={styles.gridWrap}>
              <PixelGrid />
            </div>
          )}

          {completed && <p className={styles.winMsg}>¡Completado! 🎉</p>}

          <p className={styles.hint}>
            {activeColor
              ? `Color ${activeColorId} seleccionado — ${activeColor.total - activeColor.done} celdas restantes`
              : "Selecciona un color de la paleta para empezar"}
          </p>
        </div>
      </div>
    </div>
  );
};