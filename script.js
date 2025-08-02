let data = [], filteredData = [], couriers = {}, courierSlugMap = {}, currentPage = 1, entriesPerPage = 10;

// ========== UI / Utility Functions ==========
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

function showPopup(row, trackingId) {
  const content = `
    <div class="popup-content">
      <p><b>Date:</b> ${formatDate(row.Date)}</p>
      <p><b>Name:</b> ${row["Customer Name"]}</p>
      <p><b>Location:</b> ${row["Location (Pincode)"]}</p>
      <p><b>Courier:</b> <a href="${couriers[row["Courier Name"]] || '#'}" target="_blank">${row["Courier Name"]}</a></p>
     <p><b>Tracking ID:</b> <span class="tracking-id" id="copyTarget">${trackingId.toUpperCase()}</span><button class="copy-btn" onclick="copyTrackingID()" title="Copy to clipboard">📝</button></p>
      <p><b>Category:</b> ${row["Category"] || ''}</p>
     <p><button class="share-btn" onclick="shareReceiptMessage({
        date: '${formatDate(row.Date)}',
        name: '${row["Customer Name"]}',
        pincode: '${row["Location (Pincode)"]}',
        courier: '${row["Courier Name"]}',
        trackingId: '${trackingId.toUpperCase()}',
        category: '${row["Category"] || ""}'
      })">📤 Share Receipt</button></p>
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

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, 2500);
}

function hidePopup() {
  document.getElementById('popupOverlay').style.display = 'none';
}

function paginate(data, page) {
  const start = (page - 1) * entriesPerPage;
  return data.slice(start, start + entriesPerPage);
}

function renderPaginationControls() {
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  document.getElementById('totalPages').textContent = totalPages;
  document.getElementById('pageNumber').value = currentPage;
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderResults();
  }
}

function nextPage() {
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderResults();
  }
}

function jumpToPage() {
  const input = parseInt(document.getElementById('pageNumber').value);
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  if (input >= 1 && input <= totalPages) {
    currentPage = input;
    renderResults();
  }
}

// ========== DATA LOADING AND COURIER MAPPING ==========
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
    // lower-case and trim courier name for mapping
    courierSlugMap[entry['Courier Name'].toLowerCase().trim()] = (entry['AfterShip Slug'] || '').toLowerCase().trim();
    const option = document.createElement('option');
    option.value = entry['Courier Name'];
    option.textContent = entry['Courier Name'];
    dropdown.appendChild(option);
  });
  // Uncomment if you ever want to debug mapping:
  // console.log(courierSlugMap);
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

// ========== Open AfterShip mini-tab popup ==========
function openAfterShipMiniTab(slug, trackingId) {
  if (!slug || !trackingId) {
    alert("No courier or tracking ID found for this order.");
    return;
  }
  // Assembles direct AfterShip public tracking URL
  const url = `https://www.aftership.com/track/${slug}/${trackingId}`;
  window.open(url, 'AfterShipStatus', 'width=600,height=600,resizable=yes,scrollbars=yes');
}
window.openAfterShipMiniTab = openAfterShipMiniTab;

// ========== TABLE RENDER & STATUS HANDLER ==========
function renderResults() {
  const table = document.getElementById('resultsTable');
  table.innerHTML = '';
  document.getElementById('resultsCount').textContent = `🔍 Showing ${filteredData.length} results`;

  paginate(filteredData, currentPage).forEach(row => {
    const tr = document.createElement('tr');
    const courierNameOrig = row["Courier Name"] || '';
    const courierNameKey = courierNameOrig.toLowerCase().trim(); // for robust mapping
    const trackingId = (row["Tracking ID"] || '').trim();

    let courierDisplay = '';
    if (courierNameOrig) {
      courierDisplay = `<a href="${couriers[courierNameOrig] || '#'}" target="_blank">${courierNameOrig}</a>`;
    } else {
      if ((trackingId.toLowerCase() || "").includes('cancelled')) {
        courierDisplay = `<span style="color:#e60000;font-weight:600;">❌ Cancelled</span>`;
      } else if ((trackingId.toLowerCase() || "").includes('delivered')) {
        courierDisplay = `<span style="color:#28a745;font-weight:600;">✅ Delivered</span>`;
      } else {
        courierDisplay = `<span style="color:#888;">N/A</span>`;
      }
    }

    // --- status cell: always shows "View Status" and opens mini popup to AfterShip directly ---
    let statusCell = `<span style="color:#999;">N/A</span>`;
    const slug = courierSlugMap[courierNameKey];
    if (slug && trackingId.length > 4) {
      statusCell = `<span class="status-text" style="cursor:pointer;color:#007bff;text-decoration:underline;font-weight:bold;"
        onclick="event.stopPropagation(); openAfterShipMiniTab('${slug}','${trackingId}')"
      >View Status</span>`;
    } else if (trackingId.length > 4) {
      statusCell = `<span style="color:#999;cursor:default;" title="Courier not mapped.">N/A</span>`;
      // Optionally, add a warning for missing mapping in dev console
      // console.warn('No mapping slug found for', courierNameOrig, '| Did you add this to CourierMapping?');
    }

    tr.innerHTML = `
      <td>${formatDate(row.Date)}</td>
      <td>${row["Customer Name"]}</td>
      <td>${row["Location (Pincode)"]}</td>
      <td>${courierDisplay}</td>
      <td>${trackingId}</td>
      <td>${row["Category"] || ''}</td>
      <td class="live-status-cell">${statusCell}</td>
    `;

    tr.onclick = (e) => {
      if (e.target.classList.contains("status-text")) return; // Prevent row-popup on status click
      showPopup(row, trackingId);
    };
    table.appendChild(tr);
  });

  renderPaginationControls();
}

// ========== INIT ==========
fetchData();
loadCouriers();
