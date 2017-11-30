// @flow

const client = require('@slack/client');
const WebClient = client.WebClient;

import type {GroupResponse, UserResponse} from './slack_client_responses.flow';

const tokensToClients: Map<string, SlackClient> = new Map();

class SlackClient {
    client: WebClient;

    constructor(token: string): void {
        this.client = new WebClient(token);
    }

    createChannel(channelName: string): Promise<GroupResponse> {
        return new Promise((resolve) => {
            this.client.groups.create(channelName, (err, res) => {
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
            this.client.users.info(id, (err, res) => {
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
            this.client.chat.postMessage(channel, message, (err, res) => {
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
            this.client.channels.list({}, (err, res) => {
                if (err) {
                    throw err;
                } else {
                    resolve(res);
                }
            });
        });
    }

    getUserIdGivenName(name: string): Promise<string> {
        return new Promise((resolve) => {
            this.client.users.list({limit: 999}, (err, res) => {
                if (err) {
                    throw err;
                }

                for (const user of res.members) {
                    if (user.name === name) {
                        resolve(user.id);
                    }
                }

                throw new Error('No user found with that name!');
            });
        });
    }

    inviteUserToChannel(channel: string, userId: string): Promise<GroupResponse> {
    	return new Promise((resolve) => {
    		this.client.groups.invite(channel, userId, (err, res) => {
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
		    this.client.groups.leave(channel, (err) => {
			    if (err) {
				    throw err;
			    } else {
				    resolve();
			    }
		    });
	    });
    }

    kickUserFromChannel(channel: string, userId: string): Promise<void> {
    	return new Promise((resolve) => {
    		this.client.groups.kick(channel, userId, (err, res) => {
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
