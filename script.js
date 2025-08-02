let data = [], filteredData = [], couriers = {}, courierSlugMap = {}, currentPage = 1, entriesPerPage = 10;

// === UI / Search UI helpers ===
function handleSearchFieldChange() {
  const field = document.getElementById('searchField').value;
  document.getElementById('searchInput').style.display = (field === 'Date' || field === 'Courier Name') ? 'none' : 'inline-block';
  document.getElementById('dateInput').style.display = field === 'Date' ? 'inline-block' : 'none';
  document.getElementById('courierDropdown').style.display = field === 'Courier Name' ? 'inline-block' : 'none';
}
function formatDate(inputDate) {
  const date = new Date(inputDate);
  if (isNaN(date)) return '';
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
}

// === Order details popup (unchanged) ===
function showPopup(row, trackingId) {
  const content = `
    <div class="popup-content">
      <p><b>Date:</b> ${formatDate(row.Date)}</p>
      <p><b>Name:</b> ${row["Customer Name"]}</p>
      <p><b>Location:</b> ${row["Location (Pincode)"]}</p>
      <p><b>Courier:</b> <a href="${couriers[row["Courier Name"]] || '#'}" target="_blank">${row["Courier Name"]}</a></p>
      <p><b>Tracking ID:</b> <span class="tracking-id" id="copyTarget">${trackingId.toUpperCase()}</span>
         <button class="copy-btn" onclick="copyTrackingID()" title="Copy to clipboard">📝</button>
      </p>
      <p><b>Category:</b> ${row["Category"] || ''}</p>
      <p><button class="share-btn" onclick="shareReceiptMessage({
        date: '${formatDate(row.Date)}',
        name: '${row["Customer Name"]}',
        pincode: '${row["Location (Pincode)"]}',
        courier: '${row["Courier Name"]}',
        trackingId: '${trackingId.toUpperCase()}',
        category: '${row["Category"] || ""}'
      })">📤 Share Receipt</button></p>
    </div>
  `;
  document.getElementById('popupContent').innerHTML = content;
  document.getElementById('popupOverlay').style.display = 'flex';
}
function copyTrackingID() {
  const trackingText = document.getElementById("copyTarget").innerText;
  navigator.clipboard.writeText(trackingText)
    .then(() => showToast("📋 Copied to clipboard!"))
    .catch(() => showToast("❌ Failed to copy."));
}
// ...your shareReceiptMessage, showToast, hidePopup, paginate, renderPaginationControls, prevPage, nextPage, jumpToPage (unchanged)...

// === Data Loaders / Lookup ===
async function fetchData() {
  document.querySelector('.loading').style.display = 'block';
  const response = await fetch('https://opensheet.elk.sh/1UMul8nt25GR8MUM-_EdwAR0q6Ne2ovPv_R-m1-CHeXw/Daily%20Sales%20record');
  let result = await response.json();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  data = result.filter(row => new Date(row.Date) >= threeMonthsAgo);
  filteredData = data;
  document.querySelector('.loading').style.display = 'none';
  renderResults();
}
async function loadCouriers() {
  const resp = await fetch('https://opensheet.elk.sh/1UMul8nt25GR8MUM-_EdwAR0q6Ne2ovPv_R-m1-CHeXw/CourierMapping');
  const map = await resp.json();
  const dropdown = document.getElementById('courierDropdown');
  map.forEach(entry => {
    couriers[entry['Courier Name']] = entry['Courier Website Link'];
    courierSlugMap[entry['Courier Name']] = entry['AfterShip Slug'] || "";
    const option = document.createElement('option');
    option.value = entry['Courier Name'];
    option.textContent = entry['Courier Name'];
    dropdown.appendChild(option);
  });
}
function filterResults() {
  let field = document.getElementById('searchField').value;
  let query = '';
  if (field === 'Date') query = formatDate(document.getElementById('dateInput').value);
  else if (field === 'Courier Name') query = document.getElementById('courierDropdown').value;
  else query = document.getElementById('searchInput').value.toLowerCase();
  filteredData = data.filter(row => {
    if (!row[field]) return false;
    let value = field === 'Date' ? formatDate(row[field]) : row[field].toLowerCase();
    return value.includes(query);
  });
  currentPage = 1;
  renderResults();
}

