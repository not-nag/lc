import React from "react";
import { ArrayView } from "./ArrayView";
import type { ArrayState } from "@/engine/state";
import type { ViewProps } from "./types";

/** A string is an array of characters — same renderer, same ops. */
export const StringView: React.FC<ViewProps<ArrayState>> = (p) => <ArrayView {...p} />;
