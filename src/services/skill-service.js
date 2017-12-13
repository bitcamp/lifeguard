const Skill = require('../models/Skill');

function addSkill(skill: string, initialMentor: string): Promise<Object> {
	const newSkill = new Skill({skill, mentors: [initialMentor]});
	return newSkill.save();
}

async function getAllSkills(): Promise<Array<Object>> {
	const skills = await Skill.find().exec();
	return skills.map(skill => {
		return {
			skill: skill.skill,
			mentors: skills.mentors,
		};
	});
}

async function addMentorForSkill(skill: string, mentor: string): Promise<void> {
	let skillDocument = await Skill.findOne({skill}).exec();
	if (skillDocument == null) {
		skillDocument = new Skill({skill, mentors: []});
	}

	if (!skillDocument.mentors.includes(mentor)) {
		skillDocument.mentors.push(mentor);
		return skillDocument.save();
	} else {
		return Promise.resolve();
	}
}

async function removeMentorForSkill(skill: string, mentor: string): Promise<void> {
	const skillDocument = await Skill.findOne({skill}).exec();
	if (skillDocument == null) {
		throw new Error('Skill does not exist!');
	}

	const idx = skillDocument.mentors.indexOf(mentor);
	if (idx === -1) {
		return Promise.resolve();
	}

	skillDocument.mentors.splice(idx, 1);
	return skillDocument.mentors.length === 0 ? Skill.findOneAndRemove({skill}).exec() : skillDocument.save();
}

module.exports = {
	addMentorForSkill,
	addSkill,
	getAllSkills,
	removeMentorForSkill,
};
