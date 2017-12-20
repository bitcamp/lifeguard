// @flow

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skillSchema = new Schema({
	skill: {
		type: String,
		index: true,
		unique: true,
		required: true,
	},
	mentors: [{type: String}],
});

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
