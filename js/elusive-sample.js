//elusive-sample
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const elusiveSampleTemplate = document.createElement('template');
elusiveSampleTemplate.innerHTML = `
  <style>
    .play-button {
      position: absolute;
      border: 0;
      background: transparent;
      box-sizing: border-box;
      width: 0;
      height: 1em;
      padding: 0;
      margin-left: 1em;

      border-color: transparent transparent transparent #202020;
      transition: 100ms all ease;
      cursor: pointer;

      /*play state*/
      border-style: solid;
      border-width: 0.5rem 0 0.5rem .7em;

      outline-color: transparent;
    }
    .paused {
      border-style: double;
      border-width: 0px 0 0px 0.62em;
    }

    .play-button:hover {
      border-color: transparent transparent transparent #404040;
    }
  </style>

  <button type="button" class="play-button" title="Play sound sample!"></button>
`;

class elusiveSample extends HTMLElement {
  static get observedAttributes() {
    return ['playing'];
  }

  set playing (bool) {
    if (bool) {//if true
      this.setAttribute('playing', '');
    } else {//if false
      this.removeAttribute('playing');
    }
  }

  get playing() {
    if(this.hasAttribute('playing'))
      return true;
    else
      return false;
  }

  constructor() {
    super();
    this.appendChild(elusiveSampleTemplate.content.cloneNode(true));
    this.src = this.getAttribute('src');
    this.button = this.querySelector('.play-button');
    this.audio = document.querySelector('#sample-player');
  }//end constructor

  connectedCallback() {
    //if no audio element exists
    if(!this.audio) {
      //create an audio element
      const newAudio = document.createElement('audio');
      newAudio.setAttribute('id', 'sample-player');
      document.getElementById('selections').appendChild(newAudio);
      this.audio = newAudio;

      //event listener to set all elusive-sample elements to paused when audio stops
      newAudio.addEventListener('ended', function() {
        const samples = document.querySelectorAll('elusive-sample');
        samples.forEach(function(sample) {
          sample.playing = false;
        });
      });//end event listener
    }//end if

    this.button.addEventListener('click', e => this.togglePlayback(e));
  }//end connectedCallback

  attributeChangedCallback(attrName, oldVal, newVal) {
    if(attrName === 'playing') {
      if(newVal != null) {//if playing
        this.audio.play();
        this.button.classList.add("paused");
        //this.svg.innerHTML = svgInnards.playing;
      } else {// not playing
        this.audio.pause();
        this.button.classList.remove("paused");
        //this.svg.innerHTML = svgInnards.paused;
      }
    }
  }//end attributeChangedCallback

  togglePlayback(e) {
    let elusiveSample = e.target.parentNode;
    if (elusiveSample.playing) {// if playing, toggle to pause

      elusiveSample.playing = false;
    } else {//if paused
      if(elusiveSample.audio.src != elusiveSample.src) {//if they don't match
        //pause all elusive-samples
        const samples = document.querySelectorAll('elusive-sample');
        samples.forEach(function(sample) {
          sample.playing =  false;
        });

        //load new source
        elusiveSample.audio.src = elusiveSample.src;
        elusiveSample.audio.load();
      }
      //play newly selected sample
      elusiveSample.playing = true;
    }
  }//togglePlayback
}//end HTMLElement
customElements.define('elusive-sample', elusiveSample);
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//end elusive-sample
