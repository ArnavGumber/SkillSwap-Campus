const profile = {
	name: "Amrita Sharma",
	studentId: "UIET2026001",
	college: "UIET Chandigarh",
	branch: "ECE",
	year: "1st Year",
	bio: "Building projects, sharing knowledge, and learning something new every day.",
	offers: ["JavaScript", "HTML/CSS", "Python Basics"],
	wants: ["UI/UX Design", "Embedded Systems"],
	interests: ["Startups", "Hackathons", "Open Source"]
};

const students = [
	{
		id: "deekshita-goyal", name: "Deekshita Goyal", branch: "CSE", year: "1st Year", initials: "PV", tone: "tone-lilac",
		teaches: ["UI/UX Design", "Figma"], wants: ["JavaScript"], interests: ["Design", "Web Development"],
		bio: "I like turning rough ideas into friendly, thoughtful interfaces. Always up for a small project or a design jam."
	},
	{
		id: "arnav", name: "Arnav", branch: "IT", year: "2nd Year", initials: "AS", tone: "tone-teal",
		teaches: ["Python", "Data Structures"], wants: ["Embedded Systems"], interests: ["Robotics", "Hackathons"],
		bio: "Curious about the bridge between software and the physical world. Building with sensors and learning by shipping."
	},
	{
		id: "isha-goyal", name: "Isha Goyal", branch: "ECE", year: "1st Year", initials: "RM", tone: "tone-coral",
		teaches: ["Canva", "Presentation Design"], wants: ["HTML/CSS"], interests: ["Startups", "Content Creation"],
		bio: "I enjoy making ideas clear and presentable. Looking for a patient web-development learning buddy."
	},
	{
		id: "deevanshi", name: "Deevanshi", branch: "CSE", year: "2nd Year", initials: "KB", tone: "tone-blue",
		teaches: ["CAD", "3D Design"], wants: ["Python"], interests: ["Product Design", "Robotics"],
		bio: "Mechanical engineering student exploring product design, rapid prototypes, and practical Python projects."
	}
];

const opportunityDetails = {
	hackathon: {
		title: "Looking for a Hackathon Teammate", eyebrow: "TEAM UP · 2 DAYS LEFT", art: "01", tone: "art-hack",
		description: "A few students are bringing ideas together for the upcoming campus hackathon. The team is open to a frontend builder, a visual thinker, or anyone who likes turning a rough concept into a useful demo.",
		skills: ["JavaScript", "Ideas", "Prototyping"]
	},
	frontend: {
		title: "Frontend Study Group", eyebrow: "LEARN TOGETHER · WEEKLY", art: "02", tone: "art-study",
		description: "A relaxed weekly peer session for learning web fundamentals together. Bring one question, share what you know, and leave with a small thing built.",
		skills: ["HTML/CSS", "JavaScript", "Peer learning"]
	},
	project: {
		title: "Campus Project Collaboration", eyebrow: "COLLABORATE · OPEN INVITE", art: "03", tone: "art-project",
		description: "Find a small campus problem worth solving and form a cross-discipline crew. This is a demo opportunity; details and project teams are not connected to a live service yet.",
		skills: ["Prototyping", "Teamwork", "Problem solving"]
	}
};

const skillAliases = new Map([["python basics", "python"]]);
const matchWeights = { complementary: 40, reciprocal: 30, interests: 20 };
const connectedStudents = new Set();
const dialog = document.querySelector("#app-dialog");
const dialogContent = document.querySelector("#dialog-content");
const recommendationGrid = document.querySelector("#recommendation-grid");
const searchInput = document.querySelector("#recommendation-search");
const toastRegion = document.querySelector("#toast-region");
let currentQuery = "";
let toastTimer;

function normalizeSkill(value) {
	const normalized = String(value || "").trim().toLocaleLowerCase();
	return skillAliases.get(normalized) || normalized;
}

function findOverlaps(first, second, normalize = normalizeSkill) {
	const secondValues = new Set((second || []).map(normalize).filter(Boolean));
	return [...new Set((first || []).filter((value) => secondValues.has(normalize(value))))];
}

