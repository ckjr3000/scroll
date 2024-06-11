let ctx;
let source;
let gainNodeLeft, gainNodeRight;
let gainVal = 0.5;
let filterNode;
let bitcrusherNode;
let bitDepth = 16;
let stereoPanner;
let compressor;
let bitcrusherGainNode;
const audioFilePath = './assets/drones.mp3';


function initialiseSoundSource() {
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
    initialiseSoundSource();
    gainNodeLeft.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNodeRight.gain.setValueAtTime(gainVal, ctx.currentTime);
})

// stop
const stopButton = document.getElementById('stop-btn');
stopButton.addEventListener('click', () => {
    if (source) {
        source.stop();
    }
});

// master volume
const volCtrl = document.getElementById('vol-ctrl');
volCtrl.addEventListener('change', (e) => {
    let newGain = e.target.value;
    gainVal = newGain;
    gainNodeLeft.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.05);
    gainNodeRight.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.05);
});

// pan
const panValueInput = document.getElementById('pan-val');
let panValue = 0;

panValueInput.addEventListener('change', (e) => {
    panValue = parseFloat(e.target.value);
    setPanning(panValue);
});

function setPanning(panValue) {
    panValue = Math.min(1, Math.max(-1, panValue));
    stereoPanner.pan.linearRampToValueAtTime(panValue, ctx.currentTime + 0.05);
}

// randomise pan
const randPan = document.getElementById('rand-pan');
let randPanActive = false;
let panInterval;
randPan.addEventListener('click', () => {
    if (!randPanActive) {
        randPanActive = true;
        panInterval = setInterval(() => {
            panValue = Math.random() * 2 - 1;
            stereoPanner.pan.linearRampToValueAtTime(panValue, ctx.currentTime + 0.05);
            panValueInput.value = panValue;
        }, 500);
    } else {
        randPanActive = false;
        clearInterval(panInterval);
        stereoPanner.pan.linearRampToValueAtTime(0, ctx.currentTime + 0.05); 
        panValueInput.value = 0; 
    }
});

// time stretch
const stretchValueInput = document.getElementById('stretch-val');
let stretchValue = 1;

stretchValueInput.addEventListener('change', (e) => {
    stretchValue = e.target.value;
    source.playbackRate.linearRampToValueAtTime(stretchValue, ctx.currentTime + 0.05);
});

// randomise stretch
const randStretch = document.getElementById('rand-stretch');
let randStretchActive = false;
let stretchInterval;
randStretch.addEventListener('click', () => {
    if (!randStretchActive) {
        randStretchActive = true;
        stretchInterval = setInterval(() => {
            stretchValue = Math.random() * (2 - 0.5) + 0.5;
            source.playbackRate.linearRampToValueAtTime(stretchValue, ctx.currentTime + 0.05);
            stretchValueInput.value = stretchValue;
        }, 500);
    } else {
        randStretchActive = false;
        clearInterval(stretchInterval);
        source.playbackRate.linearRampToValueAtTime(stretchValue, ctx.currentTime + 0.05);
        stretchValueInput.value = 1; 
    }
});

// pitch
const pitchValueInput = document.getElementById('pitch-val');
let pitchValue = 20000;

pitchValueInput.addEventListener('change', (e) => {
    pitchValue = e.target.value;
    filterNode.frequency.linearRampToValueAtTime(pitchValue, ctx.currentTime + 0.05);
});

// randomise pitch
const randPitch = document.getElementById('rand-pitch');
let randPitchActive = false;
let pitchInterval;
randPitch.addEventListener('click', () => {
    if (!randPitchActive) {
        randPitchActive = true;
        pitchInterval = setInterval(() => {
            pitchValue = Math.random() * 24000;
            filterNode.frequency.linearRampToValueAtTime(pitchValue, ctx.currentTime + 0.05);
            pitchValueInput.value = pitchValue;
        }, 500);
    } else {
        randPitchActive = false;
        clearInterval(pitchInterval);
        filterNode.frequency.linearRampToValueAtTime(pitchValue, ctx.currentTime + 0.05);
        pitchValueInput.value = pitchValue; 
    }
});

// bitcrush
function createBitcrusherNode() {
    const bufferSize = 4096;
    const bitcrusherNode = ctx.createScriptProcessor(bufferSize, 2, 2);

    bitcrusherNode.onaudioprocess = function(event) {
        for (let channel = 0; channel < event.inputBuffer.numberOfChannels; channel++) {
            const input = event.inputBuffer.getChannelData(channel);
            const output = event.outputBuffer.getChannelData(channel);

            for (let i = 0; i < input.length; i++) {
                let reduction = Math.pow(2, 16 - bitDepth);
                output[i] = Math.sign(input[i]) * (1 - Math.pow(1 - Math.abs(input[i]), reduction));
            }
        }
    };

    return bitcrusherNode;
}

const bitcrushValueInput = document.getElementById('crush-val');

bitcrushValueInput.addEventListener('change', (e) => {
    bitDepth = e.target.value;
    if (bitDepth < 16) {
        bitcrusherGainNode.gain.setValueAtTime(0.5, ctx.currentTime); 
    } else {
        bitcrusherGainNode.gain.setValueAtTime(1, ctx.currentTime);
    }
});

// randomise crush
const randCrush = document.getElementById('rand-crush');
let randCrushActive = false;
let crushInterval;
randCrush.addEventListener('click', () => {
    if (!randCrushActive) {
        randCrushActive = true;
        crushInterval = setInterval(() => {
            bitDepth = Math.random() * (16 - 12) + 12;
            bitcrushValueInput.value = bitDepth;
        }, 500);
    } else {
        randCrushActive = false;
        clearInterval(crushInterval);
        bitDepth = 16;
        bitcrushValueInput.value = bitDepth; 
    }
});

/// Add key press events
document.addEventListener('keydown', (e) => {
    let targetInput;
    switch (e.key) {
        case 'v':
            targetInput = document.getElementById('vol-ctrl');
            break;
        case 'p':
            targetInput = document.getElementById('pan-val');
            break;
        case 't':
            targetInput = document.getElementById('stretch-val');
            break;
        case 'f':
            targetInput = document.getElementById('pitch-val');
            break;
        case 'b':
            targetInput = document.getElementById('crush-val');
            break;
        default:
            return; 
    }
    if (targetInput) {
        targetInput.focus();
    }
});


