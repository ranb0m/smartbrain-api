const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')
const app = express();

app.use(express.json());
app.use(cors())

db.serialize(() => {
    db.run('CREATE TABLE user (name TEXT, email TEXT NOT NULL UNIQUE, hash TEXT, entries INT)')
})



app.get('/', (req, res) => {
    db.all('SELECT name, email FROM user;', function (err, rows) {
        res.json(rows)
    })
});

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    let success = false;
    db.get(`SELECT * FROM user WHERE email = '${email}';`, function (err, row) {
        console.log(row.hash, err);
        if (row) {
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
                    res.status(400).json('error logging in')

                }
            })
        } else {

            res.status(400).json('error logging in')
        }
    })
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    bcrypt.hash(password, bcrypt.genSaltSync(2), null, function (err, hash) {
        console.log(err)
        if (err)
            res.status(400).json('error hashing user')
        else {

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

app.get('/profile/:email', (req, res) => {
    const { email } = req.params;

    db.get("SELECT * FROM user WHERE email = '(?)'", [email], function (err, row) {
        if (row) {
            res.json(row)
        }
    })
    res.status(400).json({ error: 'womp womp' })
})

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