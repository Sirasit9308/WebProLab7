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