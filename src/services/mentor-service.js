// @flow

const Mentor = require('../models/Mentor');

function addMentor(id: string, initialSkill: string): Promise<Object> {
	const newMentor = new Mentor({slackId: id, skills: [initialSkill]});
	return newMentor.save();
}

async function getAllMentors(): Promise<Array<Object>> {
	const mentors = await Mentor.find().exec();
	return mentors.map(mentor => {
		return {
			id: mentor.slackId,
			busy: mentor.busy,
			skills: mentor.skills,
		};
	});
}

function setMentorAsBusy(id: string): Promise<Object> {
	return Mentor.findOneAndUpdate({ slackId: id }, { $set: { busy: true } }, { new: true }).exec();
}

function setMentorAsAvailable(id: string): Promise<Object> {
	return Mentor.findOneAndUpdate({ slackId: id }, { $set: { busy: false } }, { new: true }).exec();
}

async function addSkillForMentor(id: string, skill: string): Promise<void> {
	let mentor = await Mentor.findOne({slackId: id}).exec();
	if (mentor == null) {
		mentor = new Mentor({slackId: id, skills: []});
	}

	if (!mentor.skills.includes(skill)) {
		mentor.skills.push(skill);
		return mentor.save();
	} else {
		return Promise.resolve();
	}
}

async function removeSkillForMentor(id: string, skill: string): Promise<void> {
	const mentor = await Mentor.findOne({slackId: id}).exec();
	if (mentor == null) {
		throw new Error('Mentor does not exist!');
	}

	const idx = mentor.skills.indexOf(skill);
	if (idx === -1) {
		return Promise.resolve();
	}

	mentor.skills.splice(idx, 1);
	return mentor.skills.length === 0 ? Mentor.findOneAndRemove({slackId: id}).exec() : mentor.save();
}

module.exports = {
	addMentor,
	addSkillForMentor,
	getAllMentors,
	removeSkillForMentor,
	setMentorAsAvailable,
	setMentorAsBusy,
};
