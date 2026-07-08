export type ResizeCleanup = () => void

export interface ObserveResizeOptions {
  delay?: number
}

export const observeResize = (
  target: Element,
  callback: () => void,
  options: ObserveResizeOptions = {}
): ResizeCleanup => {
  const delay = options.delay ?? 300
  let timer: ReturnType<typeof setTimeout> | null = null

  // ResizeObserver 会高频触发，这里做一次简单防抖，避免图表连续 resize 抖动。
  const observer = new ResizeObserver(() => {
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      callback()
    }, delay)
  })

  observer.observe(target)

  return () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    observer.disconnect()
  }
}
