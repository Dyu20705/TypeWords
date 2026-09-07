<script setup lang="ts">
import { BaseButton } from '@/base'
import type { Resource } from '@/core/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  resource: Resource
}>()

const emit = defineEmits(['openLink'])
const { t: $t } = useI18n()

const difficultyKeyMap: Record<string, string> = {
  '入门': 'difficulty_beginner',
  '基础': 'difficulty_elementary',
  '中级': 'difficulty_intermediate',
  '进阶': 'difficulty_upper_intermediate',
  '高级': 'difficulty_advanced',
  '全级别': 'difficulty_all_levels',
  'Beginner': 'difficulty_beginner',
  'Elementary': 'difficulty_elementary',
  'Intermediate': 'difficulty_intermediate',
  'Upper-Intermediate': 'difficulty_upper_intermediate',
  'Advanced': 'difficulty_advanced',
  'All Levels': 'difficulty_all_levels',
}

const formatDifficulty = (difficulty: string) => {
  const key = difficultyKeyMap[difficulty]
  return key ? $t(key) : difficulty
}

// 根据难度获取对应的样式类
const getDifficultyClass = (difficulty: string) => {
  const key = difficultyKeyMap[difficulty] || difficulty
  switch (key) {
    case 'difficulty_beginner':
      return 'bg-green-500'
    case 'difficulty_elementary':
      return 'bg-blue-500'
    case 'difficulty_intermediate':
      return 'bg-purple-500'
    case 'difficulty_upper_intermediate':
      return 'bg-amber-500'
    case 'difficulty_advanced':
      return 'bg-red-500'
    case 'difficulty_all_levels':
      return 'bg-gray-500'
    default:
      return 'bg-blue-500'
  }
}
</script>

<template>
  <div class="card-white min-h-45 mb-0 flex flex-col justify-between">
    <div v-if="resource.type !== 'list'">
      <div class="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
        {{ resource.name }}
      </div>
      <div class="space-y-2 mb-4">
        <div v-if="resource.author" class="text-sm text-gray-600 dark:text-gray-300">
          <span class="font-medium">{{ $t('author') }}</span
          >{{ resource.author }}
        </div>
        <div v-if="resource.features" class="text-sm text-gray-600 dark:text-gray-300">
          <span class="font-medium">🌟 {{ $t('features') }}</span
          >{{ resource.features }}
        </div>
        <div v-if="resource.suitable" class="text-sm text-gray-600 dark:text-gray-300">
          <span class="font-medium">📌 {{ $t('suitable_for') }}</span
          >{{ resource.suitable }}
        </div>
        <div v-if="resource.description" class="text-sm text-gray-600 dark:text-gray-300">
          {{ resource.description }}
        </div>
        <span
          v-if="resource.difficulty"
          class="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
          :class="getDifficultyClass(resource.difficulty)"
        >
          {{ formatDifficulty(resource.difficulty) }}
        </span>
      </div>
    </div>
    <div class="space-y-2" v-else>
      <div class=" flex items-start justify-between" v-for="item in resource.children">
        <div>
          <div class="text-base font-semibold text-gray-800 dark:text-gray-100">
            {{ item.name }}
          </div>
          <div v-if="item.author" class="text-sm text-gray-600 dark:text-gray-300">
            <span class="font-medium">{{ $t('author') }}</span
            >{{ item.author }}
          </div>
          <div v-if="item.features" class="text-sm text-gray-600 dark:text-gray-300">
            <span class="font-medium">🌟 {{ $t('features') }}</span
            >{{ item.features }}
          </div>
          <div v-if="item.suitable" class="text-sm text-gray-600 dark:text-gray-300">
            <span class="font-medium">📌 {{ $t('suitable_for') }}</span
            >{{ item.suitable }}
          </div>
          <div v-if="item.description" class="text-sm text-gray-600 dark:text-gray-300">
            {{ item.description }}
          </div>
        </div>
        <span
          v-if="item.difficulty"
          class="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
          :class="getDifficultyClass(item.difficulty)"
        >
          {{ formatDifficulty(item.difficulty) }}
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-3" v-if="resource.link">
      <BaseButton type="primary" @click="emit('openLink', resource.link)">
        {{ $t('open_link') }}
      </BaseButton>
    </div>
  </div>
</template>
