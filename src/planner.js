import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const deliveriesFile = fileURLToPath(
  new URL("../data/deliveries.json", import.meta.url),
);
const tripsFile = fileURLToPath(new URL("../data/trips.json", import.meta.url));
const rejectedDeliveriesFile = fileURLToPath(
  new URL("../data/rejectedDeliveries.json", import.meta.url),
);
const seedDeliveriesFile = fileURLToPath(
  new URL("../data/seed-deliveries.json", import.meta.url),
);

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

async function getSeedDeliveries() {
  return JSON.parse(await fs.readFile(seedDeliveriesFile, "utf-8"));
}

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
  try {
    const rawData = await fs.readFile(deliveriesFile, "utf-8");
    if (rawData.trim().length === 0) {
      const seedDeliveries = await getSeedDeliveries();
      await fs.writeFile(deliveriesFile, JSON.stringify(seedDeliveries, null, 2), "utf-8");
      return seedDeliveries;
    }

    const deliveries = JSON.parse(rawData);
    if (deliveries.length === 0) {
      const seedDeliveries = await getSeedDeliveries();
      await fs.writeFile(deliveriesFile, JSON.stringify(seedDeliveries, null, 2), "utf-8");
      return seedDeliveries;
    }

    return deliveries;
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    const seedDeliveries = await getSeedDeliveries();
    await fs.writeFile(deliveriesFile, JSON.stringify(seedDeliveries, null, 2), "utf-8");
    return seedDeliveries;
  }
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
      totalWeight: roundToOneDecimal(firstDelivery.weight),
      remainingWeight: roundToOneDecimal(10.0 - firstDelivery.weight),
      area: firstDelivery.area,
    };

    for (let i = 0; i < remainingDeliveries.length; i++) {
      const delivery = remainingDeliveries[i];

      const totalWithDelivery = roundToOneDecimal(
        currentTrip.totalWeight + delivery.weight,
      );
      if (delivery.area === currentTrip.area && totalWithDelivery <= 10.0) {
        currentTrip.deliveries.push(delivery);
        currentTrip.totalWeight = totalWithDelivery;
        currentTrip.remainingWeight = roundToOneDecimal(
          10.0 - currentTrip.totalWeight,
        );
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

export async function planDeliveryTripsByPriority(deliveries) {
  const validDeliveries = deliveries.filter(isValidDelivery);
  const rejectedDeliveries = deliveries.filter(
    (delivery) => !isValidDelivery(delivery),
  );
  const sortedDeliveries = [...validDeliveries].sort((a, b) =>
    a.priority !== b.priority
      ? a.priority - b.priority
      : a.area.localeCompare(b.area),
  );
  const trips = [];
  let remainingDeliveries = [...sortedDeliveries];

  while (remainingDeliveries.length > 0) {
    const currentTrip = {
      tripId: trips.length + 1,
      deliveries: [],
      totalWeight: 0,
      remainingWeight: 10,
      area: "Multiple areas",
    };

    for (let i = 0; i < remainingDeliveries.length; i++) {
      const delivery = remainingDeliveries[i];
      const totalWithDelivery = roundToOneDecimal(
        currentTrip.totalWeight + delivery.weight,
      );
      if (totalWithDelivery <= 10) {
        currentTrip.deliveries.push(delivery);
        currentTrip.totalWeight = totalWithDelivery;
        remainingDeliveries.splice(i, 1);
        i--;
      }
    }

    currentTrip.remainingWeight = roundToOneDecimal(10 - currentTrip.totalWeight);
    trips.push(currentTrip);
  }

  return { trips, rejectedDeliveries };
}

export function summary(trips, rejectedDeliveries) {
    console.log("=====================================================");
    console.log("QUICK SUMMARY")
    console.log("=====================================================");

    const totalTrips = trips.length;
    const totalRejectedDeliveries = rejectedDeliveries.length;
    const totalCapacity = roundToOneDecimal(trips.length * 10);
    const totalWeight = roundToOneDecimal(
      trips.reduce((acc, trip) => acc + trip.totalWeight, 0),
    );
    console.log(`Total Trips : ${totalTrips}`);
    console.log(`Total Rejected Deliveries : ${totalRejectedDeliveries}`);
    console.log(`Total Capacity : ${totalCapacity} kg`);
    console.log(`Total Weight of Deliveries : ${totalWeight} kg`);
    console.log(
      `Total Wasted Capacity : ${roundToOneDecimal(totalCapacity - totalWeight)}`,
    );
}
