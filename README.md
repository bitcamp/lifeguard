# Lifeguard
Lifeguard is a slack mentorship app for easy collaboration between hackers and
mentors. Written by Allen Cheng, intended for use during the Bitcamp 2018
hackathon. This is the server-side portion of the app that serves all hacker and
mentor requests.

# Technologies
We'd love for you to contribute! Lifeguard makes use of Node.js with Babel
ES2017, and uses [Flow](https://flow.org/en/) for static type checking.
Lifeguard also uses MongoDB to persist mentorship data across sessions and
crashes.

Just run `npm run flow` after installing `node_modules` to start a Flow server
and check for type errors throughout the repository.

# Requirements and Installation
For both development and deployment, run `npm install` to install the required
`node_modules`, then just run `npm run start` to start the server.

### Environment
In the root directory, provide a `.env` file for configurable data.

`SLACK_API_TOKEN`: Note that for any Slack functionality to work, you must
provide a Slack API OAuth access token that is provided to you when you register
your app with Slack.

`MONGODB`: The MongoDB Connection String URI to connect the database to. See
[this](https://docs.mongodb.com/manual/reference/connection-string/) for
formatting help.

`PORT`: A specific port to launch the server on, although this is not explicitly
required and will default to 5000 if not specified.

For example:
```
MONGODB=mongodb://localhost/lifeguard
SLACK_API_TOKEN=xoxp-1234567890-123456789012-123456789012-a12bc345d67890e12345678f9012g3h3
PORT=3000
```

# Deployment
The Slack app must also request the following permissions from the workplace installer, after creating the app under `OAuth & Permissions > Scopes`:
- `chat:write:user`
- `groups:write`
- `users.profile:read`
- `users:read`
