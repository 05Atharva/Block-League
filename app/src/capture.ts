import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
export async function captureAndShare(ref: any) {
  if (!ref?.current) throw Error("Open the result-card preview first");
  const uri = await captureRef(ref, {
    format: "png",
    quality: 1,
    width: 1080,
    height: 1350,
    result: "tmpfile",
  });
  if (!(await Sharing.isAvailableAsync()))
    throw Error("File sharing is unavailable on this device");
  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    UTI: "public.png",
    dialogTitle: "Share your Block League result",
  });
}
