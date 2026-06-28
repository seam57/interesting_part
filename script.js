/* ==========================================================================
   GLOBAL UTILITIES & INITIALIZATION
   ========================================================================== */
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initAmbientHearts();
    initNavigation();
    initStoryCards();
    initMysteryBox();
    initProposal();
    initCanvasParticles();
});

// Restarts a CSS entrance animation on an element (so it can replay each
// time the user reaches Step 4, including after "Start Over")
function restartAnimation(el) {
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetHeight; // force reflow
    el.style.animation = '';
}

function replayConfessionEntrance() {
    restartAnimation(document.getElementById('confession-text'));
    restartAnimation(document.querySelector('.confession-subtitle'));
    restartAnimation(document.getElementById('proposal-question'));
}

/* ==========================================================================
   WEB AUDIO SYNTHESIZER
   ========================================================================== */
function playSound(type) {
    // Only synthesize sound if context initialized
    if (!audioCtx) return;
    
    const now = audioCtx.currentTime;
    
    if (type === 'click') {
        // Cute soft pop/spark sound
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
        
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'swipe') {
        // Soft swish/pop sound
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'magic') {
        // Magical ascending harp chord (C-E-G-C)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            
            gain.gain.setValueAtTime(0.04, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.35);
        });
    } else if (type === 'celebrate') {
        // Beautiful ambient romantic chord (C Major 9)
        const chords = [261.63, 392.00, 523.25, 659.25, 783.99, 987.77, 1174.66];
        chords.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.02);
            
            gain.gain.setValueAtTime(0.03, now + idx * 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 2.0);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.02);
            osc.stop(now + idx * 0.02 + 2.2);
        });
    }
}

/* ==========================================================================
   AMBIENT BACKGROUND HEARTS
   ========================================================================== */
function initAmbientHearts() {
    const container = document.getElementById('ambient-hearts');
    if (!container) return;

    const heartSVG = `
        <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/>
        </svg>
    `;

    const maxHearts = 15;
    for (let i = 0; i < maxHearts; i++) {
        createAmbientHeart(container, heartSVG, true);
    }

    // Keep adding new hearts periodically to maintain ambience
    setInterval(() => {
        if (container.children.length < maxHearts) {
            createAmbientHeart(container, heartSVG, false);
        }
    }, 3000);
}

function createAmbientHeart(container, svgContent, isInitial = false) {
    const heart = document.createElement('div');
    heart.className = 'ambient-heart';
    heart.innerHTML = svgContent;

    // Randomize characteristics
    const size = Math.random() * 20 + 10; // 10px to 30px
    const left = Math.random() * 100; // 0% to 100%
    const duration = Math.random() * 10 + 10; // 10s to 20s
    const delay = isInitial ? -(Math.random() * duration) : 0; // Negative delay spreads them out initially
    const opacity = Math.random() * 0.25 + 0.1; // 0.1 to 0.35 opacity

    heart.style.width = `${size}px`;
    heart.style.height = `${size}px`;
    heart.style.left = `${left}%`;
    heart.style.animationDuration = `${duration}s`;
    heart.style.animationDelay = `${delay}s`;
    heart.style.opacity = opacity;

    container.appendChild(heart);

    // Remove heart after animation completes
    heart.addEventListener('animationend', () => {
        heart.remove();
    });
}

/* ==========================================================================
   NAVIGATION SYSTEM
   ========================================================================== */
let activeStep = 1;

function initNavigation() {
    const btnStart = document.getElementById('btn-start');
    const btnToMystery = document.getElementById('btn-to-mystery');
    const btnMysteryNext = document.getElementById('btn-mystery-next');
    const btnRestart = document.getElementById('btn-restart');

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            initAudio();
            playSound('magic');
            navigateToStep(2);
        });
    }

    if (btnToMystery) {
        btnToMystery.addEventListener('click', () => {
            initAudio();
            playSound('magic');
            navigateToStep(3);
        });
    }

    if (btnMysteryNext) {
        btnMysteryNext.addEventListener('click', () => {
            initAudio();
            playSound('celebrate');
            navigateToStep(4);
            // Trigger explosion burst upon entering step 4
            triggerExplosionBurst();
            replayConfessionEntrance();
        });
    }

    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            initAudio();
            playSound('swipe');
            resetApp();
        });
    }
}

