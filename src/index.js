import {
  clearPreviousOutputs,
  getDeliveries,
  planDeliveryTrips,
  planDeliveryTripsByPriority,
  summary,
} from "./planner.js";

async function readDeliveries() {
  try {
    const deliveries = await getDeliveries();
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

  const standardResult = await planDeliveryTrips(deliveries);
  const priorityResult = await planDeliveryTripsByPriority(deliveries);
  const { trips, rejectedDeliveries } = standardResult;

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
  console.log("PRIORITY-BASED TRIP PLAN");
  console.log("=====================================================");
  console.log(`Priority-based Trips: ${priorityResult.trips.length}`);
  console.dir(priorityResult.trips, { depth: null });

  console.log("=====================================================");
  console.log("Thank you for using the Delivery Route Planner!");
}

main();
