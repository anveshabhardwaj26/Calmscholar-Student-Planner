// CalmScholar - script.js
// Plain JavaScript only. Data is saved in the browser's localStorage.
// Every time data changes we: change the array -> saveData() -> renderAll().

// ====================================================
// 1. SMALL HELPER FUNCTIONS
// ====================================================

// Shortcut for document.getElementById
function $(id) {
  return document.getElementById(id);
}

// Read saved data from localStorage. If nothing is saved (or it is broken),
// return the fallback value instead.
function loadData(key, fallback) {
  try {
    const text = localStorage.getItem(key);
    if (text === null) return fallback;
    const data = JSON.parse(text);
    if (Array.isArray(fallback) && !Array.isArray(data)) return fallback;
    return data;
  } catch (error) {
    return fallback;
  }
}

// Save data to localStorage as text (JSON)
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage can be full or blocked. The app still works until refresh.
  }
}

// Make user text safe before putting it inside HTML
// (stops things like <script> from being run)
function safe(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Show a success or error message under a form
function showMessage(id, text, type) {
  $(id).textContent = text;
  $(id).className = "message " + type;
}

// Turn a Date into the text "YYYY-MM-DD" (same format as <input type="date">)
function dateToText(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

// The date that is n days from today, as text. Used for sample data.
function dateFromToday(n) {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return dateToText(date);
}

// How many days from today until a date? (0 = today, negative = in the past)
function daysUntil(dateText) {
  const parts = dateText.split("-");
  const target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

// Show a date like "12 Nov 2026"
function formatDate(dateText) {
  const parts = dateText.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Words for "days left"
function daysText(days) {
  if (days < 0) return "Overdue by " + (-days) + " day(s)";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return days + " days left";
}

// Is this text a real date in the form YYYY-MM-DD ?
function isValidDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const parts = text.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return dateToText(date) === text;
}

// ====================================================
// 2. DATA (loaded from localStorage, or sample data the first time)
// ====================================================

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

let assignments = loadData("cs_assignments", [
  { title: "Integration problems", subject: "Mathematics", deadline: dateFromToday(3), priority: "High", done: false },
  { title: "Java mini project", subject: "Computer Science", deadline: dateFromToday(7), priority: "High", done: false },
  { title: "Wave motion lab report", subject: "Physics", deadline: dateFromToday(10), priority: "Medium", done: false },
  { title: "Climate change essay", subject: "English", deadline: dateFromToday(14), priority: "Low", done: false }
]);

let exams = loadData("cs_exams", [
  { subject: "Physics", date: dateFromToday(8), time: "14:00" },
  { subject: "Mathematics", date: dateFromToday(15), time: "10:00" }
]);

let classes = loadData("cs_classes", [
  { subject: "Mathematics", day: "Monday", start: "09:00", end: "10:00" },
  { subject: "Physics", day: "Monday", start: "11:00", end: "12:00" },
  { subject: "Computer Science", day: "Tuesday", start: "10:00", end: "12:00" },
  { subject: "English", day: "Wednesday", start: "09:00", end: "10:00" },
  { subject: "Chemistry", day: "Thursday", start: "11:00", end: "12:00" },
  { subject: "Mathematics", day: "Friday", start: "09:00", end: "10:00" }
]);

let subjects = loadData("cs_subjects", [
  { name: "Mathematics", attended: 34, total: 40 },
  { name: "Physics", attended: 27, total: 38 },
  { name: "Computer Science", attended: 38, total: 42 }
]);

let threshold = loadData("cs_threshold", 75);
if (typeof threshold !== "number" || threshold < 1 || threshold > 99) threshold = 75;

let materials = loadData("cs_materials", [
  { title: "MDN Web Docs - HTML guide", subject: "Computer Science", url: "https://developer.mozilla.org/en-US/docs/Learn/HTML" },
  { title: "NPTEL course list", subject: "Other", url: "https://nptel.ac.in" }
]);

let goals = loadData("cs_goals", [
  { title: "Score 85% in final exams", category: "Academic", target: dateFromToday(30), progress: 40, done: false }
]);

let ventMessages = loadData("cs_vent", []);
let joinedGroups = loadData("cs_groups", []);
let wellness = loadData("cs_wellness", null);
let selectedMood = -1;

// Sample data that is never saved or changed
const studyGroups = [
  { id: 1, name: "Maths Masters", description: "Solve problems together and share shortcuts.", topics: "Calculus, Algebra, Probability" },
  { id: 2, name: "Code Together", description: "Practice programming questions and help with projects.", topics: "Java, HTML/CSS, JavaScript" },
  { id: 3, name: "Physics Circle", description: "Discuss concepts and revise numericals before tests.", topics: "Mechanics, Waves, Optics" },
  { id: 4, name: "Exam Week Revision", description: "A group for last-minute revision plans.", topics: "All subjects" }
];

const mentors = [
  { name: "Demo Mentor A", expertise: "Mathematics", intro: "Sample mentor card. Explains calculus step by step." },
  { name: "Demo Mentor B", expertise: "Computer Science", intro: "Sample mentor card. Helps with Java and web basics." },
  { name: "Demo Mentor C", expertise: "Physics and Chemistry", intro: "Sample mentor card. Focuses on exam problem solving." },
  { name: "Demo Mentor D", expertise: "Career Guidance", intro: "Sample mentor card. Shares tips on internships and resumes." }
];

const moods = [
  { emoji: "😞", label: "Very low" },
  { emoji: "😕", label: "Low" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😄", label: "Great" }
];

// Mock test questions. "answer" is the index (0 to 3) of the correct option.
const questions = [
  { question: "What is the derivative of sin(x)?", options: ["cos(x)", "-cos(x)", "tan(x)", "-sin(x)"], answer: 0 },
  { question: "Newton's second law says that force F equals:", options: ["m + a", "m x a", "m / a", "m x v"], answer: 1 },
  { question: "Which data structure follows the LIFO order?", options: ["Queue", "Array", "Stack", "Linked list"], answer: 2 },
  { question: "Which HTML tag is used for the largest heading?", options: ["<h6>", "<head>", "<heading>", "<h1>"], answer: 3 },
  { question: "Which CSS property changes the text colour?", options: ["font-color", "color", "text-style", "background"], answer: 1 }
];

// ====================================================
// 3. NAVIGATION
// ====================================================

// Show one page and hide all the others
function showPage(name) {
  const pages = document.querySelectorAll(".page");
  for (let i = 0; i < pages.length; i++) {
    pages[i].classList.remove("active");
  }
  const buttons = document.querySelectorAll(".nav-button");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
    if (buttons[i].getAttribute("data-page") === name) {
      buttons[i].classList.add("active");
    }
  }
  $("page-" + name).classList.add("active");
  window.scrollTo(0, 0);
}

// ====================================================
// 4. ASSIGNMENTS
// ====================================================

function addAssignment() {
  const title = $("aTitle").value.trim();
  const subject = $("aSubject").value.trim();
  const deadline = $("aDeadline").value;
  const priority = $("aPriority").value;

  if (title === "" || subject === "" || deadline === "") {
    showMessage("aMessage", "Please fill in the title, subject and deadline.", "error");
    return;
  }

  assignments.push({ title: title, subject: subject, deadline: deadline, priority: priority, done: false });
  // keep the list in deadline order (dates in YYYY-MM-DD format sort correctly as text)
  assignments.sort(function (a, b) { return a.deadline.localeCompare(b.deadline); });
  saveData("cs_assignments", assignments);

  $("aTitle").value = "";
  $("aSubject").value = "";
  $("aDeadline").value = "";
  showMessage("aMessage", "Assignment added.", "success");
  renderAll();
}

// Mark an assignment completed (or move it back to pending)
function toggleAssignment(index) {
  assignments[index].done = !assignments[index].done;
  saveData("cs_assignments", assignments);
  renderAll();
}

function deleteAssignment(index) {
  assignments.splice(index, 1);
  saveData("cs_assignments", assignments);
  renderAll();
}

function renderAssignments() {
  let pendingHtml = "";
  let doneHtml = "";

  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    const days = daysUntil(a.deadline);
    const priorityClass = a.priority.toLowerCase();

    if (a.done === false) {
      const lateClass = days < 0 ? "late" : "";
      pendingHtml += '<div class="item"><div>' +
        '<div class="item-title">' + safe(a.title) + '</div>' +
        '<div class="item-info">' + safe(a.subject) + ' &middot; ' + formatDate(a.deadline) +
        ' &middot; <span class="' + lateClass + '">' + daysText(days) + '</span> ' +
        '<span class="tag ' + priorityClass + '">' + safe(a.priority) + '</span></div></div>' +
        '<div class="item-buttons">' +
        '<button class="btn" onclick="toggleAssignment(' + i + ')">Mark completed</button>' +
        '<button class="btn btn-danger" onclick="deleteAssignment(' + i + ')">Delete</button>' +
        '</div></div>';
    } else {
      doneHtml += '<div class="item"><div>' +
        '<div class="item-title done">' + safe(a.title) + '</div>' +
        '<div class="item-info">' + safe(a.subject) + ' &middot; ' + formatDate(a.deadline) + '</div></div>' +
        '<div class="item-buttons">' +
        '<button class="btn btn-light" onclick="toggleAssignment(' + i + ')">Undo</button>' +
        '<button class="btn btn-danger" onclick="deleteAssignment(' + i + ')">Delete</button>' +
        '</div></div>';
    }
  }

  $("pendingList").innerHTML = pendingHtml || '<p class="empty">No pending assignments. Nice work!</p>';
  $("completedList").innerHTML = doneHtml || '<p class="empty">Nothing completed yet.</p>';
}

// ====================================================
// 5. EXAM SCHEDULE
// ====================================================

function addExam() {
  const subject = $("eSubject").value.trim();
  const date = $("eDate").value;
  const time = $("eTime").value;

  if (subject === "" || date === "" || time === "") {
    showMessage("eMessage", "Please fill in the subject, date and time.", "error");
    return;
  }

  exams.push({ subject: subject, date: date, time: time });
  exams.sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
  saveData("cs_exams", exams);

  $("eSubject").value = "";
  $("eDate").value = "";
  $("eTime").value = "";
  showMessage("eMessage", "Exam added.", "success");
  renderAll();
}

function deleteExam(index) {
  exams.splice(index, 1);
  saveData("cs_exams", exams);
  renderAll();
}

function renderExams() {
  let html = "";
  for (let i = 0; i < exams.length; i++) {
    const e = exams[i];
    const days = daysUntil(e.date);
    let status;
    if (days < 0) {
      status = '<span class="item-info">Exam is over</span>';
    } else if (days === 0) {
      status = '<span class="late">Today!</span>';
    } else {
      const cls = days <= 7 ? "late" : "good";
      status = '<span class="' + cls + '">' + days + ' day(s) remaining</span>';
    }
    html += '<div class="item"><div>' +
      '<div class="item-title">' + safe(e.subject) + '</div>' +
      '<div class="item-info">' + formatDate(e.date) + ' at ' + safe(e.time) + ' &middot; ' + status + '</div></div>' +
      '<div class="item-buttons"><button class="btn btn-danger" onclick="deleteExam(' + i + ')">Delete</button></div></div>';
  }
  $("examList").innerHTML = html || '<p class="empty">No exams added yet.</p>';
}

// ====================================================
// 6. TIMETABLE
// ====================================================

function addClass() {
  const subject = $("tSubject").value.trim();
  const day = $("tDay").value;
  const start = $("tStart").value;
  const end = $("tEnd").value;

  if (subject === "" || start === "" || end === "") {
    showMessage("tMessage", "Please fill in the subject, start time and end time.", "error");
    return;
  }
  // "09:00" and "10:30" are written so that normal text comparison works
  if (end <= start) {
    showMessage("tMessage", "The end time must be after the start time.", "error");
    return;
  }

  classes.push({ subject: subject, day: day, start: start, end: end });
  classes.sort(function (a, b) { return a.start.localeCompare(b.start); });
  saveData("cs_classes", classes);

  $("tSubject").value = "";
  showMessage("tMessage", "Class added to the timetable.", "success");
  renderAll();
}

function deleteClass(index) {
  classes.splice(index, 1);
  saveData("cs_classes", classes);
  renderAll();
}

function renderTimetable() {
  let html = "";
  for (let d = 0; d < WEEK.length; d++) {
    html += '<div class="day"><h3>' + WEEK[d].substring(0, 3) + '</h3>';
    for (let i = 0; i < classes.length; i++) {
      const c = classes[i];
      if (c.day === WEEK[d]) {
        html += '<div class="class-box"><strong>' + safe(c.subject) + '</strong><br>' +
          safe(c.start) + ' - ' + safe(c.end) + '<br>' +
          '<button onclick="deleteClass(' + i + ')">remove</button></div>';
      }
    }
    html += '</div>';
  }
  $("weekGrid").innerHTML = html;
}

// ====================================================
// 7. ATTENDANCE
// ====================================================

// Attendance % = (attended / total) x 100. If no classes yet, return 0.
function calculatePercentage(attended, total) {
  if (total === 0) return 0;
  return (attended / total) * 100;
}

// How many more classes must be attended (with no absences) to reach the target?
function classesNeeded(attended, total, target) {
  const needed = Math.ceil((target * total - 100 * attended) / (100 - target));
  return needed > 0 ? needed : 0;
}

function addSubject() {
  const name = $("sName").value.trim();
  const attendedText = $("sAttended").value;
  const totalText = $("sTotal").value;
  const attended = Number(attendedText);
  const total = Number(totalText);

  if (name === "" || attendedText === "" || totalText === "") {
    showMessage("sMessage", "Please fill in all three boxes.", "error");
    return;
  }
  if (!Number.isInteger(attended) || !Number.isInteger(total) || attended < 0 || total < 0) {
    showMessage("sMessage", "Classes must be whole numbers, 0 or more.", "error");
    return;
  }
  if (attended > total) {
    showMessage("sMessage", "Classes attended cannot be more than total classes.", "error");
    return;
  }

  subjects.push({ name: name, attended: attended, total: total });
  saveData("cs_subjects", subjects);

  $("sName").value = "";
  $("sAttended").value = "";
  $("sTotal").value = "";
  showMessage("sMessage", "Subject added.", "success");
  renderAll();
}

// Add one more class: present = true means the student attended it
function markClass(index, present) {
  subjects[index].total = subjects[index].total + 1;
  if (present) {
    subjects[index].attended = subjects[index].attended + 1;
  }
  saveData("cs_subjects", subjects);
  renderAll();
}

function deleteSubject(index) {
  subjects.splice(index, 1);
  saveData("cs_subjects", subjects);
  renderAll();
}

function changeThreshold() {
  const value = Number($("threshold").value);
  if (!Number.isInteger(value) || value < 1 || value > 99) {
    showMessage("sMessage", "Minimum attendance must be a whole number from 1 to 99.", "error");
    $("threshold").value = threshold;
    return;
  }
  threshold = value;
  saveData("cs_threshold", threshold);
  renderAll();
}

// Overall attendance = all attended classes / all classes
function overallAttendance() {
  let attended = 0;
  let total = 0;
  for (let i = 0; i < subjects.length; i++) {
    attended += subjects[i].attended;
    total += subjects[i].total;
  }
  if (total === 0) return null;
  return calculatePercentage(attended, total);
}

function renderAttendance() {
  $("threshold").value = threshold;
  let html = "";
  for (let i = 0; i < subjects.length; i++) {
    const s = subjects[i];
    const percent = calculatePercentage(s.attended, s.total);
    let status;
    let barClass = "bar-fill";

    if (s.total === 0) {
      status = "No classes held yet";
    } else if (percent >= threshold) {
      status = '<span class="good">On track</span>';
    } else {
      const need = classesNeeded(s.attended, s.total, threshold);
      status = '<span class="late">Below ' + threshold + '%. Attend the next ' + need + ' class(es) to reach it.</span>';
      barClass = "bar-fill low";
    }

    html += '<div class="item"><div style="flex:1">' +
      '<div class="item-title">' + safe(s.name) + '</div>' +
      '<div class="item-info">' + s.attended + ' of ' + s.total + ' classes &middot; ' + status + '</div>' +
      '<div class="bar"><div class="' + barClass + '" style="width:' + percent + '%"></div></div></div>' +
      '<div class="percent">' + percent.toFixed(1) + '%</div>' +
      '<div class="item-buttons">' +
      '<button class="btn" onclick="markClass(' + i + ', true)">+ Present</button>' +
      '<button class="btn btn-light" onclick="markClass(' + i + ', false)">+ Absent</button>' +
      '<button class="btn btn-danger" onclick="deleteSubject(' + i + ')">Delete</button>' +
      '</div></div>';
  }
  $("attendanceList").innerHTML = html || '<p class="empty">No subjects yet. Add one above.</p>';
}

// ====================================================
// 8. MOCK TESTS
// ====================================================

// Draw the questions with radio buttons
function renderQuiz() {
  let html = "";
  for (let q = 0; q < questions.length; q++) {
    html += '<div class="card question"><div class="question-text">Q' + (q + 1) + '. ' + safe(questions[q].question) + '</div>';
    for (let o = 0; o < 4; o++) {
      html += '<label class="option" id="label' + q + '_' + o + '">' +
        '<input type="radio" name="q' + q + '" id="q' + q + '_' + o + '"> ' +
        String.fromCharCode(65 + o) + '. ' + safe(questions[q].options[o]) + '</label>';
    }
    html += '</div>';
  }
  $("quizArea").innerHTML = html;
}

function submitQuiz() {
  // 1. Make sure every question has an answer
  const chosen = [];
  for (let q = 0; q < questions.length; q++) {
    let picked = -1;
    for (let o = 0; o < 4; o++) {
      if ($("q" + q + "_" + o).checked) picked = o;
    }
    if (picked === -1) {
      showMessage("quizMessage", "Please answer question " + (q + 1) + " before submitting.", "error");
      return;
    }
    chosen.push(picked);
  }

  // 2. Count the score and colour the options
  let score = 0;
  let review = "";
  for (let q = 0; q < questions.length; q++) {
    const correct = questions[q].answer;
    if (chosen[q] === correct) {
      score++;
      review += "<p>Q" + (q + 1) + ": Correct</p>";
    } else {
      review += "<p>Q" + (q + 1) + ": Wrong. Correct answer is " +
        String.fromCharCode(65 + correct) + ". " + safe(questions[q].options[correct]) + "</p>";
    }
    for (let o = 0; o < 4; o++) {
      let cls = "option";
      if (o === correct) cls = "option correct";
      else if (o === chosen[q]) cls = "option wrong";
      $("label" + q + "_" + o).className = cls;
    }
  }

  // 3. Show the result
  const percent = Math.round((score / questions.length) * 100);
  $("quizResult").innerHTML = "<h2>Your score: " + score + " / " + questions.length + " (" + percent + "%)</h2>" + review;
  $("quizResult").classList.remove("hidden");
  showMessage("quizMessage", "Test submitted.", "success");
}

function resetQuiz() {
  renderQuiz();
  $("quizResult").classList.add("hidden");
  showMessage("quizMessage", "", "");
}

// ====================================================
// 9. STUDY MATERIALS (saved links only, no file upload)
// ====================================================

function addMaterial() {
  const title = $("mTitle").value.trim();
  const subject = $("mSubject").value;
  const url = $("mUrl").value.trim();

  if (title === "" || url === "") {
    showMessage("mMessage", "Please enter a title and a URL.", "error");
    return;
  }
  // Only allow normal web links
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    showMessage("mMessage", "The URL must start with http:// or https://", "error");
    return;
  }

  materials.push({ title: title, subject: subject, url: url });
  saveData("cs_materials", materials);

  $("mTitle").value = "";
  $("mUrl").value = "";
  showMessage("mMessage", "Link saved.", "success");
  renderAll();
}

function deleteMaterial(index) {
  materials.splice(index, 1);
  saveData("cs_materials", materials);
  renderAll();
}

function renderMaterials() {
  let html = "";
  for (let i = 0; i < materials.length; i++) {
    const m = materials[i];
    html += '<div class="item"><div>' +
      '<div class="item-title">' + safe(m.title) + '</div>' +
      '<div class="item-info">' + safe(m.subject) + ' <span class="tag">Saved link</span></div></div>' +
      '<div class="item-buttons">' +
      '<a class="btn" href="' + safe(m.url) + '" target="_blank" rel="noopener noreferrer">Open</a>' +
      '<button class="btn btn-danger" onclick="deleteMaterial(' + i + ')">Delete</button>' +
      '</div></div>';
  }
  $("materialList").innerHTML = html || '<p class="empty">No links saved yet.</p>';
}

// ====================================================
// 10. WELLNESS
// ====================================================

function renderMoodButtons() {
  let html = "";
  for (let i = 0; i < moods.length; i++) {
    const selected = i === selectedMood ? " selected" : "";
    html += '<div class="mood-button' + selected + '" onclick="selectMood(' + i + ')">' +
      '<span class="emoji">' + moods[i].emoji + '</span>' + moods[i].label + '</div>';
  }
  $("moodButtons").innerHTML = html;
}

function selectMood(index) {
  selectedMood = index;
  renderMoodButtons();
}

function updateStressLabel() {
  $("stressValue").textContent = $("stressSlider").value;
}

function saveWellness() {
  if (selectedMood === -1) {
    showMessage("wMessage", "Please choose how you are feeling first.", "error");
    return;
  }
  wellness = {
    date: dateToText(new Date()),
    mood: selectedMood,
    stress: Number($("stressSlider").value)
  };
  saveData("cs_wellness", wellness);
  showMessage("wMessage", "Check-in saved.", "success");
  renderWellness();
}

// Choose a supportive message and suggestions using simple if / else rules
function renderWellness() {
  if (wellness === null) return;

  let message;
  let tips;
  if (wellness.stress <= 3) {
    message = "You seem calm today. That is a great place to study from.";
    tips = ["Keep your usual routine", "Take a short walk after studying", "Drink enough water"];
  } else if (wellness.stress <= 6) {
    message = "You are carrying a little stress. That is normal during busy weeks.";
    tips = ["Study in 25 minute blocks with 5 minute breaks", "Do 5 slow deep breaths", "Stretch your neck and shoulders"];
  } else {
    message = "Your stress is high today. Be kind to yourself and slow down.";
    tips = ["Take a proper break away from screens", "Try breathing in for 4 seconds and out for 6, five times", "Talk to a friend, family member or counsellor about how you feel"];
  }

  if (wellness.mood <= 1) {
    message += " It is okay to have low days. You do not have to handle everything at once.";
  }

  let html = "<p>Last check-in: " + formatDate(wellness.date) + " &middot; Mood: " +
    moods[wellness.mood].emoji + " " + moods[wellness.mood].label + " &middot; Stress: " + wellness.stress + "/10</p>" +
    "<p><strong>" + message + "</strong></p><ul class=\"advice-list\">";
  for (let i = 0; i < tips.length; i++) {
    html += "<li>" + tips[i] + "</li>";
  }
  html += "</ul>";
  $("wellnessAdvice").innerHTML = html;
}

// ====================================================
// 11. STUDY GROUPS (demonstration, saved in this browser only)
// ====================================================

function toggleGroup(id) {
  const position = joinedGroups.indexOf(id);
  if (position === -1) {
    joinedGroups.push(id);   // join
  } else {
    joinedGroups.splice(position, 1);   // leave
  }
  saveData("cs_groups", joinedGroups);
  renderGroups();
}

function renderGroups() {
  let html = "";
  for (let i = 0; i < studyGroups.length; i++) {
    const g = studyGroups[i];
    const joined = joinedGroups.indexOf(g.id) !== -1;
    html += '<div class="card"><h2>' + safe(g.name) + '</h2>' +
      '<p>' + safe(g.description) + '</p>' +
      '<p class="item-info">Subjects: ' + safe(g.topics) + '</p>' +
      '<button class="btn ' + (joined ? "btn-light" : "") + '" onclick="toggleGroup(' + g.id + ')">' +
      (joined ? "Leave group" : "Join group") + '</button>' +
      (joined ? ' <span class="tag">Joined</span>' : '') + '</div>';
  }
  $("groupList").innerHTML = html;
}

// ====================================================
// 12. GOALS AND CAREER
// ====================================================

function addGoal() {
  const title = $("gTitle").value.trim();
  const category = $("gCategory").value;
  const target = $("gDate").value;

  if (title === "" || target === "") {
    showMessage("gMessage", "Please enter a goal and a target date.", "error");
    return;
  }

  goals.push({ title: title, category: category, target: target, progress: 0, done: false });
  saveData("cs_goals", goals);

  $("gTitle").value = "";
  $("gDate").value = "";
  showMessage("gMessage", "Goal added.", "success");
  renderAll();
}

// Called when the progress slider is moved
function updateProgress(index, value) {
  goals[index].progress = Number(value);
  goals[index].done = goals[index].progress === 100;
  saveData("cs_goals", goals);
  renderAll();
}

function completeGoal(index) {
  goals[index].progress = 100;
  goals[index].done = true;
  saveData("cs_goals", goals);
  renderAll();
}

function deleteGoal(index) {
  goals.splice(index, 1);
  saveData("cs_goals", goals);
  renderAll();
}

function renderGoals() {
  let html = "";
  for (let i = 0; i < goals.length; i++) {
    const g = goals[i];
    const days = daysUntil(g.target);
    const when = days < 0 ? "Target date passed" : days + " day(s) left";
    html += '<div class="item"><div style="flex:1">' +
      '<div class="item-title ' + (g.done ? "done" : "") + '">' + safe(g.title) + ' <span class="tag">' + safe(g.category) + '</span></div>' +
      '<div class="item-info">Target: ' + formatDate(g.target) + ' &middot; ' + when + ' &middot; Progress: ' + g.progress + '%</div>' +
      '<div class="bar"><div class="bar-fill" style="width:' + g.progress + '%"></div></div>' +
      '<input type="range" min="0" max="100" step="5" value="' + g.progress + '" onchange="updateProgress(' + i + ', this.value)">' +
      '</div><div class="item-buttons">' +
      (g.done ? '<span class="good">Completed</span>' : '<button class="btn" onclick="completeGoal(' + i + ')">Mark completed</button>') +
      '<button class="btn btn-danger" onclick="deleteGoal(' + i + ')">Delete</button>' +
      '</div></div>';
  }
  $("goalList").innerHTML = html || '<p class="empty">No goals yet. Add your first goal above.</p>';
}

// ====================================================
// 13. MENTOR CONNECT (demonstration data)
// ====================================================

function renderMentors() {
  let html = "";
  for (let i = 0; i < mentors.length; i++) {
    const m = mentors[i];
    html += '<div class="card"><h2>' + safe(m.name) + ' <span class="badge-demo">Demo data</span></h2>' +
      '<p><strong>' + safe(m.expertise) + '</strong></p>' +
      '<p>' + safe(m.intro) + '</p></div>';
  }
  $("mentorList").innerHTML = html;
}

// ====================================================
// 14. ANONYMOUS VENT (saved in this browser only)
// ====================================================

function postVent() {
  const text = $("ventText").value.trim();
  if (text === "") {
    showMessage("vMessage", "Please write something first.", "error");
    return;
  }
  ventMessages.unshift({ text: text, time: new Date().toLocaleString("en-IN") });
  saveData("cs_vent", ventMessages);
  $("ventText").value = "";
  showMessage("vMessage", "Thank you for sharing. Letting feelings out is a good first step, and you are not alone.", "success");
  renderVent();
}

function clearVent() {
  if (ventMessages.length === 0) return;
  if (confirm("Delete all your saved messages from this browser?")) {
    ventMessages = [];
    saveData("cs_vent", ventMessages);
    renderVent();
  }
}

function renderVent() {
  let html = "";
  for (let i = 0; i < ventMessages.length; i++) {
    html += '<div class="item"><div><div class="item-info">' + safe(ventMessages[i].time) + '</div>' +
      '<div>' + safe(ventMessages[i].text) + '</div></div></div>';
  }
  $("ventList").innerHTML = html || '<p class="empty">No messages yet.</p>';
}

// ====================================================
// 15. AI PLANNER (rule-based, not a real AI model)
// ====================================================

// "Maths, Physics ,, CS" -> ["Maths", "Physics", "CS"]
function splitList(text) {
  const parts = text.split(",");
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    const item = parts[i].trim();
    if (item !== "") result.push(item);
  }
  return result;
}

