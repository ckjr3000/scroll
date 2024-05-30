let ctx;
let source;
let gainNodeLeft, gainNodeRight;
let gainVal = 0.5;
let filterNode;
let bitcrusherNode;
let bitDepth = 16;
let stereoPanner;
let compressor; // Add a compressor node
let bitcrusherGainNode; // Gain node for bitcrusher compensation
const audioFilePath = './assets/drones.mp3';

async function initialiseSoundSource(audioFilePath) {
    const response = await fetch(audioFilePath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;

    gainNodeLeft = ctx.createGain();
    gainNodeRight = ctx.createGain();
    stereoPanner = ctx.createStereoPanner();

    filterNode = ctx.createBiquadFilter();
    filterNode.type = 'bandpass';

    bitcrusherNode = createBitcrusherNode();
    
    // Gain node to compensate bitcrusher volume increase
    bitcrusherGainNode = ctx.createGain();
    bitcrusherGainNode.gain.setValueAtTime(1, ctx.currentTime);

    // Initialize the compressor node
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-40, ctx.currentTime); // Lower threshold
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    gainNodeLeft.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNodeRight.gain.setValueAtTime(gainVal, ctx.currentTime);
    stereoPanner.pan.setValueAtTime(0, ctx.currentTime);
    filterNode.frequency.setValueAtTime(20000, ctx.currentTime);

    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);

    source.connect(splitter);
    splitter.connect(gainNodeLeft, 0);
    splitter.connect(gainNodeRight, 1);
    gainNodeLeft.connect(merger, 0, 0);
    gainNodeRight.connect(merger, 0, 1);
    merger.connect(stereoPanner);
    stereoPanner.connect(filterNode);
    filterNode.connect(bitcrusherNode);
    bitcrusherNode.connect(bitcrusherGainNode); // Connect to gain node
    bitcrusherGainNode.connect(compressor); // Connect gain node to compressor
    compressor.connect(ctx.destination);

    source.start();
}

// play
const playButton = document.getElementById('play-btn');
playButton.addEventListener('click', async () => {
    ctx = new AudioContext();
    await initialiseSoundSource(audioFilePath);
});

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
    console.log(gainVal);
});

// pan
const pan = document.getElementById('pan');
const panValueInput = document.getElementById('pan-val');
let panValue = 0;

pan.addEventListener('click', () => {
    panValueInput.classList.remove('hidden');
});

panValueInput.addEventListener('change', (e) => {
    panValue = parseFloat(e.target.value);
    setPanning(panValue);
});

function setPanning(panValue) {
    panValue = Math.min(1, Math.max(-1, panValue));
    stereoPanner.pan.linearRampToValueAtTime(panValue, ctx.currentTime + 0.05);
}

// time stretch
const stretch = document.getElementById('stretch');
const stretchValueInput = document.getElementById('stretch-val');
let stretchValue = 1;

stretch.addEventListener('click', () => {
    stretchValueInput.classList.remove('hidden');
});

stretchValueInput.addEventListener('change', (e) => {
    stretchValue = e.target.value;
    source.playbackRate.linearRampToValueAtTime(stretchValue, ctx.currentTime + 0.05);
});

// pitch
const pitch = document.getElementById('pitch');
const pitchValueInput = document.getElementById('pitch-val');
let pitchValue = 20000;

pitch.addEventListener('click', () => {
    pitchValueInput.classList.remove('hidden');
});

pitchValueInput.addEventListener('change', (e) => {
    pitchValue = e.target.value;
    filterNode.frequency.linearRampToValueAtTime(pitchValue, ctx.currentTime + 0.05);
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

const bitcrush = document.getElementById('crush');
const bitcrushValueInput = document.getElementById('crush-val');
bitcrush.addEventListener('click', () => {
    bitcrushValueInput.classList.remove('hidden');
});

bitcrushValueInput.addEventListener('change', (e) => {
    bitDepth = e.target.value;
    // Adjust bitcrusherGainNode based on bitDepth
    if (bitDepth < 16) {
        bitcrusherGainNode.gain.setValueAtTime(0.5, ctx.currentTime); // Reduce gain when bitcrusher is active
    } else {
        bitcrusherGainNode.gain.setValueAtTime(1, ctx.currentTime); // Neutral gain when bitcrusher is not active
    }
});