function navigateToStep(stepNumber) {
    const currentStepEl = document.getElementById(`step-${activeStep}`);
    const nextStepEl = document.getElementById(`step-${stepNumber}`);

    if (currentStepEl && nextStepEl) {
        currentStepEl.classList.remove('active');
        nextStepEl.classList.add('active');
        activeStep = stepNumber;
        
        // Custom actions on step changes
        if (stepNumber === 4) {
            startCanvasAnimation();
        } else {
            stopCanvasAnimation();
        }
    }
}

function resetApp() {
    // Reset Navigation
    navigateToStep(1);
    
    // Reset Cards Stack (Step 2)
    resetStoryCards();
    
    // Reset Mystery Box (Step 3)
    resetMysteryBox();

    // Reset the Proposal (Step 4)
    resetProposal();
}

/* ==========================================================================
   STEP 2: STORY CARDS MECHANICS (SWIPING & BUTTONS)
   ========================================================================== */
let cardIndex = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

function initStoryCards() {
    const cards = Array.from(document.querySelectorAll('.story-card'));
    const nextButtons = document.querySelectorAll('.card-btn-next');
    const prevArrow = document.getElementById('prev-card');
    const nextArrow = document.getElementById('next-card');

    // Add pointer events for swiping
    cards.forEach(card => {
        card.addEventListener('mousedown', dragStart);
        card.addEventListener('touchstart', dragStart, { passive: true });
    });

    // Wire up inline buttons
    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => swipeTopCard(true)); // Swipe right visually
    });

    // Wire up navigation arrows
    if (prevArrow) {
        prevArrow.addEventListener('click', unswipeCard);
    }
    if (nextArrow) {
        nextArrow.addEventListener('click', () => {
            if (cardIndex < cards.length - 1) {
                swipeTopCard(true);
            }
        });
    }

    updateControlsState();
}

function dragStart(e) {
    initAudio();
    const card = e.currentTarget;
    const cards = Array.from(document.querySelectorAll('.story-card'));
    const expectedIndex = parseInt(card.dataset.index);

    // Only allow dragging the top-most active card
    if (expectedIndex !== cardIndex) return;

    isDragging = true;
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    currentX = clientX;
    currentY = clientY;

    card.style.transition = 'none';

    // Bind event listeners globally
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
}

function dragMove(e) {
    if (!isDragging) return;
    
    // Prevent scrolling during touch drags
    if (e.cancelable) e.preventDefault();

    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    currentX = clientX;
    currentY = clientY;

    const diffX = currentX - startX;
    const diffY = currentY - startY;

    // Apply transformation live to card
    const cards = Array.from(document.querySelectorAll('.story-card'));
    const card = cards.find(c => parseInt(c.dataset.index) === cardIndex);
    if (card) {
        // Soft tilt effect based on drag distance
        const tilt = diffX * 0.08;
        card.style.transform = `translate(${diffX}px, ${diffY * 0.4}px) rotate(${tilt}deg)`;
    }
}

function dragEnd() {
    if (!isDragging) return;
    isDragging = false;

    // Unbind listeners
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchend', dragEnd);

    const diffX = currentX - startX;
    const cards = Array.from(document.querySelectorAll('.story-card'));
    const card = cards.find(c => parseInt(c.dataset.index) === cardIndex);

    if (!card) return;

    const swipeThreshold = 100;
    if (Math.abs(diffX) > swipeThreshold) {
        // Determine swipe direction
        const swipeRight = diffX > 0;
        executeSwipe(card, swipeRight);
    } else {
        // Reset card placement with smooth transition
        card.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        card.style.transform = getCardTransform(cardIndex);
    }
}

function swipeTopCard(swipeRight = true) {
    const cards = Array.from(document.querySelectorAll('.story-card'));
    const card = cards.find(c => parseInt(c.dataset.index) === cardIndex);
    if (card) {
        executeSwipe(card, swipeRight);
    }
}

