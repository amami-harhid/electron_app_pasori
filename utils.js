import iconv from 'iconv-lite';

export const utf8_to_sjis = function(utf8Text) {

    const shiftJisBuffer = iconv.encode(utf8Text, 'Shift_JIS');

    return shiftJisBuffer.toString();
}