const startButton = document.getElementById('start');
const controls = document.getElementById('controls');
let ctx;
let gainNode;
let gainVal = 0.5;

startButton.addEventListener('click', () => {
    ctx = new AudioContext();
    startButton.classList.add('hidden');
    controls.classList.remove('hidden');
    initialiseWhiteNoise();
})

function initialiseWhiteNoise() {
    const numChannels = 2;
    const sampleRate = ctx.sampleRate;
    const duration = 2; // in seconds
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

    gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();
}


const playButton = document.getElementById('play-btn');
playButton.addEventListener('click', () => {
    gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
})


const stopButton = document.getElementById('stop-btn');
stopButton.addEventListener('click', () => {
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
})


const volCtrl = document.getElementById('volume-ctrl');
volCtrl.addEventListener('change', (e) => {
    let newGain = e.target.value;
    gainVal = newGain;
    gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
})