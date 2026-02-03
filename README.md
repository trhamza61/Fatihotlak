 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/app.js b/app.js
new file mode 100644
index 0000000000000000000000000000000000000000..d8c8f876999a610df808bcb540c28f6b87520c45
--- /dev/null
+++ b/app.js
@@ -0,0 +1,299 @@
+const directoryMap = {
+  "Ayşe Demir": { directorate: "İdari İşler", chiefdom: "Lojistik Şefliği" },
+  "Mehmet Yıldız": { directorate: "Destek Hizmetleri", chiefdom: "Araç Tahsis Şefliği" },
+  "Elif Kaya": { directorate: "Mali İşler", chiefdom: "Bütçe Şefliği" },
+  "Can Öztürk": { directorate: "Bilgi İşlem", chiefdom: "Sistem Destek Şefliği" }
+};
+
+const directorateOptions = [
+  "İdari İşler",
+  "Destek Hizmetleri",
+  "Mali İşler",
+  "Bilgi İşlem",
+  "İnsan Kaynakları",
+  "Hukuk İşleri"
+];
+
+const chiefdomOptions = {
+  "İdari İşler": ["Lojistik Şefliği", "Satınalma Şefliği"],
+  "Destek Hizmetleri": ["Araç Tahsis Şefliği", "Saha Destek Şefliği"],
+  "Mali İşler": ["Bütçe Şefliği", "Muhasebe Şefliği"],
+  "Bilgi İşlem": ["Sistem Destek Şefliği", "Uygulama Şefliği"],
+  "İnsan Kaynakları": ["Özlük Şefliği", "Eğitim Şefliği"],
+  "Hukuk İşleri": ["Mevzuat Şefliği", "Sözleşmeler Şefliği"]
+};
+
+const form = document.getElementById("vehicleForm");
+const personName = document.getElementById("personName");
+const directorate = document.getElementById("directorate");
+const chiefdom = document.getElementById("chiefdom");
+const recordsBody = document.getElementById("recordsBody");
+const searchInput = document.getElementById("searchInput");
+const exportCsv = document.getElementById("exportCsv");
+const emailDialog = document.getElementById("emailDialog");
+const emailSubject = document.getElementById("emailSubject");
+const emailBody = document.getElementById("emailBody");
+const emailSummary = document.getElementById("emailSummary");
+const sendMail = document.getElementById("sendMail");
+const selfMonitorDialog = document.getElementById("selfMonitorDialog");
+const selfMonitorDetails = document.getElementById("selfMonitorDetails");
+
+let currentEmail = null;
+
+const storedRecords = JSON.parse(localStorage.getItem("vehicleRecords") || "[]");
+let records = storedRecords;
+
+const buildOptions = (select, options) => {
+  select.innerHTML = "<option value=\"\">Seçiniz</option>";
+  options.forEach((option) => {
+    const opt = document.createElement("option");
+    opt.value = option;
+    opt.textContent = option;
+    select.appendChild(opt);
+  });
+};
+
+buildOptions(directorate, directorateOptions);
+
+const updateChiefdomOptions = (selected) => {
+  const options = chiefdomOptions[selected] || [];
+  buildOptions(chiefdom, options);
+};
+
+personName.addEventListener("input", (event) => {
+  const value = event.target.value.trim();
+  const match = directoryMap[value];
+  if (match) {
+    directorate.value = match.directorate;
+    updateChiefdomOptions(match.directorate);
+    chiefdom.value = match.chiefdom;
+  }
+});
+
+directorate.addEventListener("change", (event) => {
+  updateChiefdomOptions(event.target.value);
+});
+
+const saveRecords = () => {
+  localStorage.setItem("vehicleRecords", JSON.stringify(records));
+};
+
+const formatDate = (dateString) => {
+  if (!dateString) return "-";
+  return new Date(dateString).toLocaleDateString("tr-TR");
+};
+
+const renderRecords = () => {
+  const query = searchInput.value.trim().toLowerCase();
+  recordsBody.innerHTML = "";
+
+  records
+    .filter((record) => {
+      if (!query) return true;
+      return [
+        record.personName,
+        record.directorate,
+        record.chiefdom,
+        record.plate,
+        record.email
+      ]
+        .join(" ")
+        .toLowerCase()
+        .includes(query);
+    })
+    .forEach((record) => {
+      const row = document.createElement("tr");
+      row.innerHTML = `
+        <td>${record.personName}</td>
+        <td>${record.directorate}</td>
+        <td>${record.chiefdom}</td>
+        <td>${record.plate}</td>
+        <td>${formatDate(record.handoverDate)}</td>
+        <td>${formatDate(record.returnDate)}</td>
+        <td>${record.email}</td>
+        <td>
+          <span class="status ${record.status}">
+            ${record.status === "returned" ? "İade" : "Teslim"}
+          </span>
+        </td>
+        <td>
+          <div class="row-actions">
+            <button class="secondary" data-action="monitor" data-id="${record.id}">Öz İzleme</button>
+            <button class="secondary" data-action="handover" data-id="${record.id}">Teslim Maili</button>
+            <button class="secondary" data-action="return" data-id="${record.id}">İade Maili</button>
+            <button class="secondary" data-action="remove" data-id="${record.id}">Sil</button>
+          </div>
+        </td>
+      `;
+      recordsBody.appendChild(row);
+    });
+};
+
+const buildEmailPayload = (record, type) => {
+  const isReturn = type === "return";
+  const subject = isReturn
+    ? `Araç İade Bildirimi - ${record.plate}`
+    : `Araç Teslim Bildirimi - ${record.plate}`;
+  const body = [
+    `Sayın ${record.personName},`,
+    "",
+    isReturn
+      ? "Araç iade işleminiz tamamlanmıştır."
+      : "Araç teslim işleminiz tamamlanmıştır.",
+    `Müdürlük: ${record.directorate}`,
+    `Şeflik: ${record.chiefdom}`,
+    `Araç Plakası: ${record.plate}`,
+    `Teslim Tarihi: ${formatDate(record.handoverDate)}`,
+    `İade Tarihi: ${formatDate(record.returnDate)}`,
+    record.notes ? `Notlar: ${record.notes}` : "",
+    "",
+    "İyi çalışmalar."
+  ]
+    .filter(Boolean)
+    .join("\n");
+
+  return { subject, body };
+};
+
+const openEmailDialog = (record, type) => {
+  currentEmail = { record, type };
+  const payload = buildEmailPayload(record, type);
+  emailSubject.value = payload.subject;
+  emailBody.value = payload.body;
+  emailSummary.textContent = `${record.personName} için ${type === "return" ? "iade" : "teslim"} bildirimi hazırlanıyor.`;
+  emailDialog.showModal();
+};
+
+const openSelfMonitorDialog = (record) => {
+  const details = [
+    ["İsim", record.personName],
+    ["Müdürlük", record.directorate],
+    ["Şeflik", record.chiefdom],
+    ["Plaka", record.plate],
+    ["Teslim Tarihi", formatDate(record.handoverDate)],
+    ["İade Tarihi", formatDate(record.returnDate)],
+    ["E-posta", record.email],
+    ["Durum", record.status === "returned" ? "İade" : "Teslim"],
+    ["Notlar", record.notes || "-"]
+  ];
+
+  selfMonitorDetails.innerHTML = details
+    .map(
+      ([label, value]) => `
+        <span>
+          <strong>${label}</strong>
+          <span>${value}</span>
+        </span>
+      `
+    )
+    .join("");
+  selfMonitorDialog.showModal();
+};
+
+sendMail.addEventListener("click", () => {
+  if (!currentEmail) return;
+  const { record, type } = currentEmail;
+  const subject = encodeURIComponent(emailSubject.value);
+  const body = encodeURIComponent(emailBody.value);
+  const link = `mailto:${record.email}?subject=${subject}&body=${body}`;
+  window.location.href = link;
+
+  if (type === "return") {
+    record.status = "returned";
+    if (!record.returnDate) {
+      record.returnDate = new Date().toISOString().split("T")[0];
+    }
+  }
+  saveRecords();
+  renderRecords();
+});
+
+form.addEventListener("submit", (event) => {
+  event.preventDefault();
+  const formData = new FormData(form);
+  const newRecord = {
+    id: crypto.randomUUID(),
+    personName: formData.get("personName").trim(),
+    directorate: formData.get("directorate"),
+    chiefdom: formData.get("chiefdom"),
+    plate: formData.get("plate").trim(),
+    handoverDate: formData.get("handoverDate"),
+    returnDate: formData.get("returnDate"),
+    email: formData.get("email").trim(),
+    notes: formData.get("notes").trim(),
+    status: "active"
+  };
+
+  records = [newRecord, ...records];
+  saveRecords();
+  renderRecords();
+  form.reset();
+  updateChiefdomOptions("");
+});
+
+recordsBody.addEventListener("click", (event) => {
+  const actionButton = event.target.closest("button[data-action]");
+  if (!actionButton) return;
+  const action = actionButton.dataset.action;
+  const recordId = actionButton.dataset.id;
+  const record = records.find((item) => item.id === recordId);
+  if (!record) return;
+
+  if (action === "remove") {
+    records = records.filter((item) => item.id !== recordId);
+    saveRecords();
+    renderRecords();
+    return;
+  }
+
+  if (action === "monitor") {
+    openSelfMonitorDialog(record);
+  }
+
+  if (action === "handover") {
+    openEmailDialog(record, "handover");
+  }
+
+  if (action === "return") {
+    openEmailDialog(record, "return");
+  }
+});
+
+searchInput.addEventListener("input", renderRecords);
+
+exportCsv.addEventListener("click", () => {
+  const header = [
+    "İsim",
+    "Müdürlük",
+    "Şeflik",
+    "Plaka",
+    "Teslim Tarihi",
+    "İade Tarihi",
+    "E-posta",
+    "Durum"
+  ];
+  const rows = records.map((record) => [
+    record.personName,
+    record.directorate,
+    record.chiefdom,
+    record.plate,
+    record.handoverDate,
+    record.returnDate,
+    record.email,
+    record.status
+  ]);
+  const csv = [header, ...rows]
+    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
+    .join("\n");
+
+  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
+  const url = URL.createObjectURL(blob);
+  const link = document.createElement("a");
+  link.href = url;
+  link.download = `havuz-arac-tablosu-${Date.now()}.csv`;
+  link.click();
+  URL.revokeObjectURL(url);
+});
+
+updateChiefdomOptions("");
+renderRecords();
 
EOF
)
