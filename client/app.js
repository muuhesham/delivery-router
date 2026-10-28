var storageKey = "delivery-router-deliveries";
var statusElement = document.querySelector("#status");
var deliveriesElement = document.querySelector("#deliveries");
var planElement = document.querySelector("#plan");
var form = document.querySelector("#delivery-form");
var planButton = document.querySelector("#plan-button");
var summaryButton = document.querySelector("#summary-button");
var summaryElement = document.querySelector("#summary");
var lastPlanResult = null;

function addSeeMore(container, itemCount) {
  container.classList.remove("expanded");
  var oldButton = container.nextElementSibling;
  if (oldButton && oldButton.classList.contains("see-more-button")) {
    oldButton.parentNode.removeChild(oldButton);
  }

  if (itemCount <= 4) return;

  var button = document.createElement("button");
  button.type = "button";
  button.className = "see-more-button";
  button.textContent = "See More";
  button.onclick = function () {
    var expanded = container.classList.toggle("expanded");
    button.textContent = expanded ? "See Less" : "See More";
  };
  container.parentNode.insertBefore(button, container.nextSibling);
}

function requestJson(url, options, callback) {
  options = options || {};
  var request = new XMLHttpRequest();
  request.open(options.method || "GET", url, true);
  request.setRequestHeader("Content-Type", "application/json");
  request.onreadystatechange = function () {
    if (request.readyState !== 4) return;
    var data = {};
    try {
      data = request.responseText ? JSON.parse(request.responseText) : {};
    } catch (error) {
      callback(error);
      return;
    }
    if (request.status >= 200 && request.status < 300) {
      callback(null, data);
    } else {
      callback(new Error(data.error || "Request failed."));
    }
  };
  request.send(options.body || null);
}

function saveDeliveries(deliveries) {
  localStorage.setItem(storageKey, JSON.stringify(deliveries));
}

function loadCachedDeliveries() {
  try {
    var deliveries = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(deliveries) ? deliveries : [];
  } catch (error) {
    return [];
  }
}

function renderDeliveries(deliveries) {
  deliveriesElement.innerHTML = "";
  if (deliveries.length === 0) {
    deliveriesElement.textContent = "No deliveries found.";
    return;
  }

  deliveriesElement.classList.add("output-list");
  for (var index = 0; index < deliveries.length; index += 1) {
    var delivery = deliveries[index];
    var row = document.createElement("div");
    row.className = "delivery";
    row.innerHTML = "<span>ID: " + delivery.id + "</span><span>Area: " + delivery.area + "</span><span>Priority: " + delivery.priority + "</span><span>Weight: " + delivery.weight + " kg</span><button type=\"button\" data-delete-id=\"" + delivery.id + "\">Delete</button>";
    deliveriesElement.appendChild(row);
  }
  addSeeMore(deliveriesElement, deliveries.length);
}

function loadDeliveries() {
  requestJson("/api/deliveries", {}, function (error, deliveries) {
    if (error) {
      renderDeliveries(loadCachedDeliveries());
      statusElement.textContent = "API unavailable. Showing cached data. " + error.message;
      return;
    }
    saveDeliveries(deliveries);
    renderDeliveries(deliveries);
    statusElement.textContent = "Connected to delivery data.";
  });
}

form.onsubmit = function (event) {
  event.preventDefault();
  var delivery = {
    id: Number(form.elements.id.value),
    area: form.elements.area.value.trim(),
    priority: Number(form.elements.priority.value),
    weight: Number(form.elements.weight.value)
  };

  requestJson("/api/deliveries", {
    method: "POST",
    body: JSON.stringify(delivery)
  }, function (error) {
    if (error) {
      statusElement.textContent = error.message;
      return;
    }
    form.reset();
    loadDeliveries();
    statusElement.textContent = "Delivery added.";
  });
};

