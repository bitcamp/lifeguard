// @flow

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mentorSchema = new Schema({
	slackId: {
		type: String,
		index: true,
		unique: true,
		required: true,
	},
	busy: {
		type: Boolean,
		default: false,
	},
	skills: [{type: String}],
});

const Mentor = mongoose.model('Mentor', mentorSchema);

module.exports = Mentor;
