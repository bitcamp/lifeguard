// @flow
const express = require('express');
const app = express();

const token = process.env.SLACK_API_TOKEN || '';
const port = process.env.PORT || 5000;

const client = require('@slack/client');

console.log(client);


app.get('/', (req, res) => {
	res.send('gg');
});

app.listen(port, () => console.log(`Listening on ${port}`));