// "Maths:2026-11-10, Physics:2026-11-14" ->
//   { items: [ {name:"Maths", date:"2026-11-10"}, ... ], errors: [] }
function parseNameDatePairs(text) {
  const result = { items: [], errors: [] };
  const parts = splitList(text);
  for (let i = 0; i < parts.length; i++) {
    const position = parts[i].lastIndexOf(":");
    const name = position === -1 ? "" : parts[i].substring(0, position).trim();
    const date = position === -1 ? "" : parts[i].substring(position + 1).trim();
    if (name === "" || !isValidDate(date)) {
      result.errors.push(parts[i]);
    } else {
      result.items.push({ name: name, date: date });
    }
  }
  return result;
}

// Buttons that copy saved exams / assignments into the planner boxes
function fillExams() {
  const list = [];
  for (let i = 0; i < exams.length; i++) {
    if (daysUntil(exams[i].date) >= 0) {
      list.push(exams[i].subject.replace(/[:,]/g, " ") + ":" + exams[i].date);
    }
  }
  $("pExams").value = list.join(", ");
  if ($("pSubjects").value.trim() === "") {
    $("pSubjects").value = exams.filter(function (e) { return daysUntil(e.date) >= 0; })
      .map(function (e) { return e.subject.replace(/[:,]/g, " "); }).join(", ");
  }
}