function rankStudent(student) {
	const complementary = findOverlaps(profile.wants, student.teaches);
	const reciprocal = findOverlaps(profile.offers, student.wants);
	const sharedInterests = findOverlaps(profile.interests, student.interests, (value) => String(value || "").trim().toLocaleLowerCase());
	const availableWeight = Object.values(matchWeights).reduce((total, weight) => total + weight, 0);

	// These provisional weights are experimental and need validation with real student feedback.
	// Collaboration-goal weight is omitted until both sides have sample goals to compare.
	const points = (complementary.length ? matchWeights.complementary : 0)
		+ (reciprocal.length ? matchWeights.reciprocal : 0)
		+ (sharedInterests.length ? matchWeights.interests * Math.min(sharedInterests.length / 2, 1) : 0);
	const score = availableWeight ? Math.round((points / availableWeight) * 100) : 0;
	let reason = "No direct skill or interest overlap yet; explore their profile to see what they are building.";

	if (complementary.length && reciprocal.length) {
		reason = `Exchange ${reciprocal[0]} knowledge for ${complementary[0]} guidance.`;
	} else if (complementary.length) {
		reason = `Learn ${complementary[0]} from someone who enjoys sharing it.`;
	} else if (reciprocal.length) {
		reason = `You can help with ${reciprocal[0]}, which they want to learn.`;
	} else if (sharedInterests.length) {
		reason = `You both enjoy ${sharedInterests.join(" and ")}; a good place to start a conversation.`;
	}

	return { ...student, score, complementary, reciprocal, sharedInterests, reason };
}

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, (character) => ({
		"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
	})[character]);
}

function makeChips(items) {
	if (!items.length) return '<span class="skill-chip">Not listed</span>';
	return items.map((item) => `<span class="skill-chip">${escapeHtml(item)}</span>`).join("");
}

function makeStudentCard(student, index) {
	const connected = connectedStudents.has(student.id);
	return `<article class="match-card" style="animation-delay:${index * 45}ms">
		<div class="match-card-top"><span class="student-avatar ${student.tone}" aria-hidden="true">${escapeHtml(student.initials)}</span><div class="student-heading"><h3>${escapeHtml(student.name)}</h3><p>${escapeHtml(student.branch)} · ${escapeHtml(student.year)}</p></div><span class="match-score" title="Calculated from the sample skill and interest overlaps"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m10 2.5 1.8 5.7 5.7 1.8-5.7 1.8-1.8 5.7-1.8-5.7-5.7-1.8 5.7-1.8L10 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>${student.score}%</span></div>
		<div class="match-meter" aria-label="${student.score}% compatibility"><span style="width:${student.score}%"></span></div>
		<div class="skill-pair"><div class="skill-line teach"><span class="skill-line-label">Can teach</span><span class="skill-chip-list">${makeChips(student.teaches)}</span></div><div class="skill-line"><span class="skill-line-label">Wants to learn</span><span class="skill-chip-list">${makeChips(student.wants)}</span></div></div>
		<p class="match-reason"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m10 2.5 1.8 5.7 5.7 1.8-5.7 1.8-1.8 5.7-1.8-5.7-5.7-1.8 5.7-1.8L10 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg><span>${escapeHtml(student.reason)}</span></p>
		<div class="card-actions"><button type="button" class="view-profile-button" data-action="view-profile" data-student="${student.id}">View Profile</button><button type="button" class="connect-button${connected ? " is-connected" : ""}" data-action="connect" data-student="${student.id}" ${connected ? "aria-pressed=\"true\"" : ""}>${connected ? "<svg viewBox=\"0 0 20 20\" fill=\"none\" aria-hidden=\"true\"><path d=\"m4 10 4 4 8-8\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>Request Sent" : "Connect"}</button></div>
	</article>`;
}

function getRankedStudents() {
	return students.map(rankStudent).sort((first, second) => second.score - first.score || first.name.localeCompare(second.name));
}

