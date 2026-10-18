(() => {
	"use strict";

	const ASSET_ROOT = "game 1/freetileset/png/";
	const NATURAL_NOTES = [0, 2, 4, 5, 7, 9, 11];
	const SHARP_NOTES = [1, 3, 6, 8, 10];
	const FOOTSTEP_INTERVAL = 0.24;
	const NOTE_NAMES = {
		sharp: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"],
		flat: ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"]
	};
	const TILE_FUNCTIONS = ["food", "ladder", "spring", "shield"];
	const IMAGE_PATHS = {
		background: "BG/BG.png",
		grass: "Tiles/1.png",
		dirt: "Tiles/5.png",
		platformLeft: "Tiles/13.png",
		platformMiddle: "Tiles/14.png",
		platformRight: "Tiles/15.png",
		bushA: "Object/Bush (1).png",
		bushB: "Object/Bush (2).png",
		bushC: "Object/Bush (3).png",
		bushD: "Object/Bush (4).png",
		crate: "Object/Crate.png",
		mushroomA: "Object/Mushroom_1.png",
		mushroomB: "Object/Mushroom_2.png",
		stone: "Object/Stone.png",
		treeA: "Object/Tree_2.png",
		treeB: "Object/Tree_3.png"
	};
	const images = Object.fromEntries(Object.entries(IMAGE_PATHS).map(([name, path]) => {
		const image = new Image();
		image.src = `${ASSET_ROOT}${path}`;
		return [name, image];
	}));

	const ui = {
		gamesNav: document.querySelector("#games-nav"),
		studioNav: document.querySelector("#studio-nav"),
		studio: document.querySelector("#studio"),
		hero: document.querySelector(".hero"),
		hub: document.querySelector("#games"),
		lobby: document.querySelector("#game-lobby"),
		session: document.querySelector("#game-session"),
		canvas: document.querySelector("#runner-canvas"),
		frame: document.querySelector("#runner-frame"),
		practice: document.querySelector("#runner-practice"),
		notation: document.querySelector("#runner-notation"),
		start: document.querySelector("#runner-start"),
		restart: document.querySelector("#runner-restart"),
		restartOverlay: document.querySelector("#runner-restart-overlay"),
		returnLobby: document.querySelector("#runner-return-lobby"),
		returnSession: document.querySelector("#runner-return"),
		connectMidi: document.querySelector("#runner-midi-connect"),
		midiBadge: document.querySelector("#runner-midi-badge"),
		midiStatus: document.querySelector("#runner-midi-status"),
		modeLabel: document.querySelector("#runner-mode-label"),
		mute: document.querySelector("#runner-mute"),
		feedback: document.querySelector("#runner-feedback"),
		midiDetail: document.querySelector("#runner-midi-detail"),
		gameOver: document.querySelector("#runner-gameover"),
		gameOverCopy: document.querySelector("#runner-gameover-copy"),
		keyboardMount: document.querySelector("#game-keyboard-mount"),
		keyboardPanel: document.querySelector(".keyboard-panel"),
		keyboardAnchor: document.querySelector("#keyboard-home-anchor"),
		health: document.querySelector("#hud-health"),
		healthValue: document.querySelector("#hud-health-value"),
		hunger: document.querySelector("#hud-hunger"),
		hungerValue: document.querySelector("#hud-hunger-value"),
		power: document.querySelector("#hud-power"),
		powerValue: document.querySelector("#hud-power-value"),
		score: document.querySelector("#hud-score-value")
	};
	const context = ui.canvas.getContext("2d");
	const state = {
		active: false,
		gameOver: false,
		practice: true,
		preferFlats: false,
		muted: false,
		midiConnected: false,
		midiStatusText: "Not connected",
		width: 0,
		height: 0,
		dpr: 1,
		time: 0,
		lastFrame: 0,
		frameId: 0,
		worldX: 160,
		nextSectionX: 0,
		sectionIndex: 0,
		sections: [],
		tiles: [],
		decorations: [],
		player: { height: 52, z: 0, velocity: 0, platform: null, climbing: null, springAt: null, falling: false, fallElapsed: 0 },
		health: 100,
		hunger: 100,
		power: 0,
		score: 0,
		shieldUntil: 0,
		feedbackUntil: 0,
		feedbackText: "Ready when you are.",
		feedbackKind: "",
		currentTileKey: "",
		pressedMidi: new Set(),
		footClock: 0,
		footIndex: 0,
		audio: null,
		keyboardHomeParent: ui.keyboardPanel.parentElement
	};

	function pitchClass(midi) {
		return ((midi % 12) + 12) % 12;
	}

	function noteName(midi) {
		return NOTE_NAMES[state.preferFlats ? "flat" : "sharp"][pitchClass(midi)];
	}

	function randomNote() {
		const notes = NATURAL_NOTES.slice();
		const sharpCount = Math.min(SHARP_NOTES.length, Math.floor(state.score / 500));
		for (let index = 0; index < sharpCount; index += 1) notes.push(SHARP_NOTES[index]);
		return notes[Math.floor(Math.random() * notes.length)];
	}

	function imageReady(name) {
		return images[name]?.complete && images[name].naturalWidth > 0;
	}

	function loadImage(name, x, y, width, height) {
		if (imageReady(name)) context.drawImage(images[name], x, y, width, height);
	}

	function resizeCanvas() {
		const rect = ui.canvas.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		state.width = rect.width;
		state.height = rect.height;
		state.dpr = Math.min(2, window.devicePixelRatio || 1);
		ui.canvas.width = Math.round(state.width * state.dpr);
		ui.canvas.height = Math.round(state.height * state.dpr);
		context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
		if (state.active) render();
	}

	function groundY() {
		return state.height * 0.78;
	}

	function createSection() {
		const start = state.nextSectionX;
		const index = state.sectionIndex;
		const width = 900;
		const hasGap = index >= 3 && index % 5 === 3;
		const gap = hasGap ? { start: start + 765, end: start + 833 } : null;
		const section = { start, end: start + width, gap, platform: null };
		if (!gap && index > 0 && index % 3 === 1) {
			section.platform = { start: start + 485, end: start + 677, rise: 106, y: 0 };
		}
		state.sections.push(section);

		const decorNames = ["bushA", "bushB", "bushC", "bushD", "mushroomA", "mushroomB", "crate", "stone"];
		state.decorations.push({ x: start + 125, asset: decorNames[(index * 3 + 1) % decorNames.length] });
		state.decorations.push({ x: start + 810, asset: decorNames[(index * 5 + 3) % decorNames.length] });
		if (index % 2 === 0) state.decorations.push({ x: start + 335, asset: index % 4 === 0 ? "treeA" : "treeB" });

		if (section.platform) {
			state.tiles.push({ x: section.platform.start + 26, type: "ladder", note: randomNote(), used: false, platform: section.platform, yOffset: -142, wrongUntil: 0, pulse: 0 });
		} else {
			const type = TILE_FUNCTIONS[index % TILE_FUNCTIONS.length];
			state.tiles.push({ x: gap ? start + 25 : start + 485, type, note: randomNote(), used: false, platform: null, yOffset: -154, wrongUntil: 0, pulse: 0 });
		}
		if (gap) {
			state.tiles.push({ x: gap.start - 182, type: "spring", note: randomNote(), used: false, gap, platform: null, yOffset: -142, wrongUntil: 0, pulse: 0 });
		}

		state.sectionIndex += 1;
		state.nextSectionX += width;
	}

	function ensureWorld() {
		while (state.nextSectionX < state.worldX + state.width + 1800) createSection();
		const keepFrom = state.worldX - 500;
		state.sections = state.sections.filter((section) => section.end > keepFrom);
		state.tiles = state.tiles.filter((tile) => tile.x > keepFrom || !tile.used);
		state.decorations = state.decorations.filter((decor) => decor.x > keepFrom - 300);
	}

	function resetGame() {
		state.practice = ui.practice.checked;
		state.preferFlats = ui.notation.value === "flat";
		state.gameOver = false;
		state.worldX = 160;
		state.nextSectionX = 0;
		state.sectionIndex = 0;
		state.sections = [];
		state.tiles = [];
		state.decorations = [];
		state.player = { height: 52, z: 0, velocity: 0, platform: null, climbing: null, springAt: null, falling: false, fallElapsed: 0 };
		state.health = 100;
		state.hunger = 100;
		state.power = 0;
		state.score = 0;
		state.shieldUntil = 0;
		state.footClock = 0;
		state.footIndex = 0;
		state.pressedMidi.clear();
		state.feedbackText = "Play a nearby tile’s note to interact.";
		state.feedbackKind = "";
		state.feedbackUntil = 0;
		state.currentTileKey = "";
		ui.gameOver.hidden = true;
		ensureWorld();
		updateHud();
	}

	function setFeedback(text, kind = "") {
		state.feedbackText = text;
		state.feedbackKind = kind;
		state.feedbackUntil = performance.now() + 2100;
		ui.feedback.textContent = text;
		ui.feedback.dataset.kind = kind;
	}

	function updateHud() {
		const bars = [[ui.health, ui.healthValue, state.health], [ui.hunger, ui.hungerValue, state.hunger], [ui.power, ui.powerValue, state.power]];
		bars.forEach(([bar, value, amount]) => {
			bar.style.width = `${Math.max(0, amount)}%`;
			value.textContent = `${Math.round(amount)}`;
		});
		ui.score.textContent = String(state.score).padStart(6, "0");
		ui.modeLabel.textContent = state.practice ? "BEGINNER PRACTICE" : "SURVIVAL RUN";
	}

	function roundedRect(x, y, width, height, radius) {
		context.beginPath();
		context.roundRect(x, y, width, height, radius);
	}

	function drawBackground() {
		const width = state.width;
		const height = state.height;
		if (!imageReady("background")) {
			const sky = context.createLinearGradient(0, 0, 0, height);
			sky.addColorStop(0, "#b7eff2");
			sky.addColorStop(1, "#8adea5");
			context.fillStyle = sky;
			context.fillRect(0, 0, width, height);
			return;
		}
		const image = images.background;
		const imageHeight = height;
		const imageWidth = imageHeight * image.naturalWidth / image.naturalHeight;
		const offset = (state.worldX * 0.13) % imageWidth;
		for (let x = -offset; x < width; x += imageWidth) context.drawImage(image, x, 0, imageWidth + 1, imageHeight);
	}

	function drawGround() {
		const floor = groundY();
		const cameraX = state.worldX - playerScreenX();
		const visibleStart = cameraX - 120;
		const visibleEnd = cameraX + state.width + 160;
		const tilesAcross = Math.ceil((visibleEnd - visibleStart) / 64);
		const firstX = Math.floor(visibleStart / 64) * 64;
		context.imageSmoothingEnabled = false;
		for (let index = 0; index < tilesAcross; index += 1) {
			const worldTileX = firstX + index * 64;
			const gap = state.sections.some((section) => section.gap && worldTileX + 64 > section.gap.start && worldTileX < section.gap.end);
			if (gap) continue;
			const screenX = worldTileX - cameraX;
			if (imageReady("grass")) loadImage("grass", screenX, floor, 64, 64);
			else { context.fillStyle = "#72bd3f"; context.fillRect(screenX, floor, 64, 64); }
			for (let dirtRow = 1; dirtRow < 4; dirtRow += 1) {
				if (imageReady("dirt")) loadImage("dirt", screenX, floor + dirtRow * 64, 64, 64);
				else { context.fillStyle = "#815331"; context.fillRect(screenX, floor + dirtRow * 64, 64, 64); }
			}
		}
		context.imageSmoothingEnabled = true;
	}

	function drawPlatforms() {
		const cameraX = state.worldX - playerScreenX();
		const floor = groundY();
		state.sections.forEach((section) => {
			if (!section.platform) return;
			const platform = section.platform;
			const y = floor - platform.rise;
			platform.y = y;
			const x = platform.start - cameraX;
			const width = platform.end - platform.start;
			context.imageSmoothingEnabled = false;
			loadImage("platformLeft", x, y, 64, 47);
			for (let tileX = 64; tileX < width - 64; tileX += 64) loadImage("platformMiddle", x + tileX, y, 64, 47);
			loadImage("platformRight", x + width - 64, y, 64, 47);
			context.imageSmoothingEnabled = true;
		});
	}

	function drawDecorations() {
		const cameraX = state.worldX - playerScreenX();
		state.decorations.forEach((decoration) => {
			const x = decoration.x - cameraX;
			if (x < -330 || x > state.width + 50) return;
			const floor = groundY();
			const sizes = { treeA: [141, 151], treeB: [141, 138], bushA: [67, 33], bushB: [67, 33], bushC: [37, 24], bushD: [37, 23], crate: [39, 39], mushroomA: [25, 21], mushroomB: [25, 21], stone: [45, 27] };
			const [width, height] = sizes[decoration.asset] || [48, 32];
			const y = floor - height;
			if (imageReady(decoration.asset)) loadImage(decoration.asset, x, y, width, height);
			else {
				context.fillStyle = decoration.asset.startsWith("tree") ? "#437d44" : "#76b953";
				context.beginPath(); context.ellipse(x + width / 2, floor - height / 2, width / 2, height / 2, 0, 0, Math.PI * 2); context.fill();
			}
		});
	}

	function drawLadder(x, floor, top) {
		const left = x - 14;
		context.fillStyle = "#85522f";
		context.fillRect(left, top, 7, floor - top);
		context.fillRect(left + 24, top, 7, floor - top);
		context.fillStyle = "#b77b49";
		for (let y = top + 10; y < floor - 2; y += 17) {
			context.fillRect(left + 5, y, 21, 6);
			context.fillStyle = "#d39a5c";
			context.fillRect(left + 6, y, 18, 2);
			context.fillStyle = "#b77b49";
		}
	}

	function drawTileIcon(type, x, y, active) {
		context.save();
		context.translate(x, y);
		context.fillStyle = "#ffffff";
		context.strokeStyle = "#ffffff";
		context.lineWidth = 2;
		if (type === "food") {
			context.fillStyle = "#ed6e67";
			context.beginPath(); context.ellipse(0, 2, 9, 8, 0, 0, Math.PI * 2); context.fill();
			context.fillStyle = "#82cf79";
			context.beginPath(); context.ellipse(4, -7, 4, 2, -.4, 0, Math.PI * 2); context.fill();
		} else if (type === "ladder") {
			context.strokeStyle = "#e0ae76";
			context.beginPath(); context.moveTo(-6, -8); context.lineTo(-6, 9); context.moveTo(6, -8); context.lineTo(6, 9);
			for (let rung = -4; rung <= 7; rung += 6) { context.moveTo(-6, rung); context.lineTo(6, rung); }
			context.stroke();
		} else if (type === "spring") {
			context.strokeStyle = "#8de0b0";
			context.beginPath(); context.moveTo(-10, 7); context.lineTo(-6, 7); context.lineTo(-2, -4); context.lineTo(2, 7); context.lineTo(6, -4); context.lineTo(10, 7); context.stroke();
		} else {
			context.strokeStyle = "#91d9ef";
			context.beginPath(); context.moveTo(0, -10); context.quadraticCurveTo(12, -1, 0, 10); context.quadraticCurveTo(-12, -1, 0, -10); context.stroke();
		}
		if (active) {
			context.strokeStyle = "#ffe0a0";
			context.lineWidth = 2;
			context.beginPath(); context.arc(0, 0, 17, 0, Math.PI * 2); context.stroke();
		}
		context.restore();
	}

	function tileY(tile) {
		const floor = groundY();
		if (tile.platform) return floor - tile.platform.rise - 64;
		return floor + tile.yOffset;
	}

	function drawTiles() {
		const cameraX = state.worldX - playerScreenX();
		const playerX = playerScreenX();
		const now = performance.now();
		state.tiles.forEach((tile) => {
			if (tile.used) return;
			const x = tile.x - cameraX;
			if (x < -100 || x > state.width + 100) return;
			const y = tileY(tile) + Math.sin(state.time * 2.1 + tile.x) * 3;
			const distance = Math.abs(tile.x - state.worldX);
			const near = distance < 370;
			const wrong = tile.wrongUntil > now;
			const width = 62;
			const height = 60;
			context.save();
			context.shadowColor = wrong ? "#ed7868" : near ? "#a8e5c377" : "#17201b99";
			context.shadowBlur = near ? 18 : 7;
			context.fillStyle = wrong ? "#562e2b" : "#18241d";
			roundedRect(x - width / 2, y - height / 2, width, height, 9);
			context.fill();
			context.shadowBlur = 0;
			context.lineWidth = near ? 2 : 1;
			context.strokeStyle = wrong ? "#f18e79" : near ? "#b5edc8" : "#63826b";
			roundedRect(x - width / 2, y - height / 2, width, height, 9);
			context.stroke();
			drawTileIcon(tile.type, x, y + 6, near);
			context.fillStyle = "#f7fff8";
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.font = "700 16px system-ui, sans-serif";
			context.fillText(noteName(tile.note), x, y - 15);
			if (near && distance <= 270) {
				context.fillStyle = "#17231b";
				context.font = "700 8px system-ui, sans-serif";
				context.fillText("PLAY NOTE", x, y + 27);
			}
			context.restore();
		});
	}

	function playerScreenX() {
		return Math.min(210, state.width * 0.26);
	}

	function drawPlayer() {
		const player = state.player;
		const x = playerScreenX();
		const floor = groundY() - player.z;
		const feetY = floor;
		const running = (!player.climbing || player.climbing.phase === "approach") && player.z < 3 && !player.falling;
		const climbing = player.climbing?.phase === "climb";
		const jumping = !player.climbing && player.z > 3 && player.velocity > 0;
		const falling = player.falling || !player.climbing && player.z > 3 && player.velocity <= 0;
		const runPhase = state.time * (Math.PI / FOOTSTEP_INTERVAL);
		const legSwing = running ? Math.sin(runPhase) * 9 : 0;
		const armSwing = running ? Math.sin(runPhase + Math.PI) * 7 : 0;
		context.save();
		context.translate(x, feetY);
		if (state.time < state.shieldUntil) {
			context.strokeStyle = "#a7e8f0bb";
			context.lineWidth = 3;
			context.beginPath(); context.ellipse(0, -31, 25, 34, 0, 0, Math.PI * 2); context.stroke();
		}
		context.strokeStyle = "#314452";
		context.lineWidth = 7;
		context.lineCap = "round";
		if (jumping) {
			context.beginPath(); context.moveTo(-4, -13); context.lineTo(-12, -5); context.lineTo(-7, -2); context.stroke();
			context.beginPath(); context.moveTo(4, -13); context.lineTo(12, -5); context.lineTo(7, -2); context.stroke();
		} else if (falling) {
			context.beginPath(); context.moveTo(-4, -13); context.lineTo(-8, -3); context.lineTo(-14, -1); context.stroke();
			context.beginPath(); context.moveTo(4, -13); context.lineTo(8, -3); context.lineTo(14, -1); context.stroke();
		} else if (climbing) {
			context.beginPath(); context.moveTo(-4, -13); context.lineTo(-10, -6); context.lineTo(-3, -3); context.stroke();
			context.beginPath(); context.moveTo(4, -13); context.lineTo(10, -7); context.lineTo(6, -2); context.stroke();
		} else {
			context.beginPath(); context.moveTo(-4, -13); context.lineTo(-8 + legSwing, -1); context.lineTo(-13 + legSwing, 0); context.stroke();
			context.beginPath(); context.moveTo(4, -13); context.lineTo(8 - legSwing, -1); context.lineTo(13 - legSwing, 0); context.stroke();
		}
		context.fillStyle = "#d78c57";
		context.beginPath(); context.ellipse(0, -29, 13, 16, -.05, 0, Math.PI * 2); context.fill();
		context.fillStyle = "#3e9e92";
		context.beginPath(); context.roundRect(-13, -35, 26, 20, 6); context.fill();
		context.strokeStyle = "#d78c57";
		context.lineWidth = 5;
		if (climbing || jumping) {
			context.beginPath(); context.moveTo(-10, -31); context.lineTo(-17, -44); context.stroke();
			context.beginPath(); context.moveTo(10, -31); context.lineTo(17, -41); context.stroke();
		} else if (falling) {
			context.beginPath(); context.moveTo(-10, -31); context.lineTo(-22, -28); context.stroke();
			context.beginPath(); context.moveTo(10, -31); context.lineTo(22, -28); context.stroke();
		} else {
			context.beginPath(); context.moveTo(-10, -31); context.lineTo(-17 + armSwing, -21); context.stroke();
			context.beginPath(); context.moveTo(10, -31); context.lineTo(17 - armSwing, -21); context.stroke();
		}
		context.fillStyle = "#293f49";
		context.beginPath(); context.ellipse(0, -50, 12, 13, 0, Math.PI, Math.PI * 2); context.fill();
		context.fillStyle = "#19262b";
		context.beginPath(); context.arc(4, -49, 1.5, 0, Math.PI * 2); context.fill();
		context.restore();
	}

	function drawFeedback() {
		const now = performance.now();
		if (now < state.feedbackUntil && state.feedbackKind) {
			context.save();
			context.textAlign = "center";
			context.font = "650 12px system-ui, sans-serif";
			context.fillStyle = state.feedbackKind === "wrong" ? "#ffd2bd" : "#e8fff0";
			context.fillText(state.feedbackText, playerScreenX(), state.height * 0.16);
			context.restore();
		}
	}

	function render() {
		if (!state.width || !state.height) return;
		context.clearRect(0, 0, state.width, state.height);
		drawBackground();
		drawGround();
		drawPlatforms();
		const cameraX = state.worldX - playerScreenX();
		state.sections.forEach((section) => {
			if (section.platform) drawLadder(section.platform.start + 26 - cameraX, groundY(), groundY() - section.platform.rise);
		});
		drawDecorations();
		drawTiles();
		drawPlayer();
		drawFeedback();
	}

	function findNearbyTile(midi) {
		const candidates = state.tiles.filter((tile) => !tile.used
			&& Math.abs(tile.x - state.worldX) <= 285
			&& (!tile.gap || state.worldX <= tile.gap.start - 40));
		if (!candidates.length) return null;
		return candidates.find((tile) => tile.note === pitchClass(midi)) || { mismatch: true, closest: candidates.sort((a, b) => Math.abs(a.x - state.worldX) - Math.abs(b.x - state.worldX))[0] };
	}

	function activateTile(tile) {
		tile.used = true;
		state.score += 100;
		state.power = Math.min(100, state.power + 14);
		if (tile.type === "food") {
			state.hunger = Math.min(100, state.hunger + 32);
			setFeedback(`${noteName(tile.note)} · snack collected · hunger +32`, "correct");
		} else if (tile.type === "ladder" && tile.platform) {
			state.player.climbing = { phase: "approach", elapsed: 0, duration: 0.78, startZ: state.player.z, endZ: tile.platform.rise, targetX: tile.platform.start + 30, platform: tile.platform };
			setFeedback(`${noteName(tile.note)} · climbing`, "correct");
		} else if (tile.type === "spring") {
			state.player.springAt = tile.gap ? tile.gap.start - 12 : state.worldX + 15;
			setFeedback(`${noteName(tile.note)} · spring ready`, "correct");
		} else {
			state.shieldUntil = state.time + 11;
			setFeedback(`${noteName(tile.note)} · shield active`, "correct");
		}
		updateHud();
	}

	function handleGameNote(midi, source) {
		const tile = findNearbyTile(midi);
		const receivedName = noteName(midi);
		if (!tile) {
			setFeedback(`${receivedName} · no note tile in range`, "neutral");
			return;
		}
		if (tile.mismatch) {
			tile.closest.wrongUntil = performance.now() + 620;
			setFeedback(`${receivedName} does not match ${noteName(tile.closest.note)} · try again`, "wrong");
			return;
		}
		activateTile(tile);
	}

	function receiveNote(event) {
		const { midi, source, phase } = event.detail || {};
		if (!Number.isInteger(midi) || !state.active) return;
		if (source === "midi") {
			if (phase === "off") { state.pressedMidi.delete(midi); return; }
			if (state.pressedMidi.has(midi)) return;
			state.pressedMidi.add(midi);
		}
		handleGameNote(midi, source);
	}

	function finishRun(message) {
		if (state.gameOver) return;
		state.gameOver = true;
		state.active = false;
		cancelAnimationFrame(state.frameId);
		ui.gameOverCopy.textContent = message;
		ui.gameOver.hidden = false;
		setFeedback("Run complete", "neutral");
	}

	function updatePlayer(delta) {
		const player = state.player;
		if (player.climbing) {
			if (player.climbing.phase === "approach") {
				state.worldX = Math.min(player.climbing.targetX, state.worldX + 158 * delta);
				if (state.worldX >= player.climbing.targetX) {
					player.climbing.phase = "climb";
					player.climbing.elapsed = 0;
				}
				return;
			}
			player.climbing.elapsed += delta;
			const progress = Math.min(1, player.climbing.elapsed / player.climbing.duration);
			player.z = player.climbing.startZ + (player.climbing.endZ - player.climbing.startZ) * progress;
			if (progress >= 1) {
				player.platform = player.climbing.platform;
				player.climbing = null;
			}
			return;
		}

		if (player.springAt && state.worldX >= player.springAt) {
			player.velocity = 620;
			player.springAt = null;
			player.platform = null;
		}
		const speed = 158;
		state.worldX += speed * delta;
		const activePlatform = state.sections.find((section) => section.platform && state.worldX >= section.platform.start && state.worldX <= section.platform.end)?.platform;
		if (activePlatform && !player.falling && player.velocity === 0) {
			player.platform = activePlatform;
			player.z = activePlatform.rise;
		}
		if (player.platform && (state.worldX < player.platform.start || state.worldX > player.platform.end)) player.platform = null;

		const grounded = Boolean(player.platform && player.velocity === 0) || player.z <= 0.5 && player.velocity <= 0 && !player.falling;
		if (player.velocity !== 0 || !grounded) {
			player.velocity -= 1280 * delta;
			player.z += player.velocity * delta;
			if (player.z <= 0) {
				player.z = 0;
				player.velocity = 0;
				player.falling = false;
			}
		}

		const inGap = state.sections.some((section) => section.gap && state.worldX >= section.gap.start && state.worldX <= section.gap.end);
		if (inGap && player.z <= 0 && !player.falling) {
			player.falling = true;
			player.fallElapsed = 0;
			player.platform = null;
			if (!state.practice && state.time >= state.shieldUntil) state.health = Math.max(0, state.health - 22);
			setFeedback(state.practice ? "Keep running · a spring note can carry you over gaps" : "You stumbled · keep going", "wrong");
		}
		if (player.falling) {
			player.fallElapsed += delta;
			player.velocity -= 1280 * delta;
			player.z = Math.max(-state.height * 0.65, player.z + player.velocity * delta);
			if (player.fallElapsed > 0.76 || !inGap) {
				player.falling = false;
				player.z = 0;
				player.velocity = 0;
				player.fallElapsed = 0;
			}
		}
	}

	function playFootstep() {
		if (!state.audio || state.muted) return;
		try {
			const oscillator = state.audio.createOscillator();
			const gain = state.audio.createGain();
			oscillator.type = "sine";
			oscillator.frequency.setValueAtTime(state.footIndex % 2 ? 72 : 86, state.audio.currentTime);
			gain.gain.setValueAtTime(0.008, state.audio.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.0001, state.audio.currentTime + 0.055);
			oscillator.connect(gain);
			gain.connect(state.audio.destination);
			oscillator.start();
			oscillator.stop(state.audio.currentTime + 0.06);
			state.footIndex += 1;
		} catch { /* Audio is optional; the game remains playable without it. */ }
	}

	function update(delta) {
		state.time += delta;
		updatePlayer(delta);
		if (!state.practice) {
			state.hunger = Math.max(0, state.hunger - delta * 0.16);
			if (state.hunger <= 0) { updateHud(); finishRun("Hunger ran out. Collect food tiles to keep your runner going."); return; }
			if (state.health <= 0) { updateHud(); finishRun("Your runner needs a rest. Try Beginner Practice or start another run."); return; }
		}
		const onGroundAndRunning = (!state.player.climbing || state.player.climbing.phase === "approach") && state.player.z < 3 && !state.player.falling;
		if (onGroundAndRunning) {
			state.footClock += delta;
			if (state.footClock >= FOOTSTEP_INTERVAL) { state.footClock -= FOOTSTEP_INTERVAL; playFootstep(); }
		} else state.footClock = 0;
		ensureWorld();
		updateHud();
		if (performance.now() >= state.feedbackUntil && state.feedbackKind) {
			state.feedbackKind = "";
			ui.feedback.dataset.kind = "";
		}
		updateTargetPrompt();
	}

	function updateTargetPrompt() {
		const nearest = state.tiles.filter((tile) => !tile.used
			&& Math.abs(tile.x - state.worldX) < 420
			&& (!tile.gap || state.worldX <= tile.gap.start - 40))
			.sort((first, second) => Math.abs(first.x - state.worldX) - Math.abs(second.x - state.worldX))[0];
		const key = nearest ? `${nearest.type}:${nearest.note}` : "";
		if (key === state.currentTileKey) return;
		state.currentTileKey = key;
		const target = document.querySelector("#runner-target");
		if (!nearest) {
			target.textContent = "Watch for the next note tile.";
			return;
		}
		const descriptions = { food: "collect food", ladder: "climb the ladder", spring: "activate the spring", shield: "collect a shield" };
		target.textContent = `Nearby tile: ${noteName(nearest.note)} · play that note to ${descriptions[nearest.type]}.`;
	}

	function frame(timestamp) {
		if (!state.active) return;
		const delta = Math.min(0.05, (timestamp - state.lastFrame) / 1000 || 0);
		state.lastFrame = timestamp;
		update(delta);
		render();
		if (state.active) state.frameId = requestAnimationFrame(frame);
	}

	function initializeAudio() {
		const AudioContextClass = window.AudioContext || window.webkitAudioContext;
		if (!AudioContextClass) return;
		try {
			state.audio = new AudioContextClass();
			state.audio.resume().catch(() => {});
		} catch { state.audio = null; }
	}

	function startGame() {
		stopGame();
		ui.practice.checked = Boolean(ui.practice.checked);
		state.preferFlats = ui.notation.value === "flat";
		ui.lobby.hidden = true;
		ui.session.hidden = false;
		ui.keyboardMount.append(ui.keyboardPanel);
		ui.keyboardPanel.classList.add("runner-keyboard-panel");
		resizeCanvas();
		resetGame();
		initializeAudio();
		state.active = true;
		state.lastFrame = performance.now();
		state.frameId = requestAnimationFrame(frame);
		ui.mute.setAttribute("aria-pressed", String(state.muted));
		ui.mute.setAttribute("aria-label", state.muted ? "Unmute footsteps" : "Mute footsteps");
	}

	function stopGame() {
		state.active = false;
		cancelAnimationFrame(state.frameId);
		state.pressedMidi.clear();
		if (state.audio) {
			state.audio.close().catch(() => {});
			state.audio = null;
		}
	}

	function restoreKeyboard() {
		if (ui.keyboardPanel.parentElement !== state.keyboardHomeParent) {
			state.keyboardHomeParent.insertBefore(ui.keyboardPanel, ui.keyboardAnchor.nextSibling);
		}
		ui.keyboardPanel.classList.remove("runner-keyboard-panel");
	}

	function exitGame() {
		stopGame();
		restoreKeyboard();
		ui.hub.hidden = true;
		ui.studio.hidden = false;
		ui.hero.hidden = false;
		ui.gamesNav.classList.remove("active");
		ui.studioNav.classList.add("active");
		document.dispatchEvent(new CustomEvent("melodylab:game-screen", { detail: { screen: "closed" } }));
	}

	function showLobby() {
		stopGame();
		restoreKeyboard();
		ui.lobby.hidden = false;
		ui.session.hidden = true;
	}

	function updateMidiStatus(detail) {
		state.midiConnected = Boolean(detail?.connected);
		state.midiStatusText = detail?.message || "Not connected";
		ui.midiStatus.textContent = state.midiStatusText;
		ui.midiBadge.classList.toggle("connected", state.midiConnected);
		ui.midiBadge.classList.toggle("error", detail?.kind === "error");
		ui.connectMidi.disabled = state.midiStatusText === "Unavailable";
		ui.midiDetail.textContent = state.midiConnected ? "Matching notes in any octave" : "Connect MIDI or use the virtual keys";
	}

	function connectMidi() {
		document.querySelector("#connect-midi").click();
	}

	function toggleMute() {
		state.muted = !state.muted;
		ui.mute.setAttribute("aria-pressed", String(state.muted));
		ui.mute.setAttribute("aria-label", state.muted ? "Unmute footsteps" : "Mute footsteps");
		ui.mute.title = state.muted ? "Unmute footsteps" : "Mute footsteps";
	}

	function handleGameScreen(event) {
		if (event.detail?.screen === "lobby") {
			showLobby();
			updateMidiStatus({ connected: state.midiConnected, message: state.midiStatusText });
		} else if (event.detail?.screen === "closed") {
			stopGame();
			restoreKeyboard();
		}
	}

	function initialize() {
		ui.gamesNav.addEventListener("click", () => updateMidiStatus({
			connected: state.midiConnected,
			message: document.querySelector("#midi-status").textContent,
			kind: document.querySelector("#midi-status-badge").classList.contains("error") ? "error" : ""
		}));
		ui.start.addEventListener("click", startGame);
		ui.restart.addEventListener("click", startGame);
		ui.restartOverlay.addEventListener("click", startGame);
		ui.returnLobby.addEventListener("click", exitGame);
		ui.returnSession.addEventListener("click", exitGame);
		ui.connectMidi.addEventListener("click", connectMidi);
		ui.mute.addEventListener("click", toggleMute);
		document.addEventListener("melodylab:note", receiveNote);
		document.addEventListener("melodylab:midi-status", (event) => updateMidiStatus(event.detail));
		document.addEventListener("melodylab:game-screen", handleGameScreen);
		window.addEventListener("resize", resizeCanvas);
		updateMidiStatus({ connected: false, message: "Not connected" });
	}

	initialize();
})();