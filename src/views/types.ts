import type { ViewState } from "@/engine/state";

export type ViewProps<S extends ViewState = ViewState> = {
  prev: S; next: S;
  /** 0→1 settle progress of the current step */
  t: number;
  stepIndex: number;
  /** frames into the current step */
  into: number;
  fps: number;
  /** pixels available to this pane */
  width: number;
  height: number;
  label?: string;
};
