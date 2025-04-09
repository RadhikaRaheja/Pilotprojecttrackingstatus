let isAdmin = false;
function toggleAdmin() {
  const pass = prompt("Enter admin password:");
  if (pass === "your_secret") {
    isAdmin = true;
    alert("Admin mode activated.");
    renderResults(); // optional: show more
  }
}

let data = [], filteredData = [], couriers = {}, currentPage = 1, entriesPerPage = 10;

// Handle search field visibility
function handleSearchFieldChange() {
  const field = document.getElementById('searchField').value;
  document.getElementById('searchInput').style.display = (field === 'Date' || field === 'Courier Name') ? 'none' : 'inline-block';
  document.getElementById('dateInput').style.display = field === 'Date' ? 'inline-block' : 'none';
  document.getElementById('courierDropdown').style.display = field === 'Courier Name' ? 'inline-block' : 'none';
}

// Format date to DD-MMM-YYYY
function formatDate(inputDate) {
  const date = new Date(inputDate);
  if (isNaN(date)) return '';
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
}

// Show popup
function showPopup(row) {
  const content = `
    <div class="popup-content">
      <p><b>Date:</b> ${formatDate(row.Date)}</p>
      <p><b>Name:</b> ${row["Customer Name"]}</p>
      <p><b>Location:</b> ${row["Location (Pincode)"]}</p>
      <p><b>Courier:</b> <a href="${couriers[row["Courier Name"]] || '#'}" target="_blank">${row["Courier Name"]}</a></p>
      <p><b>Tracking ID:</b> ${row["Tracking ID"]}</p>
      <p><b>Category:</b> ${row["Category"] || ''}</p>
    </div>
  `;
  document.getElementById('popupContent').innerHTML = content;
  document.getElementById('popupOverlay').style.display = 'flex';
}

// Hide popup
function hidePopup() {
  document.getElementById('popupOverlay').style.display = 'none';
}

// Pagination logic
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

// Fetch order data
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

// Load courier mapping
async function loadCouriers() {
  const resp = await fetch('https://opensheet.elk.sh/1UMul8nt25GR8MUM-_EdwAR0q6Ne2ovPv_R-m1-CHeXw/CourierMapping');
  const map = await resp.json();
  const dropdown = document.getElementById('courierDropdown');
  map.forEach(entry => {
    couriers[entry['Courier Name']] = entry['Courier Website Link'];
    const option = document.createElement('option');
    option.value = entry['Courier Name'];
    option.textContent = entry['Courier Name'];
    dropdown.appendChild(option);
  });
}

// Filtering logic
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

function renderResults() {
  const table = document.getElementById('resultsTable');
  table.innerHTML = '';

  document.getElementById('resultsCount').textContent = `🔍 Showing ${filteredData.length} results`;

  paginate(filteredData, currentPage).forEach(row => {
    const tr = document.createElement('tr');

    // Safely assign courier name and tracking ID
    const courierName = (row["Courier Name"] || '').trim();
    const trackingId = (row["Tracking ID"] || '').toLowerCase();

    let courierDisplay = '';
    if (courierName) {
      courierDisplay = `<a href="${couriers[courierName] || '#'}" target="_blank">${courierName}</a>`;
    } else {
      if (trackingId.includes('cancelled')) {
        courierDisplay = `<span style="color:#e60000;font-weight:600;">❌ Cancelled</span>`;
      } else if (trackingId.includes('delivered')) {
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
      <td>${row["Tracking ID"]}</td>
      <td>${row["Category"] || ''}</td>
    `;

    tr.onclick = () => showPopup(row);
    table.appendChild(tr);
  });

  renderPaginationControls();
}

// Load data when page loads
fetchData();
loadCouriers();