function executeSwipe(card, swipeRight) {
    playSound('swipe');
    card.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.6s ease';
    
    if (swipeRight) {
        card.classList.add('swiped-right');
    } else {
        card.classList.add('swiped-left');
    }

    cardIndex++;
    
    // Automatically transition to Step 3 if we swiped the very last card
    const cards = Array.from(document.querySelectorAll('.story-card'));
    if (cardIndex >= cards.length) {
        setTimeout(() => {
            navigateToStep(3);
        }, 300);
    } else {
        updateControlsState();
    }
}

function unswipeCard() {
    if (cardIndex <= 0) return;

    playSound('swipe');
    cardIndex--;
    const cards = Array.from(document.querySelectorAll('.story-card'));
    const card = cards.find(c => parseInt(c.dataset.index) === cardIndex);
    
    if (card) {
        card.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s ease';
        card.classList.remove('swiped-left', 'swiped-right');
        card.style.transform = getCardTransform(cardIndex);
    }
    
    updateControlsState();
}

function updateControlsState() {
    const prevArrow = document.getElementById('prev-card');
    const nextArrow = document.getElementById('next-card');
    const dots = document.querySelectorAll('.dot');
    const cards = Array.from(document.querySelectorAll('.story-card'));

    // Enable/Disable prev arrow
    if (prevArrow) {
        prevArrow.disabled = (cardIndex === 0);
    }

    // Enable/Disable next arrow (if it's the last card, we transition via the "Unlock Surprise" button)
    if (nextArrow) {
        nextArrow.disabled = (cardIndex >= cards.length - 1);
    }

    // Update Dots indicator
    dots.forEach((dot, idx) => {
        if (idx === Math.min(cardIndex, cards.length - 1)) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function resetStoryCards() {
    cardIndex = 0;
    const cards = Array.from(document.querySelectorAll('.story-card'));
    cards.forEach(card => {
        card.style.transition = 'none';
        card.classList.remove('swiped-left', 'swiped-right');
        
        // Reset transforms
        const idx = parseInt(card.dataset.index);
        card.style.transform = getCardTransform(idx);
        
        // Trigger style reflow
        void card.offsetHeight;
        card.style.transition = '';
    });
    updateControlsState();
}

function getCardTransform(index) {
    const rotations = [-2, 1.5, -1, 2.5];
    const translateYs = [0, 8, 16, 24];
    const scales = [1, 0.96, 0.92, 0.88];
    
    const rot = rotations[index] || 0;
    const ty = translateYs[index] || 0;
    const scale = scales[index] || 1;
    
    return `rotate(${rot}deg) translateY(${ty}px) scale(${scale}) translateZ(0)`;
}

/* ==========================================================================
   STEP 3: MYSTERY BOX & TYPEWRITER SONG LYRICS
   ========================================================================== */
let isBoxOpened = false;
let typewriterTimer = null;

function initMysteryBox() {
    const boxTrigger = document.getElementById('mystery-box-trigger');
    const btnOpenBox = document.getElementById('btn-open-box');
    
    if (boxTrigger) {
        boxTrigger.addEventListener('click', openMysteryBox);
    }

    if (btnOpenBox) {
        btnOpenBox.addEventListener('click', openMysteryBox);
    }
}

function openMysteryBox() {
    initAudio();
    if (isBoxOpened) return;
    isBoxOpened = true;

    playSound('magic');
    const boxWrapper = document.getElementById('mystery-box-trigger');
    const btnOpenBox = document.getElementById('btn-open-box');
    const instruction = document.getElementById('mystery-instruction');

    if (boxWrapper) {
        boxWrapper.classList.add('opened');
        boxWrapper.classList.remove('ready-to-open');
    }

    if (btnOpenBox) {
        // Add fade out animation or hide instantly
        btnOpenBox.style.opacity = '0';
        setTimeout(() => btnOpenBox.classList.add('hidden'), 350);
    }

    if (instruction) {
        instruction.textContent = "হৃদয়ের কথা শোনো...";
        setTimeout(() => {
            instruction.style.opacity = '0';
        }, 1200);
    }

    // Play/Trigger lyric typewriter effect after a short delay
    setTimeout(() => {
        const lyricsText = "তোমাকে প্রথম দেখার দিনটা মনে আছে?\nসেদিন থেকেই বুঝেছিলাম,\nতুমি আমার জীবনের সবচেয়ে সুন্দর ভুল নও —\nতুমি আমার সবচেয়ে সুন্দর সিদ্ধান্ত।";
        const lyricsEl = document.getElementById('lyrics-text');
        
        if (lyricsEl) {
            lyricsEl.textContent = "";
            lyricsEl.classList.remove('finished');
            runTypewriter(lyricsText, lyricsEl, () => {
                // Typewriter completed
                lyricsEl.classList.add('finished');
                
                // Show "Click Me" / Step 4 button
                const btnMysteryNext = document.getElementById('btn-mystery-next');
                if (btnMysteryNext) {
                    btnMysteryNext.classList.remove('hidden');
                    btnMysteryNext.style.opacity = '0';
                    btnMysteryNext.style.transform = 'scale(0.8)';
                    // Trigger reflow
                    void btnMysteryNext.offsetHeight;
                    btnMysteryNext.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    btnMysteryNext.style.opacity = '1';
                    btnMysteryNext.style.transform = 'scale(1)';
                }
            });
        }
    }, 1500);
}

function runTypewriter(text, element, callback) {
    let index = 0;
    
    function type() {
        if (index < text.length) {
            const char = text.charAt(index);
            element.textContent += char;
            index++;
            
            // Premium typewriter pacing: wait longer on punctuation for emotional weight
            let delay = 90;
            if (char === '?') {
                delay = 500;
            } else if (char === ',') {
                delay = 300;
            } else if (char === '\n') {
                delay = 600;
            }
            
            typewriterTimer = setTimeout(type, delay);
        } else {
            if (callback) callback();
        }
    }
    
    type();
}

function resetMysteryBox() {
    isBoxOpened = false;
    if (typewriterTimer) {
        clearTimeout(typewriterTimer);
        typewriterTimer = null;
    }

    const boxWrapper = document.getElementById('mystery-box-trigger');
    const btnOpenBox = document.getElementById('btn-open-box');
    const instruction = document.getElementById('mystery-instruction');
    const lyricsEl = document.getElementById('lyrics-text');
    const btnMysteryNext = document.getElementById('btn-mystery-next');

    if (boxWrapper) {
        boxWrapper.classList.remove('opened');
        boxWrapper.classList.add('ready-to-open');
    }

    if (btnOpenBox) {
        btnOpenBox.classList.remove('hidden');
        btnOpenBox.style.opacity = '1';
    }

    if (instruction) {
        instruction.textContent = "What's inside the box?";
        instruction.style.opacity = '1';
    }

    if (lyricsEl) {
        lyricsEl.textContent = "";
        lyricsEl.classList.remove('finished');
    }

    if (btnMysteryNext) {
        btnMysteryNext.classList.add('hidden');
        btnMysteryNext.style.opacity = '0';
    }
}

/* ==========================================================================
   STEP 4 EXTRA: THE PROPOSAL (ACCEPT / REJECT) — HILARIOUS REJECT DODGE
   ========================================================================== */
let rejectDodgeCount = 0;

// Bangla funny captions — gets progressively desperate/funnier
const dodgeCaptions = [
    'ধরতে পারবে না!',
    'আমি ভয় পাই!',
    'এত সহজ না!',
    'ওই দিকে যাও!',
    'আমাকে ছোঁয়ো না!',
    'তুমি কি সিরিয়াস?!',
    'Accept চাপো না কেন!',
    'আমি পালাচ্ছি...',
    'হা হা হা, পারবে না!',
    'বুদ্ধি লাগাও!',
    'I am speed!',
    'এখানে আসো... সাইক!',
    'উফফ, আবারও মিস!',
    'তোমার aim কোথায়?!',
    'পাশের button টা চাপো!',
];

// Different dodge animation types
const dodgeAnimations = [
    'spin-dodge',
    'flip-dodge',
    'bounce-dodge',
    'shake-dodge',
];

function initProposal() {
    const acceptBtn = document.getElementById('btn-accept');
    const rejectBtn = document.getElementById('btn-reject');

    if (rejectBtn) {
        rejectBtn.addEventListener('mouseenter', dodgeRejectButton);
        rejectBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            dodgeRejectButton();
        }, { passive: false });
        rejectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dodgeRejectButton();
        });
    }

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            initAudio();
            playSound('celebrate');
            showYesState();
        });
    }
}

