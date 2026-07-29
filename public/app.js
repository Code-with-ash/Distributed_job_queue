var POLL_INTERVAL = 2000;

// ── Helpers ───────────────────────────────────────────

function escapeHtml(str) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function badge(status) {
  var icons = { pending: "⏳", processing: "⚙️", done: "✅" };
  var icon = icons[status] || "❓";
  var safe = escapeHtml(status);
  return '<span class="badge ' + safe + '">' + icon + " " + safe + "</span>";
}

function showToast(message) {
  var old = document.querySelector(".toast");
  if (old) old.remove();

  var toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(function () {
    toast.classList.add("show");
  });

  setTimeout(function () {
    toast.classList.remove("show");
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 2800);
}

// ── Place Order ───────────────────────────────────────

async function placeOrder() {
  var checkboxes = document.querySelectorAll('.item-checkbox input[type="checkbox"]');
  var items = [];

  checkboxes.forEach(function (cb) {
    if (cb.checked) items.push(cb.value);
  });

  if (items.length === 0) {
    showToast("⚠️  Select at least one item");
    return;
  }

  var btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.querySelector(".btn-text").textContent = "Placing...";

  try {
    var res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items }),
    });

    var data = await res.json();
    showToast("✅  Order " + data.orderId + " placed!");

    checkboxes.forEach(function (cb) {
      cb.checked = false;
    });

    fetchOrders();
  } catch (err) {
    showToast("❌  Failed — is the server running?");
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.querySelector(".btn-text").textContent = "Submit Order";
  }
}

// ── Fetch & Render ────────────────────────────────────

async function fetchOrders() {
  try {
    var res = await fetch("/api/orders");
    var orders = await res.json();
    renderOrders(orders);
    updateStats(orders);
  } catch (err) {
    console.error("Failed to fetch orders:", err);
  }
}

function renderOrders(orders) {
  var tbody = document.getElementById("ordersBody");

  if (orders.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-msg">' +
      '<div class="empty-state">' +
      '<span class="empty-icon">📭</span>' +
      "<span>No orders yet — place one above!</span>" +
      "</div></td></tr>";
    return;
  }

  var html = "";
  for (var i = 0; i < orders.length; i++) {
    var order = orders[i];
    var time = new Date(order.createdAt).toLocaleTimeString();

    // Safely escape each item
    var safeItems = [];
    for (var j = 0; j < order.items.length; j++) {
      safeItems.push(escapeHtml(order.items[j]));
    }
    var itemsList = safeItems.join(", ");

    html += '<tr class="row-new">';
    html += '<td class="order-id">' + escapeHtml(order.id) + "</td>";
    html += "<td>" + itemsList + "</td>";
    html += "<td>" + badge(order.email) + "</td>";
    html += "<td>" + badge(order.analytics) + "</td>";
    html += "<td>" + badge(order.inventory) + "</td>";
    html += '<td class="time-col">' + escapeHtml(time) + "</td>";
    html += "</tr>";
  }

  tbody.innerHTML = html;
}

function updateStats(orders) {
  document.getElementById("totalCount").textContent = orders.length;

  var pending = 0;
  var processing = 0;
  var done = 0;

  for (var i = 0; i < orders.length; i++) {
    var s = [orders[i].email, orders[i].analytics, orders[i].inventory];
    if (s[0] === "done" && s[1] === "done" && s[2] === "done") {
      done++;
    } else if (s.indexOf("processing") !== -1) {
      processing++;
    } else {
      pending++;
    }
  }

  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("processingCount").textContent = processing;
  document.getElementById("doneCount").textContent = done;
}

// ── Start Polling ─────────────────────────────────────
fetchOrders();
setInterval(fetchOrders, POLL_INTERVAL);