function renderRecommendations() {
	const query = currentQuery.trim().toLocaleLowerCase();
	const ranked = getRankedStudents().filter((student) => {
		if (!query) return true;
		const searchable = [student.name, student.branch, student.year, ...student.teaches, ...student.wants, ...student.interests].join(" ").toLocaleLowerCase();
		return searchable.includes(query);
	});
	recommendationGrid.innerHTML = ranked.map(makeStudentCard).join("");
	document.querySelector("#empty-search").hidden = ranked.length > 0;
	recommendationGrid.hidden = ranked.length === 0;
}

function showToast(message) {
	toastRegion.replaceChildren();
	const toast = document.createElement("div");
	toast.className = "toast-message";
	toast.innerHTML = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
	const text = document.createElement("span");
	text.textContent = message;
	toast.append(text);
	toastRegion.append(toast);
	window.clearTimeout(toastTimer);
	toastTimer = window.setTimeout(() => toastRegion.replaceChildren(), 3600);
}

function closeMenus(exceptId) {
	["notification-popover", "user-popover"].forEach((id) => {
		if (id === exceptId) return;
		const popover = document.getElementById(id);
		popover.hidden = true;
		const button = document.querySelector(`[aria-controls="${id}"]`);
		button?.setAttribute("aria-expanded", "false");
	});
}

function setPopover(id) {
	const popover = document.getElementById(id);
	const willOpen = popover.hidden;
	closeMenus(willOpen ? id : undefined);
	popover.hidden = !willOpen;
	document.querySelector(`[aria-controls="${id}"]`).setAttribute("aria-expanded", String(willOpen));
}

function setProfileName(name) {
	document.querySelectorAll("[data-profile-name]").forEach((element) => { element.textContent = name; });
	const firstName = name.trim().split(/\s+/)[0] || "there";
	const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toLocaleUpperCase()).join("") || "S";
	document.querySelectorAll(".avatar-arjun").forEach((avatar) => { avatar.textContent = initials; });
	document.querySelector("[data-profile-first-name]").textContent = firstName;
	document.querySelector("#welcome-title").setAttribute("aria-label", `${document.querySelector("#greeting").textContent}, ${firstName}.`);
}

function syncSkillCount() {
	document.querySelector("#skills-shared-count").textContent = String(profile.offers.length);
}

function dialogShell(eyebrow, title, description = "") {
	return `<div class="dialog-header"><div><p class="dialog-eyebrow">${escapeHtml(eyebrow)}</p><h2 id="dialog-title">${escapeHtml(title)}</h2>${description ? `<p>${escapeHtml(description)}</p>` : ""}</div><button type="button" class="dialog-close" data-action="close-dialog" aria-label="Close dialog"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>`;
}

function openDialog(content, variant = "") {
	closeDrawer();
	closeMenus();
	dialog.classList.toggle("profile-fullscreen", variant === "profile");
	dialogContent.innerHTML = content;
	dialog.showModal();
	dialog.querySelector(".dialog-close")?.focus();
}

