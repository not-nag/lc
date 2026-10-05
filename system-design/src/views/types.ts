import type { ViewState } from "@/engine/state";

export type ViewProps<S extends ViewState = ViewState> = {
  prev: S; next: S;
  /** 0 → 1 as this slide's change settles */
  t: number;
  /** index of the slide being shown, so views can animate things born on it */
  slideIndex: number;
  /** pixels available to this pane */
  width: number;
  height: number;
  label?: string;
};
