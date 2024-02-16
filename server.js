const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')
const app = express();

app.use(express.json());
app.use(cors())


// serialize in the context of the sqlite db allows for sequential execution of sql operations;
// i.e. if there is a queue of sql calls, they will execute one after the other in the order specified
// inside the serialize callback. This is to prevent a race condition between db calls, potentially 
// resulting in different effects depending on which call finishes first

db.serialize(() => {
    db.run('CREATE TABLE user (name TEXT, email TEXT NOT NULL UNIQUE, hash TEXT, entries INT)')
})

// debugging get request handler -- sends back all current users as a response

app.get('/', (req, res) => {
    db.all('SELECT name, email FROM user;', function (err, rows) {
        res.json(rows)
    })
});

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM user WHERE email = '${email}';`, function (err, row) {
        console.log(row.hash, err);
        if (row) {
            // compare hashed pass with the one sent via sign-in post request for a specific user

            bcrypt.compare(password, row.hash, function (err, result) {
                console.log(result, err)

                if (result) {
                    res.json({
                        name: row.name,
                        email: row.email,
                        entries: row.entries
                    })
                    return;
                } else {
                    res.status(400).json('error logging in: incorrect password')

                }
            })
        } else {

            res.status(400).json('error logging in: could not find user')
        }
    })
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    // put the password sent in the request body through several rounds of salting using bcrypt's
    // hash function

    bcrypt.hash(password, bcrypt.genSaltSync(2), null, function (err, hash) {
        console.log(err)
        if (err)
            res.status(400).json('error hashing user')
        else {
            // if good response, create a new row in user table with name, email, hashed pass, and entries set to 0 initially

            db.run(`INSERT INTO user VALUES ('${name}', '${email}', '${hash}', 0);`, function (err) {
                console.log(err)
                if (!err) {
                    res.json({ success: true })
                } else {
                    res.status(400).json('error registering user')

                }
            });
        }
    })
});

app.put('/image', (req, res) => {
    const { email } = req.body;
    db.serialize(() => {
        db.run(`UPDATE user SET entries = entries + 1 WHERE email = '${email}';`);
        db.get(`SELECT * FROM (SELECT *, ROW_NUMBER() OVER(ORDER BY entries DESC) rank FROM user) WHERE email = '${email}';`, function(err, result) {
            console.log("image: ", err, result)
            if (err) {
                res.status(400).json('error updating rank');
            } else {
                res.json(result)
            }
        })

    })
})

app.listen(3000)