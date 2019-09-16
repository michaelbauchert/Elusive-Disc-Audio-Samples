const length = 30;//in seconds
const fadeLength = 3;//in seconds
const bitrate = 320;

const fileUploadButton = document.getElementById('file-upload');

const fileConvertProgress = document.getElementById('progress-bar');

fileUploadButton.addEventListener('change', function() {
  document.getElementById('get-sound-samples').classList.add('hidden');
  document.getElementById('file-list').classList.remove('hidden');
  window.audioFiles = Array.from(fileUploadButton.files);

  let fileListElement = document.getElementById('file-list');
  fileListElement.innerHTML = '';

  window.fileArray = [];
  if(audioFiles) {
    document.querySelector('.spinner-border').classList.remove('hidden');

    for (var i = 0; i < audioFiles.length; i++) {
      let file = audioFiles[i];
      let newFile = document.createElement('li');
      newFile.classList.add('list-group-item');
      newFile.innerHTML = file.name;
      fileListElement.appendChild(newFile);

      getNewFile(i, file);
    }
  }
});

function getSoundSamples() {
  document.getElementById('progress-container').classList.remove('hidden');
  document.getElementById('get-sound-samples').classList.add('hidden');
  document.getElementById('file-list').classList.add('hidden');

  window.plusProgress = 100 / (window.fileArray.length * 3);

  //resume the audio context on button press
  Tone.context.resume();

  //put all the buffers and filenames to convert into an array
  let sampleBuffers = [];
  for(let i = 0; i < window.fileArray.length; i++) {
    const file = window.fileArray[i];
    let fileName = window.audioFiles[i].name;
    console.log(fileName);

    incrementProgress();
    //create a new buffer for each file
    sampleBuffers.push([fileName, new Tone.Buffer(file)]);
  }

  //wait until all sample buffers are defined
  Tone.Buffer.on('load', function() {
    let crossfadePromises = [];
    for(let i = 0; i < sampleBuffers.length; i++) {
      //slice the buffer into a predetermined size
      crossfadePromises[i] = new Promise(function(resolve, reject) {
        sampleBuffers[i][1] = sampleBuffers[i][1].slice(sampleBuffers[i][1].duration/2, sampleBuffers[i][1].duration);
        incrementProgress();

        crossfadeEdges(resolve, sampleBuffers[i][0], sampleBuffers[i][1]);
      });
    }

    Promise.all(crossfadePromises).then(function(buffer) {
      for(let i = 0; i< buffer.length; i++) {
        convertToMP3(buffer[i][0], buffer[i][1]);
      }
    });
  });
}//end getSoundSamples

//put file into tone player
function getNewFile(index, file) {
  const reader = new FileReader();

  reader.onload = function(e) {
    window.fileArray[index] = e.target.result;
    if(window.audioFiles.length != 0 && window.audioFiles.length == window.fileArray.length) {
      document.querySelector('.spinner-border').classList.add('hidden');
      document.getElementById('get-sound-samples').classList.remove('hidden');
    }
  }

  reader.readAsDataURL(file);
}//end getNewPlayer

function FloatArray2Int16 (floatbuffer) {
  var int16Buffer = new Int16Array(floatbuffer.length);
  for (var i = 0, len = floatbuffer.length; i < len; i++) {
      if (floatbuffer[i] < 0) {
          int16Buffer[i] = 0x8000 * floatbuffer[i];
      } else {
          int16Buffer[i] = 0x7FFF * floatbuffer[i];
      }
  }
  return int16Buffer;
}

//download the new sample
function downloadMP3(url, fileName) {
  fileName = fileName.substr(0, 2) + ' ' + document.getElementById('file-name').value.toLowerCase() + '.mp3';

  const downloadElement = document.getElementById('download');

  downloadElement.href = url;
  downloadElement.download = fileName;
  downloadElement.click();
  window.URL.revokeObjectURL(url);
}//end downloadMP3

function incrementProgress() {
  let floatParse = parseFloat(fileConvertProgress.style.width);
  fileConvertProgress.style.width = floatParse + window.plusProgress + '%';

  if (floatParse >= 99) {
    document.getElementById('progress-container').classList.add('hidden');
  }
}//end incrementProgress

function  crossfadeEdges(resolve, name, buffer) {
  Tone.Offline(function(){
    const player = new Tone.Player(buffer).toMaster();
    player.fadeIn = fadeLength;
    player.fadeOut = fadeLength;

    player.start(0);
    player.stop(length - fadeLength);

    incrementProgress();

  }, length).then(function(buffer){
    return resolve([name, buffer]);
  });
}//end crossfadeEdges

function convertToMP3(fileName, buffer) {
  mp3encoder = new lamejs.Mp3Encoder(2, buffer._buffer.sampleRate, 128);
  var mp3Data = [];

  left = FloatArray2Int16(buffer.getChannelData(0));
  right = FloatArray2Int16(buffer.getChannelData(1));
  sampleBlockSize = 1152;

  for (var i = 0; i < left.length; i += sampleBlockSize) {
    leftChunk = left.subarray(i, i + sampleBlockSize);
    rightChunk = right.subarray(i, i + sampleBlockSize);
    var mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }
  var mp3buf = mp3encoder.flush();   //finish writing mp3

  if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
  }

  var blob = new Blob(mp3Data, {type: 'audio/mp3'});
  var url = URL.createObjectURL(blob);

  downloadMP3(url, fileName);

  incrementProgress();
}//end convertToMP3
