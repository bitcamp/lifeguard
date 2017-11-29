// @flow

// haha, get it? pool?
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
        this._skillsToMentors = new Map();
        this._skillsToMentorsQueue = new Map();
        this._mentorsToSkills = new Map();
        this._busyMentors = new Set();
    }

    getAllSkills(): Array<string> {
        return Array.from(this._skillsToMentors.keys());
    }

    addMentor(userId: string, skill: string): void {
        // Add skill to mentors map
        if (!this._mentorsToSkills.has(userId)) {
            this._mentorsToSkills.set(userId, [skill]);
        } else {
            const skills: ?Array<string> = this._mentorsToSkills.get(userId);
            if (skills != null) {
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

            // dequeue the first mentor
            if (!queue) {
                return null;
            }

            const mentor = queue.shift();

            // this mentor is now busy
            this._busyMentors.add(mentor);

            // remove this mentor from all the other queues
            const skills: ?Array<string> = this._mentorsToSkills.get(mentor);
            if (skills) {
                for (const sk of skills) {
                    if (sk === skill) {
                        continue;
                    }

                    const currSkillQueue: ?Array<string> = this._skillsToMentorsQueue.get(sk);
                    if (currSkillQueue) {
                        const idx = currSkillQueue.indexOf(mentor);
                        if (idx !== -1) {
                            currSkillQueue.splice(idx, 1);
                            this._skillsToMentorsQueue.set(sk, currSkillQueue);
                        }
                    }
                }
            }

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

    finishMentoring(userId: string): boolean {
        if (!this._busyMentors.has(userId)) {
            return false;
        }

        // Mark as available again
        this._busyMentors.delete(userId);

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
