const form = document.getElementById("deliveryForm");
const autoMail = document.getElementById("autoMail");
const recordsBody = document.getElementById("recordsBody");

let records = JSON.parse(localStorage.getItem("poolVehicleDeliveries") || "[]");

const saveRecords = () => {
  localStorage.setItem("poolVehicleDeliveries", JSON.stringify(records));
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("tr-TR");
};

const buildEmailText = (record) => {
  const subject = `Havuz Aracı Teslim Bildirimi - ${record.plate}`;
  const body = [
    `Merhaba ${record.personName},`,
    "",
    "Havuz aracı teslim kaydınız oluşturulmuştur.",
    `Teslim Eden: ${record.deliveredBy}`,
    `Plaka: ${record.plate}`,
    `Teslim Tarihi: ${formatDate(record.handoverDate)}`,
    `Teslim KM: ${record.km}`,
    record.notes ? `Not: ${record.notes}` : "",
    "",
    "İyi çalışmalar."
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: encodeURIComponent(subject),
    body: encodeURIComponent(body)
  };
};

const openMail = (record) => {
  const payload = buildEmailText(record);
  window.location.href = `mailto:${record.email}?subject=${payload.subject}&body=${payload.body}`;
};

const renderRecords = () => {
  recordsBody.innerHTML = "";

  records.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${record.personName}</td>
      <td>${record.deliveredBy}</td>
      <td>${record.plate}</td>
      <td>${formatDate(record.handoverDate)}</td>
      <td>${record.km}</td>
      <td>${record.email}</td>
      <td><button type="button" data-id="${record.id}">Mail Gönder</button></td>
    `;
    recordsBody.appendChild(row);
  });
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);

  const record = {
    id: crypto.randomUUID(),
    personName: formData.get("personName").trim(),
    deliveredBy: formData.get("deliveredBy").trim(),
    email: formData.get("email").trim(),
    plate: formData.get("plate").trim().toUpperCase(),
    handoverDate: formData.get("handoverDate"),
    km: Number(formData.get("km")),
    notes: formData.get("notes").trim()
  };

  records = [record, ...records];
  saveRecords();
  renderRecords();
  form.reset();

  if (autoMail.checked) {
    openMail(record);
  }
});

recordsBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;

  const record = records.find((item) => item.id === button.dataset.id);
  if (!record) return;

  openMail(record);
});

renderRecords();