function renderMyProfile(editing = false) {
	const initials = profile.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toLocaleUpperCase()).join("") || "S";
	const mainTag = editing ? "form" : "section";
	const mainAttributes = editing
		? 'id="profile-inline-form" class="profile-page-main profile-editing" aria-label="Edit student profile"'
		: 'class="profile-page-main" aria-label="Student profile information"';
	const textField = (field, label, value) => editing
		? `<label class="visually-hidden" for="profile-field-${field}">${label}</label><input class="profile-inline-input" id="profile-field-${field}" name="${field}" value="${escapeHtml(value)}" maxlength="${field === "bio" ? 180 : 60}" aria-label="${label}" required>`
		: escapeHtml(value);
	const bioField = editing
		? `<label class="visually-hidden" for="profile-field-bio">About me</label><textarea class="profile-inline-textarea" id="profile-field-bio" name="bio" rows="3" maxlength="180" aria-label="About me" required>${escapeHtml(profile.bio)}</textarea>`
		: `<p class="profile-about-copy">${escapeHtml(profile.bio)}</p>`;
	const listField = (field, label, items) => editing
		? `<label class="visually-hidden" for="profile-field-${field}">${label}, comma separated</label><textarea class="profile-inline-textarea" id="profile-field-${field}" name="${field}" rows="2" aria-label="${label}, comma separated" placeholder="Add items separated by commas">${escapeHtml(items.join(", "))}</textarea>`
		: tags(items);
	const tags = (items) => items.length
		? items.map((item) => `<span class="profile-view-tag">${escapeHtml(item)}</span>`).join("")
		: '<span class="profile-empty-tag">Not added yet</span>';
	return `<div class="profile-page">
		<header class="profile-page-header"><a class="profile-page-brand" href="dashboard.html"><span class="brand-symbol" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M11.5 20a8.5 8.5 0 0 1 14.4-6.1M28.5 20a8.5 8.5 0 0 1-14.4 6.1M12 20h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="11.5" cy="20" r="4" fill="currentColor"/><circle cx="28.5" cy="20" r="4" fill="currentColor"/></svg></span><span>SkillSwap <small>Campus</small></span></a><span class="profile-page-location">Your profile <span>/</span> Campus identity</span><button type="button" class="dialog-close" data-action="close-dialog" aria-label="Close profile"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></header>
		<${mainTag} ${mainAttributes}>
			<section class="profile-cover"><div class="profile-cover-orbit profile-orbit-a"></div><div class="profile-cover-orbit profile-orbit-b"></div><div class="profile-cover-content"><span class="profile-large-avatar" aria-hidden="true">${escapeHtml(initials)}<span><svg viewBox="0 0 20 20" fill="none"><path d="m4 10 4 4 8-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span><div class="profile-cover-copy"><p class="profile-cover-label">CAMPUS PROFILE <span><i></i> Ready to connect</span></p><h2 id="dialog-title"${editing ? ' class="visually-hidden"' : ""}>${escapeHtml(profile.name)}</h2>${editing ? textField("name", "Your name", profile.name) : ""}<p>${escapeHtml(profile.studentId)} <span>·</span> ${escapeHtml(profile.college)}</p></div>${editing ? `<div class="profile-inline-actions"><button type="button" class="profile-edit-button profile-cancel-button" data-action="cancel-profile-edit">Cancel</button><button type="submit" class="profile-edit-button profile-save-button">Save</button></div>` : `<button type="button" class="profile-edit-button" data-action="start-profile-edit"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m12.9 4.1 3 3M3.8 16.2l3.5-.7L16 6.8a1.8 1.8 0 0 0-2.5-2.5l-8.7 8.7-.9 3.2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Edit</button>`}</div></section>
			<div class="profile-detail-grid">
				<section class="profile-view-card profile-about-card"><div class="profile-card-heading"><span class="profile-card-icon about-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 3.2v.1m0 2.1v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span><div><p>THE PERSON BEHIND THE SKILLS</p><h3>A little about me</h3></div></div>${bioField}</section>
				<section class="profile-view-card profile-campus-card"><div class="profile-card-heading"><span class="profile-card-icon campus-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m2.8 7 7.2-4 7.2 4L10 11 2.8 7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5.5 8.5v4c2.8 2.2 6.2 2.2 9 0v-4M17.2 7v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><p>WHERE I LEARN</p><h3>Campus details</h3></div></div><dl class="profile-campus-list"><div><dt>College</dt><dd>${textField("college", "College", profile.college)}</dd></div><div><dt>Branch</dt><dd>${textField("branch", "Branch", profile.branch)}</dd></div><div><dt>Year</dt><dd>${textField("year", "Year", profile.year)}</dd></div></dl></section>
				<section class="profile-view-card profile-skills-card"><div class="profile-card-heading"><span class="profile-card-icon offered-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6.5 6.5 4 9l2.5 2.5M13.5 13.5 16 11l-2.5-2.5M11.8 5 8.2 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><p>KNOWLEDGE I CAN SHARE</p><h3>Skills offered</h3></div></div><div class="profile-view-tags offered-tags${editing ? " profile-edit-tags" : ""}">${listField("offers", "Skills offered", profile.offers)}</div></section>
				<section class="profile-view-card profile-skills-card"><div class="profile-card-heading"><span class="profile-card-icon learning-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 7.5 10 4l7 3.5-7 3.5-7-3.5ZM5.5 9v4c2.8 2.3 6.2 2.3 9 0V9M17 7.5v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><p>WHAT I’M CURIOUS ABOUT</p><h3>Wants to learn</h3></div></div><div class="profile-view-tags learning-tags${editing ? " profile-edit-tags" : ""}">${listField("wants", "Wants to learn", profile.wants)}</div></section>
				<section class="profile-view-card profile-skills-card profile-interests-card"><div class="profile-card-heading"><span class="profile-card-icon interests-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.8 12 7l4.6.7-3.3 3.2.8 4.6-4.1-2.2-4.1 2.2.8-4.6-3.3-3.2L8 7l2-4.2Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></span><div><p>THINGS I’M INTO</p><h3>Interests</h3></div></div><div class="profile-view-tags interest-tags${editing ? " profile-edit-tags" : ""}">${listField("interests", "Interests", profile.interests)}</div></section>
			</div>
			<p class="profile-inline-status" id="profile-inline-status" role="status" aria-live="polite"></p>
			<footer class="profile-page-footer"><span>SkillSwap Campus</span><span>Learn + Teach + Grow — Together!</span></footer>
		</${mainTag}>
	</div>`;
}

