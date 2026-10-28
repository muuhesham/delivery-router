import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const deliveriesFile = fileURLToPath(
  new URL("../data/deliveries.json", import.meta.url),
);
const tripsFile = fileURLToPath(new URL("../data/trips.json", import.meta.url));
const rejectedDeliveriesFile = fileURLToPath(
  new URL("../data/rejectedDeliveries.json", import.meta.url),
);

export function isValidDelivery(delivery) {
  return (
    delivery !== null &&
    typeof delivery === "object" &&
    Number.isInteger(delivery.id) && delivery.id > 0 &&
    typeof delivery.area === "string" && delivery.area.trim().length > 0 &&
    Number.isInteger(delivery.priority) && delivery.priority > 0 &&
    delivery.priority <= 3 &&
    typeof delivery.weight === "number" &&
    Number.isFinite(delivery.weight) &&
    delivery.weight > 0 && delivery.weight <= 10
  );
}

export async function getDeliveries() {
  return JSON.parse(await fs.readFile(deliveriesFile, "utf-8"));
}

async function saveDeliveries(deliveries) {
  await fs.writeFile(deliveriesFile, JSON.stringify(deliveries, null, 2), "utf-8");
}

export async function addDelivery(delivery) {
  if (!isValidDelivery(delivery)) {
    throw new Error("Invalid delivery data.");
  }

  const deliveries = await getDeliveries();
  if (deliveries.some((item) => item.id === delivery.id)) {
    throw new Error("A delivery with this ID already exists.");
  }

  deliveries.push(delivery);
  await saveDeliveries(deliveries);
  return delivery;
}

export async function deleteDelivery(id) {
  const deliveries = await getDeliveries();
  const deliveryIndex = deliveries.findIndex((delivery) => delivery.id === id);

  if (deliveryIndex === -1) {
    throw new Error("Delivery not found.");
  }

  const deletedDelivery = deliveries[deliveryIndex];
  deliveries.splice(deliveryIndex, 1);
  await saveDeliveries(deliveries);
  return deletedDelivery;
}

export async function updateDelivery(id, updates) {
  const deliveries = await getDeliveries();
  const deliveryIndex = deliveries.findIndex((delivery) => delivery.id === id);

  if (deliveryIndex === -1) {
    throw new Error("Delivery not found.");
  }

  const updatedDelivery = { ...deliveries[deliveryIndex], ...updates };
  if (!isValidDelivery(updatedDelivery)) {
    throw new Error("Invalid delivery data.");
  }

  if (deliveries.some((delivery) => delivery.id === updatedDelivery.id && delivery.id !== id)) {
    throw new Error("A delivery with this ID already exists.");
  }

  deliveries[deliveryIndex] = updatedDelivery;
  await saveDeliveries(deliveries);
  return updatedDelivery;
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function clearPreviousOutputs() {
  let deletedPreviousOutput = false;
  if (await fileExists(tripsFile)) {
    await fs.unlink(tripsFile);
    deletedPreviousOutput = true;
  }
  if (await fileExists(rejectedDeliveriesFile)) {
    await fs.unlink(rejectedDeliveriesFile);
    deletedPreviousOutput = true;
  }

  if (deletedPreviousOutput) {
    console.log("Deleted previous trips.json & rejectedDeliveries.json files.");
    console.log("------------------------------------------------------------");
  }
}

export async function planDeliveryTrips(deliveries) {
  const validDeliveries = [];
  const rejectedDeliveries = [];

  for (const delivery of deliveries) {
    if (isValidDelivery(delivery)) {
      validDeliveries.push(delivery);
    } else {
      rejectedDeliveries.push(delivery);
    }
  }

  validDeliveries.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.area.localeCompare(b.area);
  });

  const trips = [];
  let remainingDeliveries = [...validDeliveries];

  while (remainingDeliveries.length > 0) {
    const firstDelivery = remainingDeliveries.shift();

    let currentTrip = {
      tripId: trips.length + 1,
      deliveries: [firstDelivery],
      totalWeight: firstDelivery.weight,
      remainingWeight: 10.0 - firstDelivery.weight,
      area: firstDelivery.area,
    };

    for (let i = 0; i < remainingDeliveries.length; i++) {
      const delivery = remainingDeliveries[i];

      if (delivery.area === currentTrip.area && currentTrip.totalWeight + delivery.weight <= 10.0) {
        currentTrip.deliveries.push(delivery);
        currentTrip.totalWeight = currentTrip.totalWeight + delivery.weight;
        currentTrip.remainingWeight = 10.0 - currentTrip.totalWeight;
        remainingDeliveries.splice(i, 1);
        i--;
      }
    }
    trips.push(currentTrip);
  }
  
  await fs.writeFile(tripsFile, JSON.stringify(trips), "utf-8");
  await fs.writeFile(rejectedDeliveriesFile, JSON.stringify(rejectedDeliveries), "utf-8");

  return {
    trips,
    rejectedDeliveries,
  };
}

export function summary(trips, rejectedDeliveries) {
    console.log("=====================================================");
    console.log("QUICK SUMMARY")
    console.log("=====================================================");

    const totalTrips = trips.length;
    const totalRejectedDeliveries = rejectedDeliveries.length;
    const totalCapacity = trips.length * 10;
    const totalWeight = trips.reduce((acc, trip) => acc + trip.totalWeight, 0);
    console.log(`Total Trips : ${totalTrips}`);
    console.log(`Total Rejected Deliveries : ${totalRejectedDeliveries}`);
    console.log(`Total Capacity : ${totalCapacity} kg`);
    console.log(`Total Weight of Deliveries : ${totalWeight} kg`);
    console.log(`Total Wasted Capacity : ${totalCapacity - totalWeight}`);
}
