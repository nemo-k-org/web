export const arrayBufferToString = (buffer: ArrayBuffer): string => {
  let str = ''
  const array = new Uint8Array(buffer)
  for (let i = 0; i < array.length; i++) {
    str += String.fromCharCode(array[i])
  }

  return str
}
