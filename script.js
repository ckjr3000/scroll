let ctx;
let gainNodeLeft, gainNodeRight;
let gainVal = 0.5;

const playButton = document.getElementById('play-btn');
playButton.addEventListener('click', () => {
    ctx = new AudioContext();
    initialiseWhiteNoise();
    gainNodeLeft.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNodeRight.gain.setValueAtTime(gainVal, ctx.currentTime);
})

function initialiseWhiteNoise() {
    const numChannels = 2;
    const sampleRate = ctx.sampleRate;
    const duration = 2;
    const numFrames = sampleRate * duration;

    const buffer = ctx.createBuffer(numChannels, numFrames, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const nowBuffering = buffer.getChannelData(channel);
        for (let i = 0; i < numFrames; i++) {
            nowBuffering[i] = Math.random() * 2 - 1; 
        }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const splitter = ctx.createChannelSplitter(2);
    gainNodeLeft = ctx.createGain();
    gainNodeRight = ctx.createGain();
    const merger = ctx.createChannelMerger(2);

    source.connect(splitter);
    splitter.connect(gainNodeLeft, 0);
    splitter.connect(gainNodeRight, 1);
    gainNodeLeft.connect(merger, 0, 0);
    gainNodeRight.connect(merger, 0, 1);

    merger.connect(ctx.destination);

    source.start();
}

const stopButton = document.getElementById('stop-btn');
stopButton.addEventListener('click', () => {
    gainNodeLeft.gain.setValueAtTime(0, ctx.currentTime);
    gainNodeRight.gain.setValueAtTime(0, ctx.currentTime);
    stopWobble();
})

const volCtrl = document.getElementById('vol-ctrl');
volCtrl.addEventListener('change', (e) => {
    let newGain = e.target.value;
    gainVal = newGain;
    gainNodeLeft.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNodeRight.gain.setValueAtTime(gainVal, ctx.currentTime);
})

const wobbleGain = document.getElementById('wobble-gain');
const intervalSizeInput = document.getElementById('interval-size');

let wobbleInterval;
let wobbleIntervalSize = 500;
let wobbleActive = false;
wobbleGain.addEventListener('click', () => {
    if (!wobbleActive) {
        intervalSizeInput.classList.remove('hidden');
        wobble();
    } else {
        gainNodeLeft.gain.setValueAtTime(gainVal, ctx.currentTime);
        gainNodeRight.gain.setValueAtTime(gainVal, ctx.currentTime);
        stopWobble();
    }
});

intervalSizeInput.addEventListener('change', (e) => {
    let newSize = e.target.value;
    wobbleIntervalSize = newSize;
    wobble();
})

function wobble() {
    wobbleActive = true;
    wobbleGain.innerText = 'Stop Wobble';
    clearInterval(wobbleInterval);
    wobbleInterval = setInterval(() => {
        let randomGain = Math.random();
        gainNodeLeft.gain.setValueAtTime(randomGain, ctx.currentTime);
        gainNodeRight.gain.setValueAtTime(randomGain, ctx.currentTime);
        volCtrl.value = randomGain;
    }, wobbleIntervalSize);
}

function stopWobble() {
    clearInterval(wobbleInterval);
    wobbleActive = false;
    intervalSizeInput.classList.add('hidden');
}

const pan = document.getElementById('pan');
const panValueInput = document.getElementById('pan-val');
let panValue = 0;

pan.addEventListener('click', () => {
    panValueInput.classList.remove('hidden');
})

panValueInput.addEventListener('change', (e) => {
    panValue = e.target.value;
    if (panValue == 0) {
        gainNodeLeft.gain.setValueAtTime(gainVal, ctx.currentTime);
        gainNodeRight.gain.setValueAtTime(gainVal, ctx.currentTime);
    } else if (panValue < 0) {
        gainNodeRight.gain.setValueAtTime(gainVal * (1 + parseFloat(panValue)), ctx.currentTime); // decrease right channel gain
        gainNodeLeft.gain.setValueAtTime(gainVal, ctx.currentTime);
    } else {
        gainNodeLeft.gain.setValueAtTime(gainVal * (1 - parseFloat(panValue)), ctx.currentTime); // decrease left channel gain
        gainNodeRight.gain.setValueAtTime(gainVal, ctx.currentTime);
    }
})
