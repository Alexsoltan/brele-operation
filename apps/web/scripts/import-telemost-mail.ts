import { loadScriptEnv } from "./script-utils";

async function main() {
  loadScriptEnv();

  const { importTelemostMeetingDrafts } = await import(
    "@/lib/mail/telemost-import"
  );

  const results = await importTelemostMeetingDrafts();

  const imported = results.reduce((sum, item) => sum + item.imported, 0);
  const skipped = results.reduce((sum, item) => sum + item.skipped, 0);
  const errors = results.filter((item) => item.error);

  console.log(
    JSON.stringify(
      {
        imported,
        skipped,
        errors,
        results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
