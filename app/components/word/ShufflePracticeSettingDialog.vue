<script setup lang="ts">
import { BaseButton, InputNumber, Slider, Toast } from '@/base'
import { computed, defineAsyncComponent, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBaseStore } from '@/core/stores/base.ts'
import { WordPracticeModeNameMap } from '@/core/config/env'
import { useSettingStore } from '@/core/stores/setting.ts'
import { getBookName, getShufflePracticeWords, toShufflePracticeRange, type ShufflePracticeSetting } from '@/core/utils'
const Dialog = defineAsyncComponent(() => import('@/base/dialog/Dialog.vue'))

const { t: $t } = useI18n()

const MIN_RANGE_WORD_COUNT = 5
const MIN_RANGE_GAP = MIN_RANGE_WORD_COUNT - 1

const props = defineProps<{
  wordPracticeMode: number
  onConfirm?: (setting: ShufflePracticeSetting) => Promise<void | boolean>
}>()

let wordPracticeMode = $computed(() => $t(WordPracticeModeNameMap[props.wordPracticeMode]))

const store = useBaseStore()
const settingStore = useSettingStore()
const model = defineModel()

let num = $ref(0)
let startNo = $ref(1)
let endNo = $ref(0)
let showRangeInput = $ref(false)
let showInsufficientDialog = $ref(false)
let requestedCount = $ref(0)
let availableCount = $ref(0)

const wordCount = $computed(() => store.sdict.words.length)
const progressNo = $computed(() => Math.min(Math.max(Number(store.sdict.lastLearnIndex) || 0, 0), wordCount))
const displayRange = $computed(() => {
  const end = Math.min(Math.max(Math.floor(Number(endNo) || 0), 0), wordCount)
  const start = end > 0 ? Math.min(Math.max(Math.floor(Number(startNo) || 1), 1), end) : 0
  return { start, end }
})
const rangeWordCount = $computed(() => (displayRange.end > 0 ? displayRange.end - displayRange.start : 0))
const sliderMinGap = $computed(() =>
  wordCount >= MIN_RANGE_WORD_COUNT && rangeWordCount >= MIN_RANGE_WORD_COUNT ? MIN_RANGE_GAP : 0
)
const rangeModel = computed<[number, number]>({
  get() {
    return [displayRange.start || 1, displayRange.end || 1]
  },
  set(value) {
    setRange(value[0], value[1])
  },
})

function getDefaultTotal(total: number) {
  if (total <= 0) return 0
  return Math.min(Math.max(Math.floor(total / 3), 1), 50, total)
}

function setDefaultRange() {
  startNo = progressNo > 0 ? 1 : wordCount > 0 ? 1 : 0
  endNo = progressNo
  num = getDefaultTotal(rangeWordCount)
}

function setRawRange(start: number, end: number) {
  if (!wordCount) {
    startNo = 0
    endNo = 0
    syncTotalWithRange()
    return
  }
  startNo = Math.min(Math.max(Math.floor(Number(start) || 1), 1), wordCount)
  endNo = Math.min(Math.max(Math.floor(Number(end) || 1), 1), wordCount)
  syncTotalWithRange()
}

function setRange(start: number, end: number, target?: 'start' | 'end') {
  if (!wordCount) {
    setRawRange(0, 0)
    return
  }

  let nextStart = Math.min(Math.max(Math.floor(Number(start) || 1), 1), wordCount)
  let nextEnd = Math.min(Math.max(Math.floor(Number(end) || 1), 1), wordCount)
  const gap = wordCount >= MIN_RANGE_WORD_COUNT ? MIN_RANGE_GAP : Math.max(wordCount - 1, 0)

  if (nextStart > nextEnd) {
    if (target === 'start') {
      nextStart = nextEnd
    } else if (target === 'end') {
      nextEnd = nextStart
    } else {
      ;[nextStart, nextEnd] = [nextEnd, nextStart]
    }
  }

  if (nextEnd - nextStart < gap) {
    if (target === 'start') {
      nextStart = nextEnd - gap
    } else {
      nextEnd = nextStart + gap
    }
  }

  if (nextStart < 1) {
    nextStart = 1
    nextEnd = Math.min(wordCount, nextStart + gap)
  }
  if (nextEnd > wordCount) {
    nextEnd = wordCount
    nextStart = Math.max(1, nextEnd - gap)
  }

  startNo = nextStart
  endNo = nextEnd
  syncTotalWithRange()
}

function syncTotalWithRange() {
  if (rangeWordCount <= 0) {
    num = 0
    return
  }
  if (!num) {
    num = getDefaultTotal(rangeWordCount)
  } else if (num > rangeWordCount) {
    num = rangeWordCount
  } else if (num < 1) {
    num = 1
  }
}

function applyRecentRange(size: number) {
  if (progressNo <= 0) {
    setRawRange(wordCount > 0 ? 1 : 0, 0)
    return
  }
  setRange(Math.max(1, progressNo - size + 1), progressNo)
}

