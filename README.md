# Delivery Route Planner

![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg?logo=node.js&logoColor=white)

A Node.js application that manages delivery requests and organizes them into trips with a maximum vehicle capacity of **10 kg**. It provides a web interface and a CLI, validates deliveries, groups compatible orders, and records scheduled trips and rejected deliveries.

## Overview

Delivery Route Planner reads delivery data from JSON and provides browser and API tools for managing deliveries. The planner prioritizes deliveries, groups orders from the same area when capacity allows, and generates trip plans and summaries through the browser or terminal.

<img width="1808" height="972" alt="image" src="https://github.com/user-attachments/assets/bf6b2321-daf5-4534-9237-8c55ebceb2e0" />
<img width="1914" height="1018" alt="image" src="https://github.com/user-attachments/assets/b1c8737d-790d-4c57-9365-6b9fa56b1091" />

## Features

- Reads deliveries from a JSON input file.
- Provides a browser interface for managing deliveries.
- Supports creating, updating, deleting, listing, and planning deliveries through a REST API.
- Rejects deliveries with invalid fields, unsupported priorities, or invalid weights.
- Groups deliveries by area within the 10 kg trip capacity.
- Sorts deliveries by priority and area.
- Generates separate trip and rejected-delivery JSON outputs.
- Generates both area-based and priority-based trip plans.
- Provides a priority-based planning button in the web interface.
- Prints a quick planning summary in the terminal.

## Repository Structure

```text
├── data/
│   ├── deliveries.json
│   ├── seed-deliveries.json
│   ├── trips.json
│   └── rejectedDeliveries.json
├── client/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── index.js
│   ├── planner.js
│   └── server.js
├── package.json
└── README.md
```

## Quick Start

```bash
npm install
npm start
```

Then open `http://localhost:3000` in your browser. `npm start` runs the Express server and its web interface.

To run the planner in the terminal instead, use:

```bash
npm run cli
```

The CLI displays both the area-based trip plan and the priority-based trip plan.

In the web interface, **Generate Trips** uses the area-based planner, while **Generate by Priority** uses the priority-based planner. Generated results are written to the `data` folder.

## Output

| File | Purpose |
| --- | --- |
| `data/trips.json` | Scheduled trips and their deliveries |
| `data/rejectedDeliveries.json` | Deliveries that could not be scheduled |

## Installation and Running

### Requirements

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Steps

1. Clone or download the repository as a ZIP file, then open a terminal in the project directory.
2. Navigate to the project directory:
   ```bash
   cd project-folder
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the program:
   ```bash
   npm start
   ```

The web application reads and updates deliveries in `data/deliveries.json`.

The input format is JSON. Each delivery must contain:

```json
{
	"id": 1,
	"area": "Nasr City",
	"priority": 2,
	"weight": 4.5
}
```

The ID must be a positive integer, the area must be non-empty, the priority must be an integer from 1 to 3, and the weight must be a finite number greater than 0 kg and no more than 10 kg.

## Solution Approach

The program uses a greedy approach: it validates the deliveries, sorts valid orders by priority and area, starts each trip with the highest-priority delivery, and fills it with orders from the same area until the 10 kg limit is reached. Every valid delivery is assigned once, while invalid weights and weights above 10 kg are rejected.

An additional priority-based mode sorts deliveries by priority first, then groups fitting deliveries into trips that may contain multiple areas.

### Assignment Notes

- **Challenges:** Balancing urgent deliveries with area grouping and floating-point weights within the 10 kg limit.
- **Limitations:** This greedy method may leave trips underfilled or miss combinations with better capacity utilization.
- **Large datasets:** Loading millions of deliveries into memory would be inefficient. The scalable solution would use a database and process records in batches or streams.
- **Future improvements:** Add automated tests and database storage with indexes for larger datasets.

### Output

- `data/trips.json`: generated trips.
- `data/rejectedDeliveries.json`: deliveries rejected for invalid or excessive weight.

The terminal summary shows trip count, rejected count, total capacity, delivery weight, and wasted capacity. These files are regenerated on each run.
