import type {UserResponse, GroupResponse} from './slack_client_responses.flow';

const LifeguardPool = require('./LifeguardPool');
const {SlackClient} = require('./SlackClient');
const {sendDelayedMessage,
    sendErrorResponse,
    NOT_ENOUGH_ARGUMENTS_MESSAGE,
    ADMIN_PASSWORD, BAD_ADMIN_REQUEST_MESSAGE, BAD_REQUEST_MESSAGE} = require('./util');

const lifeguardPools: Map<string, LifeguardPool> = new Map();

const HELP_TEXT: string = "welcome to Lifeguard! Lifeguard is Bitcamp 2018's \
flagship Slack mentorship system. It's designed to ease communication between aspiring mentors \
and hackers drowning too desperately in their tears from their code. \n\n \
List of available commands:\n\n \
\`/lifeguard help\`: Displays this help message.\n\n \
\`/lifeguard list\`: Displays all skills that mentors have tagged themselves with.\n\n \
\`/lifeguard lifejacket [skill] [question]\`: Finds an available mentor tagged with \`[skill]\` \
and creates a private conversation between you and the mentor. \n\n \
*Mentor commands*: \n\n \
\`/lifeguard available\`: Set your status as available; also, when you are done helping out \
a hacker, use this to mark that you are available to help another hacker. \n\n \
\`/lifeguard away\`: Set your status to away; when you are away, you will not be requested for help. \n\n \
\`/lifeguard whoami\`: List skills that you are currently mentoring. \n\n \
Want to add yourself as a mentor? Questions about this Slack app? Please direct message @allen.";