function dodgeRejectButton() {
    const rejectBtn = document.getElementById('btn-reject');
    const acceptBtn = document.getElementById('btn-accept');
    if (!rejectBtn) return;

    initAudio();
    rejectDodgeCount++;

    if (rejectDodgeCount % 3 === 0) {
        playSound('magic');
    } else {
        playSound('swipe');
    }

    // First dodge: inject placeholder to keep layout stable
    if (rejectDodgeCount === 1) {
        const placeholder = document.createElement('span');
        placeholder.className = 'choice-reject-placeholder btn secondary-btn';
        placeholder.style.width = rejectBtn.offsetWidth + 'px';
        placeholder.style.height = rejectBtn.offsetHeight + 'px';
        rejectBtn.parentNode.insertBefore(placeholder, rejectBtn.nextSibling);

        // Position button at its current location before going fixed
        const rect = rejectBtn.getBoundingClientRect();
        rejectBtn.classList.add('armed');
        rejectBtn.style.left = `${rect.left}px`;
        rejectBtn.style.top = `${rect.top}px`;
        rejectBtn.style.width = `${rect.width}px`;
    }

    const viewW = document.documentElement.clientWidth || window.innerWidth;
    const viewH = document.documentElement.clientHeight || window.innerHeight;
    const btnWidth = rejectBtn.offsetWidth || 120;
    const btnHeight = rejectBtn.offsetHeight || 50;
    const safeMargin = 15;

    const minX = safeMargin;
    const minY = safeMargin;
    const maxX = viewW - btnWidth - safeMargin;
    const maxY = viewH - btnHeight - safeMargin;

    let newX, newY;

    if (rejectDodgeCount === 1) {
        // First dodge: jump to a random spot (not the original position)
        newX = minX + Math.random() * (maxX - minX);
        newY = minY + Math.random() * (maxY - minY);
    } else if (rejectDodgeCount <= 4) {
        newX = minX + Math.random() * (maxX - minX);
        newY = minY + Math.random() * (maxY - minY);
    } else if (rejectDodgeCount <= 8) {
        const corners = [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: minX, y: maxY },
            { x: maxX, y: maxY },
        ];
        const corner = corners[Math.floor(Math.random() * corners.length)];
        newX = corner.x;
        newY = corner.y;
    } else {
        newX = minX + Math.random() * (maxX - minX);
        newY = minY + Math.random() * (maxY - minY);

        const btnRect = rejectBtn.getBoundingClientRect();
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;

        if (Math.abs(newX - btnCenterX) < 100) newX = maxX - newX + minX;
        if (Math.abs(newY - btnCenterY) < 100) newY = maxY - newY + minY;
    }

    // STRICT CLAMP
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    rejectBtn.style.left = `${newX}px`;
    rejectBtn.style.top = `${newY}px`;

    // Dodge animations
    const prevAnims = [...rejectBtn.classList].filter(c => c.endsWith('-dodge'));
    prevAnims.forEach(a => rejectBtn.classList.remove(a));
    void rejectBtn.offsetHeight;
    const animChoice = dodgeAnimations[Math.floor(Math.random() * dodgeAnimations.length)];
    rejectBtn.classList.add(animChoice);
    setTimeout(() => { rejectBtn.classList.remove(animChoice); }, 600);

    // Shrink reject, grow accept
    const rScale = Math.max(0.45, 1 - rejectDodgeCount * 0.04);
    rejectBtn.style.setProperty('--reject-scale', rScale);

    if (acceptBtn) {
        const aScale = Math.min(1.5, 1 + rejectDodgeCount * 0.05);
        acceptBtn.style.transform = `scale(${aScale})`;
        if (rejectDodgeCount >= 5) {
            acceptBtn.style.boxShadow = `0 0 ${10 + rejectDodgeCount * 3}px rgba(255, 94, 126, ${Math.min(0.8, 0.3 + rejectDodgeCount * 0.05)})`;
        }
    }

    const span = rejectBtn.querySelector('span');
    if (span) {
        span.textContent = dodgeCaptions[(rejectDodgeCount - 1) % dodgeCaptions.length];
    }

    if (rejectDodgeCount >= 10) {
        rejectBtn.style.opacity = Math.max(0.4, 1 - (rejectDodgeCount - 10) * 0.08);
    }

    if (rejectDodgeCount >= 15) {
        rejectBtn.style.transition = 'top 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s ease';
    }
}

