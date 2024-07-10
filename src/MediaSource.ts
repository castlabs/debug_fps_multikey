import {Queue} from "./Queue.js";

import {log, bufferString, one} from "./debug.js"
import {EventBus} from "./EventBus";

export interface SegmentRequest {
  url: string,
  byteStart?: number,
  byteEnd?: number
}

export function toSpeedString(bps:number) {
  let kbps = bps / 1000;
  let mbps = kbps / 1000;
  if(kbps < 1) {
    return `${bps} bps`
  }
  if(mbps < 1) {
    return `${kbps.toFixed(2)} Kbps`;
  }
  return `${mbps.toFixed(2)} Mbps`;
}

export function toBytesString(bytes:number) {
  let kb = bytes / 1024;
  let mb = kb / 1024;
  if(kb < 1) {
    return `${bytes} B`
  }
  if(mb < 1) {
    return `${kb.toFixed(2)} KB`;
  }
  return `${mb.toFixed(2)} MB`;
}

export function toTimeString(ms:number) {
  if(ms < 1000) {
    return `${ms.toFixed(0)} ms`
  }
  return `${(ms / 1000).toFixed(3)} s`
}

export function bufferedAhead(video:HTMLVideoElement, playHead:number) {
  if(!playHead) {
    playHead = video.currentTime;
  }
  let bufferAhead = 0
  for (let i=0; i<video.buffered.length; i++) {
    let start = video.buffered.start(i);
    let end = video.buffered.end(i);
    if(start <= playHead && end > playHead) {
      bufferAhead = end - playHead
    }
  }
  return bufferAhead
}

function getMediaSource():MediaSource {
  // @ts-ignore
  if (window.ManagedMediaSource) {
      log('[MSE]', 'Using ManagedMediaSource')
      // @ts-ignore
      return new window.ManagedMediaSource();
  }

  if (window.MediaSource) {
      log('[MSE]', 'Using MediaSource')
      return new window.MediaSource();
  }
  throw "No MediaSource API available";
}

export class MSE {
  private readonly mediaSource: MediaSource;
  private readonly video: HTMLVideoElement;
  private sourceBuffer: SourceBuffer|null;
  private queue_: Queue|null;
  private abortController: any[];
  private readonly openPromise_: Promise<void>;

  constructor(video: HTMLVideoElement) {
    this.mediaSource = getMediaSource()
    this.video = video;
    this.video.disableRemotePlayback = true;
    this.sourceBuffer = null;
    this.queue_ = null;
    this.abortController = [];
    this.openPromise_ = new Promise((resolve) => {
      one(this.mediaSource, 'sourceopen', () => {
        resolve()
      });
    })
    this.video.src = URL.createObjectURL(this.mediaSource);
  }

  async init(mimeCodec:string) {
    await this.openPromise_;
    this.sourceBuffer = this.mediaSource.addSourceBuffer(mimeCodec);
    this.queue_ = new Queue(this.sourceBuffer)
  }

  /**
   *
   * @param data
   * @private
   */
  async append_(data:BufferSource) {
    return new Promise<void>((resolve) => {
      let start = -1
      let bufferedBefore = -1
      let playHead = -1

      this.queue_?.add(() => {
        start = performance.now()
        playHead = this.video.currentTime
        bufferedBefore = bufferedAhead(this.video, playHead)
        this.sourceBuffer?.appendBuffer(data)
      })

      this.queue_?.addAsync(() => {
        const time = performance.now() - start
        let bufferedAfter = bufferedAhead(this.video, playHead)
        let bufferAdded = bufferedAfter - bufferedBefore;
        EventBus.dispatch('appended', {
          time, bufferedBefore, bufferedAfter, bufferAdded
        })
        // log(`Appended ${fragment ? 'Fragment' : 'Segment'} with ${data.byteLength} bytes. Buffer ${bufferString(this.sourceBuffer)}. Time ${delta.toFixed(2)} ms`)
        resolve()
      })
    })
  }

  resetPosition_() {
    log('[MSE] Resetting position to: ', this.video.currentTime)
    this.video.currentTime = this.video.currentTime
  }

