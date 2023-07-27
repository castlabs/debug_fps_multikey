// import './style.css'
import {MSE} from "./MediaSource";
import {log} from "./debug";

// Make sure we load the FPS certificate ahead of time
const certificate = await fetch(
  'https://lic.staging.drmtoday.com/license-server-fairplay/cert/client_dev')
  .then(r => r.arrayBuffer());

// The key system we want to use
const keySystem = "com.apple.fps.3_0";

// this is the base URL for the test content that we are using for multi key
// if you change that, note that you also need to adjust the segment loading
// for the MSE example
const base_url = "http://localhost:8000/fps_shaka/pkg"

// this is the base URL for the test content that we are using for single key
// if you change that, note that you also need to adjust the segment loading
// for the MSE example
const base_url_single_key = "http://localhost:8000/fps_shaka_single_key/pkg"

// Load the native AV Player with the master playlist
const exampleAvPlayer = getExampleElements("example-av-player");
exampleAvPlayer.loadButton.addEventListener('click', () => {
  const block = exampleAvPlayer

  logVideoEvents(block.video, "AVPlayer")
  addResizeListener(block.video, block.logs);
  addEncryptedListener(block.video, block.logs)
  addTimeupdateListener(block.video, block.currentTime)

  block.video.src = `${base_url}/master.m3u8`
  block.video.play()
})