function fillAssignments() {
  const list = [];
  for (let i = 0; i < assignments.length; i++) {
    if (assignments[i].done === false) {
      list.push(assignments[i].title.replace(/[:,]/g, " ") + ":" + assignments[i].deadline);
    }
  }
  $("pAssign").value = list.join(", ");
}

// Score rules for a date: the closer the date, the more points
function urgencyPoints(days, closeBonus) {
  if (days <= 3) return closeBonus + 3;
  if (days <= 7) return closeBonus + 2;
  if (days <= 14) return closeBonus + 1;
  return closeBonus;
}

// Turn minutes since midnight into "HH:MM"
function toClock(totalMinutes) {
  const minutes = totalMinutes % (24 * 60);
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return h + ":" + m;
}

// THE PLANNER. It works in 6 steps (see comments below).
// It returns an object: { error, sessions, later, totalStudy, totalBreak }
function buildPlan(subjectText, examText, weakText, hours, startText, assignText) {
  // Step 1: read the inputs
  const subjectList = splitList(subjectText);
  const weakList = splitList(weakText);
  const examInfo = parseNameDatePairs(examText);
  const assignInfo = parseNameDatePairs(assignText);

  if (subjectList.length === 0) {
    return { error: "Please enter at least one subject." };
  }
  if (examInfo.errors.length > 0) {
    return { error: "Check the exam dates. Use Subject:YYYY-MM-DD. Problem with: " + examInfo.errors.join(", ") };
  }
  if (assignInfo.errors.length > 0) {
    return { error: "Check the assignments. Use Title:YYYY-MM-DD. Problem with: " + assignInfo.errors.join(", ") };
  }
  if (isNaN(hours) || hours < 1 || hours > 16) {
    return { error: "Study hours per day must be a number from 1 to 16." };
  }

  // Step 2: give every task points. More points = higher priority.
  const tasks = [];

  for (let i = 0; i < subjectList.length; i++) {
    const name = subjectList[i];
    const lower = name.toLowerCase();
    let points = 1;
    const reasons = [];

    // exam date rule
    for (let j = 0; j < examInfo.items.length; j++) {
      if (examInfo.items[j].name.toLowerCase() === lower) {
        const days = daysUntil(examInfo.items[j].date);
        if (days >= 0) {
          points += urgencyPoints(days, 1);
          reasons.push("exam in " + days + " day(s)");
        }
      }
    }
    // weak topic rule
    for (let j = 0; j < weakList.length; i === -1, j++) {
      if (weakList[j].toLowerCase() === lower) {
        points += 3;
        reasons.push("needs more attention");
      }
    }
    tasks.push({ name: name, points: points, reasons: reasons });
  }

  // weak topics that are not subjects become their own tasks
  for (let j = 0; j < weakList.length; j++) {
    let isSubject = false;
    for (let i = 0; i < subjectList.length; i++) {
      if (subjectList[i].toLowerCase() === weakList[j].toLowerCase()) isSubject = true;
    }
    if (!isSubject) {
      tasks.push({ name: weakList[j] + " (weak topic)", points: 4, reasons: ["needs more attention"] });
    }
  }

  // assignments become tasks too
  for (let i = 0; i < assignInfo.items.length; i++) {
    const days = daysUntil(assignInfo.items[i].date);
    let points;
    let reason;
    if (days < 0) {
      points = 6;
      reason = "deadline has passed";
    } else {
      points = urgencyPoints(days, 2);
      reason = "deadline in " + days + " day(s)";
    }
    tasks.push({ name: "Assignment: " + assignInfo.items[i].name, points: points, reasons: [reason] });
  }

  // Step 3: put the most important tasks first
  tasks.sort(function (a, b) { return b.points - a.points; });

  // Step 4: share the available time in proportion to the points
  let totalPoints = 0;
  for (let i = 0; i < tasks.length; i++) totalPoints += tasks[i].points;
  const availableMinutes = Math.round(hours * 60);

  const sessions = [];
  const later = [];
  let usedMinutes = 0;
  let totalBreak = 0;
  let clock = Number(startText.split(":")[0]) * 60 + Number(startText.split(":")[1]);

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    // share of time, rounded to the nearest 5 minutes, at least 20 minutes
    let minutes = Math.round((availableMinutes * t.points / totalPoints) / 5) * 5;
    if (minutes < 20) minutes = 20;

    // not enough time left? keep the task for later
    if (usedMinutes + minutes > availableMinutes) {
      if (sessions.length === 0) {
        minutes = availableMinutes;   // always plan at least one session
      } else {
        later.push(t.name);
        continue;
      }
    }

    // priority label from points
    let priority = "Low";
    if (t.points >= 6) priority = "High";
    else if (t.points >= 3) priority = "Medium";

    // Step 5: split long tasks into sessions of about 50 minutes
    let remaining = minutes;
    let part = 1;
    const partCount = minutes > 65 ? Math.ceil(minutes / 50) : 1;
    while (remaining > 0) {
      let length = remaining > 65 ? 50 : remaining;

      // Step 6: add a short break before every session except the first
      if (sessions.length > 0) {
        const breakLength = sessions[sessions.length - 1].length >= 45 ? 10 : 5;
        sessions.push({ type: "break", length: breakLength, start: clock });
        clock += breakLength;
        totalBreak += breakLength;
      }

      const label = partCount > 1 ? t.name + " (part " + part + " of " + partCount + ")" : t.name;
      sessions.push({
        type: "study", name: label, length: length, priority: priority,
        reason: t.reasons.join(", "), start: clock
      });
      clock += length;
      remaining -= length;
      part++;
    }
    usedMinutes += minutes;
  }

  return { error: "", sessions: sessions, later: later, totalStudy: usedMinutes, totalBreak: totalBreak };
}

