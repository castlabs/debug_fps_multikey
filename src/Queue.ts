
type Job = () => Promise<void> | void;

interface QueueItem {
  job: Job,
  async: boolean
}

export class Queue {
  private elements: QueueItem[];
  private active: QueueItem | null ;
  readonly sourceBuffer: SourceBuffer;

  constructor(sourceBuffer: SourceBuffer) {
    this.elements = []
    this.active = null;
    this.sourceBuffer = sourceBuffer;

    if(sourceBuffer != null) {
      sourceBuffer.addEventListener("error", (e) => {
        console.error('Source buffer error: ', e);
      })
      sourceBuffer.addEventListener('updateend', () => {
        this.onCompleted_();
      });
    }
  }

  add(job: Job) {
    this.elements.push({job: job, async: false})
    this.process_()
  }

  addAsync(job:Job) {
    this.elements.push({job: job, async: true})
    this.process_()
  }

  clear() {
    this.elements = []
    this.active = null;
  }

  onCompleted_() {
    this.active = null;
    this.process_()
  }

  /**
   * @private
   */
  async process_() {
    if (this.active != null || (this.sourceBuffer && this.sourceBuffer.updating)) {
      return
    }
    this.active = this.elements.shift() || null;
    let localActive = this.active
    if (this.active) {
      try {
        let p = this.active.job()
        if (p != null) {
          await p;
        }
      } catch (e: any) {
        if(!e || !e.name || e.name !== 'AbortError') {
          throw e;
        } else {
          if (this.active && this.active == localActive) {
            this.onCompleted_();
          }
        }
      }

      if (this.active && this.active === localActive && this.active.async) {
        this.onCompleted_()
      }
    }
  }
}