function showYesState() {
    const proposalQuestion = document.getElementById('proposal-question');
    const yesMessage = document.getElementById('yes-message');

    if (proposalQuestion) proposalQuestion.classList.add('hidden');
    if (yesMessage) {
        yesMessage.classList.remove('hidden');
        restartAnimation(yesMessage);
    }

    // Extra big celebration burst for the "yes"
    triggerExplosionBurst();
}

function resetProposal() {
    rejectDodgeCount = 0;
    const acceptBtn = document.getElementById('btn-accept');
    const rejectBtn = document.getElementById('btn-reject');
    const proposalQuestion = document.getElementById('proposal-question');
    const yesMessage = document.getElementById('yes-message');

    if (rejectBtn) {
        rejectBtn.classList.remove('armed', ...dodgeAnimations);
        rejectBtn.style.left = '';
        rejectBtn.style.top = '';
        rejectBtn.style.width = '';
        rejectBtn.style.transform = '';
        rejectBtn.style.opacity = '';
        rejectBtn.style.transition = '';
        rejectBtn.style.removeProperty('--reject-scale');
        const span = rejectBtn.querySelector('span');
        if (span) span.textContent = 'না';
    }

    // Remove placeholder if exists
    const placeholder = document.querySelector('.choice-reject-placeholder');
    if (placeholder) placeholder.remove();

    if (acceptBtn) {
        acceptBtn.style.transform = '';
        acceptBtn.style.boxShadow = '';
    }
    if (proposalQuestion) proposalQuestion.classList.remove('hidden');
    if (yesMessage) yesMessage.classList.add('hidden');
}

