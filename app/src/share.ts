import { Platform } from "react-native";
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#F6F5F1"/><rect x="70" y="70" width="940" height="1210" rx="50" fill="#233942"/><text x="140" y="190" fill="#D6E7E4" font-family="sans-serif" font-size="34">BLOCK LEAGUE</text><text x="140" y="340" fill="white" font-family="sans-serif" font-size="60">A good little game.</text><text x="140" y="520" fill="#C4B0F6" font-family="sans-serif" font-size="140" font-weight="bold">${score.toLocaleString()}</text><text x="140" y="600" fill="#D6E7E4" font-family="sans-serif" font-size="34">${esc(mode)}</text>${["#F17854", "#9C7CEC", "#46B9A7", "#E5AF41", "#64A7E7", "#DC79AC"].map((c, i) => `<rect x="${140 + (i % 3) * 115}" y="${750 + Math.floor(i / 3) * 115}" width="100" height="100" rx="16" fill="${c}"/>`).join("")}<text x="140" y="1100" fill="white" font-family="sans-serif" font-size="34">Same blocks. Your move.</text><text x="140" y="1170" fill="#B8CDCF" font-family="sans-serif" font-size="25">Practice challenge · seed ${seed}</text></svg>`;
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
