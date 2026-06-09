import { Actor, log } from "apify";
import {
  createBattlecardRun,
  defaultInput,
  renderRunMarkdown
} from "./battlecard-engine.mjs";

function envFlag(name, fallback = "false") {
  return String(process.env[name] || fallback).toLowerCase() === "true";
}

async function maybeCharge(record) {
  if (!envFlag("ENABLE_PPE_CHARGE")) {
    return { charged: false, reason: "ENABLE_PPE_CHARGE is not true" };
  }
  if (record.status !== "succeeded") {
    return { charged: false, reason: "record did not succeed" };
  }

  try {
    const result = await Actor.charge({ eventName: "competitor-battlecard-generated" });
    return { charged: true, result };
  } catch (error) {
    log.warning("Pay-per-event charge was skipped or failed", { message: error.message });
    return { charged: false, reason: error.message };
  }
}

await Actor.init();

try {
  const input = await Actor.getInput() || defaultInput();
  const run = await createBattlecardRun(input, {
    onFetch: (details) => log.info("Fetching public page", details)
  });

  const charged = [];
  for (const record of run.records) {
    const charge = await maybeCharge(record);
    charged.push({ url: record.url, ...charge });
    await Actor.pushData({ ...record, charge });
  }

  const runWithCharges = {
    ...run,
    charged
  };

  await Actor.setValue("RUN.json", runWithCharges, { contentType: "application/json; charset=utf-8" });
  await Actor.setValue("BATTLECARDS.md", renderRunMarkdown(runWithCharges), { contentType: "text/markdown; charset=utf-8" });

  log.info("Competitor battlecard run finished", {
    competitors: run.summary.totalCompetitors,
    succeeded: run.summary.succeeded,
    failed: run.summary.failed,
    dryRun: run.summary.dryRun
  });
} finally {
  await Actor.exit();
}
