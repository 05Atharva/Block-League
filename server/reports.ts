/** Local administrator command. No moderation endpoint is exposed to players. */
import { Service } from "./service.ts";
const service = new Service(
  process.env.DATA_FILE || "./data/block-league.json",
);
const [command, reportId] = process.argv.slice(2);
if (command === "resolve") {
  const r = service.db.reports.find((r) => r.id === reportId);
  if (!r) throw Error("Report not found");
  r.status = "reviewed";
  r.reviewedAt = Date.now();
  service.save();
  console.log("Marked report reviewed:", reportId);
} else console.log(JSON.stringify(service.db.reports, null, 2));
