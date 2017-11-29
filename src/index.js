// @flow
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {getClient, SlackClient} = require('./SlackClient');
const {processLifeguardCommand} = require('./poolHandler');
const {sendErrorResponse, INTERNAL_ERROR_MESSAGE, BAD_REQUEST_MESSAGE} = require('./util');

const token: string = process.env.SLACK_API_TOKEN || '';
const port: string = process.env.PORT || "5000";
const client: SlackClient = getClient(token);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/', (req, res): any => {
    return res.status(200).send('');
});

app.post('/lifeguard', (req, res): any => {
    const params = req.body;
    if (params == null || typeof params !== 'object') {
        return sendErrorResponse(res, BAD_REQUEST_MESSAGE);
    }

    const teamId: ?string = params.team_id;
    const userId: ?string = params.user_id;
    const userName: ?string = params.user_name;
    const responseUrl: ?string = params.response_url;

    if (teamId == null || userId == null || userName == null || responseUrl == null) {
        return sendErrorResponse(res, INTERNAL_ERROR_MESSAGE);
    }

    const text: ?string = params.text;
    const textTokens: ?Array<string> = text ? text.split(/\s+/) : null;

    if (textTokens == null || textTokens.length === 0) {
        return sendErrorResponse(res, BAD_REQUEST_MESSAGE);
    }

    processLifeguardCommand(client, res,teamId, userId, responseUrl, textTokens);
});

app.listen(port, () => console.log(`Listening on ${port}`));