/* ==========================================================================
   STEP 4: FULLSCREEN CANVAS CONFETTI & HEART BURST ENGINE
   ========================================================================== */
let canvas = null;
let ctx = null;
let particles = [];
let isCanvasRunning = false;
let canvasAnimFrame = null;
let width = 0;
let height = 0;

function initCanvasParticles() {
    canvas = document.getElementById('canvas-particles');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Let user tap canvas to create heart sparkles
    document.addEventListener('click', handleScreenClick);
    document.addEventListener('touchstart', handleScreenClick, { passive: true });
}

function resizeCanvas() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

function handleScreenClick(e) {
    if (activeStep !== 4 || !canvas) return;

    initAudio();
    playSound('click');
    // Get click location
    let clickX = 0;
    let clickY = 0;

    if (e.type === 'touchstart') {
        clickX = e.touches[0].clientX;
        clickY = e.touches[0].clientY;
    } else {
        clickX = e.clientX;
        clickY = e.clientY;
    }

    // Trigger local burst of heart and sparkles at click point
    for (let i = 0; i < 8; i++) {
        particles.push(new HeartParticle(clickX, clickY, true));
    }
    for (let i = 0; i < 10; i++) {
        particles.push(new ConfettiParticle(clickX, clickY));
    }
}

/* --- Particle Definitions --- */

// Confetti Particle
class ConfettiParticle {
    constructor(x, y) {
        this.x = x || Math.random() * width;
        this.y = y || (Math.random() * -100) - 20; // Spawn offscreen top
        
        this.size = Math.random() * 8 + 6;
        this.color = getConfettiColor();
        this.shape = Math.random() > 0.5 ? 'circle' : 'rect';
        
        // Movement vectors
        this.vx = Math.random() * 4 - 2;
        this.vy = Math.random() * 3 + 2; // Gravity speed
        
        // Rotational characteristics
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.1 - 0.05;
        this.swing = Math.random() * 0.05;
        this.swingStep = Math.random() * 360;
    }

