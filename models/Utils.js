class UtilsClass {
  ShuffleArray(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }

  Sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  GetRandomNumber(start, end) {
    return Math.floor(Math.random() * (end - start + 1)) + start
  }

  SpeakText(message) {
    if (!('speechSynthesis' in window)) { return }

    let speakData = new SpeechSynthesisUtterance()
    speakData.volume = 1
    speakData.rate = 1
    speakData.pitch = 1.1
    speakData.text = message
    speakData.lang = 'id-ID'

    speechSynthesis.speak(speakData)
  }

  Slugify(text) {
    text = `${text}`
    return text
      .toLowerCase()
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with dashes
      .replace(/[^a-z0-9-]+/g, '') // Remove non-alphanumeric characters (except dashes)
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  }

  RemoveFileExtension(filename) {
    const lastDotIndex = filename.lastIndexOf('.');

    // If no dot is found or the dot is the first character (e.g., ".bashrc"),
    // assume no extension or a hidden file without a true extension to remove.
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return filename;
    }

    return filename.substring(0, lastDotIndex);
  }
}

var Utils = new UtilsClass()

export default Utils