deliveriesElement.onclick = function (event) {
  var target = event.target;
  while (target && !target.getAttribute("data-delete-id")) target = target.parentNode;
  if (!target) return;

  requestJson("/api/deliveries/" + target.getAttribute("data-delete-id"), { method: "DELETE" }, function (error) {
    if (error) {
      statusElement.textContent = error.message;
      return;
    }
    loadDeliveries();
    statusElement.textContent = "Delivery deleted.";
  });
};

planButton.onclick = function () {
  requestJson("/api/plan", { method: "POST" }, function (error, result) {
    if (error) {
      statusElement.textContent = error.message;
      return;
    }

    var tripsMarkup = "";
    for (var index = 0; index < result.trips.length; index += 1) {
      var trip = result.trips[index];
      var deliveriesMarkup = "";
      for (var deliveryIndex = 0; deliveryIndex < trip.deliveries.length; deliveryIndex += 1) {
        var delivery = trip.deliveries[deliveryIndex];
        deliveriesMarkup += "<span>ID " + delivery.id + " - " + delivery.area + " (" + delivery.weight + " kg)</span>";
      }
      tripsMarkup += "<article class=\"trip-card\"><strong>Trip " + trip.tripId + "</strong><span>Area: " + trip.area + "</span><span>Deliveries: " + trip.deliveries.length + "</span><span>Total Weight: " + trip.totalWeight + " kg</span><span>Remaining Capacity: " + trip.remainingWeight + " kg</span><div class=\"trip-deliveries\">" + deliveriesMarkup + "</div></article>";
    }

    var rejectedMarkup = "";
    for (var rejectedIndex = 0; rejectedIndex < result.rejectedDeliveries.length; rejectedIndex += 1) {
      var rejectedDelivery = result.rejectedDeliveries[rejectedIndex];
      var rejectionReason = "Invalid delivery data";
      if (typeof rejectedDelivery.weight !== "number" || !Number.isFinite(rejectedDelivery.weight)) {
        rejectionReason = "Invalid weight";
      } else if (rejectedDelivery.weight <= 0) {
        rejectionReason = "Weight is not positive";
      } else if (rejectedDelivery.weight > 10) {
        rejectionReason = "Weight exceeds 10 kg";
      }
      rejectedMarkup += "<p class=\"rejected-delivery\">Rejected Delivery ID: " + (rejectedDelivery.id || "Unknown") + " - " + (rejectedDelivery.area || "Unknown area") + " (" + (rejectedDelivery.weight == null ? "Invalid weight" : rejectedDelivery.weight + " kg") + ") — Reason: " + rejectionReason + "</p>";
    }
    if (result.rejectedDeliveries.length === 0) {
      rejectedMarkup = "<p>No rejected deliveries.</p>";
    }
    planElement.classList.remove("output-list", "expanded");
    planElement.innerHTML = tripsMarkup + "<h3>Rejected Deliveries</h3>" + rejectedMarkup;
    lastPlanResult = result;
    statusElement.textContent = "Trip plan generated.";
  });
};

summaryButton.onclick = function () {
  if (!lastPlanResult) {
    summaryElement.innerHTML = "<p>Generate trips first to show the summary.</p>";
    return;
  }

  var totalWeight = 0;
  for (var tripIndex = 0; tripIndex < lastPlanResult.trips.length; tripIndex += 1) {
    totalWeight += lastPlanResult.trips[tripIndex].totalWeight;
  }
  var totalCapacity = lastPlanResult.trips.length * 10;

  summaryElement.innerHTML = "<section class=\"summary-card\"><h3>Summary</h3><p>Total Trips: " + lastPlanResult.trips.length + "</p><p>Total Rejected Deliveries: " + lastPlanResult.rejectedDeliveries.length + "</p><p>Total Capacity: " + totalCapacity + " kg</p><p>Total Weight: " + totalWeight + " kg</p><p>Total Wasted Capacity: " + (totalCapacity - totalWeight) + " kg</p></section>";
};

loadDeliveries();
