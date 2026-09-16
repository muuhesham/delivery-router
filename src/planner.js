import fs from "fs";

if(fs.existsSync("./data/trips.json") && fs.existsSync("./data/rejectedDeliveries.json")){
    fs.unlinkSync("./data/trips.json");
    fs.unlinkSync("./data/rejectedDeliveries.json");
    console.log("Deleted previous trips.json & rejectedDeliveries.json files.");
    console.log("------------------------------------------------------------");
}

export function planDeliveryTrips(deliveries) {
  const rejectedDeliveries = deliveries.filter((d) => d.weight > 10.0 || d.weight <= 0);
  const validDeliveries = deliveries.filter(
    (d) => d.weight > 0 && d.weight <= 10.0,
  );

  validDeliveries.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.area.localeCompare(b.area);
  });

  const trips = [];
  let reminingDeliveries = [...validDeliveries];

  while (reminingDeliveries.length > 0) {
    const firtstDelivery = reminingDeliveries.shift();

    let currentTrip = {
      tripId: trips.length + 1,
      deliveries: [firtstDelivery],
      totalWeight: firtstDelivery.weight,
      reminingWeight: Math.round(10.0 - firtstDelivery.weight),
      area: firtstDelivery.area,
    };

    for (let i = 0; i < reminingDeliveries.length; i++) {
      const delivery = reminingDeliveries[i];

      if (delivery.area === currentTrip.area && currentTrip.totalWeight + delivery.weight <= 10.0) {
        currentTrip.deliveries.push(delivery);
        currentTrip.totalWeight = Math.round(currentTrip.totalWeight + delivery.weight);
        currentTrip.reminingWeight = Math.round(10.0 - currentTrip.totalWeight);
        reminingDeliveries.splice(i, 1);
        i--;
      }
    }
    trips.push(currentTrip);
  }
  
  fs.writeFileSync("./data/trips.json", JSON.stringify(trips), "utf-8");
  fs.writeFileSync("./data/rejectedDeliveries.json", JSON.stringify(rejectedDeliveries), "utf-8");

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
