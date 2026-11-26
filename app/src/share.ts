import { Platform } from "react-native";
import { brand, palette } from "./design";
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function resultSvg(score: number, mode: string, seed: number) {
  const tiles = palette
    .map(
      (color, i) =>
        `<rect x="${140 + (i % 3) * 115}" y="${755 + Math.floor(i / 3) * 115}" width="100" height="100" rx="16" fill="${color}"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <rect width="1080" height="1350" fill="${brand.paper}"/>
    <rect x="70" y="70" width="940" height="1210" rx="54" fill="${brand.ink}"/>
    <g transform="translate(116 128) scale(.68)">
      <path d="M30 34a8 8 0 0 1 8-8h17a8 8 0 0 1 8 8v38h29a8 8 0 0 1 8 8v15a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8Z" fill="${brand.tile}"/>
      <rect x="76" y="31" width="30" height="30" rx="7" transform="rotate(9 91 46)" fill="${brand.accent}"/>
    </g>
    <g font-family="sans-serif">
      <text x="205" y="186" fill="${brand.paper}" font-size="40" font-weight="bold">Block League</text>
      <text x="140" y="495" fill="${brand.accent}" font-size="154" font-weight="bold">${score.toLocaleString()}</text>
      <text x="140" y="580" fill="${brand.quiet}" font-size="38">${esc(mode)}</text>
      <text x="140" y="1100" fill="${brand.paper}" font-size="42" font-weight="bold">Same blocks. Your move.</text>
      <text x="140" y="1170" fill="${brand.quiet}" font-size="30">Practice challenge · seed ${seed}</text>
    </g>
    ${tiles}
  </svg>`;
}
export async function exportCard(
  score: number,
  mode: string,
  seed: number,
  ref?: any,
) {
  if (Platform.OS !== "web") {
    const { captureAndShare } = await import("./capture");
    return captureAndShare(ref);
  }
  const svg = resultSvg(score, mode, seed),
    url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(Error("Could not render result card"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("Canvas export is unavailable");
    ctx.drawImage(img, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(Error("PNG export failed"))),
        "image/png",
      ),
    );
    const download = URL.createObjectURL(png);
    const a = document.createElement("a");
    a.href = download;
    a.download = "block-league-result.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(download), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
