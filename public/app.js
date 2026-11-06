const form = document.querySelector("#course-form");
const nameInput = document.querySelector("#course-name");
const creditsInput = document.querySelector("#course-credits");
 
const courseList = document.querySelector("#course-list");
const emptyMessage = document.querySelector("#empty-message");
const statusBox = document.querySelector("#status");
 
const addButton = document.querySelector("#add-button");
const refreshButton = document.querySelector("#refresh-button");
 
function showStatus(message, type = "") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
}
 
function renderCourses(courses) {
  courseList.replaceChildren();
  emptyMessage.hidden = courses.length > 0;
  for (const course of courses) {
    const row = document.createElement("tr");
 
    const idCell = document.createElement("td");
    idCell.textContent = course.id;
 
    const nameCell = document.createElement("td");
    nameCell.textContent = course.name;
 
    const creditsCell = document.createElement("td");
    creditsCell.textContent = course.credits;
 
    row.append(idCell, nameCell, creditsCell);
    courseList.appendChild(row);
  }
}
 
async function loadCourses() {
  refreshButton.disabled = true;
  showStatus("Loading courses...", "loading");
 
  try {
    const response = await fetch("/api/courses");
 
    if (!response.ok) {
      throw new Error(
        `Failed to load courses (HTTP ${response.status})`
      );
    }
 
    const courses = await response.json();
 
    if (!Array.isArray(courses)) {
      throw new Error("Invalid API response format");
    }
 
    renderCourses(courses);
 
    showStatus(
      `Successfully loaded ${courses.length} courses.`,
      "success"
    );
    return true;
 
  } catch (error) {
    console.error("GET courses failed:", error);
    showStatus(error.message, "error");
    return false;
 
  } finally {
    refreshButton.disabled = false;
  }
}
 
async function createCourse(name, credits) {
  const response = await fetch("/api/courses", {
    method: "POST",
 
    headers: {
      "Content-Type": "application/json"
    },
 
    body: JSON.stringify({
      name: name,
      credits: credits
    })
  });
 
  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
 
    try {
      const errorData = await response.json();
 
      if (typeof errorData.error === "string") {
        message = errorData.error;
      }
    } catch {
 
    }
 
    throw new Error(message);
  }
  return response.json();
}
 
form.addEventListener("submit", async (event) => {
  event.preventDefault();
 
  const name = nameInput.value.trim();
  const credits = Number(creditsInput.value);
 
  if (
    name.length === 0 ||
    name.length > 150 ||
    !Number.isInteger(credits) ||
    credits < 1 ||
    credits > 6
  ) {
    showStatus("Please enter valid course data.", "error");
    return;
  }
 
  addButton.disabled = true;
  showStatus("Creating course...", "loading");
 
  try {
    const newCourse = await createCourse(name, credits);
 
    form.reset();
 
    const refreshed = await loadCourses();
 
    if (refreshed) {
        showStatus(
          `Course "${newCourse.name}" created successfully.`,
          "success"
        );
      } else {
        showStatus(
          "Course created, but the list could not be refreshed.",
          "error"
        );
      }
 
    await loadCourses();
 
    showStatus(
      `Course "${newCourse.name}" created successfully.`,
      "success"
    );
 
  } catch (error) {
    console.error("POST course failed:", error);
    showStatus(error.message, "error");
 
  } finally {
    addButton.disabled = false;
  }
});
 
refreshButton.addEventListener("click", loadCourses);
 
loadCourses();
 
/*Edit / Delete */
 
async function readApiError(response) {
  let message = `HTTP error ${response.status}`;
 
  try {
    const errorData = await response.json();
 
    if (typeof errorData.error === "string") {
      message = errorData.error;
    }
  } catch {
    // ใช้ข้อความ HTTP error ทั่วไป
  }
 
  return new Error(message);
}
 
async function updateCourse(id, name, credits) {
  const response = await fetch(`/api/courses/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, credits })
  });
 
  if (!response.ok) throw await readApiError(response);
  return response.json();
}
 
async function deleteCourse(id) {
  const response = await fetch(`/api/courses/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
 
  if (!response.ok) throw await readApiError(response);
}
 
function setRowDisabled(row, disabled) {
  for (const control of row.querySelectorAll("button, input")) {
    control.disabled = disabled;
  }
}
 
function createActionButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) button.className = className;
  button.addEventListener("click", onClick);
  return button;
}
 