function openMyProfile() {
	openDialog(renderMyProfile(), "profile");
}

function setMyProfileEditMode(editing) {
	dialogContent.innerHTML = renderMyProfile(editing);
	dialogContent.querySelector(editing ? "#profile-field-name" : ".dialog-close")?.focus();
}

function openOfferSkill() {
	openDialog(`${dialogShell("GIVE A LITTLE, LEARN A LOT", "Add a skill", "Share what you can teach or what you would like to learn.")}
		<form class="dialog-form" id="offer-skill-form"><div class="dialog-field"><label for="skill-name-input">Skill</label><input id="skill-name-input" name="skill" maxlength="40" placeholder="e.g. Motion design" required></div>
		<div class="dialog-field"><label for="skill-type-input">I want to…</label><select id="skill-type-input" name="type"><option value="offer">Teach this skill</option><option value="learn">Learn this skill</option></select></div>
		<p class="dialog-status" id="dialog-status" role="status" aria-live="polite"></p><div class="dialog-actions"><button type="button" class="button button-quiet" data-action="close-dialog">Cancel</button><button type="submit" class="button button-primary">Add to my profile</button></div></form>`);
}

function openStudentProfile(student) {
	const ranked = rankStudent(student);
	const skillTags = (skills) => skills.length
		? skills.map((skill) => `<span class="profile-view-tag">${escapeHtml(skill)}</span>`).join("")
		: '<span class="profile-empty-tag">Not listed</span>';
	const connected = connectedStudents.has(student.id);
	openDialog(`<div class="profile-page">
		<header class="profile-page-header"><a class="profile-page-brand" href="dashboard.html"><span class="brand-symbol" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M11.5 20a8.5 8.5 0 0 1 14.4-6.1M28.5 20a8.5 8.5 0 0 1-14.4 6.1M12 20h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="11.5" cy="20" r="4" fill="currentColor"/><circle cx="28.5" cy="20" r="4" fill="currentColor"/></svg></span><span>SkillSwap <small>Campus</small></span></a><span class="profile-page-location">Discover people <span>/</span> Student profile</span><button type="button" class="dialog-close" data-action="close-dialog" aria-label="Close profile"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></header>
		<section class="profile-page-main" aria-label="Student profile information">
			<section class="profile-cover"><div class="profile-cover-orbit profile-orbit-a"></div><div class="profile-cover-orbit profile-orbit-b"></div><div class="profile-cover-content"><span class="profile-large-avatar ${student.tone}" aria-hidden="true">${escapeHtml(student.initials)}<span><svg viewBox="0 0 20 20" fill="none"><path d="m4 10 4 4 8-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span><div class="profile-cover-copy"><p class="profile-cover-label">STUDENT PROFILE <span>${connected ? "Request sent" : "Suggested for you"}</span><span class="profile-full-score"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m10 2.5 1.8 5.7 5.7 1.8-5.7 1.8-1.8 5.7-1.8-5.7-5.7-1.8 5.7-1.8L10 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>${ranked.score}% match</span></p><h2 id="dialog-title">${escapeHtml(student.name)}</h2><p>${escapeHtml(student.branch)} <span>·</span> ${escapeHtml(student.year)} <span>·</span> UIET Chandigarh</p></div><button type="button" class="profile-edit-button profile-connect-button" data-action="dialog-connect" data-student="${student.id}" ${connected ? 'aria-pressed="true"' : ""}>${connected ? "Request Sent" : "Connect"}</button></div></section>
			<div class="profile-detail-grid">
				<section class="profile-view-card profile-about-card"><div class="profile-card-heading"><span class="profile-card-icon about-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 3.2v.1m0 2.1v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span><div><p>THE PERSON BEHIND THE SKILLS</p><h3>A little about ${escapeHtml(student.name.split(/\s+/)[0])}</h3></div></div><p class="profile-about-copy">${escapeHtml(student.bio)}</p></section>
				<section class="profile-view-card profile-campus-card"><div class="profile-card-heading"><span class="profile-card-icon campus-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m2.8 7 7.2-4 7.2 4L10 11 2.8 7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5.5 8.5v4c2.8 2.2 6.2 2.2 9 0v-4M17.2 7v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><p>STUDENT DETAILS</p><h3>Campus details</h3></div></div><dl class="profile-campus-list"><div><dt>College</dt><dd>UIET Chandigarh</dd></div><div><dt>Branch</dt><dd>${escapeHtml(student.branch)}</dd></div><div><dt>Year</dt><dd>${escapeHtml(student.year)}</dd></div></dl></section>
				<section class="profile-view-card profile-skills-card"><div class="profile-card-heading"><span class="profile-card-icon offered-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6.5 6.5 4 9l2.5 2.5M13.5 13.5 16 11l-2.5-2.5M11.8 5 8.2 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><p>KNOWLEDGE TO SHARE</p><h3>Can teach</h3></div></div><div class="profile-view-tags offered-tags">${skillTags(student.teaches)}</div></section>
				<section class="profile-view-card profile-skills-card"><div class="profile-card-heading"><span class="profile-card-icon learning-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 7.5 10 4l7 3.5-7 3.5-7-3.5ZM5.5 9v4c2.8 2.3 6.2 2.3 9 0V9M17 7.5v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div><p>WHAT THEY’RE CURIOUS ABOUT</p><h3>Wants to learn</h3></div></div><div class="profile-view-tags learning-tags">${skillTags(student.wants)}</div></section>
				<section class="profile-view-card profile-skills-card profile-interests-card"><div class="profile-card-heading"><span class="profile-card-icon interests-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.8 12 7l4.6.7-3.3 3.2.8 4.6-4.1-2.2-4.1 2.2.8-4.6-3.3-3.2L8 7l2-4.2Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></span><div><p>SHARED CURIOSITY</p><h3>Interests</h3></div></div><div class="profile-view-tags interest-tags">${skillTags(student.interests)}</div></section>
				<section class="profile-view-card profile-match-card"><div class="profile-card-heading"><span class="profile-card-icon match-profile-icon"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m10 2.5 1.8 5.7 5.7 1.8-5.7 1.8-1.8 5.7-1.8-5.7-5.7-1.8 5.7-1.8L10 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></span><div><p>WHY YOU MATCH</p><h3>${ranked.score}% compatibility</h3></div></div><p class="profile-match-copy">${escapeHtml(ranked.reason)}</p></section>
			</div>
			<footer class="profile-page-footer"><span>SkillSwap Campus</span><span>Learn + Teach + Grow — Together!</span></footer>
		</section>
	</div>`, "profile");
}