function getSetting(total = num): ShufflePracticeSetting {
  return {
    total: Math.max(0, Math.floor(Number(total) || 0)),
    range: toShufflePracticeRange(displayRange.start, displayRange.end, wordCount),
  }
}

function getSelection(total = num) {
  const ignoreSet = [store.allIgnoreWordsSet, store.knownWordsSet][settingStore.ignoreSimpleWord ? 0 : 1]
  return getShufflePracticeWords(store.sdict.words, getSetting(total), ignoreSet)
}

async function submit(setting: ShufflePracticeSetting) {
  const res = await props.onConfirm?.(setting)
  if (res === false) return false
  model.value = false
  return true
}

async function confirm() {
  syncTotalWithRange()
  if (rangeWordCount < MIN_RANGE_WORD_COUNT) {
    Toast.warning($t('range_min_limit'))
    return false
  }
  if (!num) {
    Toast.warning($t('please_set_random_amount'))
    return false
  }

  const result = getSelection()
  if (!result.available) {
    Toast.warning($t('no_words_in_range'))
    return false
  }

  if (result.available < result.total) {
    requestedCount = result.total
    availableCount = result.available
    showInsufficientDialog = true
    return false
  }

  return props.onConfirm?.(getSetting(result.total))
}

async function continueWithAvailable() {
  return submit(getSetting(availableCount))
}

watch(
  () => model.value,
  n => {
    if (n) {
      showRangeInput = false
      showInsufficientDialog = false
      setDefaultRange()
    }
  }
)

watch(
  () => rangeWordCount,
  () => syncTotalWithRange()
)
</script>

<template>
  <Dialog v-model="model" :title="$t('practice_mode_setting_title', { mode: wordPracticeMode })" :footer="true" :padding="true" :onConfirm="confirm">
    <div class="w-120 color-main">
      <div class="center items-end mb-4 flex-wrap text-center">
        <span class="font-bold mx-2">{{ getBookName(store.sdict, $t) }}</span>
        <span>[{{ startNo }} - {{ endNo }}] · {{ wordPracticeMode }}:</span>
        <span class="target-number mx-2">{{ num }}</span>
        <span>{{ $t('unit_words') }}</span>
      </div>

      <div class="space-y-4">
        <div class="flex items-start gap-space">
          <span class="shrink-0 w-28">{{ $t('random_quantity') }}</span>
          <Slider
            v-model="num"
            show-input
            show-text
            class="mt-1"
            :min="rangeWordCount ? 1 : 0"
            :max="rangeWordCount"
            :step="1"
          />
        </div>

        <div class="flex items-start gap-space">
          <span class="shrink-0 w-28">{{ $t('random_range') }}</span>
          <div class="flex-1">
            <Slider
              v-model="rangeModel"
              range
              draggable-track
              show-text
              :min="1"
              :max="wordCount || 1"
              :step="1"
              :min-gap="sliderMinGap"
            />
            <div class="text-sm mt-1" :class="rangeWordCount < MIN_RANGE_WORD_COUNT ? 'text-red-500' : 'text-gray-500'">
              {{ $t('range_word_count_desc', { start: displayRange.start || 0, end: displayRange.end || 0, count: rangeWordCount }) }}
            </div>
          </div>
          <BaseButton type="info" @click="showRangeInput = !showRangeInput">{{ $t('input_range') }}</BaseButton>
        </div>

        <div class="flex items-center gap-space pl-28" v-if="showRangeInput">
          <InputNumber
            :min="wordCount ? 1 : 0"
            :max="wordCount"
            :model-value="startNo"
            @update:model-value="value => setRange(Number(value), endNo, 'start')"
          />
          <span>-</span>
          <InputNumber
            :min="wordCount ? 1 : 0"
            :max="wordCount"
            :model-value="endNo"
            @update:model-value="value => setRange(startNo, Number(value), 'end')"
          />
        </div>

        <div class="flex items-center gap-space">
          <span class="shrink-0 w-28">{{ $t('quick_select') }}</span>
          <BaseButton type="info" @click="applyRecentRange(500)">{{ $t('recent_words_count', { count: 500 }) }}</BaseButton>
          <BaseButton type="info" @click="applyRecentRange(300)">{{ $t('recent_words_count', { count: 300 }) }}</BaseButton>
          <BaseButton type="info" @click="applyRecentRange(100)">{{ $t('recent_words_count', { count: 100 }) }}</BaseButton>
        </div>
      </div>
    </div>
  </Dialog>

  <Dialog
    v-model="showInsufficientDialog"
    :title="$t('words_insufficient')"
    :footer="true"
    :padding="true"
    :confirm-button-text="$t('confirm_continue')"
    :cancel-button-text="$t('cancel')"
    :onConfirm="continueWithAvailable"
  >
    <div class="w-90 color-main py-2">
      {{ $t('words_insufficient_msg', { actual: availableCount, target: requestedCount }) }}
    </div>
  </Dialog>
</template>

<style scoped lang="scss"></style>
