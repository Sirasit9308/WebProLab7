CREATE TABLE IF NOT EXISTS courses (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    credits INTEGER NOT NULL,
    CONSTRAINT chk_course_credits CHECK (credits BETWEEN 1 AND 6)
);

INSERT INTO
    courses (name, credits)
VALUES ('Web Programming', 3),
    ('Database Systems', 3),
    ('Software Engineering', 3);