function openOpportunity(id) {
	const opportunity = opportunityDetails[id];
	if (!opportunity) return;
	openDialog(`${dialogShell(opportunity.eyebrow, "Campus opportunity", "A sample invitation from the SkillSwap community.")}
		<div class="detail-hero"><span class="opportunity-art ${opportunity.tone}">${opportunity.art}<span></span></span><div><h3>${escapeHtml(opportunity.title)}</h3><p>UIET Chandigarh · Student community</p></div></div>
		<p class="detail-copy">${escapeHtml(opportunity.description)}</p><div class="profile-dialog-section"><h3>Good skills to bring</h3><div class="profile-dialog-tags">${opportunity.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div></div>
		<div class="dialog-actions"><button type="button" class="button button-quiet" data-action="close-dialog">Close</button><button type="button" class="button button-primary" data-action="opportunity-interest" data-title="${escapeHtml(opportunity.title)}">I'm interested</button></div>`);
}

function setGreeting() {
	const hour = new Date().getHours();
	const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
	document.querySelector("#greeting").textContent = greeting;
}

function setSearchPlaceholder() {
	if (window.matchMedia("(max-width: 360px)").matches) searchInput.placeholder = "Search";
	else if (window.matchMedia("(max-width: 768px)").matches) searchInput.placeholder = "Search skills…";
	else searchInput.placeholder = "Search skills, people, or projects…";
}

