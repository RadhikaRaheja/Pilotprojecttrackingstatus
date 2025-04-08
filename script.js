let allData = [];
let currentPage = 1;
const rowsPerPage = 10;
const maxVisiblePages = 5;

async function fetchData() {
  const response = await fetch('https://opensheet.elk.sh/1UMul8nt25GR8MUM-_EdwAR0q6Ne2ovPv_R-m1-CHeXw/Daily Sales record');
  const courierMapResponse = await fetch('https://opensheet.elk.sh/1UMul8nt25GR8MUM-_EdwAR0q6Ne2ovPv_R-m1-CHeXw/CourierMapping');
  const data = await response.json();
  const mapData = await courierMapResponse.json();

  const courierMap = {};
  mapData.forEach(row => {
    if (row['Courier Name'] && row.URL) {
      courierMap[row['Courier Name'].trim()] = row.URL.trim();
    }
  });

  allData = data.filter(row => row['Tracking ID'] && row['Customer Name']);
  allData.forEach(row => {
    row['Courier Link'] = courierMap[row['Courier Name']] || '';
  });

  renderTable();
  setupPagination();
}

function renderTable() {
  const tableBody = document.querySelector("#data-table tbody");
  tableBody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = allData.slice(start, end);

  pageData.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDate(row.Date)}</td>
      <td>${row['Customer Name']}</td>
      <td>${row.Location}</td>
      <td><a href="${row['Courier Link']}" target="_blank">${row['Courier Name']}</a></td>
      <td>${row['Tracking ID']}</td>
    `;
    tr.onclick = () => showPopup(row);
    tableBody.appendChild(tr);
  });
}

function setupPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const pageCount = Math.ceil(allData.length / rowsPerPage);
  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(pageCount, startPage + maxVisiblePages - 1);

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.style.fontWeight = 'bold';
    btn.onclick = () => {
      currentPage = i;
      renderTable();
      setupPagination();
    };
    pagination.appendChild(btn);
  }
}

function performSearch() {
  const category = document.getElementById("searchCategory").value;
  const value = document.getElementById("searchInput").value.toLowerCase();
  currentPage = 1;

  const filtered = allData.filter(row =>
    row[category] && row[category].toLowerCase().includes(value)
  );

  allData = filtered;
  renderTable();
  setupPagination();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
}

function showPopup(row) {
  document.getElementById("popupDetails").innerHTML = `
    <h3>Customer Details</h3>
    <p><strong>Name:</strong> ${row['Customer Name']}</p>
    <p><strong>Location:</strong> ${row.Location}</p>
    <p><strong>Date:</strong> ${formatDate(row.Date)}</p>
    <p><strong>Courier:</strong> ${row['Courier Name']}</p>
    <p><strong>Tracking ID:</strong> ${row['Tracking ID']}</p>
  `;
  document.getElementById("popup").style.display = "block";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}

window.onload = fetchData;
