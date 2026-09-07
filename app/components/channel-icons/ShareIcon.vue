<script setup lang="ts">
import { APP_NAME, LIB_JS_URL, Origin } from '@/core/config/env.ts'
import { BaseIcon, Progress } from '@/base'
import { usePracticeStore } from '@/core/stores/practice.ts'
import { useBaseStore } from '@/core/stores/base.ts'
import { getBookName, loadJsLib, msToHourMinute } from '@/core/utils'
import dayjs from 'dayjs'
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { withAppBaseURL } from '@/core/utils/base-url'

const Dialog = defineAsyncComponent(() => import('@/base/dialog/Dialog.vue'))

const { t, locale } = useI18n()
const practiceStore = usePracticeStore()
const baseStore = useBaseStore()

let showShareDialog = $ref(false)
let loading1 = $ref(false)
let loading2 = $ref(false)
let posterEl = $ref<HTMLDivElement | null>(null)
let imgIndex = $ref(Math.floor(Math.random() * 10))

// 计算学习统计数据
const studyStats = $computed(() => {
  return {
    total: practiceStore.total,
    newWords: practiceStore.newWordNumber,
    review: practiceStore.reviewWordNumber,
    wrong: practiceStore.wrong,
    correct: practiceStore.total - practiceStore.wrong,
    time: msToHourMinute(practiceStore.spend),
    date: dayjs().format(locale.value === 'vi' ? 'DD/MM' : 'MM/DD'),
    dictionary: getBookName(baseStore.sdict, t),
  }
})

// 复制图片到剪贴板
async function copyImageToClipboard() {
  try {
    loading1 = true
    const snapdom = await loadJsLib('snapdom', LIB_JS_URL.SNAPDOM)
    const blob = await snapdom.toBlob(posterEl, { scale: 2, type: 'png' })
    if (!blob) throw new Error('capture failed')

    if (navigator.clipboard && (window as any).ClipboardItem) {
      await navigator.clipboard.write([new (window as any).ClipboardItem({ [blob.type || 'image/png']: blob })])
      Toass.success(t('image_copied'))
    } else {
      await downloadImage()
    }
  } catch (error) {
    Toass.error(t('copy_failed'))
    await downloadImage()
  } finally {
    loading1 = false
  }
}

// 下载图片
async function downloadImage() {
  loading2 = true
  const snapdom = await loadJsLib('snapdom', LIB_JS_URL.SNAPDOM)
  snapdom.download(posterEl, { scale: 2 })
  loading2 = false
}

// 切换背景
function changeBackground() {
  const newIndex = Math.floor(Math.random() * 9) // 0-8
  imgIndex = newIndex >= imgIndex ? newIndex + 1 : newIndex
}

// 计算学习进度百分比
const studyProgress = $computed(() => {
  if (!baseStore.sdict.length) return 0
  return Math.round((baseStore.sdict.lastLearnIndex / baseStore.sdict.length) * 100)
})

const sentence = $computed(() => {
  let list = [
    { en: 'Actions speak louder than words.', vi: 'Hành động có ý nghĩa hơn lời nói' },
    { en: 'Keep going, never give up!', vi: 'Kiên trì là thắng lợi' },
    { en: "Where there's a will, there's a way.", vi: 'Có chí thì nên' },
    { en: 'Every cloud has a silver lining.', vi: 'Trong cái rủi có cái may' },
    { en: 'Time heals all wounds.', vi: 'Thời gian chữa lành mọi vết thương' },
    { en: 'Never say die.', vi: 'Đừng bao giờ từ bỏ' },
    { en: 'The best is yet to come.', vi: 'Điều tốt đẹp nhất vẫn ở phía trước' },
    { en: "Believe you can and you're halfway there.", vi: 'Tin vào bản thân là bạn đã thành công một nửa' },
    { en: 'No pain, no gain.', vi: 'Có làm thì mới có ăn, có khổ mới có thành công' },
    { en: 'Dream big and dare to fail.', vi: 'Dám ước mơ lớn, dám chấp nhận thất bại' },
    { en: 'Home is where the heart is.', vi: 'Nơi nào có tình yêu thương, nơi đó là nhà' },
    { en: 'Knowledge is power.', vi: 'Tri thức là sức mạnh' },
    { en: 'Practice makes perfect.', vi: 'Có công mài sắt, có ngày nên kim' },
    { en: 'When in Rome, do as the Romans do.', vi: 'Nhập gia tùy tục' },
    { en: 'Just do it.', vi: 'Cứ làm đi' },
    { en: 'So far, so good.', vi: 'Mọi thứ đến nay vẫn rất ổn' },
    { en: 'The early bird catches the worm.', vi: 'Dậy sớm mới có cơ hội' },
    { en: 'Every day is a new beginning.', vi: 'Mỗi ngày là một khởi đầu mới' },
    { en: 'Success is a journey, not a destination.', vi: 'Thành công là một hành trình, không phải đích đến' },
    { en: 'Your only limit is your mind.', vi: 'Giới hạn duy nhất là tâm trí của bạn' },
    { en: 'A friend in need is a friend indeed.', vi: 'Hoạn nạn mới biết bạn hiền' },
    { en: 'Silence is golden.', vi: 'Im lặng là vàng' },
    { en: 'Let bygones be bygones.', vi: 'Hãy để quá khứ ngủ yên' },
    { en: 'Keep calm and carry on.', vi: 'Bình tĩnh và vững bước tiến lên' },
    { en: 'Live and learn.', vi: 'Học, học nữa, học mãi' },
    { en: 'Mistakes are proof that you are trying.', vi: 'Sai lầm chứng minh bạn đang nỗ lực' },
    { en: 'Better late than never.', vi: 'Muộn còn hơn không bao giờ' },
    { en: 'Be the change you wish to see in the world.', vi: 'Hãy là sự thay đổi bạn muốn thấy ở thế giới' },
    { en: 'The journey of a thousand miles begins with a single step.', vi: 'Hành trình vạn dặm bắt đầu từ một bước chân' },
    { en: 'When one door closes, another opens.', vi: 'Cánh cửa này đóng lại, cánh cửa khác sẽ mở ra' },
  ]
  return list[Math.floor(Math.random() * list.length)]
})
</script>

