export function log(...a:any) {
  let time:any = new Date();
  if (time.toISOString) {
    time = time.toISOString().substring(11).replace('Z', '');
  }
  console.log(`[${time}]`, ...a)
}

export function bufferString(source:any) {
  let b = source.buffered;
  if(b.length === 0) return 'empty'
  let s = ''
  for (let i=0; i<b.length; i++) {
    s += `${b.start(i)}-${b.end(i)}`
    if (i<b.length - 1) s += ' '
  }
  return s;
}

export function one(target:EventTarget, name:string, fun:(...a:any|undefined) => void) {
  const listener = (...a:any) => {
    fun(...a)
    target.removeEventListener(name, listener)
  }
  target.addEventListener(name, listener)
}
