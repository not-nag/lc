import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";

export const interFamily = loadInter("normal", { weights: ["400", "600", "700"], subsets: ["latin"] }).fontFamily;
export const monoFamily = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] }).fontFamily;
export const displayFamily = loadDisplay("normal", { weights: ["600", "700", "800"], subsets: ["latin"] }).fontFamily;
