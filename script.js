class SoundManager {
    constructor() { this.enabled = true; this.ctx = null; }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }
    playTone(freq, type, duration, delay = 0, vol = 0.15) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    }
    click() { this.playTone(520, 'sine', 0.08, 0, 0.1); }
    correct() {
        this.playTone(523.25, 'triangle', 0.12, 0, 0.18);
        this.playTone(659.25, 'triangle', 0.12, 0.09, 0.18);
        this.playTone(783.99, 'triangle', 0.22, 0.18, 0.2);
    }
    wrong() {
        this.playTone(260, 'sawtooth', 0.18, 0, 0.12);
        this.playTone(210, 'sawtooth', 0.25, 0.14, 0.12);
    }
    win() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((n, i) => this.playTone(n, 'triangle', 0.22, i * 0.11, 0.2));
    }
}

const sound = new SoundManager();

function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6C5CE7', '#00CEC9', '#FDCB6E', '#FF7675', '#00B894', '#FD79A8'];
    const pieces = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 4 + 3,
        speedX: Math.random() * 4 - 2,
        rot: Math.random() * 360
    }));

    let frames = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rot += 5;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        frames++;
        if (frames < 140) requestAnimationFrame(animate);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animate();
}

const CATEGORIES = [
    { id: 'math', name: 'Matematika', icon: '🧮', color: '#6C5CE7', bg: '#EDE9FE', desc: 'Qo‘shish, ayirish, ko‘paytirish, bo‘lish va qiziqarli tenglamalar.' },
    { id: 'memory', name: 'Xotira', icon: '🧠', color: '#00CEC9', bg: '#E0FCFF', desc: 'Rasmlarni eslab qolish, juftliklarni topish va ketma-ketlikni tiklash.' },
    { id: 'logic', name: 'Mantiq', icon: '🧩', color: '#FF7675', bg: '#FFE8E8', desc: 'Topishmoqlar, mantiqiy qonuniyatlar va boshqotirmalar.' },
    { id: 'colors', name: 'Rang va shakllar', icon: '🎨', color: '#FDCB6E', bg: '#FFF9DB', desc: 'Geometrik shakllar, ranglar uyg‘unligi va vizual naqshlar.' },
    { id: 'attention', name: 'Diqqat', icon: '🔍', color: '#00B894', bg: '#E8F8F5', desc: 'Ortiqcha belgini topish, sanash va ziyraklik sinovlari.' },
    { id: 'speed', name: 'Tezkor fikrlash', icon: '⚡', color: '#FD79A8', bg: '#FFF0F6', desc: 'Qisqa vaqt ichida to‘g‘ri qaror qabul qilish o‘yinlari.' },
    { id: 'knowledge', name: 'Bilimdon', icon: '🌍', color: '#0984E3', bg: '#E7F5FF', desc: 'Tabiat, hayvonot olami, geografiya va umumiy bilimlar.' }
];

function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

