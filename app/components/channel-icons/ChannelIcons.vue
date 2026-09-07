<script setup lang="ts">
import { BaseIcon } from '@/base'
import ShareIcon from './ShareIcon.vue'
import Github from './Github.vue'
import { EMAIL } from '@/core/config/env.ts'

withDefaults(
  defineProps<{
    type?: 'vertical' | 'horizontal'
    share?: boolean
    github?: boolean
  }>(),
  {
    type: 'vertical',
    share: true,
    github: true,
  }
)
</script>

<template>
  <div class="center" :class="type === 'vertical' ? 'flex-col gap-1' : 'gap-4'">
    <Github v-if="github" />

    <a
      href="https://x.com/typewords2"
      target="_blank"
      rel="noreferrer"
      :aria-label="$t('follow_x_account', { x_account: 'typewords2' })"
    >
      <BaseIcon :title="$t('twitter')">
        <IconRiTwitterFill class="color-blue" />
      </BaseIcon>
    </a>

    <a
      :href="`mailto:${EMAIL}`"
      target="_blank"
      rel="noreferrer"
      :aria-label="$t('send_email', { email: EMAIL })"
    >
      <BaseIcon :title="$t('email')">
        <IconMaterialSymbolsMail class="color-blue" />
      </BaseIcon>
    </a>

    <ShareIcon v-if="share" />
  </div>
</template>
<style scoped lang="scss"></style>
