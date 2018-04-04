// @flow

// Set up dotenv configuration (from local .env file)
require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

// Use native ES6 Promises
mongoose.Promise = global.Promise;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const {getClient, SlackClient} = require('./SlackClient');
const {processLifeguardCommand} = require('./poolHandler');
const {sendErrorResponse, INTERNAL_ERROR_MESSAGE, BAD_REQUEST_MESSAGE} = require('./util');

const token: string = process.env.SLACK_API_TOKEN || '';
const port: string = process.env.PORT || '5000';
const client: SlackClient = getClient(token);
const mongoDbUrl: string = process.env.MONGODB || '';

mongoose.connect(mongoDbUrl, {
	useMongoClient: true,
	connectTimeoutMS: 3000,
});
mongoose.connection.on('error', () => {
	console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
	process.exit(1);
});

app.get('/', (req, res): any => {
	console.log('App is working!');
	res.send('App is working!');
});


app.post('/lifeguard', (req, res): any => {
    const params = req.body;
    if (params == null || typeof params !== 'object') {
        return sendErrorResponse(res, BAD_REQUEST_MESSAGE);
    }

    // Important parameters that we need, sent with every Slack slash command request
    const teamId: ?string = params.team_id;
    const userId: ?string = params.user_id;
    const userName: ?string = params.user_name;
    const responseUrl: ?string = params.response_url;
    if (teamId == null || userId == null || userName == null || responseUrl == null) {
        return sendErrorResponse(res, INTERNAL_ERROR_MESSAGE);
    }

    const text: ?string = params.text;
    const textTokens: ?Array<string> = text ? text.split(/\s+/) : null;

    processLifeguardCommand(client, res,teamId, userId, responseUrl, textTokens);
});

app.listen(port, () => console.log(`Listening on ${port}`));
