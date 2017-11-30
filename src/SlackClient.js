// @flow
import type {GroupResponse, UserResponse} from './slack_client_responses.flow';

const client = require('@slack/client');
const WebClient = client.WebClient;

const tokensToClients: Map<string, SlackClient> = new Map();

/**
 * The client that interfaces with the Slack Web API methods.
 *
 * Some of the responses from the Slack API are Flow-typed, but not all of them.
 * For full documentation on the Slack API method and the format of its
 * JSON response, please see https://api.slack.com/methods
 *
 * The method you need to look for is what comes after `this.client`. For example,
 * `this.client.groups.create` => `groups.create` method.
 */
class SlackClient {
    _client: WebClient;

    constructor(token: string): void {
        this._client = new WebClient(token);
    }

    createChannel(channelName: string): Promise<GroupResponse> {
        return new Promise((resolve) => {
            this._client.groups.create(channelName, (err, res) => {
                if (err) {
                    throw err;
                } else {
                    resolve(res);
                }
            });
        });
    }

    getUserInfo(id: string): Promise<UserResponse> {
        return new Promise((resolve) => {
            this._client.users.info(id, (err, res) => {
                if (err) {
                    throw err;
                } else {
                    resolve(res);
                }
            });
        });
    }

    postMessage(channel: string, message: string): Promise<Object> {
        return new Promise((resolve) => {
            this._client.chat.postMessage(channel, message, (err, res) => {
                if (err) {
                    throw err;
                } else {
                    resolve(res);
                }
            });
        });
    }

    listChannels(): Promise<Object> {
        return new Promise((resolve) => {
            this._client.channels.list({}, (err, res) => {
                if (err) {
                    throw err;
                } else {
                    resolve(res);
                }
            });
        });
    }

    inviteUserToChannel(channel: string, userId: string): Promise<GroupResponse> {
    	return new Promise((resolve) => {
    		this._client.groups.invite(channel, userId, (err, res) => {
    			if (err) {
    				throw err;
			    } else {
    				resolve(res);
			    }
		    });
	    });
    }

    leaveChannel(channel: string): Promise<void> {
	    return new Promise((resolve) => {
		    this._client.groups.leave(channel, (err) => {
			    if (err) {
				    throw err;
			    } else {
				    resolve();
			    }
		    });
	    });
    }
}

const getClient = (token: string): SlackClient => {
    if (tokensToClients.has(token)) {
        const client = tokensToClients.get(token);
        if (client == null) {
            throw new Error('Slack client is null!');
        }

        return client;
    } else {
        const client = new SlackClient(token);
        tokensToClients.set(token, client);
        return client;
    }
};

module.exports = {
    getClient,
    SlackClient,
};
