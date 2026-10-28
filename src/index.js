import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { clearPreviousOutputs, planDeliveryTrips, summary } from "./planner.js";

const deliveriesFile = fileURLToPath(
  new URL("../data/deliveries.json", import.meta.url),
);

async function readDeliveries() {
  try {
    const rawData = await readFile(deliveriesFile, "utf-8");
    if (rawData.trim().length === 0) {
      return [];
    }

    const deliveries = JSON.parse(rawData);
    if (Array.isArray(deliveries) && deliveries.length === 0) {
      return [];
    }

    if (!Array.isArray(deliveries)) {
      throw new Error(
        "Invalid Array of Data: Expected an array of deliveries.",
      );
    }

    return deliveries;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(
        "Deliveries Data not found. Please make sure the file path is correct.",
      );
    } else if (err instanceof SyntaxError) {
      console.error(
        "Invalid JSON format. Please check for syntax errors in your data file.",
      );
    } else {
      console.error(
        "Error reading or parsing delivery data. Please try again.",
      );
    }
    process.exit(1);
  }
}

async function main() {
  await clearPreviousOutputs();

  console.log("Welcome to the Delivery Route Planner!");
  console.log("=====================================================");

  const deliveries = await readDeliveries();
  if (deliveries.length === 0) {
    console.log(`No deliveries to schedule. Total Trips: 0`);
    return;
  } else {
    console.log(`Total Deliveries: ${deliveries.length}`);
    console.log("ALL RECEIVED DELIVERIES : ", deliveries);
  }
  console.log("----------------------------------------------------");

  const { trips, rejectedDeliveries } = await planDeliveryTrips(deliveries);

  if (rejectedDeliveries.length === 0) {
    console.log(`No rejected deliveries. Total Rejected Deliveries: 0`);
  } else {
    const rejectionCount = rejectedDeliveries.length;
    const deliveryLabel = rejectionCount === 1 ? "delivery was rejected" : "deliveries were rejected";
    console.log(
      `${rejectionCount} ${deliveryLabel}. Rejected because one or more delivery fields are invalid.\nRejected Deliveries:`,
      rejectedDeliveries,
    );
  }

  console.log("----------------------------------------------------");

  console.log(`Total Trips: ${trips.length}`);
  console.dir(trips, { depth: null });

  summary(trips, rejectedDeliveries);

  console.log("=====================================================");
  console.log("Thank you for using the Delivery Route Planner!");
}

main();
