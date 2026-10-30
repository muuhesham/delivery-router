import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  addDelivery,
  deleteDelivery,
  getDeliveries,
  planDeliveryTrips,
  planDeliveryTripsByPriority,
  updateDelivery,
} from "./planner.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const clientDirectory = path.join(projectRoot, "client");
const port = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());
app.use(express.static(clientDirectory));

app.get("/api/deliveries", async (request, response, next) => {
  try {
    response.json(await getDeliveries());
  } catch (error) {
    next(error);
  }
});

app.post("/api/deliveries", async (request, response, next) => {
  try {
    response.status(201).json(await addDelivery(request.body));
  } catch (error) {
    next(error);
  }
});

app.put("/api/deliveries/:id", async (request, response, next) => {
  try {
    response.json(await updateDelivery(Number(request.params.id), request.body));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/deliveries/:id", async (request, response, next) => {
  try {
    response.json(await deleteDelivery(Number(request.params.id)));
  } catch (error) {
    next(error);
  }
});

app.post("/api/plan", async (request, response, next) => {
  try {
    response.json(await planDeliveryTrips(await getDeliveries()));
  } catch (error) {
    next(error);
  }
});

app.post("/api/plan/priority", async (request, response, next) => {
  try {
    response.json(await planDeliveryTripsByPriority(await getDeliveries()));
  } catch (error) {
    next(error);
  }
});

app.use((error, request, response, next) => {
  response.status(400).json({ error: error.message });
});

app.listen(port, () => {
  console.log(`Delivery Route Planner client running at http://localhost:${port}`);
});