function openDrawer() {
	const sidebar = document.querySelector(".sidebar");
	const button = document.querySelector("[data-action='toggle-drawer']");
	const isOpen = sidebar.classList.toggle("is-open");
	button.setAttribute("aria-expanded", String(isOpen));
	button.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
	document.querySelector("[data-close-drawer]").hidden = !isOpen;
	if (isOpen) sidebar.querySelector(".nav-item")?.focus();
}

function closeDrawer() {
	document.querySelector(".sidebar").classList.remove("is-open");
	document.querySelector("[data-action='toggle-drawer']").setAttribute("aria-expanded", "false");
	document.querySelector("[data-action='toggle-drawer']").setAttribute("aria-label", "Open navigation");
	document.querySelector("[data-close-drawer]").hidden = true;
}

function navigateTo(target) {
	document.querySelectorAll("[data-nav]").forEach((item) => {
		const active = item.dataset.nav === target;
		item.classList.toggle("is-active", active);
		if (active) item.setAttribute("aria-current", "page");
		else item.removeAttribute("aria-current");
	});
	closeDrawer();
	closeMenus();
	if (target === "home") document.querySelector("#home-section").scrollIntoView({ behavior: "smooth", block: "start" });
	else if (target === "discover" || target === "matches") document.querySelector("#discover-section").scrollIntoView({ behavior: "smooth", block: "start" });
	else if (target === "collaboration") document.querySelector("#collaboration-section").scrollIntoView({ behavior: "smooth", block: "start" });
	else if (target === "profile") openMyProfile();
}

document.addEventListener("input", (event) => {
	if (event.target === searchInput) {
		currentQuery = searchInput.value;
		renderRecommendations();
	}
});

document.addEventListener("click", (event) => {
	const navigationItem = event.target.closest("[data-nav]");
	if (navigationItem) {
		navigateTo(navigationItem.dataset.nav);
		return;
	}

	if (!event.target.closest(".popover-wrap")) closeMenus();
	const action = event.target.closest("[data-action]");
	if (action) {
		const { action: name, student: studentId } = action.dataset;
		if (name === "toggle-drawer") openDrawer();
					else if (name === "start-profile-edit") setMyProfileEditMode(true);
					else if (name === "cancel-profile-edit") setMyProfileEditMode(false);
		else if (name === "view-my-profile") openMyProfile();
		else if (name === "offer-skill") openOfferSkill();
		else if (name === "discover") navigateTo("discover");
		else if (name === "view-all") { navigateTo("discover"); searchInput.focus({ preventScroll: true }); }
		else if (name === "toggle-notifications") setPopover("notification-popover");
		else if (name === "toggle-user-menu") setPopover("user-popover");
		else if (name === "notifications-read") {
			document.querySelector(".notification-indicator").hidden = true;
			document.querySelector(".notification-button").setAttribute("aria-label", "Notifications, all caught up");
			document.querySelector("#notification-popover .popover-heading span").textContent = "All read";
			showToast("You are all caught up on campus updates.");
			closeMenus();
		} else if (name === "sign-out") window.location.assign("index.html");
		else if (name === "rescue") showToast("Skill Rescue is coming soon. Urgent peer assistance will be available in a future version.");
		else if (name === "close-dialog") dialog.close();
		else if (name === "view-profile") {
			const student = students.find((candidate) => candidate.id === studentId);
			if (student) openStudentProfile(student);
		} else if (name === "connect" || name === "dialog-connect") {
			if (!connectedStudents.has(studentId)) {
				connectedStudents.add(studentId);
				renderRecommendations();
				showToast(`Connection request sent to ${students.find((student) => student.id === studentId)?.name || "your match"}. This is a demo action.`);
			}
			if (name === "dialog-connect") {
				const student = students.find((candidate) => candidate.id === studentId);
				if (student) openStudentProfile(student);
			}
		} else if (name === "opportunities-more" || name === "updates-more") showToast("You are viewing the latest sample campus opportunities.");
		else if (name === "clear-search") {
			searchInput.value = "";
			currentQuery = "";
			renderRecommendations();
			searchInput.focus();
		} else if (name === "opportunity-interest") {
			showToast(`Interest noted for “${action.dataset.title}”. Team sign-up is a demo feature.`);
			dialog.close();
		}
	}

	const opportunityButton = event.target.closest("[data-opportunity]");
	if (opportunityButton) openOpportunity(opportunityButton.dataset.opportunity);

	if (event.target.matches("[data-close-drawer]")) closeDrawer();
});

