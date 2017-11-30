# Lifeguard
Lifeguard is a slack mentorship app for easy collaboration between hackers and mentors. Written by Allen Cheng, intended for use during the Bitcamp 2018 hackathon. This is the server-side portion of the app that serves all hacker and mentor requests.

# Technologies
We'd love for you to contribute! Lifeguard makes use of Node.js with Babel ES2017, and uses [Flow](https://flow.org/en/) for static type checking.

# Requirements and Installation
For both development and deployment, run `npm install` to install the required `node_modules`, then just run `npm run start` to start the server.

Note that for any functionality to actually work, you must provide a Slack API OAuth access token that is provided to you when you register your app with Slack. This token should begin with `xoxp-`. This token should be placed in an `.env` file in the root directory of the application as an environment variable with the key `SLACK_API_TOKEN`. This `.env` file can also contain a port to launch the server on, although this is not explicitly required and will default to 5000 if not specified.

For example:
```
SLACK_API_TOKEN=xoxp-1234567890-123456789012-123456789012-a12bc345d67890e12345678f9012g3h3
PORT=3000
```

The Slack app must also request the following permissions from the workplace installer, after creating the app under `OAuth & Permissions > Scopes`:
- `chat:write:user`
- `groups:write`
- `users.profile:read`
- `users:read`
