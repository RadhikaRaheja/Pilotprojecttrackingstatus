
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

function shareReceiptMessage(order) {
  const trackingLinks = {
    dtdc: `https://www.dtdc.in/track-trace.aspx?cn_no=${order.trackingId}`,
    bluedart: `https://www.bluedart.com/tracking`,
    fedex: `https://www.fedex.com/fedextrack/?tracknumbers=${order.trackingId}`,
    delhivery: `https://www.delhivery.com/tracking?waybill=${order.trackingId}`,
    indiapost: `https://www.indiapost.gov.in/VAS/Pages/trackconsignment.aspx`,
    amazon: `https://track.amazon.in/`,
    firstflight: `https://firstflightme.com/`,
    shreetirupati: `http://www.shreetirupaticourier.net/index.aspx`,
    mahavir: `http://shreemahavircourier.com/`,
    gati: `https://www.gati.com/track-by-docket/`,
    madhur: `https://www.madhurcouriers.in/(S(5mhmi5rxen0hy3xgxqtis5jr))/CNoteTracking`,
    maruti: `https://www.shreemaruti.com/track-your-shipment/`,
    skyking: `https://skyking.co/track`,
    trackon: `https://www.trackon.in/courier-tracking`,
    tpc: `https://www.tpcindia.com/`,
    ecom: `https://www.ecomexpress.in/`,
    anjani: `http://www.shreeanjanicourier.com/`,
    gms: `https://www.gmsworldwide.com/`
  };

  const courierKey = Object.keys(trackingLinks).find(key =>
    order.courier.toLowerCase().includes(key)
  );
  const trackingURL = courierKey ? trackingLinks[courierKey] : 'Tracking link unavailable';

  const message = `
🧾 *Order Receipt*

*Cute Printed Nightwears by Radhika* 🎀

📅 *Date:* ${order.date}
👤 *Name:* ${order.name}
📍 *Pincode:* ${order.pincode}

🚚 *Courier:* ${order.courier}
🔗 *Track:* ${trackingURL}

🔢 *Tracking ID:* \`${order.trackingId}\`
📂 *Category:* ${order.category}

━━━━━━━━━━━━━━━━━━━━━━  
Thank you for shopping with us! ❤️`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/?text=${encodedMessage}`;

  if (navigator.share) {
    navigator.share({
      title: 'Order Receipt',
      text: message
    }).catch(() => {
      window.open(whatsappURL, '_blank');
    });
  } else {
    window.open(whatsappURL, '_blank');
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
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

function renderResults() {
  const table = document.getElementById('resultsTable');
  table.innerHTML = '';

  document.getElementById('resultsCount').textContent = `🔍 Showing ${filteredData.length} results`;

  paginate(filteredData, currentPage).forEach(row => {
    const tr = document.createElement('tr');

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

    tr.onclick = () => showPopup(row, trackingId);
    table.appendChild(tr);
  });

  renderPaginationControls();
}

fetchData();
loadCouriers();