// Load the MSE + EME implementation and switch between HD and SD
const exampleMseMultiKey = getExampleElements("example-mse-multi-key");
exampleMseMultiKey.loadButton.addEventListener('click', async () => {
  const block = exampleMseMultiKey;

  logVideoEvents(block.video, "MSE-1")
  addEncryptedListener(block.video, block.logs)
  addResizeListener(block.video, block.logs)
  addTimeupdateListener(block.video, block.currentTime)

  // Create and initialize the MSE buffer
  const mse = new MSE(block.video);
  await mse.init('video/mp4')
  log('[Player]', 'MSE Buffer ready and initialized')

  log2screen(block.logs, "Fetch & Append HD init")
  await mse.fetchAndAppendSegment({url: `${base_url}/1080p_init.mp4`,})
  block.video.play()

  log2screen(block.logs, "Fetch & Append HD S-1")
  await mse.fetchAndAppendSegment({url: `${base_url}/1080p_1.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)

  log2screen(block.logs, "Fetch & Append SD init")
  await mse.fetchAndAppendSegment({url: `${base_url}/360p_init.mp4`,})

  log2screen(block.logs, "Fetch & Append SD S-2")
  await mse.fetchAndAppendSegment({url: `${base_url}/360p_2.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)

  log2screen(block.logs, "Fetch & Append SD S-3")
  await mse.fetchAndAppendSegment({url: `${base_url}/360p_3.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)
})

// Load the MSE + EME but play only SD
const exampleMseSdOnly = getExampleElements("example-mse-sd-only");
exampleMseSdOnly.loadButton.addEventListener('click', async () => {
  const block = exampleMseSdOnly;

  logVideoEvents(block.video, "MSE-2")
  addEncryptedListener(block.video, block.logs)
  addResizeListener(block.video, block.logs)
  addTimeupdateListener(block.video, block.currentTime)

  // Create and initialize the MSE buffer
  const mse = new MSE(block.video);
  await mse.init('video/mp4')
  log('[Player]', 'MSE Buffer ready and initialized')

  log2screen(block.logs, "Fetch & Append SD init")
  await mse.fetchAndAppendSegment({url: `${base_url}/360p_init.mp4`,})
  block.video.play()

  log2screen(block.logs, "Fetch & Append SD S-1")
  await mse.fetchAndAppendSegment({url: `${base_url}/360p_1.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)

  log2screen(block.logs, "Fetch & Append SD S-2")
  await mse.fetchAndAppendSegment({url: `${base_url}/360p_2.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)

  log2screen(block.logs, "Fetch & Append SD S-3")
  await mse.fetchAndAppendSegment({url: `${base_url}/360p_3.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)

  log2screen(block.logs, "Fetch & Append SD S-4")
  await mse.fetchAndAppendSegment({url: `${base_url}/360p_4.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)
})

// Load the MSE + EME but play only HD
const exampleMseHdOnly = getExampleElements("example-mse-hd-only");
exampleMseHdOnly.loadButton.addEventListener('click', async () => {
  const block = exampleMseHdOnly;

  logVideoEvents(block.video, "MSE-3")
  addEncryptedListener(block.video, block.logs)
  addResizeListener(block.video, block.logs)
  addTimeupdateListener(block.video, block.currentTime)

  // Create and initialize the MSE buffer
  const mse = new MSE(block.video);
  await mse.init('video/mp4')
  log('[Player]', 'MSE Buffer ready and initialized')

  log2screen(block.logs, "Fetch & Append HD init")
  await mse.fetchAndAppendSegment({url: `${base_url}/1080p_init.mp4`,})
  block.video.play()

  log2screen(block.logs, "Fetch & Append HD S-1")
  await mse.fetchAndAppendSegment({url: `${base_url}/1080p_1.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)

  log2screen(block.logs, "Fetch & Append HD S-2")
  await mse.fetchAndAppendSegment({url: `${base_url}/1080p_2.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)

  log2screen(block.logs, "Fetch & Append HD S-3")
  await mse.fetchAndAppendSegment({url: `${base_url}/1080p_3.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)

  log2screen(block.logs, "Fetch & Append HD S-4")
  await mse.fetchAndAppendSegment({url: `${base_url}/1080p_4.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)
})

// Load the MSE + EME implementation and switch between HD and SD
// with a single key
const exampleMseSingleKey = getExampleElements("example-mse-single-key");
exampleMseSingleKey.loadButton.addEventListener('click', async () => {
  const block = exampleMseSingleKey;

  logVideoEvents(block.video, "MSE-5")
  addEncryptedListener(block.video, block.logs)
  addResizeListener(block.video, block.logs)
  addTimeupdateListener(block.video, block.currentTime)

  // Create and initialize the MSE buffer
  const mse = new MSE(block.video);
  await mse.init('video/mp4')
  log('[Player]', 'MSE Buffer ready and initialized')

  log2screen(block.logs, "Fetch & Append HD init")
  await mse.fetchAndAppendSegment({url: `${base_url_single_key}/1080p_init.mp4`,})
  block.video.play()

  log2screen(block.logs, "Fetch & Append HD S-1")
  await mse.fetchAndAppendSegment({url: `${base_url_single_key}/1080p_1.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)

  log2screen(block.logs, "Fetch & Append SD init")
  await mse.fetchAndAppendSegment({url: `${base_url_single_key}/360p_init.mp4`,})

  log2screen(block.logs, "Fetch & Append SD S-2")
  await mse.fetchAndAppendSegment({url: `${base_url_single_key}/360p_2.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)

  log2screen(block.logs, "Fetch & Append SD S-3")
  await mse.fetchAndAppendSegment({url: `${base_url_single_key}/360p_3.mp4`,})
  log2screen(block.logs, `Buffer: ${logBuffer(block.video)}`)
})


/**
 * This is the handler function that we call when we receive an encrypted event.
 * Here we are setting up a new session and load the license. If a log target
 * is provided we log the key status at the end.
 *
 * @param event
 * @param logTarget
 */
async function handleEncryptedEvent(event: MediaEncryptedEvent, logTarget: HTMLElement | null | undefined) {
  const video = event.target as HTMLVideoElement;
  if (!video) {
    log('[EME] No video element attached to encrypted event')
    return
  }

  try {
    let initDataType = event.initDataType;
    log(`[EME] Received initialization data type '${initDataType}'`)

    let initData = event.initData;
    if (!initData) {
      log('[EME] No init data attached to encrypted event')
      return
    }

    // Create and set the media keys
    if (!video.mediaKeys) {
      log('[EME] Initialize Media Keys')
      const access = await navigator.requestMediaKeySystemAccess(keySystem, [{
        initDataTypes: [initDataType],
        videoCapabilities: [{contentType: 'video/mp4', robustness: ''}],
        distinctiveIdentifier: 'not-allowed',
        persistentState: 'not-allowed',
        sessionTypes: ['temporary'],
      }]);

      const keys = await access.createMediaKeys();
      await keys.setServerCertificate(certificate);
      await video.setMediaKeys(keys);
      log('[EME] Media Keys Initialized and loaded')
    }

    if (!video.mediaKeys) {
      log('[EME] Failed to init Media Keys')
      return
    }

    const session = video.mediaKeys.createSession();
    await session.generateRequest(initDataType, initData);

    session.addEventListener('message', async (message: MediaKeyMessageEvent) => {
      let response = await loadDrmLicense(message);
      log(`[EME] Updating session ${session.sessionId} with payload`)
      await session.update(response);
      log(`[EME] Session ${session.sessionId} updated`)

      if (logTarget) {
        session?.keyStatuses.forEach((status, key) => {
          let kid = ''
          const kidData = new Uint8Array(key as ArrayBufferLike, 0, key.byteLength);
          if (initDataType === 'skd') {
            kid = uInt8ArrayToString(kidData)
          } else if (initDataType === 'sinf') {
            kid = "0x" + toHexString(kidData)
          }
          log2screen(logTarget, `${initDataType} Key: ${status} ${kid}`)
        })
      }
    })
  } catch (e) {
    window.console.error(`Could not start encrypted playback due to exception "${e}"`, e)
  } finally {
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
  }
}


/**
 * Helper function that will log the current buffer level
 */
function logBuffer(videoElement: HTMLVideoElement): string {
  let ranges = []
  if (videoElement.buffered) {
    for (let i = 0; i < videoElement.buffered.length; i++) {
      let bufferString = `${videoElement.buffered.start(i).toFixed(2)} - ${videoElement.buffered.end(i).toFixed(2)}`;
      ranges.push(bufferString)
      log(`[Buffer] [${i}]: ${bufferString}`)
    }
  }
  return ranges.join(' ')
}

/**
 * Takes a MediaKeyMessageEvent and load a license from DRMtoday. This returns
 * a promise that resovles to the license pauload that can be pushed to
 * `session.update()`.
 *
 * @param event The media key message event
 */
async function loadDrmLicense(event: MediaKeyMessageEvent) {
  const encodedKey = encodeURIComponent('spc');
  const encodedValue = encodeURIComponent(base64EncodeUint8Array(new Uint8Array(event.message)));
  const licenseResponse = await fetch('https://lic.staging.drmtoday.com/license-server-fairplay/', {
    method: 'POST',
    headers: new Headers({
      'Content-type': 'application/x-www-form-urlencoded',
      'dt-custom-data': btoa(JSON.stringify({
        "userId": "purchase",
        "sessionId": "default",
        "merchant": "client_dev"
      }))
    }),
    body: encodedKey + "=" + encodedValue
  })
    .then(r => r.text())
    .then(r => r.trim())
  return base64DecodeUint8Array(licenseResponse);
}


type ExampleElements = {
  video: HTMLVideoElement,
  logs: HTMLElement,
  currentTime: HTMLElement
  loadButton: HTMLElement
}

function getExampleElements(id: string): ExampleElements {
  const exampleBlock = document.getElementById(id);
  if (!exampleBlock) {
    throw new Error(`Example ${id} not found!`)
  }

  const video = exampleBlock.getElementsByTagName("video").item(0) as HTMLVideoElement;
  const logs = exampleBlock.getElementsByClassName("event-logs").item(0) as HTMLElement;
  const currentTime = exampleBlock.getElementsByClassName("time").item(0) as HTMLElement;
  const loadButton = exampleBlock.getElementsByClassName("btn-load").item(0) as HTMLElement;

  return {video, logs, currentTime, loadButton}
}


function uInt8ArrayToString(array: Uint8Array) {
  // @ts-ignore
  return String.fromCharCode.apply(null, array);
}

function toHexString(arr: Uint8Array) {
  let hex = '';
  for (let i = 0; i < arr.length; ++i) {
    let value = arr[i].toString(16);
    if (value.length == 1) value = '0' + value;
    hex += value;
  }
  return hex;
}

function base64DecodeUint8Array(input: string) {
  return Uint8Array.from(atob(input), c => c.charCodeAt(0));
}

function base64EncodeUint8Array(input: Uint8Array) {
  return btoa(uInt8ArrayToString(input));
}

function log2screen(target: Element | null, line: string | null) {
  if (!target || !line) {
    return
  }
  target.innerHTML += `<div>${line}</div>`
}

function addResizeListener(video: HTMLVideoElement, logTarget?: HTMLElement | null) {
  if (!logTarget) return
  video.addEventListener('resize', () => {
    log2screen(logTarget, `<div>Resize ${video.videoWidth}x${video.videoHeight} @ ${video.currentTime.toFixed(3)} s</div>`)
  })
}

function addTimeupdateListener(video: HTMLVideoElement, logTarget?: HTMLElement | null) {
  if (!logTarget) return
  video.addEventListener('timeupdate', () => {
    if (logTarget) {
      logTarget.innerHTML = `<div>Time-Update ${video.currentTime.toFixed(3)} seconds</div>`
    }
  })
}

function addEncryptedListener(video: HTMLVideoElement, logTarget?: HTMLElement | null) {
  video.addEventListener('encrypted', async (e) => {
    await handleEncryptedEvent(e, logTarget)
  })
}

const VIDEO_ELEMENT_EVENTS = [
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'interruptbegin',
  'interruptend',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'mozaudioavailable',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
  'waitingforkey',
  'resize',
  'webkitneedkey',
  'webkitkeymessage',
  'webkitkeyadded',
  'webkitkeyerror',
]

export function logVideoEvents(element: HTMLVideoElement, name: string) {
  VIDEO_ELEMENT_EVENTS.forEach(eventType => {
    element.addEventListener(eventType, (event) => {
      switch (eventType) {
        case 'timeupdate':
          log(`[Video]-[${name}] Video Element Event ${event.type}: ${element.currentTime.toFixed(3)}`)
          break
        case 'resize':
          log(`[Video]-[${name}] Video Element Event ${event.type}: ${element.videoWidth}x${element.videoHeight} at ${element.currentTime.toFixed(3)} seconds`)
          break
        case 'durationchange':
          log(`[Video]-[${name}] Video Element Event ${event.type}: ${element.duration.toFixed(2)} seconds`)
          break
        default:
          log(`[Video]-[${name}] Video Element Event ${event.type}`)
      }

    })
  })
}
