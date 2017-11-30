const request = require('request-promise-native');

const BAD_REQUEST_MESSAGE: string = 'Please check the syntax of your message.';
const INTERNAL_ERROR_MESSAGE: string = `We've encountered an internal error. Please reach out to @allen and describe what you were doing.`;
const ADMIN_PASSWORD: string = 'bitcampsux';
const BAD_ADMIN_REQUEST_MESSAGE: string = 'Stop trying to mess with Lifeguard!';
const NOT_ENOUGH_ARGUMENTS_MESSAGE: string = 'The command you entered requires more arguments.';


/**
 * Send an error response message. Note that this actually sends a 200, but we
 * want to send a more descriptive error message because otherwise the message
 * we want to send doesn't go through to the original requester.
 *
 * @param res Express.js Response object
 * @param message Detailed text we want to send.
 * @param delayed Should this be a delayed response?
 */
const sendErrorResponse = (res: any, message: string, delayed: boolean=false, responseUrl: string=''): any => {
	if (delayed) {
		return sendDelayedMessage(responseUrl, message);
	} else {
		return res.send({text: `Error in your request: ${message} Type \`/lifeguard help\` for assistance.`});
	}
};

/**
 * Send a delayed message to the Slack caller. Use when you've already responded
 * with a 200 to the original request, but need more time for post-processing.
 */
const sendDelayedMessage = (responseUrl: string, text: string): void => {
	const options = {
		method: 'POST',
		uri: responseUrl,
		body: {
			text,
		},
		json: true,
	};

	request(options);
}

module.exports = {
	sendDelayedMessage,
	sendErrorResponse,
	BAD_REQUEST_MESSAGE,
	INTERNAL_ERROR_MESSAGE,
	ADMIN_PASSWORD,
	BAD_ADMIN_REQUEST_MESSAGE,
	NOT_ENOUGH_ARGUMENTS_MESSAGE,
};