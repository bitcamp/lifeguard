// @flow

const mentorService = require('./services/mentor-service');
const skillService = require('./services/skill-service');

/**
 * This class manages the mentor queue and oversees all mentor assignments and
 * keeps track of specialized skills by mentors.
 *
 * haha, get it? pool?
 */
class LifeguardPool {
    // maps skill tags to user ids of mentors
    _skillsToMentors: Map<string, Array<string>>;

    // maps skill tags to current queue of mentor user ids
    _skillsToMentorsQueue: Map<string, Array<string>>;

    // maps mentor user ids to their skills
    _mentorsToSkills: Map<string, Array<string>>;

    // busy mentors
    _busyMentors: Set<string>;

    constructor(): void {
        this._populateFields();
        this._enableLogging();
    }

    async _populateFields(): Promise<void> {
	    this._skillsToMentors = new Map();
	    this._skillsToMentorsQueue = new Map();
	    this._mentorsToSkills = new Map();
	    this._busyMentors = new Set();

        const mentors = await mentorService.getAllMentors();
        const skills = await skillService.getAllSkills();

        for (const mentor of mentors) {
            if (mentor.busy) {
                this._busyMentors.add(mentor.id);
            }

            this._mentorsToSkills.set(mentor.id, mentor.skills);
        }

        for (const skill of skills) {
            this._skillsToMentors.set(skill.skill, skill.mentors);
        }
    }

    _enableLogging(): void {
	    setInterval(() => {
		    console.log('=============================================');
		    console.log(this._skillsToMentors);
		    console.log(this._skillsToMentorsQueue);
		    console.log(this._mentorsToSkills);
		    console.log(this._busyMentors);
	    }, 30000);
    }

    /**
     * Return an array of all the skills that mentors are tagged with.
     */
    getAllSkills(): Array<string> {
        return Array.from(this._skillsToMentors.keys());
    }

    /**
     * Add a knowledgeable skill to the specified mentor.
     */
    addMentor(userId: string, skill: string): void {
        // mark mentor as available again if busy
        this.finishMentoring(userId);

        mentorService.addSkillForMentor(userId, skill);
        skillService.addMentorForSkill(skill, userId);

        // Add skill to mentors map
        if (!this._mentorsToSkills.has(userId)) {
            this._mentorsToSkills.set(userId, [skill]);
        } else {
            const skills: ?Array<string> = this._mentorsToSkills.get(userId);
            if (skills != null) {
                if (skills.indexOf(skill) !== -1) {
                    // This mentor already knows this skill, don't do anything.
                    return;
                }

                skills.push(skill);
                this._mentorsToSkills.set(userId, skills);
            }
        }

        // Add mentor to skills map
        if (!this._skillsToMentors.has(skill)) {
            this._skillsToMentors.set(skill, [userId]);
            this._skillsToMentorsQueue.set(skill, [userId]);
        } else {
            const mentors: ?Array<string> = this._skillsToMentors.get(skill);
            const mentorsQueue: ?Array<string> = this._skillsToMentorsQueue.get(skill);
            if (mentors != null && mentorsQueue != null) {
                mentors.push(userId);
                mentorsQueue.push(userId);

                this._skillsToMentors.set(skill, mentors);
                this._skillsToMentorsQueue.set(skill, mentorsQueue);
            }
        }
    }

    /**
     * Find a mentor at the front of the queue for a specified skill.
     * Mark the mentor with a 'busy' status.
     *
     * Throw an Error if no mentor knows that skill.
     *
     * Return the mentor that was selected, or null if no mentor is available
     * to help out with that skill.
     */
    findMentor(skill: string): ?string {
        if (!this._skillsToMentorsQueue.has(skill)) {
            throw new Error('The skill requested does not exist!');
        }

        const allMentors: ?Array<string> = this._skillsToMentors.get(skill);
        let queue: ?Array<string> = this._skillsToMentorsQueue.get(skill);

        if (queue != null && allMentors != null) {
            if (queue.length === 0) {
                // If nobody left in the queue, reset the queue...
                queue = allMentors.slice();
                shuffleArray(queue);

                // ...and remove all busy mentors from it
                queue = this._removeBusyMentors(queue);
            }

            if (!queue) {
                return null;
            }

            // dequeue the first mentor
            const mentor = queue.shift();

            // mark mentor as busy
            this.setBusyMentor(mentor);

            // update with new queue
            this._skillsToMentorsQueue.set(skill, queue);

            return mentor;
        } else {
            throw new Error('Something has gone wrong with the lifeguard pool');
        }
    }

    _removeBusyMentors(queue: Array<string>): Array<string> {
        const ret: Array<string> = [];
        for (const mentor of queue) {
            if (!this._busyMentors.has(mentor)) {
                ret.push(mentor);
            }
        }

        return ret;
    }

    /**
     * Mark a mentor with a busy status.
     * Note that it is NOT an error for a user without any mentor skills to be "busy."
     *
     * Return true is the mentor was successfully marked as busy.
     * Return false if the mentor is already marked as busy.
     */
    setBusyMentor(userId: string): boolean {
        if (this._busyMentors.has(userId)) {
            return false;
        }

        // this mentor is now busy
        this._busyMentors.add(userId);
        mentorService.setMentorAsBusy(userId);

        // remove this mentor from all the other queues
        const skills: ?Array<string> = this._mentorsToSkills.get(userId);
        if (skills) {
            for (const sk of skills) {
                const currSkillQueue: ?Array<string> = this._skillsToMentorsQueue.get(sk);
                if (currSkillQueue) {
                    const idx = currSkillQueue.indexOf(userId);
                    if (idx !== -1) {
                        currSkillQueue.splice(idx, 1);
                        this._skillsToMentorsQueue.set(sk, currSkillQueue);
                    }
                }
            }
        }

        return true;
    }

    /**
     * Mark a mentor with a busy status to be available again.
     *
     * Return true if the mentor was successfully marked as available and
     * back on the queue for more tasks.
     *
     * Return false if the mentor is already available.
     */
    finishMentoring(userId: string): boolean {
        if (!this._busyMentors.has(userId)) {
            return false;
        }

        // Mark as available again
        this._busyMentors.delete(userId);
	    mentorService.setMentorAsAvailable(userId);

        // Place mentor back in queue for all of his skills
        const skills: ?Array<string> = this._mentorsToSkills.get(userId);
        if (skills) {
            for (const skill of skills) {
                const queue: ?Array<string> = this._skillsToMentorsQueue.get(skill);
                if (queue != null) {
                    queue.push(userId);
                    this._skillsToMentorsQueue.set(skill, queue);
                }
            }
        }

        return true;
    }

    /**
     * Return an array of all the skills that a mentor is marked with.
     */
    getSkillsForMentor(userId: string): Array<string> {
        const ret: ?Array<string> = this._mentorsToSkills.get(userId);
        return ret ? ret : [];
    }
}

function shuffleArray(array: Array<any>): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        // $FlowFixMe - Allow swapping in same array
        [array[i], array[j]] = [array[j], array[i]];
    }
}

module.exports = LifeguardPool;