function setRowActions(row, ...buttons) {
  const wrapper = document.createElement("div");
  wrapper.className = "row-actions";
  wrapper.append(...buttons);
  row.cells[3].replaceChildren(wrapper);
}
 
function showViewActions(row) {
  setRowActions(
    row,
    createActionButton("Edit", "secondary-button", () => startEdit(row)),
    createActionButton("Delete", "danger-button", () => removeRow(row))
  );
}
 
function startEdit(row) {
  const [idCell, nameCell, creditsCell] = row.cells;
  const original = {
    name: nameCell.textContent,
    credits: creditsCell.textContent
  };
 
  const nameEdit = document.createElement("input");
  nameEdit.type = "text";
  nameEdit.maxLength = 150;
  nameEdit.value = original.name;
  nameEdit.setAttribute("aria-label", "Course name");
 
  const creditsEdit = document.createElement("input");
  creditsEdit.type = "number";
  creditsEdit.min = "1";
  creditsEdit.max = "6";
  creditsEdit.step = "1";
  creditsEdit.value = original.credits;
  creditsEdit.setAttribute("aria-label", "Credits");
 
  nameCell.replaceChildren(nameEdit);
  creditsCell.replaceChildren(creditsEdit);
 
  const cancel = () => {
    nameCell.textContent = original.name;
    creditsCell.textContent = original.credits;
    showViewActions(row);
  };
  const save = () =>
    saveRow(row, idCell.textContent, nameEdit, creditsEdit);
 
  for (const input of [nameEdit, creditsEdit]) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        save();
      } else if (event.key === "Escape") {
        cancel();
      }
    });
  }
 
  setRowActions(
    row,
    createActionButton("Save", "", save),
    createActionButton("Cancel", "secondary-button", cancel)
  );
 
  nameEdit.focus();
  nameEdit.select();
}
 
async function saveRow(row, id, nameEdit, creditsEdit) {
  const name = nameEdit.value.trim();
  const credits = Number(creditsEdit.value);
 
  if (
    name.length === 0 ||
    name.length > 150 ||
    !Number.isInteger(credits) ||
    credits < 1 ||
    credits > 6
  ) {
    showStatus("Please enter valid course data.", "error");
    return;
  }
 
  setRowDisabled(row, true);
  showStatus("Updating course...", "loading");
 
  try {
    const updated = await updateCourse(id, name, credits);
 
    const refreshed = await loadCourses();
 
    showStatus(
      refreshed
        ? `Course "${updated.name}" updated successfully.`
        : "Course updated, but the list could not be refreshed.",
      refreshed ? "success" : "error"
    );
 
    if (!refreshed) setRowDisabled(row, false);
  } catch (error) {
    console.error("PUT course failed:", error);
    showStatus(error.message, "error");
    setRowDisabled(row, false);
  }
}
 
async function removeRow(row) {
  const id = row.cells[0].textContent;
  const name = row.cells[1].textContent;
 
  if (!window.confirm(`Delete course "${name}"? This cannot be undone.`)) {
    return;
  }
 
  setRowDisabled(row, true);
  showStatus("Deleting course...", "loading");
 
  try {
    await deleteCourse(id);
 
    const refreshed = await loadCourses();
 
    showStatus(
      refreshed
        ? `Course "${name}" deleted successfully.`
        : "Course deleted, but the list could not be refreshed.",
      refreshed ? "success" : "error"
    );
 
    if (!refreshed) setRowDisabled(row, false);
  } catch (error) {
    console.error("DELETE course failed:", error);
    showStatus(error.message, "error");
    setRowDisabled(row, false);
  }
}
 
function addActionsCell(row) {
  if (row.dataset.actions || row.cells.length < 3) return;
 
  row.dataset.actions = "1";
  row.appendChild(document.createElement("td"));
  showViewActions(row);
}
 
new MutationObserver(() => {
  for (const row of courseList.rows) addActionsCell(row);
}).observe(courseList, { childList: true });
 
for (const row of courseList.rows) addActionsCell(row);