const processLifeguardCommand = async (client: SlackClient, res: any, teamId: string,
                                       userId: string, responseUrl: string,
                                       textTokens: ?Array<string>): Promise<void> => {
    function getFirstName(user: UserResponse): string {
        const realName: string = user.user.real_name;
        const tokenized: Array<string> = realName.split(/\s+/);
        return tokenized.length === 0 ? '' : tokenized[0];
    }

    const user: UserResponse = await client.getUserInfo(userId);
    const firstName: string = getFirstName(user);

    if (textTokens == null || textTokens.length === 0 || textTokens[0] === 'help') {
        const helpText = `Hi ${firstName}, ${HELP_TEXT}`;
        return res.json({text: helpText});
    }

    let lifeguardPool: ?LifeguardPool = getLifeguardPool(teamId);
    if (lifeguardPool == null) {
        lifeguardPool = new LifeguardPool();
    }

    if (!(textTokens[0] === 'list' ||
            textTokens[0] === 'admin' ||
            textTokens[0] === 'lifejacket' ||
            textTokens[0] === 'available' ||
		    textTokens[0] === 'away' ||
		    textTokens[0] === 'whoami')) {
        return sendErrorResponse(res, BAD_REQUEST_MESSAGE);
    }

	sendRequestAcknowledgedResponse(res, firstName);

	if (textTokens[0] === 'list') {
        let skills: Array<string> = lifeguardPool.getAllSkills();
        skills.sort();
        skills = skills.map((s) => '`' + s + '`'); // can't do string interpolation here...

        if (skills.length > 0) {
            sendDelayedMessage(responseUrl, `The skills we currently have include: ${skills.join(', ')}`);
        } else {
            sendDelayedMessage(responseUrl, 'There are currently no skills available!');
        }
    } else if (textTokens[0] === 'admin') {
        if (textTokens.length < 3 || textTokens[1] !== ADMIN_PASSWORD) {
            return sendErrorResponse(res, BAD_ADMIN_REQUEST_MESSAGE, true, responseUrl);
        }

        if (textTokens[2] === 'add') {
            if (textTokens.length < 5) {
                return sendErrorResponse(res, NOT_ENOUGH_ARGUMENTS_MESSAGE, true, responseUrl);
            }

            const userId: string = textTokens[3];
            const skill: string = textTokens[4];

            lifeguardPool.addMentor(userId, skill);
            sendDelayedMessage(responseUrl, `Successfully added id ${userId} as a mentor for ${skill}!`);
        } else {
            return sendErrorResponse(res, BAD_ADMIN_REQUEST_MESSAGE, true, responseUrl);
        }
    } else if (textTokens[0] === 'lifejacket') {
        if (textTokens.length < 3) {
            return sendErrorResponse(res, NOT_ENOUGH_ARGUMENTS_MESSAGE, true, responseUrl);
        }

        const skill: string = textTokens[1];
        const question: string = textTokens.splice(2).join(' ');

        let mentorId: ?string;
        try {
            mentorId = lifeguardPool.findMentor(skill);
        } catch (e) {
            if (e.message === 'The skill requested does not exist!') {
                return sendErrorResponse(res, `There are no mentors to help with your requested skill: \`${skill}\``, true, responseUrl);
            }
        }

        if (mentorId == null) {
            sendDelayedMessage(responseUrl, 'Sorry, all of the mentors for that skill are currently busy! Try again later.');
        } else {
            const mentorInfo: UserResponse = await client.getUserInfo(mentorId)
            const mentorFirstName: string = getFirstName(mentorInfo);

            const newChannelName = getChannelName(userId, skill);
            const group: GroupResponse = await client.createChannel(newChannelName);
            const newChannelId: string = group.group.id;

			const inviteMentorPromise = client.inviteUserToChannel(newChannelId, mentorId);
			const inviteUserPromise = client.inviteUserToChannel(newChannelId, userId);
	        const postMessagePromise = client.postMessage(newChannelId, `Hi ${firstName} \
and ${mentorFirstName}!`);
	        const postMessagePromise2 = client.postMessage(newChannelId, `${mentorFirstName}, here is \
${firstName}'s question: *${question}*. After you finish helping ${firstName}, please type \
\`/lifeguard available\` to mark yourself as available for helping out your next hacker!`);

	        await Promise.all([inviteMentorPromise, inviteUserPromise, postMessagePromise, postMessagePromise2]);
			await client.leaveChannel(newChannelId);

            sendDelayedMessage(responseUrl, `Found a new mentor: \`${mentorInfo.user.name}\`. \
You should have been added to a new private channel called \`${newChannelName}\` to \
communicate with your mentor.`);
        }
    } else if (textTokens[0] === 'available') {
        const wasABusyMentor: boolean = lifeguardPool.finishMentoring(userId);

        if (wasABusyMentor) {
	        sendDelayedMessage(responseUrl, `You have been released! You are now available to take on more tasks.`);
        } else {
            sendDelayedMessage(responseUrl, 'Your status is not available!');
        }
    } else if (textTokens[0] === 'away') {
	    const success: boolean = lifeguardPool.setBusyMentor(userId);

	    if (success) {
	        sendDelayedMessage(responseUrl, 'Your status has been set to away!');
        } else {
	        sendDelayedMessage(responseUrl, 'Your status is already set to away/busy!');
        }
    } else if (textTokens[0] === 'whoami') {
        let skills: Array<string> = lifeguardPool.getSkillsForMentor(userId);
        skills.sort();
		skills = skills.map((s) => '`' + s + '`'); // can't do string interpolation here...

		if (skills.length > 0) {
            sendDelayedMessage(responseUrl, `You are currently a mentor for ${skills.join(', ')}`);
        } else {
            sendDelayedMessage(responseUrl, 'You are not currently a mentor for any skills!');
        }
    }

    setLifeguardPool(teamId, lifeguardPool);
};

function getChannelName(id: string, skill: string): string {
    const randomString = Math.random().toString(36).substring(0, 6);
    return `${skill}-${id.substring(0, 3)}-${randomString}`;
}

function sendRequestAcknowledgedResponse(res: any, firstName: string): any {
    return res.json({text: `Hi ${firstName}, we've received your Lifeguard request. Stay afloat!`});
}

function getLifeguardPool(teamId: string): ?LifeguardPool {
    return lifeguardPools.get(teamId);
}

function setLifeguardPool(teamId: string, pool: LifeguardPool): void {
    lifeguardPools.set(teamId, pool);
}

module.exports = {
    processLifeguardCommand,
};
