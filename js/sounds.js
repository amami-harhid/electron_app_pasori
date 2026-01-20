// サウンド定義
const soundIn = new Audio('./assets/tm2_quiz000good.wav');
const soundBye = new Audio('./assets/tm2_quiz001good.wav');
const soundInPlay = function() {
    soundIn.play()
}
const soundByePlay = function() {
    soundBye.play()
}

module.exports = {
    soundInPlay,
    soundByePlay,
}