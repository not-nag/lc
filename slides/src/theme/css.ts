import { palette, font } from "./index";
/** CSS custom properties for the Next.js site, derived from the same tokens. */
export const cssVars = `
:root{
${Object.entries(palette).map(([k, v]) => `  --c-${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}: ${v};`).join("\n")}
  --font-display: ${font.display};
  --font-body: ${font.body};
  --font-mono: ${font.mono};
}`;