const TaskGenerator = {
    generateSession(age, catId, levelNum) {
        const difficulty = levelNum <= 33 ? 'easy' : levelNum <= 67 ? 'medium' : 'hard';
        const baseSeed = (age === '6-9' ? 1000 : age === '9-13' ? 5000 : 9000) +
                         CATEGORIES.findIndex(c => c.id === catId) * 200 + levelNum;

        const questions = [];
        const totalQuestions = catId === 'memory' ? 3 : 5;

        for (let q = 0; q < totalQuestions; q++) {
            const seed = baseSeed * 31 + q * 17;
            questions.push(this.createQuestion(age, catId, levelNum, difficulty, seed, q));
        }

        return {
            age, catId, levelNum, difficulty,
            timePerQuestion: catId === 'speed' ? (age === '6-9' ? 12 : 9) : (catId === 'memory' ? 35 : 22),
            questions
        };
    },

    shuffle(arr, seed) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i) * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    },

    createQuestion(age, catId, level, diff, seed, qIdx) {
        const r = (offset = 0) => seededRandom(seed + offset);

        if (catId === 'math') {
            if (age === '6-9') {
                const max = diff === 'easy' ? 15 : diff === 'medium' ? 35 : 70;
                const a = Math.floor(r(1) * max) + 2;
                const b = Math.floor(r(2) * (max / 2)) + 1;
                const isAdd = (level + qIdx) % 2 === 0;
                const ans = isAdd ? a + b : Math.max(a, b) - Math.min(a, b);
                const prompt = isAdd ? `${a} + ${b} = ?` : `${Math.max(a, b)} − ${Math.min(a, b)} = ?`;
                const emojis = ['🍎', '⭐', '🎈', '🍓', '🍬'][qIdx % 5];
                const visual = a <= 10 && b <= 10 && isAdd ? `${emojis.repeat(a)}  +  ${emojis.repeat(b)}` : null;
                return this.makeMCQ(prompt, ans, [ans + 1, Math.max(0, ans - 1), ans + 3], seed, visual);
            } else if (age === '9-13') {
                const mode = (level + qIdx) % 3;
                if (mode === 0) {
                    const a = Math.floor(r(1) * 12) + (diff === 'easy' ? 3 : 6);
                    const b = Math.floor(r(2) * 11) + 4;
                    const ans = a * b;
                    return this.makeMCQ(`${a} × ${b} = ?`, ans, [ans + a, ans - b, ans + 10], seed);
                } else if (mode === 1) {
                    const b = Math.floor(r(1) * 9) + 3;
                    const ans = Math.floor(r(2) * 15) + 4;
                    const a = b * ans;
                    return this.makeMCQ(`${a} ÷ ${b} = ?`, ans, [ans + 1, ans + 2, Math.max(1, ans - 1)], seed);
                } else {
                    const x = Math.floor(r(1) * 20) + 5;
                    const add = Math.floor(r(2) * 30) + 10;
                    return this.makeMCQ(`Tenglamani yeching: x + ${add} = ${x + add}`, x, [x + 2, Math.max(1, x - 3), x + 5], seed);
                }
            } else {
                const mode = (level + qIdx) % 3;
                if (mode === 0) {
                    const x = Math.floor(r(1) * 12) + 3;
                    const k = Math.floor(r(2) * 5) + 2;
                    const c = Math.floor(r(3) * 15) + 4;
                    return this.makeMCQ(`${k}x + ${c} = ${k * x + c} bo‘lsa, x nechaga teng?`, x, [x + 1, x - 1, x + 3], seed);
                } else if (mode === 1) {
                    const base = Math.floor(r(1) * 12) + 4;
                    const ans = base * base;
                    return this.makeMCQ(`${base}² + 15 ning qiymatini toping:`, ans + 15, [ans + 10, ans + 25, base * 2 + 15], seed);
                } else {
                    const pct = [10, 20, 25, 50][qIdx % 4];
                    const num = (Math.floor(r(1) * 8) + 2) * 20;
                    const ans = (num * pct) / 100;
                    return this.makeMCQ(`${num} sonining ${pct}% qismi nechaga teng?`, ans, [ans + 5, ans * 2, Math.max(2, ans - 4)], seed);
                }
            }
        }

        if (catId === 'memory') {
            if (qIdx === 0 || qIdx === 2) {
                const pool = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🐵', '🦄', '🐙', '🦋', '🐢', '🦉'];
                const pairsCount = age === '6-9' ? 3 : age === '9-13' ? 4 : 6;
                const chosen = this.shuffle(pool, seed).slice(0, pairsCount);
                const cards = this.shuffle([...chosen, ...chosen], seed + 9);
                return { type: 'memory_match', prompt: `Barcha bir xil juftliklarni toping! (${pairsCount} juft)`, cards };
            } else {
                const items = ['🚀', '🌈', '🎸', '⚽', '🍦', '💎', '👑', '🚲', '🎯', '🧩'];
                const len = age === '6-9' ? 3 : age === '9-13' ? 4 : 5;
                const seq = this.shuffle(items, seed).slice(0, len);
                const correctStr = seq.join(' ');
                const w1 = this.shuffle(seq, seed + 2).join(' ');
                const w2 = this.shuffle(seq, seed + 5).join(' ');
                const w3 = [...seq].reverse().join(' ');
                return {
                    type: 'memory_seq',
                    prompt: 'Ketma-ketlikni eslab qoling!',
                    sequence: correctStr,
                    options: this.shuffle(Array.from(new Set([correctStr, w1, w2, w3])).slice(0, 4), seed),
                    answer: correctStr
                };
            }
        }

        if (catId === 'logic') {
            const logicBank = [
                { q: 'Sonlar ketma-ketligini davom ettiring: 2, 4, 6, 8, ?', a: '10', w: ['9', '12', '11'], ages: ['6-9', '9-13'] },
                { q: 'Ketma-ketlikni toping: 3, 6, 12, 24, ?', a: '48', w: ['36', '30', '42'], ages: ['9-13', '13-17'] },
                { q: '1, 4, 9, 16, 25, ? — keyingi son qaysi?', a: '36', w: ['30', '32', '49'], ages: ['13-17'] },
                { q: 'Savatda 5 ta olma bor edi. 2 tasini oldingiz. Sizda nechta olma bor?', a: '2 ta', w: ['3 ta', '5 ta', '7 ta'], ages: ['6-9', '9-13', '13-17'] },
                { q: 'Qaysi biri og‘irroq: 1 kg temirmi yoki 1 kg paxta?', a: 'Ikkalasi teng', w: ['1 kg temir', '1 kg paxta', 'Aniqlab bo‘lmaydi'], ages: ['6-9', '9-13', '13-17'] },
                { q: 'Agar kecha ertangi kun bo‘lganida, bugun yakshanba bo‘lar edi. Bugun qaysi kun?', a: 'Juma', w: ['Shanba', 'Dushanba', 'Payshanba'], ages: ['13-17'] },
                { q: 'Qaysi so‘z ortiqcha? Olma, Banan, Sabzi, Uzum', a: 'Sabzi', w: ['Olma', 'Banan', 'Uzum'], ages: ['6-9'] }
            ];
            if (qIdx % 2 === 0) {
                const start = (level % 15) + 1;
                const step = (qIdx + 2) * (age === '6-9' ? 2 : age === '9-13' ? 4 : 7);
                const s1 = start, s2 = start + step, s3 = start + step * 2, s4 = start + step * 3;
                const ans = start + step * 4;
                return this.makeMCQ(`Mantiqiy qatorni davom ettiring:\n${s1}, ${s2}, ${s3}, ${s4}, ?`, ans, [ans + step, ans - 1, ans + 2], seed);
            } else {
                const filtered = logicBank.filter(item => item.ages.includes(age));
                const item = filtered[(level + qIdx) % filtered.length];
                return this.makeMCQ(item.q, item.a, item.w, seed);
            }
        }

        if (catId === 'colors') {
            const patterns = [
                { seq: '🔴 🔵 🔴 🔵 🔴 ?', ans: '🔵', w: ['🔴', '🟢', '🟡'], q: 'Ketma-ketlikni to‘ldiring:' },
                { seq: '🔺 🔺 🟩 🔺 🔺 ?', ans: '🟩', w: ['🔺', '🟡', '🔵'], q: 'Qaysi shakl tushib qolgan?' },
                { seq: '🟡 🟢 🔵 🟡 🟢 ?', ans: '🔵', w: ['🟡', '🟢', '🟣'], q: 'Ranglar zanjirini davom ettiring:' },
                { seq: '⭐ 🌙 ⭐ 🌙 ⭐ ?', ans: '🌙', w: ['⭐', '☀️', '☁️'], q: 'Keyingi belgi nima bo‘ladi?' }
            ];
            if (qIdx === 3) {
                const shapes = [
                    { q: 'Uchburchakning nechta burchagi bor?', a: '3 ta', w: ['4 ta', '5 ta', '2 ta'] },
                    { q: 'Kvadratning barcha tomonlari qanday bo‘ladi?', a: 'Teng', w: ['Har xil', 'Egri', '2 tasi uzun'] },
                    { q: 'Qizil va sariq rang aralashtirilsa qaysi rang hosil bo‘ladi?', a: 'To‘q sariq', w: ['Yashil', 'Binafsha', 'Ko‘k'] }
                ];
                const s = shapes[(level + qIdx) % shapes.length];
                return this.makeMCQ(s.q, s.a, s.w, seed);
            }
            const p = patterns[(level + qIdx) % patterns.length];
            return this.makeMCQ(p.q, p.ans, p.w, seed, p.seq);
        }

        if (catId === 'attention') {
            const pairs = [['😀', '😃'], ['🐶', '🐺'], ['🍏', '🍎'], ['🚗', '🚙'], ['⭐', '🌟']];
            const pair = pairs[(level + qIdx) % pairs.length];
            const gridSize = age === '6-9' ? 6 : age === '9-13' ? 9 : 12;
            const targetCount = Math.floor(r(1) * 3) + 2;
            const arr = Array(gridSize).fill(pair[0]);
            for (let i = 0; i < targetCount; i++) arr[i] = pair[1];
            const visualGrid = this.shuffle(arr, seed).join(' ');
            return this.makeMCQ(`Rasmlar orasida nechta ${pair[1]} belgisi bor?`, `${targetCount} ta`, [`${targetCount + 1} ta`, `${Math.max(1, targetCount - 1)} ta`, `${targetCount + 2} ta`], seed, visualGrid);
        }

        if (catId === 'speed') {
            const fastBank = [
                { q: 'Qaysi son kattaroq?', a: `${45 + level}`, w: [`${38 + level}`, `${41 + level}`, `${29 + level}`] },
                { q: '1 soatda necha daqiqa bor?', a: '60 daqiqa', w: ['100 daqiqa', '30 daqiqa', '24 daqiqa'] },
                { q: 'Bir haftada necha kun bor?', a: '7 kun', w: ['5 kun', '6 kun', '8 kun'] },
                { q: 'Quyosh qaysi tomondan chiqadi?', a: 'Sharqdan', w: ['G‘arbdan', 'Shimoldan', 'Janubdan'] }
            ];
            const item = fastBank[(level + qIdx) % fastBank.length];
            return this.makeMCQ(item.q, item.a, item.w, seed);
        }

        const knowledgeBank = [
            { q: 'Yer yuzidagi eng katta hayvon qaysi?', a: 'Ko‘k kit', w: ['Fil', 'Jirafa', 'Akula'], ages: ['6-9', '9-13', '13-17'] },
            { q: 'O‘zbekistonning poytaxti qaysi shahar?', a: 'Toshkent', w: ['Samarqand', 'Buxoro', 'Xiva'], ages: ['6-9', '9-13'] },
            { q: 'Quyosh sistemasidagi eng katta sayyora qaysi?', a: 'Yupiter', w: ['Mars', 'Saturn', 'Yer'], ages: ['9-13', '13-17'] },
            { q: 'Inson tanasidagi eng katta a’zo qaysi?', a: 'Teri', w: ['Yurak', 'Jigar', 'O‘pka'], ages: ['13-17'] }
        ];
        const kFiltered = knowledgeBank.filter(k => k.ages.includes(age));
        const kItem = kFiltered[(level + qIdx) % kFiltered.length];
        return this.makeMCQ(kItem.q, kItem.a, kItem.w, seed);
    },

    makeMCQ(prompt, answer, wrongs, seed, visual = null) {
        const uniqueWrongs = Array.from(new Set(wrongs.map(String))).filter(w => w !== String(answer)).slice(0, 3);
        while (uniqueWrongs.length < 3) {
            uniqueWrongs.push(String(Number(answer) + uniqueWrongs.length + 2));
        }
        return {
            type: 'mcq', prompt, visual,
            answer: String(answer),
            options: this.shuffle([String(answer), ...uniqueWrongs], seed)
        };
    }
};

