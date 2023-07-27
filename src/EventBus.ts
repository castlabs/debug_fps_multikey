type Listener = (data: any) => void

export class EventBus {
  static readonly listeners: Map<string, Listener[]> = new Map<string, Listener[]>();

  static subscribe(event: string, listener: Listener) {
    let listenerList = this.listeners.get(event)
    if (!listenerList) {
      listenerList = [];
      this.listeners.set(event, listenerList)
    }
    listenerList.push(listener)
  }

  static dispatch(event: string, data: any) {
    let listenerList = this.listeners.get(event)
    if (!listenerList) {
      return
    }
    listenerList.forEach((callback) => {
      callback(data)
    })
  }
}
