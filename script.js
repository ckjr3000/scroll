let ctx;
let source;
let gainNodeLeft, gainNodeRight;
let gainVal = 0.5;
let filterNode;
let bitcrusherNode;
let bitDepth = 4;

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

    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const splitter = ctx.createChannelSplitter(2);
    gainNodeLeft = ctx.createGain();
    gainNodeRight = ctx.createGain();
    const merger = ctx.createChannelMerger(2);

    filterNode = ctx.createBiquadFilter();
    filterNode.type = 'bandpass';

    bitcrusherNode = createBitcrusherNode();

    source.connect(splitter);
    splitter.connect(gainNodeLeft, 0);
    splitter.connect(gainNodeRight, 1);
    gainNodeLeft.connect(merger, 0, 0);
    gainNodeRight.connect(merger, 0, 1);

    merger.connect(filterNode);

    filterNode.connect(bitcrusherNode);

    bitcrusherNode.connect(ctx.destination);merger.connect(bitcrusherNode);

    source.start();
}

// play
const playButton = document.getElementById('play-btn');
playButton.addEventListener('click', () => {
    ctx = new AudioContext();
    initialiseWhiteNoise();
    gainNodeLeft.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNodeRight.gain.setValueAtTime(gainVal, ctx.currentTime);
})

// stop
const stopButton = document.getElementById('stop-btn');
stopButton.addEventListener('click', () => {
    gainNodeLeft.gain.setValueAtTime(0, ctx.currentTime);
    gainNodeRight.gain.setValueAtTime(0, ctx.currentTime);
    stopWobble();
})

// master volume
const volCtrl = document.getElementById('vol-ctrl');
volCtrl.addEventListener('change', (e) => {
    let newGain = e.target.value;
    gainVal = newGain;
    gainNodeLeft.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNodeRight.gain.setValueAtTime(gainVal, ctx.currentTime);
})

// wobble gain
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

// pan
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

// time stretch
const stretch = document.getElementById('stretch');
const stretchValueInput = document.getElementById('stretch-val');
let stretchValue = 0;

stretch.addEventListener('click', () => {
    stretchValueInput.classList.remove('hidden');
})

stretchValueInput.addEventListener('change', (e) => {
    stretchValue = e.target.value;
    source.playbackRate.setValueAtTime(stretchValue, ctx.currentTime);
})

// pitch
const pitch = document.getElementById('pitch');
const pitchValueInput = document.getElementById('pitch-val');
let pitchValue = 0;

pitch.addEventListener('click', () => {
    pitchValueInput.classList.remove('hidden');
})

pitchValueInput.addEventListener('change', (e) => {
    pitchValue = e.target.value;
    filterNode.frequency.setValueAtTime(pitchValue, ctx.currentTime);
})

// bitcrush
function createBitcrusherNode() {
    const bufferSize = 4096;
    const bitcrusherNode = ctx.createScriptProcessor(bufferSize, 2, 2);

    bitcrusherNode.onaudioprocess = function(event) {
        for (let channel = 0; channel < event.inputBuffer.numberOfChannels; channel++) {
            const input = event.inputBuffer.getChannelData(channel);
            const output = event.outputBuffer.getChannelData(channel);

            for (let i = 0; i < input.length; i++) {
                // Adjust the bit depth reduction factor with a non-linear function
                let reduction = Math.pow(2, 16 - bitDepth); // Example: inversely scale reduction
                // Apply non-linear distortion to the audio sample
                output[i] = Math.sign(input[i]) * (1 - Math.pow(1 - Math.abs(input[i]), reduction));
            }
        }
    };

    return bitcrusherNode;
}


const bitcrush = document.getElementById('crush');
const bitcrushValueInput = document.getElementById('crush-val');
bitcrush.addEventListener('click', () => {
    bitcrushValueInput.classList.remove('hidden');
})

bitcrushValueInput.addEventListener('change', (e) => {
    bitDepth = e.target.value;
})
