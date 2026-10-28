import fs from "node:fs";
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
    typeof delivery.weight === "number" &&
    Number.isFinite(delivery.weight) &&
    delivery.weight > 0 && delivery.weight <= 10
  );
}

export function getDeliveries() {
  return JSON.parse(fs.readFileSync(deliveriesFile, "utf-8"));
}

function saveDeliveries(deliveries) {
  fs.writeFileSync(deliveriesFile, JSON.stringify(deliveries, null, 2), "utf-8");
}

export function addDelivery(delivery) {
  if (!isValidDelivery(delivery)) {
    throw new Error("Invalid delivery data.");
  }

  const deliveries = getDeliveries();
  if (deliveries.some((item) => item.id === delivery.id)) {
    throw new Error("A delivery with this ID already exists.");
  }

  deliveries.push(delivery);
  saveDeliveries(deliveries);
  return delivery;
}

export function deleteDelivery(id) {
  const deliveries = getDeliveries();
  const deliveryIndex = deliveries.findIndex((delivery) => delivery.id === id);

  if (deliveryIndex === -1) {
    throw new Error("Delivery not found.");
  }

  const deletedDelivery = deliveries[deliveryIndex];
  deliveries.splice(deliveryIndex, 1);
  saveDeliveries(deliveries);
  return deletedDelivery;
}

export function updateDelivery(id, updates) {
  const deliveries = getDeliveries();
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
  saveDeliveries(deliveries);
  return updatedDelivery;
}

let deletedPreviousOutput = false;
if (fs.existsSync(tripsFile)) {
  fs.unlinkSync(tripsFile);
  deletedPreviousOutput = true;
}
if (fs.existsSync(rejectedDeliveriesFile)) {
  fs.unlinkSync(rejectedDeliveriesFile);
  deletedPreviousOutput = true;
}

if (deletedPreviousOutput) {
  console.log("Deleted previous trips.json & rejectedDeliveries.json files.");
  console.log("------------------------------------------------------------");
}

export function planDeliveryTrips(deliveries) {
  const rejectedDeliveries = deliveries.filter((delivery) => !isValidDelivery(delivery));
  const validDeliveries = deliveries.filter(isValidDelivery);

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
  
  fs.writeFileSync(tripsFile, JSON.stringify(trips), "utf-8");
  fs.writeFileSync(rejectedDeliveriesFile, JSON.stringify(rejectedDeliveries), "utf-8");

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