const gameEngine = {
    session: null,
    currentIdx: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    timeLeft: 20,
    totalTimeSpent: 0,
    timerInterval: null,
    isPaused: false,
    answeredCurrent: false,

    prepareGame(age, catId, levelNum) {
        sound.click();
        this.session = TaskGenerator.generateSession(age, catId, levelNum);
        const cat = CATEGORIES.find(c => c.id === catId);

        app.showView('view-game');
        document.getElementById('game-intro-card').classList.remove('d-none');
        document.getElementById('game-active-card').classList.add('d-none');
        document.getElementById('game-result-card').classList.add('d-none');

        document.getElementById('intro-icon').textContent = cat.icon;
        document.getElementById('intro-title').textContent = `${cat.name} — ${levelNum}-bosqich (${age} yosh)`;
        document.getElementById('intro-desc').textContent = cat.desc;

        const diffBadge = document.getElementById('intro-difficulty-badge');
        if (this.session.difficulty === 'easy') {
            diffBadge.textContent = '🟢 Oson daraja';
            diffBadge.className = 'badge rounded-pill px-3 py-2 mb-2 fs-6 bg-success-subtle text-success';
        } else if (this.session.difficulty === 'medium') {
            diffBadge.textContent = '🟡 O‘rta daraja';
            diffBadge.className = 'badge rounded-pill px-3 py-2 mb-2 fs-6 bg-warning-subtle text-warning-emphasis';
        } else {
            diffBadge.textContent = '🔴 Qiyin daraja';
            diffBadge.className = 'badge rounded-pill px-3 py-2 mb-2 fs-6 bg-danger-subtle text-danger';
        }
    },

    startSession() {
        sound.click();
        this.currentIdx = 0;
        this.score = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.totalTimeSpent = 0;
        this.isPaused = false;

        document.getElementById('game-intro-card').classList.add('d-none');
        document.getElementById('game-result-card').classList.add('d-none');
        document.getElementById('game-active-card').classList.remove('d-none');

        this.renderQuestion();
    },

    renderQuestion() {
        clearInterval(this.timerInterval);
        this.answeredCurrent = false;
        const q = this.session.questions[this.currentIdx];
        const total = this.session.questions.length;

        document.getElementById('game-q-counter').textContent = `${this.currentIdx + 1}/${total}`;
        document.getElementById('game-score').textContent = this.score;
        document.getElementById('game-progress-bar').style.width = `${((this.currentIdx + 1) / total) * 100}%`;

        const fb = document.getElementById('game-feedback');
        fb.classList.add('d-none');

        const stage = document.getElementById('question-stage');

        if (q.type === 'memory_match') {
            stage.innerHTML = `
                <h3 class="question-prompt">${q.prompt}</h3>
                <div class="memory-grid" id="memory-grid"></div>
            `;
            this.initMemoryMatch(q.cards);
        } else if (q.type === 'memory_seq') {
            stage.innerHTML = `
                <h3 class="question-prompt">${q.prompt}</h3>
                <div class="question-visual-box" id="seq-box">${q.sequence}</div>
                <p class="text-muted fw-bold" id="seq-hint">Diqqat bilan eslab qoling... (3 soniya)</p>
                <div class="options-grid d-none" id="seq-options">
                    ${q.options.map(opt => `<button class="option-btn" onclick="gameEngine.checkMCQ(this, '${opt.replace(/'/g, "\'")}')">${opt}</button>`).join('')}
                </div>
            `;
            setTimeout(() => {
                const box = document.getElementById('seq-box');
                const hint = document.getElementById('seq-hint');
                const opts = document.getElementById('seq-options');
                if (box && opts) {
                    box.textContent = '❓ ❓ ❓';
                    hint.textContent = 'Qaysi ketma-ketlik ko‘rsatilgan edi?';
                    opts.classList.remove('d-none');
                }
            }, 3000);
        } else {
            stage.innerHTML = `
                <h3 class="question-prompt" style="white-space: pre-line;">${q.prompt}</h3>
                ${q.visual ? `<div class="question-visual-box">${q.visual}</div>` : ''}
                <div class="options-grid">
                    ${q.options.map(opt => `<button class="option-btn" onclick="gameEngine.checkMCQ(this, '${opt.replace(/'/g, "\'")}')">${opt}</button>`).join('')}
                </div>
            `;
        }

        this.timeLeft = this.session.timePerQuestion;
        this.updateTimerUI();
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;
            this.timeLeft--;
            this.totalTimeSpent++;
            this.updateTimerUI();

            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.handleTimeout();
            }
        }, 1000);
    },

    initMemoryMatch(cards) {
        const grid = document.getElementById('memory-grid');
        let flipped = [];
        let matchedPairs = 0;
        const totalPairs = cards.length / 2;

        cards.forEach((emoji, idx) => {
            const card = document.createElement('div');
            card.className = 'mem-card';
            card.dataset.emoji = emoji;
            card.textContent = '❓';

            card.onclick = () => {
                if (this.isPaused || this.answeredCurrent || card.classList.contains('flipped') || card.classList.contains('matched') || flipped.length >= 2) return;
                sound.click();
                card.classList.add('flipped');
                card.textContent = emoji;
                flipped.push(card);

                if (flipped.length === 2) {
                    const [c1, c2] = flipped;
                    if (c1.dataset.emoji === c2.dataset.emoji) {
                        sound.correct();
                        c1.classList.add('matched');
                        c2.classList.add('matched');
                        flipped = [];
                        matchedPairs++;
                        if (matchedPairs === totalPairs) {
                            this.answeredCurrent = true;
                            clearInterval(this.timerInterval);
                            const bonus = 100 + this.timeLeft * 5;
                            this.score += bonus;
                            this.correctCount++;
                            this.showFeedback(`🎉 Barakalla! Barcha juftliklar topildi! (+${bonus} ball)`, true);
                            setTimeout(() => this.advanceQuestion(), 1200);
                        }
                    } else {
                        setTimeout(() => {
                            c1.classList.remove('flipped');
                            c2.classList.remove('flipped');
                            c1.textContent = '❓';
                            c2.textContent = '❓';
                            flipped = [];
                        }, 650);
                    }
                }
            };
            grid.appendChild(card);
        });
    },

    checkMCQ(btn, selected) {
        if (this.answeredCurrent || this.isPaused) return;
        const q = this.session.questions[this.currentIdx];

        if (selected === q.answer) {
            this.answeredCurrent = true;
            clearInterval(this.timerInterval);
            btn.classList.add('correct');
            sound.correct();

            const earned = 100 + this.timeLeft * 5;
            this.score += earned;
            this.correctCount++;
            document.getElementById('game-score').textContent = this.score;

            this.showFeedback(`🌟 To‘g‘ri javob! +${earned} ball`, true);
            setTimeout(() => this.advanceQuestion(), 1100);
        } else {
            btn.classList.add('wrong');
            btn.disabled = true;
            sound.wrong();
            this.wrongCount++;
            this.showFeedback('💡 Biroz adashdingiz, boshqa variantni urinib ko‘ring!', false);
        }
    },

    handleTimeout() {
        if (this.answeredCurrent) return;
        this.answeredCurrent = true;
        this.wrongCount++;
        sound.wrong();
        this.showFeedback('⏰ Vaqt tugadi! Keyingi savolga o‘tamiz...', false);
        setTimeout(() => this.advanceQuestion(), 1300);
    },

    showFeedback(msg, isSuccess) {
        const fb = document.getElementById('game-feedback');
        fb.textContent = msg;
        fb.className = `feedback-banner mt-3 ${isSuccess ? 'feedback-success' : 'feedback-error'}`;
        fb.classList.remove('d-none');
    },

    advanceQuestion() {
        this.currentIdx++;
        if (this.currentIdx < this.session.questions.length) {
            this.renderQuestion();
        } else {
            this.finishSession();
        }
    },

    updateTimerUI() {
        const el = document.getElementById('game-timer');
        const box = document.getElementById('timer-box');
        el.textContent = this.timeLeft;
        if (this.timeLeft <= 5) box.classList.add('urgent');
        else box.classList.remove('urgent');
    },

    togglePause() {
        this.isPaused = !this.isPaused;
        const modalEl = document.getElementById('pauseModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        if (this.isPaused) modal.show();
        else modal.hide();
    },

    confirmExit() {
        clearInterval(this.timerInterval);
        app.exitGame();
    },

    finishSession() {
        clearInterval(this.timerInterval);
        sound.win();
        launchConfetti();

        document.getElementById('game-active-card').classList.add('d-none');
        document.getElementById('game-result-card').classList.remove('d-none');

        const totalQ = this.session.questions.length;
        const accuracy = this.correctCount / totalQ;

        let stars = 1;
        if (accuracy === 1 && this.wrongCount === 0) stars = 5;
        else if (accuracy >= 0.8 && this.wrongCount <= 1) stars = 4;
        else if (accuracy >= 0.6) stars = 3;
        else if (accuracy >= 0.4) stars = 2;

        const headlines = {
            5: '⭐⭐⭐⭐⭐ — Ajoyib natija!',
            4: '⭐⭐⭐⭐ — Juda yaxshi!',
            3: '⭐⭐⭐ — Yaxshi harakat!',
            2: '⭐⭐ — Yana mashq qil!',
            1: '⭐ — Taslim bo‘lma, yana urinib ko‘r!'
        };

        document.getElementById('result-stars-display').textContent = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
        document.getElementById('result-headline').textContent = headlines[stars];
        document.getElementById('res-correct').textContent = this.correctCount;
        document.getElementById('res-wrong').textContent = this.wrongCount;
        document.getElementById('res-time').textContent = `${this.totalTimeSpent}s`;
        document.getElementById('res-points').textContent = this.score;

        const nextBtn = document.getElementById('btn-next-level');
        if (this.session.levelNum < 100) nextBtn.classList.remove('d-none');
        else nextBtn.classList.add('d-none');

        app.recordGameResult(this.session.age, this.session.catId, this.session.levelNum, stars, this.score);
    },

    restartLevel() {
        this.prepareGame(this.session.age, this.session.catId, this.session.levelNum);
        this.startSession();
    },

    nextLevel() {
        if (this.session.levelNum < 100) {
            this.prepareGame(this.session.age, this.session.catId, this.session.levelNum + 1);
            this.startSession();
        }
    }
};

const app = {
    state: {
        username: 'Yosh Daho',
        avatar: '🦊',
        stars: 50,
        gamesPlayed: 0,
        bestScore: 0,
        lastBonusDate: null,
        theme: 'sunset',
        unlockedAvatars: ['🦊', '🐼', '🦁', '🦉', '🤖', '🦄', '🐯', '🐸', '🚀', '👑'],
        progress: {}
    },

    selectedAge: '6-9',
    selectedCategory: 'math',
    currentFilter: 'all',

    init() {
        this.loadState();
        this.updateNavUI();
        this.applyTheme(this.state.theme);
        this.renderAvatarChoices();
        this.checkDailyBonusStatus();
    },

    loadState() {
        const saved = localStorage.getItem('brainPlayState_v2');
        if (saved) {
            try {
                this.state = { ...this.state, ...JSON.parse(saved) };
            } catch (e) {
                console.error(e);
            }
        }
    },

    saveState() {
        localStorage.setItem('brainPlayState_v2', JSON.stringify(this.state));
        this.updateNavUI();
    },

    updateNavUI() {
        document.getElementById('nav-stars').textContent = this.state.stars;
        document.getElementById('nav-username').textContent = this.state.username;
        document.getElementById('nav-avatar').textContent = this.state.avatar;
    },

    setTheme(themeName) {
        sound.click();
        this.state.theme = themeName;
        this.applyTheme(themeName);
        this.saveState();
    },

    applyTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
    },

    showView(viewId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('d-none'));
        document.getElementById(viewId).classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    goHome() {
        sound.click();
        clearInterval(gameEngine.timerInterval);
        this.showView('view-home');
    },

    selectAge(age) {
        sound.click();
        this.selectedAge = age;
        document.getElementById('current-age-badge').textContent = `${age} yosh`;
        this.renderCategories();
        this.showView('view-categories');
    },

    backToCategories() {
        sound.click();
        this.renderCategories();
        this.showView('view-categories');
    },

    renderCategories() {
        const grid = document.getElementById('categories-grid');
        grid.innerHTML = CATEGORIES.map(cat => {
            const completedCount = this.getCompletedCount(this.selectedAge, cat.id);
            return `
                <div class="col-sm-6 col-lg-4">
                    <div class="category-card" style="border-bottom-color: ${cat.color}" onclick="app.selectCategory('${cat.id}')">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="cat-emoji" style="background: ${cat.bg}">${cat.icon}</div>
                            <span class="badge rounded-pill bg-light text-dark border fw-bold px-3 py-2">
                                ${completedCount} / 100 ⭐
                            </span>
                        </div>
                        <h4 class="cat-title">${cat.name}</h4>
                        <p class="cat-desc mb-3">${cat.desc}</p>
                        <div class="progress" style="height: 8px; border-radius: 10px;">
                            <div class="progress-bar" style="width: ${completedCount}%; background-color: ${cat.color}"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    selectCategory(catId) {
        sound.click();
        this.selectedCategory = catId;
        this.currentFilter = 'all';
        document.getElementById('difficulty-filter').value = 'all';

        const cat = CATEGORIES.find(c => c.id === catId);
        document.getElementById('level-cat-icon').textContent = cat.icon;
        document.getElementById('level-cat-title').textContent = cat.name;
        document.getElementById('level-age-label').textContent = `${this.selectedAge} yosh`;
        document.getElementById('level-cat-desc').textContent = cat.desc;

        this.renderLevels();
        this.showView('view-levels');
    },

    filterLevels(diff) {
        sound.click();
        this.currentFilter = diff;
        this.renderLevels();
    },

    renderLevels() {
        const completedCount = this.getCompletedCount(this.selectedAge, this.selectedCategory);
        document.getElementById('cat-progress-text').textContent = `${completedCount} / 100`;
        document.getElementById('cat-progress-bar').style.width = `${completedCount}%`;

        const grid = document.getElementById('levels-grid');
        let html = '';

        for (let i = 1; i <= 100; i++) {
            const diff = i <= 33 ? 'easy' : i <= 67 ? 'medium' : 'hard';
            if (this.currentFilter !== 'all' && this.currentFilter !== diff) continue;

            const key = `${this.selectedAge}_${this.selectedCategory}_${i}`;
            const earnedStars = this.state.progress[key] || 0;
            const dotColor = diff === 'easy' ? '#00B894' : diff === 'medium' ? '#FDCB6E' : '#FF7675';

            html += `
                <div class="level-btn ${earnedStars > 0 ? 'completed' : ''}" onclick="gameEngine.prepareGame('${this.selectedAge}', '${this.selectedCategory}', ${i})">
                    <span class="level-diff-dot" style="background: ${dotColor}"></span>
                    <span class="level-num">${i}</span>
                    <span class="level-stars">${earnedStars > 0 ? '⭐'.repeat(earnedStars) : '○○○'}</span>
                </div>
            `;
        }
        grid.innerHTML = html;
    },

    playRandomLevel() {
        const randLvl = Math.floor(Math.random() * 100) + 1;
        gameEngine.prepareGame(this.selectedAge, this.selectedCategory, randLvl);
    },

    startDailyChallenge() {
        const today = new Date().getDate();
        const cat = CATEGORIES[today % CATEGORIES.length];
        const lvl = (today * 3) % 100 + 1;
        this.selectedAge = '9-13';
        this.selectedCategory = cat.id;
        gameEngine.prepareGame('9-13', cat.id, lvl);
    },

    exitGame() {
        sound.click();
        clearInterval(gameEngine.timerInterval);
        this.renderLevels();
        this.showView('view-levels');
    },

    recordGameResult(age, catId, levelNum, stars, score) {
        const key = `${age}_${catId}_${levelNum}`;
        const prevStars = this.state.progress[key] || 0;

        if (stars > prevStars) {
            this.state.stars += (stars - prevStars);
            this.state.progress[key] = stars;
        }

        this.state.gamesPlayed += 1;
        if (score > this.state.bestScore) {
            this.state.bestScore = score;
        }

        this.saveState();
    },

    getCompletedCount(age, catId) {
        let count = 0;
        for (let i = 1; i <= 100; i++) {
            if (this.state.progress[`${age}_${catId}_${i}`]) count++;
        }
        return count;
    },

    handleSearch(query) {
        const q = query.trim().toLowerCase();
        const container = document.getElementById('search-results-container');
        const grid = document.getElementById('search-results-grid');

        if (!q) {
            container.classList.add('d-none');
            return;
        }

        const matches = CATEGORIES.filter(c => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
        container.classList.remove('d-none');
        if (matches.length === 0) {
            grid.innerHTML = `<div class="col-12 text-muted fw-bold">Hech narsa topilmadi.</div>`;
            return;
        }

        grid.innerHTML = matches.map(cat => `
            <div class="col-md-4">
                <div class="card border-0 shadow-sm rounded-4 p-3 h-100">
                    <div class="d-flex align-items-center gap-3 mb-2">
                        <span class="fs-2">${cat.icon}</span>
                        <h5 class="mb-0 fw-bold">${cat.name}</h5>
                    </div>
                    <p class="small text-muted mb-3">${cat.desc}</p>
                    <div class="d-flex gap-2 mt-auto">
                        <button class="btn btn-sm btn-outline-primary rounded-pill fw-bold" onclick="app.quickJump('6-9', '${cat.id}')">6–9 yosh</button>
                        <button class="btn btn-sm btn-outline-info rounded-pill fw-bold" onclick="app.quickJump('9-13', '${cat.id}')">9–13 yosh</button>
                        <button class="btn btn-sm btn-outline-dark rounded-pill fw-bold" onclick="app.quickJump('13-17', '${cat.id}')">13–17 yosh</button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    quickJump(age, catId) {
        this.selectedAge = age;
        this.selectCategory(catId);
    },

    toggleSound() {
        sound.enabled = !sound.enabled;
        const icon = document.getElementById('sound-icon');
        icon.className = sound.enabled ? 'bi bi-volume-up-fill' : 'bi bi-volume-mute-fill text-danger';
        if (sound.enabled) sound.click();
    },

    checkDailyBonusStatus() {
        const todayStr = new Date().toDateString();
        const dot = document.getElementById('bonus-dot');
        if (this.state.lastBonusDate === todayStr) {
            dot.classList.add('d-none');
        } else {
            dot.classList.remove('d-none');
        }
    },

    claimDailyBonus() {
        const todayStr = new Date().toDateString();
        if (this.state.lastBonusDate === todayStr) {
            alert('🎁 Siz bugungi kunlik bonusni oldingiz! Ertaga yana keling!');
            return;
        }
        sound.win();
        launchConfetti();
        this.state.stars += 20;
        this.state.lastBonusDate = todayStr;
        this.saveState();
        this.checkDailyBonusStatus();
        alert('🎉 Tabriklaymiz! Sizga kunlik +20 ⭐ bonus yulduz berildi!');
    },

    renderAvatarChoices() {
        const container = document.getElementById('avatar-selector');
        container.innerHTML = this.state.unlockedAvatars.map(av => `
            <button type="button" class="avatar-choice ${av === this.state.avatar ? 'selected' : ''}" onclick="app.selectAvatar('${av}', this)">
                ${av}
            </button>
        `).join('');
    },

    selectAvatar(av, btn) {
        sound.click();
        this.state.avatar = av;
        document.getElementById('profile-avatar-preview').textContent = av;
        document.querySelectorAll('.avatar-choice').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.saveState();
    },

    renderShopItems() {
        const shopItems = [
            { id: '🦁', name: 'Sher Daho', price: 30, type: 'avatar' },
            { id: '👑', name: 'Oltin Toj', price: 50, type: 'avatar' },
            { id: '🚀', name: 'Kosmonavt', price: 40, type: 'avatar' },
            { id: '🦄', name: 'Sehrli Unicorn', price: 45, type: 'avatar' },
            { id: '🧙‍♂️', name: 'Sehrgar', price: 60, type: 'avatar' },
            { id: '🏆', name: 'Chempion Kubogi', price: 100, type: 'avatar' }
        ];

        const grid = document.getElementById('shop-items-grid');
        grid.innerHTML = shopItems.map(item => {
            const isOwned = this.state.unlockedAvatars.includes(item.id);
            return `
                <div class="col-6 col-md-4">
                    <div class="shop-item-card">
                        <div class="fs-1 mb-2">${item.id}</div>
                        <h6 class="fw-bold mb-1">${item.name}</h6>
                        <p class="small text-warning fw-bold mb-2">${item.price} ⭐</p>
                        ${isOwned ? '<button class="btn btn-sm btn-success rounded-pill w-100 fw-bold" disabled>Sotib olingan</button>' : `<button class="btn btn-sm btn-outline-primary rounded-pill w-100 fw-bold" onclick="app.buyShopItem('${item.id}', ${item.price})">Sotib olish</button>`}
                    </div>
                </div>
            `;
        }).join('');
    },

    buyShopItem(av, price) {
        if (this.state.stars < price) {
            alert('❌ Yulduzlaringiz yetarli emas! Ko‘proq o‘yin o‘ynang va yulduzlar yig‘ing.');
            return;
        }
        sound.win();
        launchConfetti();
        this.state.stars -= price;
        this.state.unlockedAvatars.push(av);
        this.state.avatar = av;
        this.saveState();
        this.renderAvatarChoices();
        this.renderShopItems();
        document.getElementById('profile-avatar-preview').textContent = av;
        document.getElementById('modal-star-count').textContent = this.state.stars;
        alert(`🎉 Tabriklaymiz! ${av} avatari sizniki bo‘ldi!`);
    },

    saveProfile() {
        const nameVal = document.getElementById('profile-name-input').value.trim();
        if (nameVal) {
            this.state.username = nameVal;
            this.saveState();
            sound.correct();
            alert('✅ Profil maʼlumotlari saqlandi!');
        }
    },

    openProfileModal() {
        sound.click();
        document.getElementById('profile-avatar-preview').textContent = this.state.avatar;
        document.getElementById('modal-star-count').textContent = this.state.stars;
        document.getElementById('profile-name-input').value = this.state.username;
        document.getElementById('stat-total-stars').textContent = this.state.stars;
        document.getElementById('stat-games-played').textContent = this.state.gamesPlayed;
        document.getElementById('stat-tasks-done').textContent = Object.keys(this.state.progress).length;
        document.getElementById('stat-best-score').textContent = this.state.bestScore;

        this.renderAvatarChoices();
        this.renderShopItems();

        const progContainer = document.getElementById('profile-category-progress');
        progContainer.innerHTML = CATEGORIES.map(cat => {
            const totalDone = ['6-9', '9-13', '13-17'].reduce((sum, age) => sum + this.getCompletedCount(age, cat.id), 0);
            const pct = Math.round((totalDone / 300) * 100);
            return `
                <div class="mb-2">
                    <div class="d-flex justify-content-between fw-bold">
                        <span>${cat.icon} ${cat.name}</span>
                        <span>${totalDone} / 300</span>
                    </div>
                    <div class="progress" style="height: 7px;">
                        <div class="progress-bar" style="width: ${pct}%; background-color: ${cat.color}"></div>
                    </div>
                </div>
            `;
        }).join('');

        bootstrap.Modal.getOrCreateInstance(document.getElementById('profileModal')).show();
    },

    openLeaderboardModal() {
        sound.click();
        const players = [
            { name: 'Madina (Toshkent)', avatar: '🦄', stars: 420 },
            { name: 'Amirbek (Samarqand)', avatar: '🦁', stars: 385 },
            { name: 'Jasmina (Buxoro)', avatar: '🦉', stars: 310 },
            { name: `${this.state.username} (Siz)`, avatar: this.state.avatar, stars: this.state.stars, isMe: true },
            { name: 'Sardor (Andijon)', avatar: '🤖', stars: 145 }
        ].sort((a, b) => b.stars - a.stars);

        document.getElementById('leaderboard-list').innerHTML = players.map((p, idx) => `
            <div class="d-flex align-items-center justify-content-between p-3 mb-2 rounded-4 ${p.isMe ? 'bg-primary-subtle border border-primary' : 'bg-light'}">
                <div class="d-flex align-items-center gap-3">
                    <span class="fw-bold fs-5 text-muted">#${idx + 1}</span>
                    <span class="fs-3">${p.avatar}</span>
                    <span class="fw-bold">${p.name}</span>
                </div>
                <span class="badge bg-warning text-dark fs-6 rounded-pill px-3 py-2">${p.stars} ⭐</span>
            </div>
        `).join('');

        bootstrap.Modal.getOrCreateInstance(document.getElementById('leaderboardModal')).show();
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
