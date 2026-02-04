import { create } from "zustand";

type Tools = "cursor" | "circle" | "polygon" | "line";

export interface DrawingStyle {
  tool: Tools;
  fillColor: string;
  strokeColor: string;
  fillOpacity: number;
  strokeWidth: number;

  setTool: (tool: Tools) => void;
  setFillColor: (fillColor: string) => void;
  setStrokeColor: (strokeColor: string) => void;
  setFillOpacity: (fillOpacity: number) => void;
  setStrokeWidth: (strokeWidth: number) => void;
}

const initialState = {
  tool: "cursor" as Tools,
  fillOpacity: 1,
  strokeWidth: 1,
  fillColor: "#000",
  strokeColor: "#000",
};

export const useToolBar = create<DrawingStyle>((set) => ({
  ...initialState,

  setTool: (tool: Tools) => set({ tool }),
  setFillColor: (fillColor: string) => set({ fillColor }),
  setStrokeColor: (strokeColor: string) => set({ strokeColor }),
  setFillOpacity: (fillOpacity: number) => set({ fillOpacity }),
  setStrokeWidth: (strokeWidth: number) => set({ strokeWidth }),
}));
