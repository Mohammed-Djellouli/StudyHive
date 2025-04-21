export default async function getAudioStream() {
    try {
        return await navigator.mediaDevices.getUserMedia({audio: true});
    } catch (err) {
        console.error(" error can't accesss the mic :");
        return null;
    }
}
