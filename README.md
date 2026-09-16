# Delivery Route Planner

Node.js program that organizes delivery requests into trips. Each trip has a maximum capacity of 10 kg.

## Installation and Running

### Requirements

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Steps
1. Clone or download the repository as Zip file, then navigate to the project directory:
   ```bash
   cd project-folder
1. Open a terminal in the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the program:
   ```bash
   npm start 
   ```

The program reads deliveries from `data/deliveries.json`.

The input format is JSON. Each delivery must contain:

```json
{
	"id": 1,
	"area": "Nasr City",
	"priority": 2,
	"weight": 4.5
}
```

## Solution Approach

1. Read the deliveries from `data/deliveries.json`.
2. Reject deliveries with a weight greater than 10 kg or a non-positive weight.
3. Sort valid deliveries by priority. Lower priority numbers are handled first.
4. Group deliveries from the same area when the trip still has enough capacity.
5. Save the generated trips and rejected deliveries in the `data` folder.
6. Print a short summary of the result.

Every valid delivery is added to exactly one trip, and no trip exceeds 10 kg.



### 1. Explain your solution approach in your own words.

The program uses a **Greedy heuristic approach**:
1. **Filtering:** Separates packages exceeding 10.0 kg or with invalid weights into `rejectedDeliveries`.
2. **Sorting:** Sorts valid deliveries by `priority` first (most urgent first), then by `area`.
3. **Trip Assembly:** Picks the highest-priority delivery to initiate a trip, then scans remaining items to pack orders for the **exact same area** until reaching vehicle capacity (10.0 kg).

Focusing on the same area minimizes vehicle transit overhead, saves fuel, and cuts operational costs while honoring delivery urgency.

---

### 2. What was the most difficult part of the assignment?

Balancing **urgency (priority)** against **operational cost (area grouping)** under the 10.0 kg limit. Strictly following priority scatters trips across different areas, while strictly grouping by area delays urgent orders. Resolving this required starting each trip with the top-priority item and filling remaining capacity from the same area, alongside handling JavaScript floating-point rounding.

---

### 3. Are there situations where your algorithm may not produce the best possible grouping?

Yes, because the greedy approach takes immediate matches instead of finding the global best fit:
- **Sub-optimal Packing:** Picking the first fitting parcel might block a combination of other parcels that could utilize 100% of the 10 kg capacity.
- **Priority Trade-off:** A non-urgent order (Priority 3) in the same area is loaded before an urgent order (Priority 1) in a different area.
- **Underfilled Vehicles:** If an area only has a single small package (e.g., 2 kg), the truck dispatches mostly empty rather than serving a neighboring zone.

---

### 4. If the input contained 1,000,000 delivery requests, what part of your solution might become slow or memory-intensive?

- **In-Memory Bottlenecks:** Loading 1,000,000 JSON records into RAM risks `JavaScript heap out of memory`.


**At-scale solution:**
- Store records in a database (like PostgreSQL) with composite indexes on `(area, priority, weight)`.
- Query and process batches incrementally using database cursors/streams instead of parsing one monolithic file into memory.

---

### 5. What would you improve if you had another day to work on the solution?

1. **Lightweight Frontend UI:** Build a simple web dashboard for dispatchers to upload files, visualize vehicle fill rates, and inspect trips.
2. **Database & Indexing:** Migrate from static JSON files to an indexed database for scalable batch processing.
3. **Automated Unit Tests:** Add test suites covering 10.0 kg capacity boundaries, negative weights, and floating-point edge cases.


## Additional Feature

The program includes two useful output files:

- `data/trips.json`: contains the trips created from the valid deliveries.
- `data/rejectedDeliveries.json`: contains deliveries that could not be scheduled because their weight is greater than 10 kg or is not positive.

It also prints a quick summary based on the generated trips and the input data, including:

- Total number of trips
- Total number of rejected deliveries
- Total vehicle capacity
- Total delivery weight
- Wasted capacity

These files are regenerated each time the program runs.
