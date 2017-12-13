const Mentor = require('../models/Mentor');

function addMentor(id: string, initialSkill: string): Promise<Object> {
	const newMentor = new Mentor({slackId: id, skills: [initialSkill]});
	return newMentor.save();
}

function setMentorAsBusy(id: string): Promise<Object> {
	return Mentor.findOneAndUpdate({ slackId: id }, { $set: { busy: true } }, { new: true }).exec();
}

function setMentorAsAvailable(id: string): Promise<Object> {
	return Mentor.findOneAndUpdate({ slackId: id }, { $set: { busy: false } }, { new: true }).exec();
}

async function addSkillForMentor(id: string, skill: string): Promise<void> {
	const mentor = await Mentor.findOne({slackId: id}).exec();
	if (mentor == null) {
		throw new Error('Mentor does not exist!');
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

function getBusyMentors(): Promise<Object> {
	return Mentor.find().where('busy').equals(true);
}

module.exports = {
	addMentor,
	addSkillForMentor,
	getBusyMentors,
	removeSkillForMentor,
	setMentorAsAvailable,
	setMentorAsBusy,
};
