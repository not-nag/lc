import React from "react";
import { ArrayView } from "./ArrayView";
import { StringView } from "./StringView";
import { BarsView } from "./BarsView";
import { MapView } from "./MapView";
import { LinearView } from "./LinearView";
import { GridView } from "./GridView";
import { VarsView } from "./VarsView";
import { TreeView } from "./TreeView";
import { GraphView } from "./GraphView";
import { ListView } from "./ListView";
import { CodeView, TextView } from "./CodeTextView";
import type { ViewProps } from "./types";

/** view kind → renderer. Adding a data structure is one line here. */
export const VIEWS: Record<string, React.FC<any>> = {
  array: ArrayView, string: StringView, bars: BarsView, map: MapView,
  stack: LinearView, queue: LinearView, grid: GridView,
  vars: VarsView, tree: TreeView, graph: GraphView,
  list: ListView, code: CodeView, text: TextView,
};

/** Escape hatch: `{type:'custom', component:'X'}` resolves against this. */
export const CUSTOM: Record<string, React.FC<any>> = {};
export const registerCustom = (name: string, c: React.FC<any>) => { CUSTOM[name] = c; };
export type { ViewProps };