    update() {
        this.x += this.vx + Math.sin(this.swingStep) * 0.5;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.swingStep += this.swing;

        // Keep it looping from top when falling off bottom during continuous step 4 mode
        if (this.y > height + 20) {
            this.y = -20;
            this.x = Math.random() * width;
            this.vy = Math.random() * 3 + 2;
            this.vx = Math.random() * 4 - 2;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;

        if (this.shape === 'rect') {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Heart Particle
class HeartParticle {
    constructor(x, y, isBurst = false) {
        this.x = x || Math.random() * width;
        this.y = y || (isBurst ? y : height + 30); // Spawn at click position, or bottom of screen
        
        this.size = Math.random() * 15 + 10; // 10 to 25px
        this.color = getHeartColor();
        
        // Speed
        if (isBurst) {
            // Explode outwards in radial direction
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            // Drift upwards
            this.vx = Math.random() * 2 - 1;
            this.vy = -(Math.random() * 2.5 + 1.5);
        }

        this.opacity = 1;
        this.fadeSpeed = isBurst ? 0.015 : 0.005;
        this.scale = 0.1;
        this.growthSpeed = 0.05;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply air resistance to bursts
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Animate scaling up on spawn
        if (this.scale < 1) {
            this.scale += this.growthSpeed;
        }

        // Fade out
        this.opacity -= this.fadeSpeed;
    }

    draw() {
        if (this.opacity <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;

        // Custom canvas heart vector drawing
        ctx.beginPath();
        const topCurveHeight = this.size * 0.3;
        ctx.moveTo(0, topCurveHeight);
        
        // Top left curve
        ctx.bezierCurveTo(
            -this.size / 2, -topCurveHeight, 
            -this.size, topCurveHeight, 
            0, this.size
        );
        
        // Top right curve
        ctx.bezierCurveTo(
            this.size, topCurveHeight, 
            this.size / 2, -topCurveHeight, 
            0, topCurveHeight
        );
        
        ctx.fill();
        ctx.restore();
    }
}

// Particle Palette Helpers
function getConfettiColor() {
    const colors = [
        '#FF5E7E', // pink
        '#FF8DA1', // light pink
        '#FFB2C1', // blush
        '#FFD1DC', // pastel pink
        '#FFD700', // gold
        '#87CEFA', // sky blue
        '#D8BFD8', // thistle lavender
        '#FFE4E1'  // misty rose
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getHeartColor() {
    const colors = [
        '#FF5E7E', // Primary Pink
        '#FF3B60', // Hot Pink
        '#FF8DA1', // Peach Pink
        '#E60026', // Pure Red
        '#FFB2C1'  // Soft Rose
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

/* --- Engine Loop Controls --- */

function triggerExplosionBurst() {
    // Initial big burst of colorful confetti and hearts
    particles = [];
    
    // Spawn bottom fountain center
    const spawnX = width / 2;
    const spawnY = height * 0.75;

    for (let i = 0; i < 100; i++) {
        const p = new ConfettiParticle();
        // Give them upward velocity for explosion effect
        p.x = spawnX + (Math.random() * 40 - 20);
        p.y = spawnY + (Math.random() * 40 - 20);
        p.vx = Math.random() * 16 - 8;
        p.vy = -(Math.random() * 12 + 6);
        particles.push(p);
    }

    for (let i = 0; i < 40; i++) {
        const p = new HeartParticle(spawnX, spawnY, true);
        p.vx *= 2.5;
        p.vy = -(Math.random() * 8 + 4);
        particles.push(p);
    }
}

function startCanvasAnimation() {
    if (isCanvasRunning) return;
    isCanvasRunning = true;
    animateParticles();
}

function stopCanvasAnimation() {
    isCanvasRunning = false;
    if (canvasAnimFrame) {
        cancelAnimationFrame(canvasAnimFrame);
        canvasAnimFrame = null;
    }
    if (ctx) {
        ctx.clearRect(0, 0, width, height);
    }
    particles = [];
}

function animateParticles() {
    if (!isCanvasRunning || !ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Keep active ambient hearts spawning slowly from bottom if count is low
    const heartCount = particles.filter(p => p instanceof HeartParticle && p.vy < 0).length;
    if (heartCount < 18) {
        particles.push(new HeartParticle(Math.random() * width, height + 20, false));
    }

    // Keep confetti count balanced
    const confettiCount = particles.filter(p => p instanceof ConfettiParticle).length;
    if (confettiCount < 50) {
        particles.push(new ConfettiParticle());
    }

    // Update and draw loop
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();

        // Kill off faded out hearts
        if (p instanceof HeartParticle && p.opacity <= 0) {
            particles.splice(i, 1);
        }
    }

    canvasAnimFrame = requestAnimationFrame(animateParticles);
}

