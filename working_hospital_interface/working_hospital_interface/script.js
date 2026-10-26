// Interactive front-end demo. Data is stored in this browser using localStorage.
const DOCTORS = [
  {id:"d1",name:"Dr. Ananya Rao",specialty:"General Physician",days:"Mon, Wed, Fri",tone:"blue"},
  {id:"d2",name:"Dr. Arjun Kumar",specialty:"Cardiologist",days:"Tue, Thu, Sat",tone:"green"},
  {id:"d3",name:"Dr. Meera Shetty",specialty:"Dermatologist",days:"Mon–Fri",tone:"purple"}
];
const readStore = (key, fallback=[]) => {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch { return fallback; }
};
let patients = readStore("carepoint_patients");
let appointments = readStore("carepoint_appointments");
const save = () => {
  localStorage.setItem("carepoint_patients", JSON.stringify(patients));
  localStorage.setItem("carepoint_appointments", JSON.stringify(appointments));
};
const $ = id => document.getElementById(id);
const today = () => {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,10);
};
$("a-date").min = today();

function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 3000);
}
function showPage(page) {
  document.querySelectorAll(".page").forEach(s => s.classList.add("hidden"));
  $(page).classList.remove("hidden");
  document.querySelectorAll(".nav").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  $("page-title").textContent = page[0].toUpperCase() + page.slice(1);
}
document.querySelectorAll(".nav").forEach(b => b.addEventListener("click", () => showPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showPage(b.dataset.go)));

function renderDoctors() {
  $("doctor-grid").innerHTML = DOCTORS.map(d => `<article class="doctor"><span class="doctor-avatar ${d.tone}">⚕</span><div><h3>${esc(d.name)}</h3><p>${esc(d.specialty)}</p><small>${esc(d.days)}</small></div></article>`).join("");
  $("doctor-count").textContent = DOCTORS.length;
  $("a-doctor").innerHTML = '<option value="">Select doctor</option>' + DOCTORS.map(d => `<option value="${d.id}">${esc(d.name)} — ${esc(d.specialty)}</option>`).join("");
}
function renderPatients() {
  const filter = $("patient-search").value.trim().toLowerCase();
  const visible = patients.filter(p => [p.name,p.phone].some(v => v.toLowerCase().includes(filter)));
  $("patient-table").innerHTML = visible.length ? visible.map(p => `<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.age)}</td><td>${esc(p.gender)}</td><td>${esc(p.phone)}</td><td>${esc(p.address || "—")}</td><td><button class="btn danger" data-delete-patient="${p.id}">Delete</button></td></tr>`).join("") : '<tr><td colspan="6" class="empty">No patient records found.</td></tr>';
  $("patient-subtitle").textContent = `${visible.length} patient record(s) shown`;
  $("patient-count").textContent = patients.length;
  $("a-patient").innerHTML = '<option value="">Select patient</option>' + patients.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
}
function renderAppointments() {
  const sorted = [...appointments].sort((a,b) => (b.date+b.time).localeCompare(a.date+a.time));
  const row = a => `<tr><td><b>${esc(a.patientName)}</b><br><small>${esc(a.doctorName)}</small></td><td>${esc(a.date)}<br>${esc(a.time)}</td><td>${esc(a.reason || "—")}</td><td><select class="status-select" data-status="${a.id}" aria-label="Appointment status"><option ${a.status==="Scheduled"?"selected":""}>Scheduled</option><option ${a.status==="Completed"?"selected":""}>Completed</option><option ${a.status==="Cancelled"?"selected":""}>Cancelled</option></select></td><td><button class="btn danger" data-delete-appointment="${a.id}">Delete</button></td></tr>`;
  $("appointment-table").innerHTML = sorted.length ? sorted.map(row).join("") : '<tr><td colspan="5" class="empty">No appointments booked yet.</td></tr>';
  $("recent-table").innerHTML = sorted.length ? sorted.slice(0,5).map(a => `<tr><td>${esc(a.patientName)}</td><td>${esc(a.doctorName)}</td><td>${esc(a.date)}</td><td>${esc(a.time)}</td><td><span class="status ${esc(a.status)}">${esc(a.status)}</span></td></tr>`).join("") : '<tr><td colspan="5" class="empty">No appointments yet. Book one to see it here.</td></tr>';
  $("appointment-count").textContent = appointments.length;
  $("today-count").textContent = appointments.filter(a => a.date === today() && a.status !== "Cancelled").length;
}
function renderAll() { renderDoctors(); renderPatients(); renderAppointments(); }
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
$("patient-form").addEventListener("submit", e => {
  e.preventDefault();
  const patient = {id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name:$("p-name").value.trim(), age:$("p-age").value, gender:$("p-gender").value, phone:$("p-phone").value.trim(), address:$("p-address").value.trim()};
  if (!patient.name || !patient.age || !patient.gender || !patient.phone) return toast("Please complete all required patient fields.");
  patients.push(patient); save(); e.target.reset(); renderAll(); toast("Patient registered successfully.");
});
$("patient-search").addEventListener("input", renderPatients);
$("patient-table").addEventListener("click", e => {
  const btn = e.target.closest("[data-delete-patient]"); if (!btn) return;
  const id = btn.dataset.deletePatient;
  const patient = patients.find(p => p.id === id);
  if (!patient || !confirm(`Delete ${patient.name} and their appointments?`)) return;
  patients = patients.filter(p => p.id !== id);
  appointments = appointments.filter(a => a.patientId !== id);
  save(); renderAll(); toast("Patient record deleted.");
});
$("appointment-form").addEventListener("submit", e => {
  e.preventDefault();
  const patientId = $("a-patient").value, doctorId = $("a-doctor").value, date = $("a-date").value, time = $("a-time").value;
  const patient = patients.find(p => p.id === patientId), doctor = DOCTORS.find(d => d.id === doctorId);
  if (!patient || !doctor || !date || !time) return toast("Please complete all required appointment fields.");
  if (date < today()) return toast("Please choose today or a future date.");
  appointments.push({id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),patientId,patientName:patient.name,doctorId,doctorName:doctor.name,date,time,reason:$("a-reason").value.trim(),status:"Scheduled"});
  save(); e.target.reset(); $("a-date").min = today(); renderAll(); toast("Appointment booked successfully.");
});
$("appointment-table").addEventListener("change", e => {
  const select = e.target.closest("[data-status]"); if (!select) return;
  const appointment = appointments.find(a => a.id === select.dataset.status);
  if (appointment) { appointment.status = select.value; save(); renderAppointments(); toast("Appointment status updated."); }
});
$("appointment-table").addEventListener("click", e => {
  const btn = e.target.closest("[data-delete-appointment]"); if (!btn) return;
  appointments = appointments.filter(a => a.id !== btn.dataset.deleteAppointment);
  save(); renderAppointments(); toast("Appointment deleted.");
});
renderAll();