// Called by the "Generate Study Plan" button
function generatePlan() {
  const plan = buildPlan(
    $("pSubjects").value, $("pExams").value, $("pWeak").value,
    Number($("pHours").value), $("pStart").value || "16:00", $("pAssign").value
  );

  if (plan.error !== "") {
    showMessage("pMessage", plan.error, "error");
    $("planResult").classList.add("hidden");
    return;
  }

  let rows = "";
  let order = 1;
  for (let i = 0; i < plan.sessions.length; i++) {
    const s = plan.sessions[i];
    const time = toClock(s.start) + " - " + toClock(s.start + s.length);
    if (s.type === "break") {
      rows += '<tr class="break-row"><td></td><td>' + time + '</td><td>Short break</td><td>' + s.length + ' min</td><td></td><td></td></tr>';
    } else {
      rows += '<tr><td>' + order + '</td><td>' + time + '</td><td>' + safe(s.name) + '</td><td>' + s.length + ' min</td>' +
        '<td><span class="tag ' + s.priority.toLowerCase() + '">' + s.priority + '</span></td><td>' + safe(s.reason) + '</td></tr>';
      order++;
    }
  }

  let html = "<h2>Your suggested study plan</h2>" +
    '<p class="item-info">Total study time: ' + plan.totalStudy + ' min &middot; Breaks: ' + plan.totalBreak + ' min</p>' +
    '<div class="table-scroll"><table class="plan-table"><thead><tr><th>Order</th><th>Time</th><th>Subject or task</th><th>Duration</th><th>Priority</th><th>Why</th></tr></thead><tbody>' +
    rows + '</tbody></table></div>';
  if (plan.later.length > 0) {
    html += '<p class="note">Not enough time today for: ' + safe(plan.later.join(", ")) + '. Plan them for tomorrow.</p>';
  }
  html += '<p class="note">Made by a rule-based planner. Change the inputs and the plan changes.</p>';

  $("planResult").innerHTML = html;
  $("planResult").classList.remove("hidden");
  showMessage("pMessage", "Study plan ready.", "success");
}

