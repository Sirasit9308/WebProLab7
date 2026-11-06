import express from "express";
import { pool } from "./db.js";

const app = express();

app.use(express.json());
app.use(express.static("public"));

function parseCourseId(rawId) {
  const id = Number(rawId);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

function validateCourse(data) {
  return (
    typeof data?.name === "string" &&
    data.name.trim().length > 0 &&
    data.name.length <= 150 &&
    Number.isInteger(data.credits) &&
    data.credits >= 1 &&
    data.credits <= 6
  );
}

app.get("/api/courses", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, credits
       FROM courses
       ORDER BY id`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve courses"
    });
  }
});

app.get("/api/courses/:id", async (req, res) => {
  const id = parseCourseId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Invalid course ID"
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, credits
       FROM courses
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Course not found"
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve course"
    });
  }
});

app.post("/api/courses", async (req, res) => {
  if (!validateCourse(req.body)) {
    return res.status(400).json({
      error: "Invalid course data"
    });
  }

  const { name, credits } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO courses (name, credits)
       VALUES ($1, $2)
       RETURNING id, name, credits`,
      [name.trim(), credits]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to create course"
    });
  }
});

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});