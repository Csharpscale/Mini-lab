(() => {
	"use strict";

	const MAJOR_PATTERN = [0, 2, 4, 5, 7, 9, 11];
	const SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
	const FLAT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
	const NOTE_LETTERS = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
	const WHITE_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);
	const DEGREE_NAMES = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
	const MIDI_MIN = 0;
	const MIDI_MAX = 127;
	const SAMPLE_MIN_MIDI = 60;
	const SAMPLE_MAX_MIDI = 108;
	const PIANO_SAMPLE_DIRECTORY = "piano/";
	const TOUR_STEPS = [
		{
			title: "Welcome to Keyboard Explorer",
			label: "A GUIDED TOUR",
			marker: "♪",
			description: "Let’s explore your keyboard and discover how notes are organized. You can use a connected MIDI controller to try the activities, or use the virtual keyboard below.",
			callout: "No controller? No problem. Every lesson activity can be completed with a click on the virtual keys.",
			visual: "<span class=\"lesson-chip accent\"><strong>25</strong> keys to explore</span><span class=\"lesson-chip\">7 natural note names</span><span class=\"lesson-chip\">One note at a time</span>",
			task: ""
		},
		{
			title: "Meet Your Keyboard",
			label: "STEP 02 · KEYBOARD KEYS",
			marker: "▥",
			description: "White keys and black keys each play notes at different pitches. The repeating pattern helps you find your way around. Press any connected MIDI key to see its matching virtual key light up, or click a key below.",
			callout: "MIDI input is optional. Use the virtual keyboard to continue and explore every example.",
			visual: "<span class=\"lesson-chip\"><strong>White</strong><span class=\"chip-detail\">natural notes</span></span><span class=\"lesson-chip\"><strong>Black</strong><span class=\"chip-detail\">notes between some whites</span></span><span class=\"lesson-chip accent\">One key = one pitch</span>",
			task: "Try a key on your controller or click any virtual key."
		},
		{
			title: "Discover the Musical Alphabet",
			label: "STEP 03 · NATURAL NOTES",
			marker: "C",
			description: "The natural notes are C, D, E, F, G, A, and B. Then the sequence repeats. C sits immediately to the left of a pair of black keys; G is between the first and second black keys in a group of three.",
			callout: "Find and select a C, then find and select a G. Look for those black-key groups on the keyboard below.",
			visual: "<span class=\"lesson-chip accent\"><strong>C · D · E · F · G · A · B</strong></span><span class=\"lesson-chip\">C ← two black keys</span><span class=\"lesson-chip\">three black keys → G</span>",
			task: "Select both C and G to continue."
		},
		{
			title: "Meet Sharps and Flats",
			label: "STEP 04 · NOTES BETWEEN NOTES",
			marker: "♯",
			description: "A sharp raises a note by one semitone; a flat lowers it by one semitone. The black key immediately right of C is called C-sharp (C♯) or D-flat (D♭) in this example: two names for the same pitch.",
			callout: "There is no black key between E–F or B–C. Those natural-note pairs are already one semitone apart.",
			visual: "<span class=\"lesson-chip\"><strong>C</strong><span class=\"chip-detail\">one semitone up</span></span><span class=\"lesson-chip accent\"><strong>C♯ / D♭</strong><span class=\"chip-detail\">same black key</span></span><span class=\"lesson-chip\"><strong>D</strong><span class=\"chip-detail\">one semitone down from C♯</span></span>",
			task: "The keyboard marks C and the black key next to it."
		},
		{
			title: "What Is an Interval?",
			label: "STEP 05 · DISTANCE IN PITCH",
			marker: "↔",
			description: "An interval is the distance in pitch between two notes. From C to D is two semitones; from C to E is four semitones. These are distances between pitches, not physical measurements.",
			callout: "Follow the highlighted start and end notes on the existing keyboard. Each neighboring key is one semitone step.",
			visual: "<span class=\"lesson-chip accent\"><strong>C → D</strong><span class=\"chip-detail\">2 semitones</span></span><span class=\"lesson-chip\"><strong>C → E</strong><span class=\"chip-detail\">4 semitones</span></span>",
			task: ""
		},
		{
			title: "What Is an Octave?",
			label: "STEP 06 · THE SAME NOTE, HIGHER",
			marker: "↗",
			description: "An octave is the distance from a note to the next note with the same name at a higher or lower pitch. C–D–E–F–G–A–B–C uses seven natural names; the final C begins the next octave. An octave is 12 semitone steps.",
			callout: "Select two different C keys, one in each octave. Some MIDI controllers have octave-shift buttons; their controls and ranges vary by model.",
			visual: "<span class=\"lesson-chip accent\"><strong>C · D · E · F · G · A · B · C</strong></span><span class=\"lesson-chip\">12 semitone steps</span>",
			task: "Select two C notes at different pitches to continue."
		},
		{
			title: "Your Keyboard Explorer Recap",
			label: "STEP 07 · THE ESSENTIALS",
			marker: "✓",
			description: "You have the essentials: white and black keys make a repeating map; the natural notes run C through B; sharps go up and flats go down; intervals measure pitch distance; and an octave reaches the next note with the same name.",
			callout: "Ready to check what you learned? The assessment is separate from the tour, untimed, and can be retaken as often as you like.",
			visual: "<span class=\"lesson-chip\"><strong>Keys</strong><span class=\"chip-detail\">white + black</span></span><span class=\"lesson-chip\"><strong>Notes</strong><span class=\"chip-detail\">C D E F G A B</span></span><span class=\"lesson-chip\"><strong>♯ / ♭</strong><span class=\"chip-detail\">up / down</span></span><span class=\"lesson-chip\"><strong>Interval</strong><span class=\"chip-detail\">pitch distance</span></span><span class=\"lesson-chip\"><strong>Octave</strong><span class=\"chip-detail\">12 semitones</span></span>",
			task: ""
		}
	];
	const ASSESSMENT_QUESTIONS = [
		{ title: "Which seven notes are the natural-note names?", type: "checkbox", options: ["C", "D", "E", "F", "G", "A", "B", "C♯", "E♭"], correct: ["C", "D", "E", "F", "G", "A", "B"], concept: "Natural notes", step: 2 },
		{ title: "Where is C in the repeating black-key pattern?", type: "radio", options: ["The white key immediately left of a pair of black keys", "The white key immediately right of a pair of black keys", "The white key between the first two black keys in a group of three"], correct: "The white key immediately left of a pair of black keys", concept: "Finding C and G", step: 2 },
		{ title: "Where is G in the group of three black keys?", type: "radio", options: ["The white key between the first and second black keys", "The white key immediately left of the first black key", "The white key between the second and third black keys"], correct: "The white key between the first and second black keys", concept: "Finding C and G", step: 2 },
		{ title: "What does a sharp do to a note?", type: "radio", options: ["Raises it by one semitone", "Lowers it by one semitone", "Raises it by one octave"], correct: "Raises it by one semitone", concept: "Sharps and flats", step: 3 },
		{ title: "What does a flat do to a note?", type: "radio", options: ["Lowers it by one semitone", "Raises it by one semitone", "Makes it louder"], correct: "Lowers it by one semitone", concept: "Sharps and flats", step: 3 },
		{ title: "Which adjacent natural-note pairs have no black key between them?", type: "checkbox", options: ["E–F", "B–C", "C–D", "F–G"], correct: ["E–F", "B–C"], concept: "Sharps and flats", step: 3 },
		{ title: "What does an interval represent?", type: "radio", options: ["The distance in pitch between two notes", "The physical width of two keys", "The length of time a note is held"], correct: "The distance in pitch between two notes", concept: "Intervals", step: 4 },
		{ title: "How many semitones are there from C to D?", type: "radio", options: ["1", "2", "3", "4"], correct: "2", concept: "Intervals", step: 4 },
		{ title: "How many semitone steps are in an octave?", type: "radio", options: ["7", "10", "12", "24"], correct: "12", concept: "Octaves", step: 5 }
	];

	const elements = {
		root: document.querySelector("#root-select"),
		scale: document.querySelector("#scale-select"),
		notation: document.querySelector("#notation-select"),
		octave: document.querySelector("#octave-select"),
		keyboard: document.querySelector("#keyboard"),
		keyboardScroll: document.querySelector("#keyboard-scroll"),
		keyboardRange: document.querySelector("#keyboard-range"),
		keyboardAudioEnabled: document.querySelector("#keyboard-audio-enabled"),
		scaleTitle: document.querySelector("#scale-summary-title"),
		scaleNotes: document.querySelector("#scale-notes"),
		noteName: document.querySelector("#note-name"),
		noteMidi: document.querySelector("#note-midi"),
		noteMembership: document.querySelector("#note-membership"),
		connectButton: document.querySelector("#connect-midi"),
		midiStatus: document.querySelector("#midi-status"),
		midiBadge: document.querySelector("#midi-status-badge"),
		midiDescription: document.querySelector("#midi-description"),
		devicePicker: document.querySelector("#device-picker-wrap"),
		deviceSelect: document.querySelector("#midi-device-select"),
		studioNav: document.querySelector("#studio-nav"),
		lessonsNav: document.querySelector("#lessons-nav"),
		gamesNav: document.querySelector("#games-nav"),
		gameHub: document.querySelector("#games"),
		lessonShell: document.querySelector("#keyboard-explorer"),
		chordLesson: document.querySelector("#chord-lesson"),
		openKeyboardLesson: document.querySelector("#open-keyboard-lesson"),
		openChordLesson: document.querySelector("#open-chord-lesson"),
		tourView: document.querySelector("#tour-view"),
		assessmentView: document.querySelector("#assessment-view"),
		tourProgressLabel: document.querySelector("#tour-progress-label"),
		tourProgressCount: document.querySelector("#tour-progress-count"),
		tourProgress: document.querySelector("#tour-progress"),
		tourProgressFill: document.querySelector("#tour-progress-fill"),
		lessonMarker: document.querySelector("#lesson-step-marker"),
		lessonStepNumber: document.querySelector("#lesson-step-number"),
		lessonStepTitle: document.querySelector("#lesson-step-title"),
		lessonDescription: document.querySelector("#lesson-step-description"),
		lessonCallout: document.querySelector("#lesson-callout"),
		lessonVisual: document.querySelector("#lesson-visual"),
		lessonTask: document.querySelector("#lesson-task"),
		tourBack: document.querySelector("#tour-back"),
		tourNext: document.querySelector("#tour-next"),
		tourHint: document.querySelector("#tour-hint"),
		lessonExit: document.querySelector("#lesson-exit"),
		questionList: document.querySelector("#question-list"),
		practicalStatus: document.querySelector("#practical-status"),
		submitAssessment: document.querySelector("#submit-assessment"),
		assessmentBack: document.querySelector("#assessment-back"),
		assessmentResult: document.querySelector("#assessment-result")
	};

	const state = {
		root: 0,
		notation: "sharp",
		startMidi: 48,
		selectedMidi: 48,
		pressedMidi: new Set(),
		audioContext: null,
		decodedSamples: new Map(),
		activeVoices: new Map(),
		midiNoteTokens: new Map(),
		virtualAudioEnabled: true,
		midiAccess: null,
		activeInput: null,
		midiSupported: "requestMIDIAccess" in navigator,
		midiGranted: false,
		isRefreshingDevices: false,
		lessonOpen: false,
		tourStep: 0,
		tourFindings: new Set(),
		octaveCs: new Set(),
		returnToAssessment: false,
		practicalComplete: false,
		assessmentSubmitted: false,
		chordPractice: new Set()
	};

	function midiToPitchClass(midi) {
		return ((midi % 12) + 12) % 12;
	}

	function midiToOctave(midi) {
		return Math.floor(midi / 12) - 1;
	}

	function getSampleFilename(midi) {
		const sampleNote = NOTE_LETTERS[midiToPitchClass(midi)].replace("♯", "s");
		return `INSPiano_Vel04_${sampleNote}${midiToOctave(midi)}_01.ogg`;
	}

	function getSampleMapping(midi) {
		if (midi >= SAMPLE_MIN_MIDI && midi <= SAMPLE_MAX_MIDI) {
			return { sampleMidi: midi, playbackRate: 1 };
		}
		if (midi >= 12 && midi < SAMPLE_MIN_MIDI) {
			const sampleMidi = midi + Math.ceil((SAMPLE_MIN_MIDI - midi) / 12) * 12;
			return { sampleMidi, playbackRate: 2 ** ((midi - sampleMidi) / 12) };
		}
		return null;
	}

	function getAudioContext() {
		if (!state.audioContext) {
			const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
			if (!AudioContextConstructor) throw new Error("Web Audio is unavailable in this browser.");
			state.audioContext = new AudioContextConstructor();
		}
		return state.audioContext;
	}

	function resumeAudioFromGesture() {
		if (!state.virtualAudioEnabled) return;
		try {
			const audioContext = getAudioContext();
			if (audioContext.state === "suspended") {
				audioContext.resume().catch((error) => console.error("Unable to resume piano audio.", error));
			}
		} catch (error) {
			console.error("Unable to initialize piano audio.", error);
		}
	}

	async function getDecodedSample(sampleMidi) {
		const audioContext = getAudioContext();
		let samplePromise = state.decodedSamples.get(sampleMidi);
		if (!samplePromise) {
			const sampleUrl = new URL(`${PIANO_SAMPLE_DIRECTORY}${getSampleFilename(sampleMidi)}`, window.location.href);
			samplePromise = fetch(sampleUrl)
				.then((response) => {
					if (!response.ok) throw new Error(`Could not load piano sample ${sampleUrl.pathname} (${response.status}).`);
					return response.arrayBuffer();
				})
				.then((audioData) => {
					if (audioData.byteLength < 4 || String.fromCharCode(...new Uint8Array(audioData, 0, 4)) !== "OggS") {
						throw new Error(`Piano sample ${sampleUrl.pathname} is not a valid OGG stream.`);
					}
					return audioContext.decodeAudioData(audioData);
				});
			state.decodedSamples.set(sampleMidi, samplePromise);
			samplePromise.catch(() => state.decodedSamples.delete(sampleMidi));
		}
		return samplePromise;
	}

	function removeVoice(midi, voice) {
		const voices = state.activeVoices.get(midi);
		if (!voices) return;
		voices.delete(voice);
		if (voices.size === 0) state.activeVoices.delete(midi);
	}

	function releaseVoice(midi, voice) {
		if (voice.ended) return;
		const now = voice.audioContext.currentTime;
		voice.gain.gain.cancelScheduledValues(now);
		voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
		voice.gain.gain.linearRampToValueAtTime(0, now + 0.08);
		voice.source.stop(now + 0.09);
		voice.ended = true;
		removeVoice(midi, voice);
	}

	function releaseMidiNote(midi) {
		const voices = state.activeVoices.get(midi);
		if (voices) Array.from(voices).filter((voice) => voice.midiHeld).forEach((voice) => releaseVoice(midi, voice));
	}

	function releaseAllPianoNotes() {
		state.activeVoices.forEach((voices, midi) => {
			Array.from(voices).forEach((voice) => releaseVoice(midi, voice));
		});
	}

	async function playPianoNote(midi, options = {}) {
		if (!state.virtualAudioEnabled) return false;
		const mapping = getSampleMapping(midi);
		if (!mapping) return false;
		try {
			const audioContext = getAudioContext();
			if (audioContext.state === "suspended") await audioContext.resume();
			const buffer = await getDecodedSample(mapping.sampleMidi);
			if (!state.virtualAudioEnabled || (options.isCurrent && !options.isCurrent())) return false;

			const source = audioContext.createBufferSource();
			const gain = audioContext.createGain();
			const now = audioContext.currentTime;
			const voice = { audioContext, source, gain, ended: false, midiHeld: Boolean(options.isCurrent) };
			source.buffer = buffer;
			source.playbackRate.value = mapping.playbackRate;
			gain.gain.setValueAtTime(0, now);
			gain.gain.linearRampToValueAtTime(0.8, now + 0.012);
			source.connect(gain);
			gain.connect(audioContext.destination);
			if (!state.activeVoices.has(midi)) state.activeVoices.set(midi, new Set());
			state.activeVoices.get(midi).add(voice);
			source.addEventListener("ended", () => {
				voice.ended = true;
				removeVoice(midi, voice);
			}, { once: true });
			source.start();
			return true;
		} catch (error) {
			console.error(`Unable to play piano note MIDI ${midi}.`, error);
			return false;
		}
	}

	function nextMidiNoteToken(midi) {
		const token = (state.midiNoteTokens.get(midi) || 0) + 1;
		state.midiNoteTokens.set(midi, token);
		return token;
	}

	function getNoteName(midi, notation = state.notation) {
		const names = notation === "flat" ? FLAT_NAMES : SHARP_NAMES;
		return `${names[midiToPitchClass(midi)]}${midiToOctave(midi)}`;
	}

	function getScalePitchClasses(root = state.root) {
		return new Set(MAJOR_PATTERN.map((step) => (root + step) % 12));
	}

	function getScaleDegree(midi) {
		const interval = (midiToPitchClass(midi) - state.root + 12) % 12;
		const degreeIndex = MAJOR_PATTERN.indexOf(interval);
		return degreeIndex === -1 ? null : DEGREE_NAMES[degreeIndex];
	}

	function noteIsInScale(midi) {
		return getScalePitchClasses().has(midiToPitchClass(midi));
	}

	function populateSelectors() {
		NOTE_LETTERS.forEach((name, pitchClass) => {
			const option = document.createElement("option");
			option.value = String(pitchClass);
			option.textContent = name;
			elements.root.append(option);
		});
		for (let octave = 0; octave <= 6; octave += 1) {
			const option = document.createElement("option");
			option.value = String((octave + 1) * 12);
			option.textContent = `C${octave} – C${octave + 2}`;
			elements.octave.append(option);
		}
		elements.root.value = "0";
		elements.octave.value = String(state.startMidi);
	}

	function getKeyboardMidiNotes() {
		return Array.from({ length: 25 }, (_, index) => state.startMidi + index)
			.filter((midi) => midi >= MIDI_MIN && midi <= MIDI_MAX);
	}

	function getWhiteKeyIndex(midi) {
		const notesBefore = midi - state.startMidi;
		let whiteIndex = 0;
		for (let offset = 0; offset < notesBefore; offset += 1) {
			if (WHITE_PITCH_CLASSES.has(midiToPitchClass(state.startMidi + offset))) whiteIndex += 1;
		}
		return whiteIndex;
	}

	function renderKeyboard() {
		const notes = getKeyboardMidiNotes();
		const scalePitches = getScalePitchClasses();
		elements.keyboard.replaceChildren();
		elements.keyboard.style.width = `calc(${Math.max(15, notes.filter((midi) => WHITE_PITCH_CLASSES.has(midiToPitchClass(midi))).length)} * var(--white-key-width))`;

		notes.forEach((midi) => {
			const pitchClass = midiToPitchClass(midi);
			const isWhite = WHITE_PITCH_CLASSES.has(pitchClass);
			const key = document.createElement("button");
			const noteName = getNoteName(midi);
			key.type = "button";
			key.className = `piano-key ${isWhite ? "white" : "black"} ${scalePitches.has(pitchClass) ? "in-scale" : "out-scale"}`;
			key.dataset.midi = String(midi);
			key.setAttribute("aria-label", `${noteName}, MIDI ${midi}${scalePitches.has(pitchClass) ? ", in selected scale" : ", outside selected scale"}`);
			key.setAttribute("aria-pressed", String(state.selectedMidi === midi));
			if (state.selectedMidi === midi) key.classList.add("selected");
			if (state.pressedMidi.has(midi)) key.classList.add("pressed");
			const whiteIndex = getWhiteKeyIndex(midi);
			key.style.left = isWhite
				? `calc(${whiteIndex} * var(--white-key-width))`
				: `calc(${whiteIndex} * var(--white-key-width))`;
			key.innerHTML = `<span class="key-label">${noteName.replace(/\d+$/, "")}<span class="key-octave">${midiToOctave(midi)}</span></span>`;
			key.addEventListener("click", () => {
				selectNote(midi);
				playPianoNote(midi);
			});
			elements.keyboard.append(key);
		});

		const firstNote = getNoteName(state.startMidi);
		const lastNote = getNoteName(state.startMidi + 24);
		elements.keyboardRange.textContent = `${firstNote} – ${lastNote}`;
		updateScaleSummary();
		updateNoteInfo(state.selectedMidi);
		applyLessonHighlights();
	}

	function getScaleSpelling(pitchClass) {
		const names = state.notation === "flat" ? FLAT_NAMES : SHARP_NAMES;
		return names[pitchClass];
	}

	function updateScaleSummary() {
		const rootName = getScaleSpelling(state.root);
		Array.from(elements.root.options).forEach((option) => {
			option.textContent = getScaleSpelling(Number(option.value));
		});
		const scalePitches = MAJOR_PATTERN.map((step) => getScaleSpelling((state.root + step) % 12));
		elements.scaleTitle.textContent = `${rootName} Major`;
		elements.scaleNotes.textContent = scalePitches.join(" · ");
	}

	function selectNote(midi, source = "virtual") {
		state.selectedMidi = midi;
		updateNoteInfo(midi);
		updateKeyStates();
		recordLessonSelection(midi, source);
		document.dispatchEvent(new CustomEvent("melodylab:note", { detail: { midi, source, phase: "on" } }));
	}

	function updateNoteInfo(midi) {
		const inScale = noteIsInScale(midi);
		const degree = getScaleDegree(midi);
		const rootName = getScaleSpelling(state.root);
		elements.noteName.textContent = getNoteName(midi);
		elements.noteMidi.textContent = `MIDI ${midi} · Octave ${midiToOctave(midi)}`;
		elements.noteMembership.classList.toggle("outside", !inScale);
		elements.noteMembership.innerHTML = `<i></i> ${inScale ? `In ${rootName} Major` : "Outside selected scale"}${degree ? ` <span class="degree-label">· ${degree} degree</span>` : ""}`;
	}

	function updateKeyStates() {
		elements.keyboard.querySelectorAll(".piano-key").forEach((key) => {
			const midi = Number(key.dataset.midi);
			const isSelected = midi === state.selectedMidi;
			const isPressed = state.pressedMidi.has(midi);
			key.classList.toggle("selected", isSelected);
			key.classList.toggle("pressed", isPressed);
			key.setAttribute("aria-pressed", String(isSelected || isPressed));
		});
		applyLessonHighlights();
	}

	function lessonFocusPitchClasses() {
		if (!state.lessonOpen || elements.tourView.hidden || state.tourStep === 0 || state.tourStep === 1 || state.tourStep === 6) return null;
		if (state.tourStep === 2) return new Set([0, 1, 3, 6, 7, 8, 10]);
		if (state.tourStep === 3) return new Set([0, 1, 4, 5, 11]);
		if (state.tourStep === 4) return new Set([0, 1, 2, 3, 4]);
		if (state.tourStep === 5) return new Set([0]);
		return null;
	}

	function applyLessonHighlights() {
		const focusedPitchClasses = lessonFocusPitchClasses();
		elements.keyboard.querySelectorAll(".piano-key").forEach((key) => {
			const midi = Number(key.dataset.midi);
			const focused = focusedPitchClasses?.has(midiToPitchClass(midi)) || false;
			key.classList.toggle("lesson-highlight", focused);
			key.classList.toggle("lesson-dim", Boolean(focusedPitchClasses) && !focused);
			key.classList.toggle("lesson-selected", focused && midi === state.selectedMidi);
		});
	}

	function recordLessonSelection(midi) {
		if (state.lessonOpen && !elements.tourView.hidden) {
			if (state.tourStep === 2) {
				const pitchClass = midiToPitchClass(midi);
				if (pitchClass === 0 || pitchClass === 7) state.tourFindings.add(pitchClass);
				updateTourTask();
			} else if (state.tourStep === 5 && midiToPitchClass(midi) === 0) {
				state.octaveCs.add(midi);
				updateTourTask();
			}
		}
		if (state.lessonOpen && !elements.assessmentView.hidden && midiToPitchClass(midi) === 0) {
			state.practicalComplete = true;
			elements.practicalStatus.textContent = `${getNoteName(midi)} selected · task complete`;
			elements.practicalStatus.classList.add("complete");
			elements.submitAssessment.disabled = false;
		}
		if (state.lessonOpen && !elements.chordLesson.hidden) {
			state.chordPractice.add(midiToPitchClass(midi));
			const expected = [0, 4, 7];
			const present = expected.filter((pitch) => state.chordPractice.has(pitch));
			document.querySelector("#chord-feedback").textContent = `Heard: ${Array.from(state.chordPractice, (pitch) => getScaleSpelling(pitch)).join(" · ") || "none yet"}. C major tones: ${present.length}/3 present${present.length === 3 ? " — complete chord!" : ". Add the missing tone(s)."}`;
		}
	}

	function openLesson() {
		state.lessonOpen = true;
		elements.chordLesson.hidden = true;
		state.returnToAssessment = false;
		elements.gameHub.hidden = true;
		document.querySelector(".hero").hidden = false;
		document.querySelector("#studio").hidden = false;
		document.dispatchEvent(new CustomEvent("melodylab:game-screen", { detail: { screen: "closed" } }));
		state.tourFindings.clear();
		state.octaveCs.clear();
		state.tourStep = 0;
		elements.lessonShell.hidden = false;
		elements.tourView.hidden = false;
		elements.assessmentView.hidden = true;
		document.querySelector("main").classList.add("lesson-active");
		setNavigation("lessons");
		renderTourStep(0);
		elements.lessonShell.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function closeLesson() {
		state.lessonOpen = false;
		state.returnToAssessment = false;
		elements.lessonShell.hidden = true;
		document.querySelector("main").classList.remove("lesson-active");
		setNavigation("studio");
		applyLessonHighlights();
	}

	function updateTourTask() {
		if (state.tourStep === 2) {
			const foundC = state.tourFindings.has(0);
			const foundG = state.tourFindings.has(7);
			elements.lessonTask.textContent = `${foundC ? "C found ✓" : "Find C"}   ·   ${foundG ? "G found ✓" : "Find G"}`;
			elements.tourHint.textContent = foundC && foundG ? "Nice work. Continue when you’re ready." : "Select the highlighted C and G, in either order.";
		} else if (state.tourStep === 5) {
			const octaves = new Set(Array.from(state.octaveCs, midiToOctave));
			elements.lessonTask.textContent = `${Math.min(2, octaves.size)} of 2 different C pitches selected`;
			elements.tourHint.textContent = octaves.size >= 2 ? "You found the octave. Continue when you’re ready." : "Select two C keys at different pitches.";
		}
	}

	function renderTourStep(index) {
		state.tourStep = index;
		const step = TOUR_STEPS[index];
		elements.tourProgressLabel.textContent = index === 0 ? "WELCOME TO THE TOUR" : step.label;
		elements.tourProgressCount.innerHTML = `${index + 1} <span>/ ${TOUR_STEPS.length}</span>`;
		elements.tourProgress.setAttribute("aria-valuenow", String(index + 1));
		elements.tourProgressFill.style.width = `${((index + 1) / TOUR_STEPS.length) * 100}%`;
		elements.lessonMarker.textContent = step.marker;
		elements.lessonStepNumber.textContent = index === 0 ? "A GUIDED TOUR" : step.label;
		elements.lessonStepTitle.textContent = step.title;
		elements.lessonDescription.textContent = step.description;
		elements.lessonCallout.textContent = step.callout;
		elements.lessonVisual.innerHTML = step.visual;
		elements.lessonTask.textContent = step.task;
		elements.tourHint.textContent = state.returnToAssessment
			? "Review this material, then return to the assessment when you’re ready."
			: "Take your time; the keyboard below is part of the lesson.";
		elements.tourBack.disabled = index === 0;
		elements.tourNext.innerHTML = state.returnToAssessment
			? 'Back to assessment <span aria-hidden="true">→</span>'
			: index === 0
				? 'Start Tour <span aria-hidden="true">→</span>'
				: index === TOUR_STEPS.length - 1
					? 'Begin assessment <span aria-hidden="true">→</span>'
					: 'Next <span aria-hidden="true">→</span>';
		if (index === 2 || index === 5) updateTourTask();
		applyLessonHighlights();
	}

	function handleTourNext() {
		if (state.returnToAssessment) {
			showAssessment();
			return;
		}
		if (state.tourStep === 0) {
			renderTourStep(1);
			return;
		}
		if (state.tourStep === 2 && (!state.tourFindings.has(0) || !state.tourFindings.has(7))) {
			elements.tourHint.textContent = "Before continuing, select both C and G on the keyboard. MIDI is optional.";
			return;
		}
		if (state.tourStep === 5 && new Set(Array.from(state.octaveCs, midiToOctave)).size < 2) {
			elements.tourHint.textContent = "Choose two C keys at different pitches. You can click the virtual keys.";
			return;
		}
		if (state.tourStep === TOUR_STEPS.length - 1) {
			beginAssessment();
			return;
		}
		renderTourStep(state.tourStep + 1);
	}

	function renderAssessmentQuestions() {
		elements.questionList.replaceChildren();		
		ASSESSMENT_QUESTIONS.forEach((question, questionIndex) => {
			const card = document.createElement("section");
			card.className = "question-card";
			card.dataset.question = String(questionIndex);
			const heading = document.createElement("div");
			heading.className = "question-heading";
			heading.innerHTML = `<span class="question-number">${questionIndex + 1}</span><h4>${question.title}</h4><span class="question-points">10 PTS</span>`;
			const options = document.createElement("div");
			options.className = "question-options";
			question.options.forEach((optionText, optionIndex) => {
				const label = document.createElement("label");
				label.className = "question-option";
				const input = document.createElement("input");
				input.type = question.type;
				input.name = `question-${questionIndex}`;
				input.value = optionText;
				input.id = `question-${questionIndex}-option-${optionIndex}`;
				if (question.type === "checkbox") input.setAttribute("aria-label", optionText);
				const text = document.createElement("span");
				text.textContent = optionText;
				label.append(input, text);
				options.append(label);
			});
			card.append(heading, options);
			elements.questionList.append(card);
		});
	}

	function beginAssessment() {
		state.returnToAssessment = false;
		state.practicalComplete = false;
		elements.tourView.hidden = true;
		elements.assessmentView.hidden = false;
		elements.assessmentResult.hidden = true;
		elements.submitAssessment.disabled = true;
		elements.practicalStatus.textContent = "Waiting for you to select a C key.";
		elements.practicalStatus.classList.remove("complete");
		renderAssessmentQuestions();
		applyLessonHighlights();
		elements.assessmentView.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function showAssessment() {
		state.returnToAssessment = false;
		elements.tourView.hidden = true;
		elements.assessmentView.hidden = false;
		applyLessonHighlights();
		elements.assessmentView.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function goBackToTour() {
		state.returnToAssessment = false;
		renderTourStep(6);
		elements.assessmentView.hidden = true;
		elements.tourView.hidden = false;
		applyLessonHighlights();
		elements.lessonShell.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function readQuestionAnswer(index, type) {
		const checked = Array.from(elements.questionList.querySelectorAll(`[name="question-${index}"]:checked`)).map((input) => input.value);
		return type === "checkbox" ? checked.sort() : checked[0] || "";
	}

	function answerIsCorrect(actual, expected) {
		if (!Array.isArray(expected)) return actual === expected;
		return Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected.slice().sort()[index]);
	}

	function submitAssessment() {
		const cards = Array.from(elements.questionList.querySelectorAll(".question-card"));
		let firstUnanswered = null;
		cards.forEach((card, index) => {
			const answer = readQuestionAnswer(index, ASSESSMENT_QUESTIONS[index].type);
			card.classList.remove("needs-answer", "correct", "incorrect");
			if (Array.isArray(answer) ? answer.length === 0 : !answer) {
				card.classList.add("needs-answer");
				firstUnanswered ||= card;
			}
		});
		if (!state.practicalComplete) {
			elements.practicalStatus.textContent = "Select a C key on the physical or virtual keyboard to complete question 10.";
			if (!firstUnanswered) elements.practicalStatus.focus?.();
			firstUnanswered ||= document.querySelector("#practical-question");
		}
		if (firstUnanswered) {
			firstUnanswered.scrollIntoView({ behavior: "smooth", block: "center" });
			return;
		}

		let score = 100;
		const missedConcepts = new Map();
		ASSESSMENT_QUESTIONS.forEach((question, index) => {
			const actual = readQuestionAnswer(index, question.type);
			const correct = answerIsCorrect(actual, question.correct);
			cards[index].classList.add(correct ? "correct" : "incorrect");
			if (!correct) {
				score -= 10;
				missedConcepts.set(question.concept, question.step);
			}
		});
		if (!state.practicalComplete) score -= 10;
		renderAssessmentResult(score, missedConcepts);
	}

	function renderAssessmentResult(score, missedConcepts) {
		const passed = score >= 90;
		elements.assessmentResult.hidden = false;
		elements.assessmentResult.classList.toggle("failed", !passed);
		const heading = passed ? "Assessment passed" : "Keep exploring; you’re close";
		const message = passed
			? "Great work. You reached the 90-point passing score."
			: "You need 90 points to pass. Review the concepts below, then retake the assessment whenever you’re ready.";
		const reviews = Array.from(missedConcepts, ([concept, step]) => `<button class="review-button" type="button" data-step="${step}">Review ${concept}</button>`).join("");
		const reviewContent = missedConcepts.size
			? `<p>${passed ? "You passed. These concepts could use another look:" : "Concepts to review:"}</p><div class="review-list">${reviews}</div>`
			: "<p>Nothing to review. You answered every concept correctly.</p>";
		elements.assessmentResult.innerHTML = `<span class="result-score">${score}<small> / 100</small></span><h4>${heading}</h4><p>${message}</p>${reviewContent}<div class="result-actions"><button class="primary-button" type="button" data-action="retake">Retake assessment <span aria-hidden="true">↻</span></button><button class="secondary-button" type="button" data-action="recap">Back to lesson recap</button></div>`;
		elements.assessmentResult.querySelectorAll(".review-button").forEach((button) => {
			button.addEventListener("click", () => {
				state.returnToAssessment = true;
				renderTourStep(Number(button.dataset.step));
				elements.assessmentView.hidden = true;
				elements.tourView.hidden = false;
				applyLessonHighlights();
				elements.lessonShell.scrollIntoView({ behavior: "smooth", block: "start" });
			});
		});
		elements.assessmentResult.querySelector('[data-action="retake"]').addEventListener("click", retakeAssessment);
		elements.assessmentResult.querySelector('[data-action="recap"]').addEventListener("click", goBackToTour);
		elements.assessmentResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}

	function retakeAssessment() {
		state.practicalComplete = false;
		elements.questionList.querySelectorAll("input").forEach((input) => { input.checked = false; });
		elements.questionList.querySelectorAll(".question-card").forEach((card) => card.classList.remove("needs-answer", "correct", "incorrect"));
		elements.assessmentResult.hidden = true;
		elements.practicalStatus.textContent = "Waiting for you to select a C key.";
		elements.practicalStatus.classList.remove("complete");
		elements.submitAssessment.disabled = true;
		showAssessment();
	}

	function handleScaleChange() {
		state.root = Number(elements.root.value);
		state.notation = elements.notation.value;
		renderKeyboard();
	}

	function setMidiStatus(message, kind = "") {
		elements.midiStatus.textContent = message;
		elements.midiBadge.classList.toggle("connected", kind === "connected");
		elements.midiBadge.classList.toggle("error", kind === "error");
		document.dispatchEvent(new CustomEvent("melodylab:midi-status", {
			detail: { message, kind, connected: Boolean(state.activeInput) }
		}));
	}

	function setMidiUnavailableMessage() {
		setMidiStatus("Unavailable", "error");
		elements.midiDescription.textContent = "Web MIDI is unavailable in this browser or page context. Try a current desktop browser over localhost; the scale explorer remains ready to use.";
		elements.connectButton.disabled = true;
		elements.connectButton.textContent = "MIDI unavailable";
	}

	function detachInput(input) {
		if (input) input.removeEventListener("midimessage", handleMidiMessage);
	}

	function selectMidiInput(input) {
		detachInput(state.activeInput);
		state.pressedMidi.clear();
		state.activeInput = input || null;
		if (state.activeInput) {
			state.activeInput.addEventListener("midimessage", handleMidiMessage);
			setMidiStatus("Connected", "connected");
			elements.midiDescription.textContent = `${state.activeInput.name || "MIDI input"} is ready. Press a key to see its note here. Melody Lab does not generate audio or route MIDI to other apps.`;
		} else if (state.midiGranted) {
			setMidiStatus("No input selected");
			elements.midiDescription.textContent = "No MIDI input is currently available. Connect your controller, then choose it here.";
		}
		updateKeyStates();
	}

	function refreshMidiDevices() {
		if (!state.midiAccess || state.isRefreshingDevices) return;
		state.isRefreshingDevices = true;
		const inputs = Array.from(state.midiAccess.inputs.values()).filter((input) => input.state !== "disconnected");
		const previousId = state.activeInput?.id || elements.deviceSelect.value;
		elements.deviceSelect.replaceChildren();

		inputs.forEach((input) => {
			const option = document.createElement("option");
			option.value = input.id;
			option.textContent = input.name || `MIDI input ${input.id}`;
			elements.deviceSelect.append(option);
		});
		elements.devicePicker.classList.toggle("visible", inputs.length > 0);
		elements.deviceSelect.disabled = inputs.length < 2;

		if (inputs.length === 0) {
			const option = document.createElement("option");
			option.value = "";
			option.textContent = "No device detected";
			elements.deviceSelect.append(option);
			selectMidiInput(null);
			if (state.midiGranted) setMidiStatus("Waiting for device");
		} else {
			const input = inputs.find((candidate) => candidate.id === previousId) || inputs[0];
			elements.deviceSelect.value = input.id;
			selectMidiInput(input);
		}
		state.isRefreshingDevices = false;
	}

	function handleMidiMessage(event) {
		const [status, noteNumber, velocity] = event.data;
		const command = status & 0xf0;
		if (noteNumber > MIDI_MAX || (command !== 0x90 && command !== 0x80)) return;

		if (command === 0x90 && velocity > 0) {
			const token = nextMidiNoteToken(noteNumber);
			state.pressedMidi.add(noteNumber);
			selectNote(noteNumber, "midi");
			playPianoNote(noteNumber, {
				isCurrent: () => state.midiNoteTokens.get(noteNumber) === token
			});
		} else {
			nextMidiNoteToken(noteNumber);
			state.pressedMidi.delete(noteNumber);
			releaseMidiNote(noteNumber);
			updateKeyStates();
			document.dispatchEvent(new CustomEvent("melodylab:note", { detail: { midi: noteNumber, source: "midi", phase: "off" } }));
		}
	}

	async function connectMidi() {
		if (!state.midiSupported) {
			setMidiUnavailableMessage();
			return;
		}
		resumeAudioFromGesture();
		elements.connectButton.disabled = true;
		setMidiStatus("Requesting access");
		elements.midiDescription.textContent = "Waiting for browser MIDI permission…";
		try {
			state.midiAccess = await navigator.requestMIDIAccess();
			state.midiGranted = true;
			state.midiAccess.addEventListener("statechange", refreshMidiDevices);
			elements.connectButton.disabled = false;
			elements.connectButton.textContent = "Refresh devices";
			refreshMidiDevices();
			if (state.midiAccess.inputs.size === 0) {
				setMidiStatus("Waiting for device");
				elements.midiDescription.textContent = "Access granted, but no MIDI input is detected. Plug in your MiniLab and use Refresh devices.";
			}
		} catch (error) {
			elements.connectButton.disabled = false;
			setMidiStatus(error?.name === "NotAllowedError" ? "Permission denied" : "MIDI error", "error");
			elements.midiDescription.textContent = error?.name === "NotAllowedError"
				? "MIDI access was denied. Allow MIDI access in your browser's site settings and try again."
				: `Could not access MIDI${error?.message ? `: ${error.message}` : ". Check browser support and try again."}`;
		}
	}

	function handleDeviceSelection() {
		const selected = state.midiAccess?.inputs.get(elements.deviceSelect.value);
		selectMidiInput(selected || null);
	}

	function initializeLesson() {
		elements.lessonsNav.addEventListener("click", (event) => {
			event.preventDefault();
			openLesson();
		});
		elements.lessonExit.addEventListener("click", closeLesson);
		elements.openKeyboardLesson.addEventListener("click", () => { elements.chordLesson.hidden = true; elements.tourView.hidden = false; elements.assessmentView.hidden = true; });
		elements.openChordLesson.addEventListener("click", () => { elements.chordLesson.hidden = false; elements.tourView.hidden = true; elements.assessmentView.hidden = true; state.chordPractice.clear(); });
		const chords = { C: [60,64,67], Am: [57,60,64], Cmaj7: [60,64,67,71], Am7: [57,60,64,67], Fmaj7: [53,57,60,64], G7: [55,59,62,65] };
		const voicings = [[48,52,55],[52,55,60],[55,60,64]];
		const playSequence = (notes) => notes.forEach((midi) => playPianoNote(midi));
		document.querySelectorAll("[data-note]").forEach((button) => button.addEventListener("click", () => playPianoNote(Number(button.dataset.note))));
		document.querySelectorAll("[data-chord]").forEach((button) => button.addEventListener("click", () => { state.chordPractice.clear(); playSequence(chords[button.dataset.chord]); }));
		document.querySelectorAll("[data-voicing]").forEach((button) => button.addEventListener("click", () => { state.chordPractice.clear(); playSequence(voicings[Number(button.dataset.voicing)]); document.querySelector("#chord-feedback").textContent = `Playing ${button.textContent}. Bass: ${getNoteName(voicings[Number(button.dataset.voicing)][0])}.`; }));
		document.querySelector("#compare-voicings").addEventListener("click", () => { playSequence(voicings[0]); window.setTimeout(() => playSequence(voicings[1]), 1200); });
		elements.tourBack.addEventListener("click", () => {
			if (state.tourStep > 0) renderTourStep(state.tourStep - 1);
		});
		elements.tourNext.addEventListener("click", handleTourNext);
		elements.assessmentBack.addEventListener("click", goBackToTour);
		elements.submitAssessment.addEventListener("click", submitAssessment);
	}

	function setNavigation(active) {
		elements.studioNav.classList.toggle("active", active === "studio");
		elements.lessonsNav.classList.toggle("active", active === "lessons");
		elements.gamesNav.classList.toggle("active", active === "games");
	}

	function initializeGamesNavigation() {
		elements.gamesNav.addEventListener("click", (event) => {
			event.preventDefault();
			state.lessonOpen = false;
			elements.lessonShell.hidden = true;
			elements.gameHub.hidden = false;
			document.querySelector(".hero").hidden = true;
			document.querySelector("#studio").hidden = true;
			elements.tourView.hidden = false;
			elements.assessmentView.hidden = true;
			document.querySelector("#game-lobby").hidden = false;
			document.querySelector("#game-session").hidden = true;
			setNavigation("games");
			document.dispatchEvent(new CustomEvent("melodylab:game-screen", { detail: { screen: "lobby" } }));
		});
		elements.studioNav.addEventListener("click", (event) => {
			event.preventDefault();
			state.lessonOpen = false;
			elements.lessonShell.hidden = true;
			elements.gameHub.hidden = true;
			document.querySelector(".hero").hidden = false;
			document.querySelector("#studio").hidden = false;
			setNavigation("studio");
			document.dispatchEvent(new CustomEvent("melodylab:game-screen", { detail: { screen: "closed" } }));
		});
	}

	function initialize() {
		populateSelectors();
		initializeLesson();
		initializeGamesNavigation();
		elements.root.addEventListener("change", handleScaleChange);
		elements.scale.addEventListener("change", handleScaleChange);
		elements.notation.addEventListener("change", handleScaleChange);
		elements.octave.addEventListener("change", () => {
			state.startMidi = Number(elements.octave.value);
			state.selectedMidi = state.startMidi;
			renderKeyboard();
		});
		elements.connectButton.addEventListener("click", connectMidi);
		elements.deviceSelect.addEventListener("change", handleDeviceSelection);
		elements.keyboardAudioEnabled.addEventListener("change", () => {
			state.virtualAudioEnabled = elements.keyboardAudioEnabled.checked;
			if (state.virtualAudioEnabled) resumeAudioFromGesture();
			else releaseAllPianoNotes();
		});
		if (!state.midiSupported) setMidiUnavailableMessage();
		renderKeyboard();
	}

	initialize();

	// Pure helpers are exposed for lightweight browser-console verification.
	window.MelodyLab = Object.freeze({
		getNoteName,
		getScalePitchClasses,
		getScaleDegree,
		midiToOctave,
		playNote: playPianoNote,
		majorPattern: MAJOR_PATTERN.slice()
	});
})();
