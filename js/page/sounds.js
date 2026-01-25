// サウンド定義
const SOUND_IN = './assets/tm2_quiz000good.wav';
const SOUND_OUT = './assets/Jinx-_Bye_Bye_.mp3';
const SOUND_NG = './assets/se_nogood09.mp3';

const soundIn = new Audio(SOUND_IN);
const soundBye = new Audio(SOUND_OUT);
const soundNg = new Audio(SOUND_NG);

export const soundInPlay = function() {
    soundIn.currentTime = 0;
    soundIn.play()
}
export const soundByePlay = function() {
    soundBye.currentTime = 0;
    soundBye.play()
}
export const soundNGPlay = function() {
    soundNg.currentTime = 0;
    soundNg.play()
}