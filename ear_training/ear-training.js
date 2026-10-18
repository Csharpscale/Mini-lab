(() => {
	"use strict";

	const LEVELS = [
		{
			id: 1,
			name: "First Footsteps",
			objective: "Learn four familiar notes: C, D, E, and G in octave 4.",
			notes: [60, 62, 64, 67],
			questions: 5,
			chances: 3
		},
		{
			id: 2,
			name: "A Familiar Path",
			objective: "Recognize all seven natural notes from C4 to B4.",
			notes: [60, 62, 64, 65, 67, 69, 71],
			questions: 8,
			chances: 4
		},
		{
			id: 3,
			name: "Across the Bridge",
			objective: "Hear every chromatic note in octave 4, then find C5, E5, and G5.",
			notes: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 76, 79],
			questions: 10,
			chances: 4
		}
	];
	const STORAGE_KEY = "melodylab-lost-note-progress-v1";
	const NOTE_LABELS = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
	const MIDI_LOWER = 60;
	const MIDI_UPPER = 84;
	const elements = {
		open: document.querySelector("#lost-note-open"),
		game: document.querySelector("#lost-note-game"),
		lobby: document.querySelector("#game-lobby"),
		session: document.querySelector("#game-session"),
		returnButton: document.querySelector("#lost-note-return"),
		scene: document.querySelector("#lost-note-scene"),
		bridge: document.querySelector("#lost-note-bridge"),
		mumo: document.querySelector("#lost-note-mumo"),
		sceneMessage: document.querySelector("#lost-note-scene-message"),
		plankCount: document.querySelector("#lost-note-plank-count"),
		intro: document.querySelector("#lost-note-intro"),
		start: document.querySelector("#lost-note-start"),
		skip: document.querySelector("#lost-note-skip"),
		learn: document.querySelector("#lost-note-learn"),
		levelLabel: document.querySelector("#lost-note-level-label"),
		levelTitle: document.querySelector("#lost-note-level-title"),
		levelObjective: document.querySelector("#lost-note-level-objective"),
		best: document.querySelector("#lost-note-best"),
		levels: document.querySelector("#lost-note-levels"),
		lessons: document.querySelector("#lost-note-lessons"),
		learnFeedback: document.querySelector("#lost-note-learn-feedback"),
		beginRound: document.querySelector("#lost-note-begin-round"),
		round: document.querySelector("#lost-note-round"),
		roundLevel: document.querySelector("#lost-note-round-level"),
		questionCount: document.querySelector("#lost-note-question-count"),
		score: document.querySelector("#lost-note-score"),
		chances: document.querySelector("#lost-note-chances"),
		progress: document.querySelector("#lost-note-progress"),
		progressFill: document.querySelector("#lost-note-progress-fill"),
		feedback: document.querySelector("#lost-note-feedback"),
		replay: document.querySelector("#lost-note-replay"),
		midiConnect: document.querySelector("#lost-note-midi-connect"),
		midiHint: document.querySelector("#lost-note-midi-hint"),
		choices: document.querySelector("#lost-note-choices"),
		next: document.querySelector("#lost-note-next"),
		result: document.querySelector("#lost-note-result"),
		resultLabel: document.querySelector("#lost-note-result-label"),
		resultTitle: document.querySelector("#lost-note-result-title"),
		resultCopy: document.querySelector("#lost-note-result-copy"),
		resultStats: document.querySelector("#lost-note-result-stats"),
		nextLevel: document.querySelector("#lost-note-next-level"),
		retry: document.querySelector("#lost-note-retry"),
		levelSelect: document.querySelector("#lost-note-level-select")
	};

	const state = {
		phase: "closed",
		level: LEVELS[0],
		round: null,
		progress: loadProgress(),
		moodTimer: 0,
		blinkTimer: 0,
		blinkResetTimer: 0,
		audioRequest: 0,
		midiConnected: false
	};

	function getNoteName(midi) {
		if (window.MelodyLab && typeof window.MelodyLab.getNoteName === "function") {
			return window.MelodyLab.getNoteName(midi, "sharp");
		}
		return `${NOTE_LABELS[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
	}

	function makeDefaultProgress() {
		return { introSeen: false, unlockedLevel: 1, completedLevels: [], best: {} };
	}

	function loadProgress() {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) return makeDefaultProgress();
			const parsed = JSON.parse(stored);
			if (!parsed || typeof parsed !== "object") return makeDefaultProgress();
			const completedLevels = Array.isArray(parsed.completedLevels)
				? parsed.completedLevels.filter((id) => Number.isInteger(id) && id >= 1 && id <= LEVELS.length)
				: [];
			const completedUnlock = completedLevels.length ? Math.max(...completedLevels) + 1 : 1;
			const storedUnlock = Number.isInteger(parsed.unlockedLevel) ? parsed.unlockedLevel : 1;
			const best = parsed.best && typeof parsed.best === "object" ? parsed.best : {};
			return {
				introSeen: Boolean(parsed.introSeen),
				unlockedLevel: Math.min(LEVELS.length, Math.max(1, storedUnlock, completedUnlock)),
				completedLevels,
				best
			};
		} catch (error) {
			console.error("Could not load The Lost Little Note progress.", error);
			return makeDefaultProgress();
		}
	}

	function saveProgress() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
			return true;
		} catch (error) {
			console.error("Could not save The Lost Little Note progress.", error);
			return false;
		}
	}

	function setPhase(phase) {
		state.phase = phase;
		elements.intro.hidden = phase !== "intro";
		elements.learn.hidden = phase !== "learn";
		elements.round.hidden = phase !== "round";
		elements.result.hidden = phase !== "result";
	}

	function setMood(mood) {
		window.clearTimeout(state.moodTimer);
		window.clearTimeout(state.blinkResetTimer);
		elements.mumo.dataset.mood = mood;
		if (mood === "happy" || mood === "worried") {
			state.moodTimer = window.setTimeout(() => {
				if (!elements.game.hidden) elements.mumo.dataset.mood = "idle";
			}, 1400);
		}
	}

	function startBlinking() {
		window.clearInterval(state.blinkTimer);
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		state.blinkTimer = window.setInterval(() => {
			if (elements.game.hidden || state.phase === "closed" || elements.mumo.dataset.mood !== "idle") return;
			elements.mumo.dataset.mood = "blink";
			state.blinkResetTimer = window.setTimeout(() => {
				if (elements.mumo.dataset.mood === "blink") elements.mumo.dataset.mood = "idle";
			}, 150);
		}, 4200);
	}

	function stopBlinking() {
		window.clearInterval(state.blinkTimer);
		window.clearTimeout(state.blinkResetTimer);
		window.clearTimeout(state.moodTimer);
		state.blinkTimer = 0;
	}

	function currentBridgeProgress() {
		if (!state.level) return { total: 5, restored: 0, complete: false };
		if (!state.round) {
			return { total: state.level.questions, restored: 0, complete: false };
		}
		return {
			total: state.level.questions,
			restored: state.round.bridgeComplete ? state.level.questions : state.round.correct,
			complete: state.round.bridgeComplete
		};
	}

	function renderScene() {
		const bridgeState = currentBridgeProgress();
		elements.bridge.style.setProperty("--bridge-plank-count", bridgeState.total);
		elements.bridge.replaceChildren();
		for (let index = 0; index < bridgeState.total; index += 1) {
			const plank = document.createElement("span");
			plank.className = "lost-note-plank";
			if (index < bridgeState.restored) plank.classList.add("is-restored");
			elements.bridge.append(plank);
		}
		elements.plankCount.textContent = bridgeState.complete
			? "Bridge restored!"
			: `${bridgeState.restored} of ${bridgeState.total} planks restored`;
		if (state.phase === "round" && state.round) {
			elements.sceneMessage.textContent = state.round.bridgeComplete
				? "The Silent Bridge is whole. Mumo can come home!"
				: "Every note you recognize brings Mumo closer.";
		} else if (state.phase === "result" && state.round?.passed) {
			elements.sceneMessage.textContent = "The Silent Bridge is whole. Mumo is safe at last!";
		} else if (state.phase === "result") {
			elements.sceneMessage.textContent = "Mumo is cheering you on. Try the trail again.";
		} else {
			elements.sceneMessage.textContent = "Mumo is waiting across the Silent Bridge.";
		}
	}

	function displayIntro() {
		setPhase("intro");
		elements.skip.hidden = !state.progress.introSeen;
		elements.start.textContent = state.progress.introSeen ? "Continue Adventure →" : "Start Adventure →";
		renderScene();
	}

	function setActiveLevel(levelId) {
		const level = LEVELS.find((candidate) => candidate.id === levelId);
		if (!level || level.id > state.progress.unlockedLevel) return;
		state.level = level;
		state.round = null;
		displayLearn();
	}

	function renderLevelButtons() {
		elements.levels.replaceChildren();
		for (const level of LEVELS) {
			const unlocked = level.id <= state.progress.unlockedLevel;
			const completed = state.progress.completedLevels.includes(level.id);
			const best = state.progress.best[level.id];
			const button = document.createElement("button");
			button.type = "button";
			button.className = "lost-note-level-button";
			button.disabled = !unlocked;
			button.setAttribute("aria-current", String(level.id === state.level.id ? "step" : "false"));
			const title = document.createElement("strong");
			title.textContent = `Level ${level.id} · ${level.name}`;
			const detail = document.createElement("span");
			if (!unlocked) detail.textContent = "Locked · pass the previous level with 80%";
			else if (completed) detail.textContent = `Complete · best ${best?.accuracy ?? 0}%`;
			else if (best) detail.textContent = `Unlocked · best ${best.accuracy}%`;
			else detail.textContent = `Unlocked · ${level.questions} questions · pass with 80%`;
			button.append(title, detail);
			button.addEventListener("click", () => setActiveLevel(level.id));
			elements.levels.append(button);
		}
	}

	function createMiniKeyboard(targetMidi) {
		const keyboard = document.createElement("div");
		keyboard.className = "lost-mini-keyboard";
		keyboard.setAttribute("role", "img");
		keyboard.setAttribute("aria-label", `${getNoteName(targetMidi)} highlighted on a two-octave keyboard`);
		const whiteRow = document.createElement("div");
		whiteRow.className = "lost-mini-whites";
		const whiteMidis = [];
		for (let midi = MIDI_LOWER; midi <= MIDI_UPPER; midi += 1) {
			if (![1, 3, 6, 8, 10].includes(midi % 12)) whiteMidis.push(midi);
		}
		whiteMidis.forEach((midi) => {
			const key = document.createElement("span");
			key.className = "lost-mini-white";
			if (midi === targetMidi) key.classList.add("is-target");
			whiteRow.append(key);
		});
		keyboard.append(whiteRow);
		for (let midi = MIDI_LOWER; midi < MIDI_UPPER; midi += 1) {
			if (![1, 3, 6, 8, 10].includes(midi % 12)) continue;
			const key = document.createElement("span");
			const precedingWhites = whiteMidis.filter((whiteMidi) => whiteMidi < midi).length;
			const whiteCount = whiteMidis.length;
			key.className = "lost-mini-black";
			key.style.left = `${(precedingWhites / whiteCount) * 100}%`;
			if (midi === targetMidi) key.classList.add("is-target");
			keyboard.append(key);
		}
		return keyboard;
	}

	async function playNote(midi) {
		if (!window.MelodyLab || typeof window.MelodyLab.playNote !== "function") {
			return { ok: false, message: "Piano playback is unavailable right now." };
		}
		const played = await window.MelodyLab.playNote(midi);
		if (!played) {
			return { ok: false, message: "The piano note did not start. Check the Virtual piano audio setting and try again." };
		}
		return { ok: true, message: `${getNoteName(midi)} is playing.` };
	}

	function renderLessons() {
		elements.lessons.replaceChildren();
		for (const midi of state.level.notes) {
			const card = document.createElement("article");
			card.className = "lost-note-note-card";
			const info = document.createElement("div");
			info.className = "lost-note-note-info";
			const name = document.createElement("strong");
			name.textContent = getNoteName(midi);
			const number = document.createElement("small");
			number.textContent = `MIDI ${midi}`;
			const play = document.createElement("button");
			play.className = "secondary-button";
			play.type = "button";
			play.textContent = "Play note ♪";
			play.addEventListener("click", async () => {
				play.disabled = true;
				const result = await playNote(midi);
				elements.learnFeedback.textContent = result.message;
				elements.learnFeedback.classList.toggle("is-audio-error", !result.ok);
				play.disabled = false;
			});
			info.append(name, number, play);
			card.append(info, createMiniKeyboard(midi));
			elements.lessons.append(card);
		}
	}

	function displayLearn() {
		setPhase("learn");
		elements.levelLabel.textContent = `LEVEL ${state.level.id} · LEARN`;
		elements.levelTitle.textContent = state.level.name;
		elements.levelObjective.textContent = `${state.level.objective} Identify ${state.level.questions} notes; pass with at least 80% accuracy.`;
		const best = state.progress.best[state.level.id];
		elements.best.textContent = best
			? `Personal best: ${best.score} points · ${best.accuracy}% accuracy`
			: "Pass with 80% accuracy to unlock the next level.";
		elements.learnFeedback.textContent = "";
		elements.learnFeedback.classList.remove("is-audio-error");
		renderLevelButtons();
		renderLessons();
		renderScene();
	}

	function shuffle(values) {
		const shuffled = values.slice();
		for (let index = shuffled.length - 1; index > 0; index -= 1) {
			const swapIndex = Math.floor(Math.random() * (index + 1));
			[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
		}
		return shuffled;
	}

	function makeQuestion() {
		const candidates = state.level.notes.filter((midi) => midi !== state.round.previousMidi);
		const possibleNotes = candidates.length ? candidates : state.level.notes;
		const targetMidi = possibleNotes[Math.floor(Math.random() * possibleNotes.length)];
		const distractors = shuffle(state.level.notes.filter((midi) => midi !== targetMidi)).slice(0, 3);
		state.round.previousMidi = targetMidi;
		state.round.targetMidi = targetMidi;
		state.round.choices = shuffle([targetMidi, ...distractors]);
		state.round.answered = false;
		state.round.canAnswer = false;
		state.round.hasHeard = false;
		state.audioRequest += 1;
		renderQuestion();
	}

	function renderQuestion() {
		const round = state.round;
		const questionNumber = round.answeredQuestions + 1;
		elements.roundLevel.textContent = `LEVEL ${state.level.id} · ${state.level.name.toUpperCase()}`;
		elements.questionCount.textContent = `Question ${Math.min(questionNumber, state.level.questions)} of ${state.level.questions}`;
		elements.score.textContent = `Score ${round.correct * 100}`;
		elements.chances.textContent = `Chances ${round.chances}`;
		elements.progress.max = state.level.questions;
		elements.progress.setAttribute("aria-valuemax", String(state.level.questions));
		elements.progress.setAttribute("aria-valuenow", String(round.correct));
		elements.progressFill.style.width = `${(round.correct / state.level.questions) * 100}%`;
		elements.feedback.textContent = "Listen closely, then choose the note you heard.";
		elements.feedback.classList.remove("is-correct", "is-wrong", "is-audio-error");
		elements.choices.replaceChildren();
		for (const midi of round.choices) {
			const button = document.createElement("button");
			button.className = "lost-note-choice";
			button.type = "button";
			button.textContent = getNoteName(midi);
			button.disabled = !round.canAnswer;
			button.addEventListener("click", () => answerQuestion(midi, "choice"));
			elements.choices.append(button);
		}
		elements.next.hidden = true;
		elements.next.textContent = round.answeredQuestions >= state.level.questions
			? "See bridge progress →"
			: round.chances <= 0 ? "See how you did →" : "Next note →";
		elements.replay.disabled = false;
	}

	async function replayQuestion() {
		const round = state.round;
		if (state.phase !== "round" || !round || round.answered) return;
		const requestId = ++state.audioRequest;
		elements.replay.disabled = true;
		if (!round.hasHeard) {
			round.canAnswer = false;
			Array.from(elements.choices.children).forEach((choice) => { choice.disabled = true; });
		}
		elements.feedback.textContent = "Playing the hidden note…";
		elements.feedback.classList.remove("is-audio-error");
		const result = await playNote(round.targetMidi);
		if (state.phase !== "round" || state.round !== round || state.audioRequest !== requestId) return;
		round.canAnswer = true;
		round.hasHeard = result.ok || round.hasHeard;
		Array.from(elements.choices.children).forEach((choice) => { choice.disabled = false; });
		elements.feedback.textContent = result.ok
			? "Listen closely, then choose the note you heard."
			: result.message;
		elements.feedback.classList.toggle("is-audio-error", !result.ok);
		elements.replay.disabled = false;
	}

	function startRound() {
		state.round = {
			answeredQuestions: 0,
			correct: 0,
			chances: state.level.chances,
			previousMidi: null,
			targetMidi: null,
			choices: [],
			answered: false,
			canAnswer: false,
			hasHeard: false,
			bridgeComplete: false,
			passed: false
		};
		setPhase("round");
		renderScene();
		makeQuestion();
		replayQuestion();
	}

	function answerQuestion(midi) {
		const round = state.round;
		if (state.phase !== "round" || !round || round.answered || !round.canAnswer) return;
		round.answered = true;
		round.answeredQuestions += 1;
		const correct = midi === round.targetMidi;
		if (correct) {
			round.correct += 1;
			setMood("happy");
			elements.feedback.textContent = `That's right — ${getNoteName(round.targetMidi)}! A plank is back in place.`;
			elements.feedback.classList.add("is-correct");
		} else {
			round.chances -= 1;
			setMood("worried");
			const guessedName = getNoteName(midi);
			elements.feedback.textContent = `${guessedName} was not quite it. The note was ${getNoteName(round.targetMidi)}; Mumo is worried, but you can keep going.`;
			elements.feedback.classList.add("is-wrong");
		}
		Array.from(elements.choices.children).forEach((choice) => {
			const choiceMidi = round.choices.find((choiceNote) => getNoteName(choiceNote) === choice.textContent);
			choice.disabled = true;
			if (choiceMidi === round.targetMidi) choice.classList.add("is-correct");
			else if (choiceMidi === midi && !correct) choice.classList.add("is-incorrect");
		});
		round.bridgeComplete = round.correct === state.level.questions;
		elements.score.textContent = `Score ${round.correct * 100}`;
		elements.chances.textContent = `Chances ${round.chances}`;
		elements.progress.setAttribute("aria-valuenow", String(round.correct));
		elements.progressFill.style.width = `${(round.correct / state.level.questions) * 100}%`;
		elements.next.hidden = false;
		elements.next.textContent = round.answeredQuestions >= state.level.questions
			? "See bridge progress →"
			: round.chances <= 0 ? "See how you did →" : "Next note →";
		renderScene();
	}

	function nextQuestion() {
		const round = state.round;
		if (!round || !round.answered) return;
		if (round.chances <= 0 || round.answeredQuestions >= state.level.questions) {
			finishRound();
			return;
		}
		makeQuestion();
		replayQuestion();
	}

	function addResultStat(value, label) {
		const stat = document.createElement("div");
		stat.className = "lost-note-result-stat";
		const strong = document.createElement("strong");
		strong.textContent = value;
		const caption = document.createElement("span");
		caption.textContent = label;
		stat.append(strong, caption);
		elements.resultStats.append(stat);
	}

	function finishRound() {
		const round = state.round;
		if (!round) return;
		const accuracy = round.answeredQuestions ? Math.round((round.correct / round.answeredQuestions) * 100) : 0;
		round.passed = round.answeredQuestions === state.level.questions && accuracy >= 80;
		round.bridgeComplete = round.passed;
		if (round.passed) {
			if (!state.progress.completedLevels.includes(state.level.id)) {
				state.progress.completedLevels.push(state.level.id);
			}
			state.progress.unlockedLevel = Math.min(LEVELS.length, Math.max(state.progress.unlockedLevel, state.level.id + 1));
			const previousBest = state.progress.best[state.level.id];
			state.progress.best[state.level.id] = {
				score: Math.max(previousBest?.score || 0, round.correct * 100),
				accuracy: Math.max(previousBest?.accuracy || 0, accuracy)
			};
			state.progress.introSeen = true;
			saveProgress();
		} else {
			const previousBest = state.progress.best[state.level.id];
			const bestScore = Math.max(previousBest?.score || 0, round.correct * 100);
			const bestAccuracy = Math.max(previousBest?.accuracy || 0, accuracy);
			if (!previousBest || bestScore !== previousBest.score || bestAccuracy !== previousBest.accuracy) {
				state.progress.best[state.level.id] = { score: bestScore, accuracy: bestAccuracy };
				saveProgress();
			}
		}
		setPhase("result");
		setMood(round.passed ? "happy" : "worried");
		elements.resultLabel.textContent = round.passed ? "BRIDGE RESTORED" : "THE TRAIL CONTINUES";
		elements.resultTitle.textContent = round.passed
			? state.level.id === LEVELS.length ? "Mumo made it home!" : "A path to the next level!"
			: "Every good ear learns with practice.";
		elements.resultCopy.textContent = round.passed
			? `You recognized ${round.correct} of ${round.answeredQuestions} notes and passed ${state.level.name}. The next trail is ready when you are.`
			: `You recognized ${round.correct} of ${round.answeredQuestions} notes. Replay the note lessons and try again; 80% accuracy unlocks the next level.`;
		elements.resultStats.replaceChildren();
		addResultStat(String(round.correct * 100), "score");
		addResultStat(`${accuracy}%`, "accuracy");
		addResultStat(`${round.correct}/${round.answeredQuestions}`, "notes recognized");
		elements.nextLevel.hidden = !round.passed || state.level.id === LEVELS.length;
		elements.nextLevel.textContent = "Continue adventure →";
		elements.retry.textContent = round.passed ? "Replay this level" : "Try this level again";
		renderLevelButtons();
		renderScene();
	}

	function answerWithMidi(event) {
		const detail = event.detail || {};
		if (state.phase !== "round" || detail.source !== "midi" || detail.phase !== "on") return;
		if (!Number.isInteger(detail.midi)) return;
		answerQuestion(detail.midi);
	}

	function updateMidiHint(detail) {
		state.midiConnected = Boolean(detail?.connected);
		elements.midiHint.textContent = state.midiConnected
			? "Play the exact note name shown in the choices; Oct buttons change the note you send."
			: "Or play the exact note on your connected MIDI keyboard.";
		elements.midiConnect.disabled = detail?.message === "Unavailable";
		elements.midiConnect.textContent = state.midiConnected ? "MIDI connected" : "Connect MIDI";
	}

	function closeAdventure(restoreLobby) {
		state.phase = "closed";
		state.round = null;
		state.audioRequest += 1;
		elements.game.hidden = true;
		stopBlinking();
		if (restoreLobby) {
			elements.lobby.hidden = false;
			elements.session.hidden = true;
			document.dispatchEvent(new CustomEvent("melodylab:game-screen", { detail: { screen: "lobby" } }));
		}
	}

	function openAdventure() {
		elements.lobby.hidden = true;
		elements.session.hidden = true;
		elements.game.hidden = false;
		displayIntro();
		startBlinking();
		elements.game.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function beginAdventure() {
		state.progress.introSeen = true;
		saveProgress();
		setActiveLevel(Math.min(state.level.id, state.progress.unlockedLevel));
	}

	function initialize() {
		elements.open.addEventListener("click", openAdventure);
		elements.returnButton.addEventListener("click", () => closeAdventure(true));
		elements.start.addEventListener("click", beginAdventure);
		elements.skip.addEventListener("click", beginAdventure);
		elements.beginRound.addEventListener("click", startRound);
		elements.replay.addEventListener("click", replayQuestion);
		elements.next.addEventListener("click", nextQuestion);
		elements.midiConnect.addEventListener("click", () => document.querySelector("#connect-midi").click());
		elements.nextLevel.addEventListener("click", () => {
			if (state.level.id < LEVELS.length) setActiveLevel(state.level.id + 1);
		});
		elements.retry.addEventListener("click", startRound);
		elements.levelSelect.addEventListener("click", displayLearn);
		document.addEventListener("melodylab:note", answerWithMidi);
		document.addEventListener("melodylab:midi-status", (event) => updateMidiHint(event.detail));
		document.addEventListener("melodylab:game-screen", (event) => {
			if (event.detail?.screen === "lobby" || event.detail?.screen === "closed") closeAdventure(false);
		});
		updateMidiHint({ connected: false, message: document.querySelector("#midi-status").textContent });
	}

	initialize();
})();
