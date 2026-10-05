import React from "react";
import { ArchView } from "./ArchView";
import { NumbersView } from "./NumbersView";
import { CompareView } from "./CompareView";
import { CodeView, TextView } from "./CodeTextView";
import type { ViewProps } from "./types";

/** view kind → renderer. Adding a view is one line here. */
export const VIEWS: Record<string, React.FC<any>> = {
  architecture: ArchView, numbers: NumbersView, compare: CompareView,
  code: CodeView, text: TextView,
};

export type { ViewProps };