document.addEventListener("submit", (event) => {
	if (event.target.id === "profile-inline-form") {
		event.preventDefault();
		const formData = new FormData(event.target);
		const requiredFields = ["name", "bio", "college", "branch", "year"];
		const values = Object.fromEntries(requiredFields.map((field) => [field, String(formData.get(field) || "").trim()]));
		const missingField = requiredFields.find((field) => !values[field]);
		if (missingField) {
			const input = event.target.elements.namedItem(missingField);
			const label = input.getAttribute("aria-label");
			document.querySelector("#profile-inline-status").textContent = `Please enter ${label.toLocaleLowerCase()}.`;
			input.focus();
			return;
		}
		const parseList = (field) => [...new Map(String(formData.get(field) || "").split(",").map((item) => item.trim()).filter(Boolean).map((item) => [normalizeSkill(item), item])).values()];
		Object.assign(profile, values, {
			offers: parseList("offers"),
			wants: parseList("wants"),
			interests: parseList("interests")
		});
		setProfileName(profile.name);
		syncSkillCount();
		renderRecommendations();
		dialogContent.innerHTML = renderMyProfile();
		dialogContent.querySelector(".dialog-close")?.focus();
		showToast("Your profile was updated for this demo session.");
	} else if (event.target.id === "offer-skill-form") {
		event.preventDefault();
		const formData = new FormData(event.target);
		const skill = String(formData.get("skill") || "").trim();
		const type = String(formData.get("type") || "offer");
		const destination = type === "learn" ? profile.wants : profile.offers;
		if (!skill) {
			document.querySelector("#dialog-status").textContent = "Enter a skill name first.";
			return;
		}
		if (destination.some((existing) => normalizeSkill(existing) === normalizeSkill(skill))) {
			document.querySelector("#dialog-status").textContent = "That skill is already on your profile.";
			return;
		}
		destination.push(skill);
		syncSkillCount();
		renderRecommendations();
		dialog.close();
		showToast(`${skill} added to skills you ${type === "learn" ? "want to learn" : "can teach"}. Matches have been recalculated.`);
	}
});

dialog.addEventListener("click", (event) => {
	if (event.target === dialog) dialog.close();
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		if (dialog.open) dialog.close();
		closeMenus();
		closeDrawer();
	}
	if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
		event.preventDefault();
		searchInput.focus();
	}
});

setGreeting();
setSearchPlaceholder();
window.matchMedia("(max-width: 768px)").addEventListener("change", setSearchPlaceholder);
window.matchMedia("(max-width: 360px)").addEventListener("change", setSearchPlaceholder);
window.addEventListener("resize", setSearchPlaceholder, { passive: true });
setProfileName(profile.name);
syncSkillCount();
renderRecommendations();