<template>
  <!-- 分享学习总结按钮 -->
  <BaseIcon @click="showShareDialog = true" class="bounce">
    <IconFluentShare20Regular class="text-blue-500 hover:text-blue-600" />
  </BaseIcon>

  <!-- 学习总结分享图片生成对话框 -->
  <Dialog v-model="showShareDialog" :title="$t('share')">
    <div class="flex min-w-160 max-w-200 p-6 pt-0 gap-space">
      <!-- 左侧：海报预览区域 -->
      <div ref="posterEl" class="flex-1 border-r border-gray-200 bg-gray-100 rounded-xl overflow-hidden relative">
        <div class="flex p-5 gap-space flex-col justify-between relative z-2 color-white h-full box-border">
          <div class="flex flex-col flex-1 space-y-3">
            <!-- 顶部用户信息 -->
            <div class="flex items-center">
              <div class="ml-auto text-xs">Type Words | {{ $t('english_learning') }}</div>
            </div>

            <div class="bg-gray-900/30 py-4 center flex-col rounded-2xl">
              <div class="text-center mb-2 text-xl">{{ $t('share_study_summary', { time: studyStats.time, name: studyStats.dictionary }) }}</div>
              <!-- Progress Overview -->
              <div class="w-90/100 flex items-center gap-space">
                <div class="shrink-0">{{ $t('progress') }}</div>
                <Progress :percentage="studyProgress" size="normal" />
              </div>
            </div>

            <!-- 统计数据 -->
            <div class="grid grid-cols-3 gap-4">
              <div class="stat-card">
                <div class="text-2xl font-bold">{{ studyStats.newWords }}</div>
                <div class="text-base">{{ $t('new_words') }}</div>
              </div>
              <div class="stat-card">
                <div class="text-2xl font-bold">{{ studyStats.review }}</div>
                <div class="text-base">{{ $t('review') }}</div>
              </div>
              <div class="stat-card">
                <div class="text-2xl font-bold">{{ studyStats.wrong }}</div>
                <div class="text-base">{{ $t('wrong_words') }}</div>
              </div>
            </div>

            <!-- 励志语句 -->
            <div class="bg-gray-900/30 py-4 rounded-2xl center flex-col flex-1 p-4">
              <div class="text-3xl text-center italic mb-2 en-article-family">{{ sentence.en }}</div>
              <div class="text-base italic" v-if="locale === 'vi'">{{ sentence.vi }}</div>
            </div>
          </div>

          <!-- 底部品牌信息 -->
          <div class="bg-gray-900/30 py-4 rounded-2xl p-4">
            <div class="flex justify-between items-end">
              <div class="space-y-2">
                <div class="font-bold text-2xl">Type Words</div>
                <div class="text-base">{{ Origin }}</div>
                <div class="text-xs">{{ $t('share_poster_slogan') }}</div>
              </div>
              <img :src="withAppBaseURL('/imgs/share/qr.png')" class="w-20 w-20 rounded-md overflow-hidden" alt="" />
            </div>
          </div>
        </div>

        <img
          :src="withAppBaseURL(`/imgs/share/bg/${imgIndex}.jpg`)"
          class="w-full object-cover object-center absolute top-0"
          alt=""
        />
      </div>

      <!-- 右侧：分享引导区域 -->
      <div class="flex-1 pt-0">
        <div class="">
          <div class="text-2xl font-bold mb-4 flex items-center">
            <span class="mr-2">🎯</span>
            {{ $t('share_your_progress') }}
          </div>
          <div class="flex items-start">
            <span class="mr-2">🚀</span>
            {{ $t('share_tagline_1', { app: APP_NAME }) }}
          </div>
          <div class="flex items-start">
            <span class="mr-2">📸</span>
            {{ $t('share_tagline_2') }}
          </div>
          <div class="flex items-start">
            <span class="mr-2">💪</span>
            {{ $t('share_tagline_3') }}
          </div>
          <div class="flex items-start">
            <span class="mr-2">🔥</span>
            {{ $t('share_tagline_4') }}
          </div>
        </div>

        <div class="space-y-4 mt-24">
          <!-- 个性化装扮 -->
          <div
            @click="changeBackground"
            class="flex items-center justify-start gap-space color-black px-6 py-3 bg-gray-200 rounded-lg cp hover:bg-gray-300 transition-all duration-200"
          >
            <IconMdiSparkles class="w-4 h-4 text-yellow-500" />
            {{ $t('change_background') }}
          </div>

          <!-- 分享战绩 -->
          <div
            @click="copyImageToClipboard"
            class="flex items-center justify-start gap-space px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white cp rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
          >
            <IconEosIconsLoading class="text-xl" v-if="loading1" />
            <IconFluentCopy20Regular class="w-5 h-5" v-else />
            <span class="font-medium">{{ $t('copy_to_clipboard') }}</span>
          </div>

          <div
            @click="downloadImage"
            class="flex items-center justify-start gap-space px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white cp rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
          >
            <IconEosIconsLoading class="text-xl" v-if="loading2" />
            <IconFluentArrowDownload20Regular class="w-5 h-5" v-else />
            <span class="font-medium">{{ $t('save_hd_poster') }}</span>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style scoped lang="scss">
.stat-card {
  @apply text-center bg-gray-900/30 py-4 rounded-2xl;
}
</style>
