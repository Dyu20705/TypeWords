export default defineNuxtPlugin(nuxtApp => {
  // 1. JS 同步错误
  window.onerror = function (msg, url, line, col, err) {
    reportError({ type: 'js', jsErr: err })
  }

  // 2. Promise 错误
  // window.addEventListener('unhandledrejection', e => {
  //   e.preventDefault() // 阻止继续传播
  //   reportError({ type: 'promise', promiseErr: e.reason })
  // })

  // 3. 资源加载错误
  window.addEventListener(
    'error',
    e => {
      if (e.target !== window) {
        reportError({ type: 'resource', resourceErr: e?.target?.src })
      }
    },
    true
  )

  // 4. vue错误
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    console.log('Vue error:', err, info)
    reportError({ type: 'vue', vueErr: err, vueInfo: info })
  }
})

function reportError(data) {
  console.log('Error report:', data)
  try {
    window?.umami?.track('global-error', { data })
  } catch (e) {
    console.error('Report failed:', e)
  }
}