// ====================================================
// 16. DASHBOARD
// ====================================================

function renderDashboard() {
  const todayName = WEEK[(new Date().getDay() + 6) % 7];   // getDay(): 0 = Sunday
  $("todayText").textContent = "Today is " + todayName + ", " + formatDate(dateToText(new Date())) + ".";

  // statistics calculated from the saved data
  const pending = assignments.filter(function (a) { return a.done === false; });
  const upcomingExams = exams.filter(function (e) { return daysUntil(e.date) >= 0; });
  const overall = overallAttendance();

  $("statPending").textContent = pending.length;
  $("statExams").textContent = upcomingExams.length;
  $("statAttendance").textContent = overall === null ? "--" : overall.toFixed(1) + "%";

  // today's classes
  let classHtml = "";
  for (let i = 0; i < classes.length; i++) {
    if (classes[i].day === todayName) {
      classHtml += '<div class="item"><div><div class="item-title">' + safe(classes[i].subject) + '</div>' +
        '<div class="item-info">' + safe(classes[i].start) + ' - ' + safe(classes[i].end) + '</div></div></div>';
    }
  }
  $("todayClasses").innerHTML = classHtml || '<p class="empty">No classes today.</p>';

  // next 4 deadlines (the list is already sorted by date)
  let deadlineHtml = "";
  for (let i = 0; i < pending.length && i < 4; i++) {
    const days = daysUntil(pending[i].deadline);
    deadlineHtml += '<div class="item"><div><div class="item-title">' + safe(pending[i].title) + '</div>' +
      '<div class="item-info">' + safe(pending[i].subject) + ' &middot; ' + daysText(days) + '</div></div></div>';
  }
  $("dashDeadlines").innerHTML = deadlineHtml || '<p class="empty">No pending deadlines.</p>';

  $("suggestion").textContent = makeSuggestion(pending, upcomingExams, overall);
}

// Simple rules that pick one study suggestion
function makeSuggestion(pending, upcomingExams, overall) {
  if (upcomingExams.length > 0) {
    const next = upcomingExams[0];
    const days = daysUntil(next.date);
    if (days <= 7) {
      return "Your " + next.subject + " exam is in " + days + " day(s). Spend your best study hours on it today.";
    }
  }
  if (pending.length > 0 && daysUntil(pending[0].deadline) <= 3) {
    return "\"" + pending[0].title + "\" is due soon. Finish it first, then revise.";
  }
  if (overall !== null && overall < threshold) {
    return "Your overall attendance is below " + threshold + "%. Try not to miss the next few classes.";
  }
  return "You are on track. Use the AI Planner to organise a balanced study day.";
}

// ====================================================
// 17. START THE APP
// ====================================================

function renderAll() {
  renderDashboard();
  renderAssignments();
  renderExams();
  renderTimetable();
  renderAttendance();
  renderMaterials();
  renderGroups();
  renderGoals();
  renderMentors();
  renderVent();
}

// These are drawn once when the page opens
renderAll();
renderQuiz();
renderMoodButtons();
renderWellness();
