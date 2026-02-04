import { create } from "zustand";

export interface DrawingStyle {
  fillColor: string;
  strokeColor: string;
  fillOpacity: number;
  strokeWidth: number;

  setFillColor: (fillColor: string) => void;
  setStrokeColor: (strokeColor: string) => void;
  setFillOpacity: (fillOpacity: number) => void;
  setStrokeWidth: (strokeWidth: number) => void;
}

const initialState = {
  fillOpacity: 1,
  strokeWidth: 1,
  fillColor: "#000",
  strokeColor: "#000",
};

export const useDrawingStyle = create<DrawingStyle>((set) => ({
  ...initialState,

  setFillColor: (fillColor: string) => set({ fillColor }),
  setStrokeColor: (strokeColor: string) => set({ strokeColor }),
  setFillOpacity: (fillOpacity: number) => set({ fillOpacity }),
  setStrokeWidth: (strokeWidth: number) => set({ strokeWidth }),
}));
