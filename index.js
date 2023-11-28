const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


app.get('/', async (req, res) => {
    res.send('<h1>Realton server is running</h1>')
})

app.listen(port, () => {
    console.log(`Realton app listening on port ${port}`)
})