// === AfterShip API fetch for live status ===
const AFTERSHIP_API_KEY = 'YOUR_AFTERSHIP_API_KEY'; // <-- REPLACE THIS!
async function fetchAfterShipStatus(slug, trackingId) {
  try {
    const response = await fetch(
      `https://api.aftership.com/v4/trackings/${slug}/${trackingId}`,
      {
        headers: {
          'aftership-api-key': AFTERSHIP_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    if (!response.ok) throw new Error("Unable to fetch tracking");
    const resData = await response.json();
    let status = "Status unavailable";
    if (resData.data && resData.data.tracking) {
      status = resData.data.tracking.tag || resData.data.tracking.subtag || "Status unavailable";
    }
    return {status, details: resData.data.tracking};
  } catch (e) {
    return {status: "Status unavailable", details: null};
  }
}

// === Table render and status cell logic ===
function renderResults() {
  const table = document.getElementById('resultsTable');
  table.innerHTML = '';
  document.getElementById('resultsCount').textContent = `🔍 Showing ${filteredData.length} results`;
  paginate(filteredData, currentPage).forEach(row => {
    const tr = document.createElement('tr');
    const courierName = (row["Courier Name"] || '').trim();
    const trackingId = (row["Tracking ID"] || '').trim();
    let courierDisplay = '';
    if (courierName) {
      courierDisplay = `<a href="${couriers[courierName] || '#'}" target="_blank">${courierName}</a>`;
    } else {
      if ((trackingId.toLowerCase() || "").includes('cancelled')) {
        courierDisplay = `<span style="color:#e60000;font-weight:600;">❌ Cancelled</span>`;
      } else if ((trackingId.toLowerCase() || "").includes('delivered')) {
        courierDisplay = `<span style="color:#28a745;font-weight:600;">✅ Delivered</span>`;
      } else {
        courierDisplay = `<span style="color:#888;">N/A</span>`;
      }
    }
    tr.innerHTML = `
      <td>${formatDate(row.Date)}</td>
      <td>${row["Customer Name"]}</td>
      <td>${row["Location (Pincode)"]}</td>
      <td>${courierDisplay}</td>
      <td>${trackingId}</td>
      <td>${row["Category"] || ''}</td>
      <td class="live-status-cell" id="status_${trackingId}"><span class="status-loading">Loading…</span></td>
    `;
    // Row click: show customer popup unless status cell was clicked
    tr.onclick = (e) => {
      if (e.target.classList.contains("status-text")) return;
      showPopup(row, trackingId);
    };
    table.appendChild(tr);

    // --- Inline status fetch & hook for click ---
    const slug = courierSlugMap[courierName];
    if (slug && trackingId.length > 5) {
      fetchAfterShipStatus(slug, trackingId).then(result => {
        const cell = document.getElementById(`status_${trackingId}`);
        if (!cell) return;
        let color = "#666";
        if (/delivered/i.test(result.status)) color = "#28a745";
        else if (/intransit|pending|info|transit/i.test(result.status)) color = "#ffc107";
        else if (/fail|return|exception/i.test(result.status)) color = "#e60000";
        cell.innerHTML = `<span class="status-text" style="font-weight:bold;color:${color};cursor:pointer;text-decoration:underline;"
            onclick="showStatusWidgetPopup('${trackingId}', '${slug}')"
          >${result.status}</span>`;
      });
    } else {
      const cell = document.getElementById(`status_${trackingId}`);
      if (cell) cell.innerHTML = `<span style="color:#999;">N/A</span>`;
    }
  });
  renderPaginationControls();
}

// === AfterShip widget popup ===
let aftershipWidgetLoaded = false;
function showStatusWidgetPopup(trackingId, slug) {
  // Remove any previous popups
  const prev = document.getElementById("statusPopupOverlay");
  if (prev) prev.remove();
  const overlay = document.createElement("div");
  overlay.id = "statusPopupOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0"; overlay.style.left = "0";
  overlay.style.width = "100vw"; overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.08)";
  overlay.style.zIndex = "2001";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  const popup = document.createElement("div");
  popup.className = "popup";
  popup.style.maxWidth = "430px";
  popup.innerHTML = `
    <button class="close-btn" onclick="document.getElementById('statusPopupOverlay').remove();">Close</button>
    <h3 style="margin-bottom:10px;">Live Parcel Tracking</h3>
    <div id="aftershipWidgetArea">
      <div class="aftership-tracking-widget"
        data-aftership-tracking-number="${trackingId}"
        ${slug?`data-aftership-courier-slug="${slug}"`:''}></div>
    </div>
    <div style="margin-top:10px;color:#666;font-size:13px;text-align:center;">
      Tip: Status auto-loads for most Indian couriers.<br>
      For rare/unsupported couriers, try the official link in order details.
    </div>
  `;
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Load widget script once per page
  if (!aftershipWidgetLoaded) {
    const s = document.createElement('script');
    s.src = "https://widget.aftership.com/widget.js";
    s.async = true;
    document.body.appendChild(s);
    aftershipWidgetLoaded = true;
  } else if (window.AfterShip && typeof window.AfterShip.renderAll === "function") {
    setTimeout(() => { window.AfterShip.renderAll(); }, 100);
  }
}
window.showStatusWidgetPopup = showStatusWidgetPopup;

// === INIT ===
fetchData();
loadCouriers();
