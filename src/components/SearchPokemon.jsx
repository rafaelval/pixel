import { useState, useEffect } from "react";
import { usePixelStore } from "../store/pixelStore";
import styles from "./SearchPokemon.module.css";

export const SearchPokemon = () => {
  const { loadPokemon } = usePixelStore();
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchPokemon = async () => {
      if (searchText.trim().length < 1) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon?limit=1200`
        );
        const data = await response.json();

        const filtered = data.results
          .filter((p) =>
            p.name.toLowerCase().startsWith(searchText.toLowerCase())
          )
          .slice(0, 8);

        setSuggestions(filtered);
        setIsOpen(filtered.length > 0);
      } catch (error) {
        console.error("Error searching Pokémon:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchPokemon, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  const handleSelectPokemon = (pokemonName) => {
    // Extract ID from URL
    const id = pokemonName.url.match(/\/(\d+)\/$/)?.[1];
    if (id) {
      loadPokemon(parseInt(id));
      setSearchText("");
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          placeholder="Buscar Pokémon..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => searchText && setIsOpen(true)}
          onBlur={handleBlur}
          className={styles.input}
        />
        {isLoading && <span className={styles.loader}>⟳</span>}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {suggestions.map((pokemon) => (
            <li
              key={pokemon.name}
              onClick={() => handleSelectPokemon(pokemon)}
              className={styles.suggestionItem}
            >
              <span className={styles.pokemonName}>
                {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isOpen && searchText && suggestions.length === 0 && !isLoading && (
        <div className={styles.noResults}>
          No se encontraron Pokémon
        </div>
      )}
    </div>
  );
};