  append(data:BufferSource) {
    return this.append_(data)
  }

  endOfStream() {
    this.queue_?.add(() => {
      this.mediaSource.endOfStream()
    })
  }

  appendWindowStart(start: number) {
    this.queue_?.addAsync(() => {
      if(!this.sourceBuffer) return;
      this.sourceBuffer.appendWindowStart = start;
      log('[MSE]', `Append window start ${start}`)
    })
  }
  appendWindowEnd(end: number) {
    this.queue_?.addAsync(() => {
      if(!this.sourceBuffer) return;
      this.sourceBuffer.appendWindowEnd = end;
      log('[MSE]', `Append window end ${end}`)
    })
  }

  timeOffset(offset: number) {
    this.queue_?.addAsync(() => {
      if(!this.sourceBuffer) return;
      this.sourceBuffer.timestampOffset = offset;
      log('[MSE]', `Timestamp offset ${offset}`)
    })
  }

  async fetchAndAppendSegment(r: SegmentRequest) {
    return this.fetchAndAppend(r.url, r.byteStart ?? -1, r.byteEnd ?? -1)
  }

  async fetchAndAppend(url:string, startByte=-1, endByte=-1) {
    this.abortLoads();

    let abortController = new AbortController()
    let signal = abortController.signal
    let abortData = {
      abortController, url, done: false
    };
    this.abortController.push(abortData);

    let isAborted = () => {
      return this.abortController.indexOf(abortData) < 0;
    }

    const headers:any = {}
    if (startByte !== -1) {
      headers["Range"] = `bytes=${startByte}-${endByte !== -1 ? endByte : ''}`
    }

    const startMs = performance.now();
    // const response = await fetch(url + "?q=" + Date.now(), {
    const response = await fetch(url, {
      signal, headers
    });
    let byteCount = 0;
    const data = await response.arrayBuffer();
    abortData.done = true;
    // log(`Load ${url} completed in ${(performance.now() - startMs)} ms for`)
    let bytesLoaded = data.byteLength;

    if(isAborted()) {
      return;
    }

    byteCount = bytesLoaded;
    let now = performance.now();
    let loadTimeS = (now-startMs) / 1000.0;
    let bps = byteCount*8 / loadTimeS
    EventBus.dispatch('fetched', {
      bytes:toBytesString(byteCount),
      loadTime: loadTimeS * 1000,
      speed: toSpeedString(bps),
      fragment: -1
    });

    if(isAborted()) {
      return;
    }

    await this.append_(data)

    if(isAborted()) {
      return;
    }

    const loadTimeMs = performance.now() - startMs;
    log(`[MSE] Fetched and appended ${toBytesString(byteCount)} in ${loadTimeMs.toFixed(0)}ms with ${toSpeedString((byteCount * 8) / (loadTimeMs / 1000.0))} for ${url}`)
  }

  abortLoads() {
    this.abortController.forEach(c => {
      if(!c.done) {
        log(`[MSE] Aborting Load for ${c.url}`)
        c.abortController.abort()
      }
    })
    this.abortController = []
  }
  async clearBuffer(abortAll:boolean) {
    return new Promise<void>((resolve) => {
      const b = this.sourceBuffer?.buffered
      if (b && b.length > 0) {
        const start = b.start(0)
        const end = b.end(b.length - 1)
        const now = performance.now()
        if(abortAll) {
          this.queue_?.clear()
          this.queue_?.addAsync(() => {
            try {
              this.sourceBuffer?.abort()
            }catch (e) {
              log("[MSE] Error while aborting clearing buffer: ", e, this.sourceBuffer?.updating)
            }
          });
        }
        this.queue_?.add(() => {
          this.sourceBuffer?.remove(start, end)
        })
        this.queue_?.addAsync(() => {
          log(`[MSE] Buffer cleared in ${(performance.now() - now).toFixed(2)}ms. Current Buffer ${bufferString(this.video)}`)
          this.resetPosition_()
          resolve();
        })
      }else {
        resolve()
      }
    });
  }
}
