<script setup lang="ts">
import { watch } from 'vue'
import { BaseButton, Dialog } from '@/base'
import { useExport } from '@/core/hooks/export'
import { IS_DEV } from '@/core/config/env.ts'
import { Toast } from '~/base'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()
const model = defineModel()

const { loading: backupLoading, exportData } = useExport()

let backupTriggered = $ref(false)

watch(model, visible => {
  if (!visible) backupTriggered = false
})

async function onBackup() {
  backupTriggered = true
  let disabled = localStorage.getItem('disable360')
  if (disabled) {
    return Toast.success($t('skip_export_success'))
  }
  await exportData($t('auto_backed_up_data'), $t('backup_filename'))
}
</script>

<template>
  <Dialog v-model="model" :title="$t('data_backup')">
    <div class="flex flex-col gap-3 p-4 w-100">
      <div>
        {{ $t('backup_data_desc') }}
      </div>

      <div class="flex justify-end mt-4">
        <BaseButton size="large" :loading="backupLoading" @click="onBackup">{{ $t('data_backup') }}</BaseButton>
        <slot :disabled="!backupTriggered"></slot>
      </div>
    </div>
  </Dialog>
</template>
