import { usePixelStore } from "../store/pixelStore";
import styles from "./PokemonPreview.module.css";

export const PokemonPreview = () => {
  const { currentPokemon, loading } = usePixelStore();

  if (loading || !currentPokemon?.image) {
    return (
      <div className={styles.preview}>
        <div className={styles.placeholder} />
      </div>
    );
  }

  return (
    <div className={styles.preview}>
      <img
        src={currentPokemon.image}
        alt={currentPokemon.name}
        className={styles.image}
      />
    </div>
  );
};
