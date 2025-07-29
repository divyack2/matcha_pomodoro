/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

// Import assets with cleaner object mapping
const assets = {
  cup1: new URL('../assets/cup1.svg', import.meta.url).href,
  cup1Alt: new URL('../assets/cup1-alt.svg', import.meta.url).href,
  cup2: new URL('../assets/cup2.svg', import.meta.url).href,
  cup2Alt: new URL('../assets/cup2-alt.svg', import.meta.url).href,
  cup3: new URL('../assets/cup3.svg', import.meta.url).href,
  cup3Alt: new URL('../assets/cup3-alt.svg', import.meta.url).href,
  cup4: new URL('../assets/cup4.svg', import.meta.url).href,
  cup4Alt: new URL('../assets/cup4-alt.svg', import.meta.url).href,
  cup5: new URL('../assets/cup5.svg', import.meta.url).href,
  cup5Alt: new URL('../assets/cup5-alt.svg', import.meta.url).href,
  play: new URL('../assets/play.svg', import.meta.url).href,
  pause: new URL('../assets/pause.svg', import.meta.url).href,
  reset: new URL('../assets/reset.svg', import.meta.url).href,
} as const;

type AssetKey = keyof typeof assets;

document.addEventListener('DOMContentLoaded', () => {
    type Mode = 'work' | 'break';
    let mode: Mode = 'work';

    const WORK_TIME = 25 * 60;     // 25 minutes
    const BREAK_TIME = 5 * 60;     // 5 minutes

    let timeLeft = WORK_TIME;
    let interval: NodeJS.Timeout | null = null;
    let idleCupInterval: NodeJS.Timeout | null = null;
    let running = false;
    let lastCupNum = 0;

    const timerDisplay = document.getElementById('timer') as HTMLElement;
    const toggleBtn = document.getElementById('toggle') as HTMLImageElement;
    const resetBtn = document.getElementById('reset') as HTMLImageElement;
    const cupImg = document.getElementById('cup') as HTMLImageElement;

    function startCupIdleAnimation(cupNum: number) {
        if (idleCupInterval) clearInterval(idleCupInterval);

        let isAlt = false;

        idleCupInterval = setInterval(() => {
            const suffix = isAlt ? '-alt' : '';
            cupImg.src = suffix ? assets[`cup${cupNum}Alt` as AssetKey] : assets[`cup${cupNum}` as AssetKey];
            isAlt = !isAlt;
        }, 1750);
    }

    function stopCupIdleAnimation() {
        if (idleCupInterval) {
            clearInterval(idleCupInterval);
            idleCupInterval = null;
        }
    }

    function refillCupAnimation(onComplete: () => void) {
        stopCupIdleAnimation(); // prevent overlap

        const cupFrames = [5, 4, 3, 2, 1];
        let i = 0;

        // Delays in ms for each frame
        const delays = [100, 150, 200, 400, 500];

        function nextFrame() {
            if (i >= cupFrames.length) {
                lastCupNum = 1;
                startCupIdleAnimation(1); // restart idle
                onComplete();
                return;
            }

            const cupNum = cupFrames[i];
            cupImg.src = assets[`cup${cupNum}` as AssetKey];
            lastCupNum = cupNum;

            setTimeout(nextFrame, delays[i]);
            i++;
        }

        nextFrame(); // start the animation
        }


    function updateCupImage() {
        if (mode !== 'work') return;

        const elapsed = WORK_TIME - timeLeft;
        const phase = Math.floor(elapsed / (WORK_TIME / 4)) + 1; // 1 to 4
        const cupNum = Math.min(phase, 4);

        if (cupNum !== lastCupNum) {
            cupImg.src = assets[`cup${cupNum}` as AssetKey];
            lastCupNum = cupNum;
            startCupIdleAnimation(cupNum);
        }
    }

    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    function resetTimer() {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }

        running = false;
        toggleBtn.src = assets.play;

        timeLeft = mode === 'work' ? WORK_TIME : BREAK_TIME;
        lastCupNum = 0;
        cupImg.src = mode === 'work' ? assets.cup1 : assets.cup5;
        updateDisplay();
    }


    function startTimer() {
        if (interval) return;

        interval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
            updateCupImage();
        } else {
            clearInterval(interval!);
            interval = null;
            running = false;
            toggleBtn.src = assets.play;

            if (mode === 'work') {
            // Transition to break
                mode = 'break';
                timeLeft = BREAK_TIME;
                document.body.style.backgroundColor = '#98CD95';
                stopCupIdleAnimation();
                cupImg.src = assets.cup5;
                updateDisplay();
                startTimer();
            } else {
                // Transition back to work
                mode = 'work';
                timeLeft = WORK_TIME;
                document.body.style.backgroundColor = '#639274';

                lastCupNum = 0;
                updateDisplay();

                refillCupAnimation(() => {
                    startTimer(); // start only after refill finishes
                });
            }
        }
        }, 1000);

        running = true;
        toggleBtn.src = assets.pause;
    }

    function pauseTimer() {
        if (interval) {
        clearInterval(interval);
        interval = null;
        }

        running = false;
        toggleBtn.src = assets.play;
    }

    toggleBtn.addEventListener('click', () => {
        running ? pauseTimer() : startTimer();
    });

    resetBtn.addEventListener('click', resetTimer);

  updateDisplay();
});

console.log('👋 This message is being logged by "renderer.ts", included via Vite');
