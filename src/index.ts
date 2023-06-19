import express from "express";
const client = require("../db");
const { readFileSync } = require("fs");
const { join } = require("path");

const cors = require("cors");

const app = express();
const port = 5050;
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send({ message: "hello world" });
});

app.get("/users", (req, res) => {
  client.query("select * from users").then((response: any) => {
    // response.rows === array of objects
    res.send(response.rows);
  });
});

app.delete("/users/:id", (req, res) => {
  const id = req.params.id;
  try {
    client.query(`delete from users where id = '${id}'`);
    res.send({ status: "OK", message: `user with userId ${id} deleted` });
  } catch (err) {
    console.error(err);
  }
});

app.post("/users/login", (req, res) => {
  const { username, password } = req.body;
  client
    .query(`select * from users where username = '${username}'`)
    .then((found: any) => {
      if (found.rowCount === 1) {
        const user = found.rows[0];
        const match = user.password === password;
        if (match) {
          res.send({
            user: {
              firstname: user.firstname,
              lastname: user.lastname,
              email: user.email,
              username: user.username,
              id: user.id,
            },
            message: "OK",
          });
        } else {
          res.send({ message: "wrong password" });
        }
      } else {
        res.send({ message: `user ${username} doesn't exist` });
      }
    });
});

app.post("/users/create", (req, res) => {
  const { firstname, lastname, email, username, password } = req.body;
  console.log(req.body);
  client
    .query(`select * from users where username = '${username}'`)
    .then((response: any) => {
      if (response.rowCount === 0) {
        try {
          client.query(
            `insert into users (firstName, lastName, email, username, password) values ($1, $2, $3, $4, $5)`,
            [firstname, lastname, email, username, password]
          );
          // then get created user
          client
            .query(`select * from users where username = '${username}'`)
            .then((found: any) => {
              res.send({
                status: "OK",
                message: `new user ${username} created`,
                user: found.rows[0],
              });
            });
        } catch (err) {
          console.error(err);
        }
      } else {
        res.send({
          status: "bad request",
          message: `user ${username} already exists`,
        });
      }
    });
});

app.put("/users/notes", (req, res) => {
  const { text, userid } = req.body;
  client.query(
    `INSERT INTO notes (userid, text) VALUES ('${userid}', '${text}') ON CONFLICT (userid) DO UPDATE SET text = EXCLUDED.text`
  );
});

app.get("/users/notes/:id", (req, res) => {
  const { id } = req.params;
  try {
    client
      .query(`select * from notes where userid = '${id}'`)
      .then((found: any) => {
        if (found.rows[0]) {
          res.send({ response: found.rows[0].text });
        } else {
          res.send({ response: "" });
        }
      });
  } catch (err) {
    console.error(err);
  }
});

app.post("/contacts", (req, res) => {
  const { firstName, lastName, favColor } = req.body;
  client
    .query(
      `INSERT INTO contacts ("firstName", "lastName", "favColor") VALUES ('${firstName}', '${lastName}', '${favColor}')`
    )
    .then(() =>
      client
        .query(
          `SELECT * FROM contacts WHERE "firstName" = '${firstName}' AND "lastName" = '${lastName}'`
        )
        .then((found: any) => res.send(found.rows))
    );
});

app.get("/contacts", (req, res) => {
  client
    .query("select * from contacts")
    .then((response: any) => res.send(response.rows));
});

app.put("/contacts", async (req, res) => {
  const { firstName, lastName, favColor, id } = req.body;
  console.log(req.body);
  client
    .query(
      'UPDATE contacts SET "firstName" = $1, "lastName" = $2, "favColor" = $3 WHERE id = $4',
      [firstName, lastName, favColor, id]
    )
    .then(() => {
      client
        .query("SELECT * FROM contacts ORDER BY id")
        .then((response: any) => res.send(response.rows));
    });
});

app.delete("/contacts/:id", (req, res) => {
  const { id } = req.params;
  client.query(`DELETE FROM contacts where id = '${id}'`).then(() => {
    client.query("SELECT * FROM contacts").then((found: any) => {
      res.send(found.rows);
    });
  });
});

app.listen(port, () => {
  console.log(`app is listening on port ${port}`);
});
