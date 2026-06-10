import { create } from "zustand";

export const GRID_SIZE = 64;

async function fetchRandomPokemonId() {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon-species/?limit=1");
  const data = await res.json();
  const total = data.count;
  return Math.floor(Math.random() * total) + 1;
}

async function fetchPokemonName(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  return data.name.charAt(0).toUpperCase() + data.name.slice(1);
}

function hexFromRgba(r, g, b, a) {
  if (a < 100) return null;
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorDistance(hexA, hexB) {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function quantizeColors(rawColors, threshold = 30) {
  const sorted = [...rawColors].sort((a, b) => b.total - a.total);
  const groups = [];

  for (const color of sorted) {
    const match = groups.find(
      (g) => colorDistance(g.representative, color.hex) < threshold
    );
    if (match) {
      match.members.push(color.id);
    } else {
      groups.push({ representative: color.hex, members: [color.id] });
    }
  }

  const remapIds = new Map();
  const finalColors = [];
  let newId = 1;

  for (const group of groups) {
    const representativeId = newId++;
    for (const oldId of group.members) {
      remapIds.set(oldId, representativeId);
    }
    finalColors.push({ id: representativeId, color: group.representative });
  }

  return { remapIds, finalColors };
}

async function processSprite(pokemonId) {
  const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(img, 0, 0);
  const tempData = tempCtx.getImageData(0, 0, img.width, img.height).data;

  let minX = img.width, maxX = 0, minY = img.height, maxY = 0;

  for (let i = 0; i < img.width * img.height; i++) {
    const a = tempData[i * 4 + 3];
    if (a > 128) {
      const y = Math.floor(i / img.width);
      const x = i % img.width;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  if (minX === img.width) {
    minX = 0;
    maxX = img.width - 1;
    minY = 0;
    maxY = img.height - 1;
  }

  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;

  const canvas = document.createElement("canvas");
  canvas.width = GRID_SIZE;
  canvas.height = GRID_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    img,
    minX,
    minY,
    croppedWidth,
    croppedHeight,
    0,
    0,
    GRID_SIZE,
    GRID_SIZE
  );
  const { data } = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);

  const colorMap = new Map();
  let counter = 1;
  const rawCells = [];

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];
    const hex = hexFromRgba(r, g, b, a);

    if (!hex) {
      rawCells.push({ id: i, colorId: 0, filled: true });
      continue;
    }

    if (!colorMap.has(hex)) colorMap.set(hex, counter++);
    rawCells.push({ id: i, colorId: colorMap.get(hex), filled: false });
  }

  const rawColors = Array.from(colorMap.entries()).map(([hex, id]) => ({
    id,
    hex,
    total: rawCells.filter((c) => c.colorId === id).length,
  }));

  const { remapIds, finalColors } = quantizeColors(rawColors, 30);

  const cells = rawCells.map((c) => ({
    ...c,
    colorId: c.colorId === 0 ? 0 : remapIds.get(c.colorId),
  }));

  const colors = finalColors.map((c) => ({
    ...c,
    total: cells.filter((cell) => cell.colorId === c.id).length,
    done: 0,
  }));

  return { cells, colors };
}

export const usePixelStore = create((set, get) => ({
  cells: [],
  colors: [],
  activeColorId: null,
  loading: false,
  completed: false,
  currentPokemon: null,

  loadRandomPokemon: async () => {
    set({ loading: true, completed: false, activeColorId: null, currentPokemon: null });
    const id = await fetchRandomPokemonId();
    const name = await fetchPokemonName(id);
    const { cells, colors } = await processSprite(id);
    set({ cells, colors, loading: false, currentPokemon: { id, name } });
  },

  loadPokemon: async (pokemonId) => {
    set({ loading: true, completed: false, activeColorId: null });
    const name = await fetchPokemonName(pokemonId);
    const { cells, colors } = await processSprite(pokemonId);
    set({ cells, colors, loading: false, currentPokemon: { id: pokemonId, name } });
  },

  setActiveColor: (id) => {
    const { colors } = get();
    const col = colors.find((c) => c.id === id);
    if (!col || col.done === col.total) return;
    set({ activeColorId: id });
  },

  fillCell: (cellId) =>
    set((state) => {
      const cell = state.cells[cellId];
      if (!cell || cell.colorId === 0 || cell.filled || cell.colorId !== state.activeColorId)
        return state;

      const updatedCells = state.cells.map((c) =>
        c.id === cellId ? { ...c, filled: true } : c
      );
      const updatedColors = state.colors.map((c) =>
        c.id === state.activeColorId ? { ...c, done: c.done + 1 } : c
      );
      const allDone = updatedCells
        .filter((c) => c.colorId > 0)
        .every((c) => c.filled);

      return { cells: updatedCells, colors: updatedColors, completed: allDone };
    }),

  isColorComplete: (colorId) => {
    const { colors } = get();
    const col = colors.find((c) => c.id === colorId);
    return col ? col.done === col.total : false;
  },

  getProgress: () => {
    const { cells } = get();
    const playable = cells.filter((c) => c.colorId > 0);
    const done = playable.filter((c) => c.filled);
    return { total: playable.length, done: done.length };
  },
}));