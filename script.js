document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.querySelector(".search-btn");
  const searchField = document.querySelector("input[type='text']");
  const filterSelect = document.querySelector("select");
  const rows = document.querySelectorAll("tbody tr");

  const modalOverlay = document.querySelector(".modal-overlay");
  const modal = document.querySelector(".modal");
  const modalCloseBtns = modal.querySelectorAll("button");

  searchBtn.addEventListener("click", () => {
    const keyword = searchField.value.toLowerCase();
    const filterBy = filterSelect.value;

    rows.forEach(row => {
      const cellValue = row.querySelector(`td[data-${filterBy}]`)?.textContent.toLowerCase() || "";
      row.style.display = cellValue.includes(keyword) ? "" : "none";
    });
  });

  rows.forEach(row => {
    row.addEventListener("click", () => {
      const cells = row.querySelectorAll("td");
      modal.querySelector(".modal-date").textContent = cells[0].textContent;
      modal.querySelector(".modal-name").textContent = cells[1].textContent;
      modal.querySelector(".modal-pincode").textContent = cells[2].textContent;
      modal.querySelector(".modal-courier").textContent = cells[3].textContent;
      modal.querySelector(".modal-tracking").textContent = cells[4].textContent;

      modalOverlay.style.display = "flex";
    });
  });

  modalCloseBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modalOverlay.style.display = "none";
    });
  });
});
