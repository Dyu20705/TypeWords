<script setup lang="ts">
import { Toast } from '@/base'
import { Origin } from '@/core/config/env.ts'
import { set } from 'idb-keyval'
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()
const Dialog = defineAsyncComponent(() => import('@/base/dialog/Dialog.vue'))

const model = defineModel()

const emit = defineEmits<{ ok: [] }>()

async function migrateFromOldSite() {
  return new Promise(async (resolve, reject) => {
    // 旧域名地址
    var OLD_ORIGIN = 'https://2study.top'
    // 需要迁移的 IndexedDB key
    var IDB_KEYS = ['type-words-app-version', 'typing-word-dict', 'typing-word-setting', 'typing-word-files']
    // 需要迁移的 localStorage key
    var LS_KEYS = ['PracticeSaveWord', 'PracticeSaveArticle']
    const migrateWin = window.open(`${OLD_ORIGIN}/migrate.html`, '_blank', 'width=400,height=400')

    if (!migrateWin) return reject($t('popup_blocked_hint'))

    async function onMessage(event) {
      if (event.origin !== OLD_ORIGIN) return
      if (event.data?.type !== 'MIGRATION_RESULT') return
      const payload = event.data.payload
      console.log('payload', payload)

      // 写入 localStorage
      LS_KEYS.forEach(key => {
        if (payload.localStorage[key] !== undefined) {
          localStorage.setItem(key, payload.localStorage[key])
        }
      })

      // 写入 IndexedDB
      for (let key of IDB_KEYS) {
        if (payload.indexedDB[key] !== undefined) {
          await set(key, payload.indexedDB[key])
        }
      }

      window.removeEventListener('message', onMessage)
      resolve(true)
    }

    window.addEventListener('message', onMessage)

    // 等窗口加载完毕后发请求
    const timer = setInterval(() => {
      if (!migrateWin || migrateWin.closed) {
        clearInterval(timer)
        reject($t('migration_window_closed'))
      } else {
        try {
          migrateWin.postMessage({ type: 'REQUEST_MIGRATION_DATA' }, OLD_ORIGIN)
        } catch (e) {
          // 跨域安全错误忽略，等窗口完全加载后再试
        }
      }
    }, 100)
  })
}

async function transfer() {
  try {
    await migrateFromOldSite()
    localStorage.setItem('__migrated_from_2study_top__', '1')
    console.log('Migration completed')
    Toast.success($t('migration_completed'))
    model.value = false
    emit('ok')
  } catch (e) {
    Toast.error($t('migration_failed') + ': ' + e)
    console.error('Migration failed', e)
  }
}
</script>

<template>
  <Dialog
    v-model="model"
    :footer="true"
    @ok="transfer"
    :confirmButtonText="$t('migrate_data')"
    :title="$t('migrate_data')"
  >
    <div class="px-4 flex-col center w-100">
      <h2 class="text-align-center text-2xl">
        {{ $t('migrate_new_domain') }} <span class="color-blue">{{ Origin }}</span>
      </h2>
      <h3>
        {{ $t('migrate_old_domain_notice') }}
      </h3>
      <div>{{ $t('migrate_later_notice') }}</div>
    </div>
  </Dialog>
</template>

<style scoped lang="scss"></style>
