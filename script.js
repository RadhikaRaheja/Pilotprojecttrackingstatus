let data = [], filteredData = [], couriers = {}, currentPage = 1, entriesPerPage = 10;

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

const courierLogos = {
  "DTDC": "https://dtdc.com/assets/images/logo.png",
  "Blue Dart": "https://bluedart.com/images/bluedart-logo.jpg",
  "FedEx": "https://1000logos.net/wp-content/uploads/2017/03/FedEx-Logo.png",
  "Delhivery": "https://logo.clearbit.com/delhivery.com",
  "Shree Tirupati Courier": "https://tirupaticourier.com/assets/img/logo.png",
  "Shree Mahavir Express": "https://shreemahavir.co.in/assets/images/logo/logo.png",
  "India Post": "https://www.indiapost.gov.in/_layouts/images/DOP.GIF",
  "First Flight": "https://www.firstflight.net/images/logo.gif",
  "Gati": "https://www.gati.com/assets/images/logo.png",
  "Madhur Courier": "https://www.madhurcourier.in/assets/img/logo.png",
  "Shree Maruti Courier": "https://maruticourier.com/wp-content/uploads/2021/06/maruti-logo.png",
  "Skyking": "https://skyking.co/images/logo.png",
  "Trackon": "https://trackoncourier.com/assets/images/trackon-logo.png",
  "Professional Couriers": "https://www.tpcindia.com/images/logo.jpg",
  "Ecom Express": "https://ecomexpress.in/wp-content/uploads/2021/03/Ecom-Express-Logo.png",
  "Shree Anjani": "https://shreeanjanicourier.com/images/logo.png",
  "GSM Courier & Cargo": "https://gsmcourier.com/assets/images/logo.png",
  "Amazon": "https://cdn.iconscout.com/icon/free/png-256/amazon-1869030-1583154.png"
};

function renderResults() {
  const table = document.getElementById('resultsTable');
  table.innerHTML = '';
  paginate(filteredData, currentPage).forEach(row => {
    const tr = document.createElement('tr');
    let courierName = (row["Courier Name"] || '').trim();

// Normalize common aliases
if (courierName.toLowerCase() === "tirupati") courierName = "Shree Tirupati Courier";
if (courierName.toLowerCase() === "maruti courier") courierName = "Shree Maruti Courier";
if (courierName.toLowerCase() === "mahavir") courierName = "Shree Mahavir Express";
if (courierName.toLowerCase().includes("professional")) courierName = "Professional Couriers";

    const courierName = row["Courier Name"] || '';
  const trackingId = (row["Tracking ID"] || '').toLowerCase();
  const courierLogo = courierLogos[courierName]
  ? `<img src="${courierLogos[courierName]}" alt="${courierName}" style="width:18px;height:18px;margin-right:6px;vertical-align:middle;border-radius:3px;" onerror="this.style.display='none';" />`
  : '';

  let courierDisplay = '';
if (courierName) {
  courierDisplay = `${courierLogo}<a href="${couriers[courierName] || '#'}" target="_blank">${courierName}</a>`;
} else {
  const trackingId = (row["Tracking ID"] || '').toLowerCase();
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
       <td>${courierDisplay}</td> <!-- ✅ now using courierDisplay -->
      <td>${row["Tracking ID"]}</td>
      <td>${row["Category"] || ''}</td>
    `;
    tr.onclick = () => showPopup(row);
    table.appendChild(tr);
  });
  renderPaginationControls();
}

fetchData();
loadCouriers();
