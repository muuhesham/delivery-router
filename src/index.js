import { readFile } from "node:fs/promises";
import { planDeliveryTrips, summary } from "./planner.js";

async function readDeliveries() {
  try {
    const rawData = await readFile("./data/deliveries.json", "utf-8");
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
        "Error in reading or parsing Data of Deliveries. TRY AGAIN!",
      );
    }
    process.exit(1);
  }
}

async function main() {
  console.log("WELCOME TO Delivery Route Planner!");
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

  const { trips, rejectedDeliveries } = planDeliveryTrips(deliveries);

  if (rejectedDeliveries.length === 0) {
    console.log(`No rejected deliveries. Total Rejected Deliveries: 0`);
  } else {
    console.log(
      `There is ${rejectedDeliveries.length} rejected deliveries. Cause: Exceeds maximum vehicle 10 kg capacity!
Rejected Deliveries:`,
      rejectedDeliveries,
    );
  }

  console.log("----------------------------------------------------");

  console.log(`Total Trips: ${trips.length}`);
  console.dir(trips, { depth: null });

  summary(trips, rejectedDeliveries);

  console.log("=====================================================");
  console.log("THANK YOU FOR USING Delivery Route Planner!");
}

main();
