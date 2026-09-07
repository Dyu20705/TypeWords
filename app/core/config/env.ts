import { offset } from '@floating-ui/dom'
//这里合并导入，打包会报错
import { ShortcutKey, WordPracticeMode, WordPracticeStage } from '../types/enum.ts'

export const GITHUB = 'https://github.com/Dyu20705/TypeWords'
export const Host = 'typewords.cc'
export const Old_Host = '2study.top'
export const EMAIL = '' // Set to fork maintainer contact email if needed
export const Origin = `https://${Host}`
export const APP_NAME = 'Type Words'
export const IS_DEV = import.meta.env.MODE === 'development'

const common = {
  word_dict_list_version: 1,
}
const map = {
  DEV: {
    API: 'http://localhost/',
    RESOURCE_URL: '',
    LIBS_URL: '/libs/',
  },
}

export const ENV = Object.assign(map['DEV'], common)

export let AppEnv = {
  TOKEN: '',
  IS_OFFICIAL: false,
  IS_LOGIN: false,
  CAN_REQUEST: false,
}

export const RESOURCE_PATH = ENV.API + 'static'

export const DICT_LIST = {
  WORD: {
    ALL: ENV.RESOURCE_URL + `/list/word.json`,
    RECOMMENDED: ENV.RESOURCE_URL + `/list/recommend_word.json`,
  },
  ARTICLE: {
    ALL: ENV.RESOURCE_URL + `/list/article.json`,
    RECOMMENDED: ENV.RESOURCE_URL + `/list/recommend_article.json`,
  },
}

export const SoundFileOptions = [
  { value: '机械键盘', label: 'sound_mechanical' },
  { value: '机械键盘1', label: 'sound_mechanical_1' },
  { value: '机械键盘2', label: 'sound_mechanical_2' },
  { value: '老式机械键盘', label: 'sound_vintage' },
  { value: '笔记本键盘', label: 'sound_laptop' },
]
export const APP_VERSION = {
  key: 'type-words-app-version',
  version: 4,
}
export const SAVE_DICT_KEY = {
  key: 'typing-word-dict',
  version: 4,
}
export const SAVE_SETTING_KEY = {
  key: 'typing-word-setting',
  version: 23,
}

//5版本，不再单独保存 app version字段
export const EXPORT_DATA_KEY = {
  key: 'typing-word-export',
  version: 5,
}
export const LOCAL_FILE_KEY = 'typing-word-files'
export const WEBSITE_VERSION_HASH = 'type-words-website-version-hash'
export const BACKUP_INDEX_KEY = 'type-words-backup-index'
export const BACKUP_KEY = 'type-words-backup-'

export const TourConfig = {
  useModalOverlay: true,
  defaultStepOptions: {
    canClickTarget: false,
    classes: 'shadow-md bg-purple-dark',
    cancelIcon: { enabled: true },
    modalOverlayOpeningPadding: 10,
    modalOverlayOpeningRadius: 6,
    floatingUIOptions: {
      middleware: [offset({ mainAxis: 30 })],
    },
  },
  total: 4,
}

export const LIB_JS_URL = {
  SHEPHERD: `${ENV.LIBS_URL}/Shepherd.14.5.1.mjs.js`,
  SNAPDOM: `${ENV.LIBS_URL}/snapdom.min.js`,
  JSZIP: `${ENV.LIBS_URL}/jszip.min.js`,
  XLSX: `${ENV.LIBS_URL}/xlsx.full.min.js`,
}
export const PronunciationApi = 'https://dict.youdao.com/dictvoice?audio='
export const DefaultShortcutKeyMap = {
  [ShortcutKey.EditArticle]: 'Ctrl+E',
  [ShortcutKey.PlayWordPronunciation]: 'Ctrl+P',
  [ShortcutKey.ToggleShowTranslate]: 'Ctrl+Z',
  [ShortcutKey.ToggleDictation]: 'Ctrl+I',
  [ShortcutKey.ToggleTheme]: 'Ctrl+Q',
  [ShortcutKey.ToggleConciseMode]: 'Ctrl+M',
  [ShortcutKey.ToggleToolbar]: 'Ctrl+B',
  [ShortcutKey.TogglePanel]: 'Ctrl+L',
  [ShortcutKey.RandomWrite]: 'Ctrl+R',

  [ShortcutKey.Previous]: 'Ctrl+⬅',
  [ShortcutKey.Next]: 'Ctrl+➡',
  [ShortcutKey.PreviousChapter]: 'Alt+⬅',
  [ShortcutKey.NextChapter]: 'Alt+➡',

  [ShortcutKey.ShowWord]: 'Escape',
  [ShortcutKey.Ignore]: 'Tab',
  [ShortcutKey.ToggleSimple]: '`',
  [ShortcutKey.ToggleCollect]: 'Enter',
  [ShortcutKey.CollectToDict]: 'Shift+Enter',
  [ShortcutKey.NextStep]: 'Shift+➡',
  [ShortcutKey.RepeatChapter]: 'Ctrl+Enter',
  [ShortcutKey.DictationChapter]: 'Alt+Enter',
  [ShortcutKey.KnowWord]: '1',
  [ShortcutKey.UnknownWord]: '2',
  [ShortcutKey.MasteredWord]: '3',
  [ShortcutKey.ChooseA]: '1',
  [ShortcutKey.ChooseB]: '2',
  [ShortcutKey.ChooseC]: '3',
  [ShortcutKey.ChooseD]: '4',
  [ShortcutKey.SelfTestingChooseA]: 'Alt+1',
  [ShortcutKey.SelfTestingChooseB]: 'Alt+2',
  [ShortcutKey.SelfTestingChooseC]: 'Alt+3',
  [ShortcutKey.SelfTestingChooseD]: 'Alt+4',
  [ShortcutKey.PlaySentence1]: 'Ctrl+1',
  [ShortcutKey.PlaySentence2]: 'Ctrl+2',
  [ShortcutKey.PlaySentence3]: 'Ctrl+3',
  [ShortcutKey.PlaySentence4]: 'Ctrl+4',
  [ShortcutKey.PlaySentence5]: 'Ctrl+5',
  [ShortcutKey.PlaySentence6]: 'Ctrl+6',
  [ShortcutKey.PlaySentence7]: 'Ctrl+7',
  [ShortcutKey.PlaySentence8]: 'Ctrl+8',
  [ShortcutKey.PlaySentence9]: 'Ctrl+9',
}

export const WordPracticeModeStageMap: Record<WordPracticeMode, WordPracticeStage[]> = {
  [WordPracticeMode.Free]: [WordPracticeStage.FollowWriteNewWord, WordPracticeStage.Complete],
  [WordPracticeMode.IdentifyOnly]: [
    WordPracticeStage.IdentifyNewWord,
    WordPracticeStage.IdentifyReview,
    WordPracticeStage.Complete,
  ],
  [WordPracticeMode.DictationOnly]: [
    WordPracticeStage.DictationNewWord,
    WordPracticeStage.DictationReview,
    WordPracticeStage.Complete,
  ],
  [WordPracticeMode.ListenOnly]: [
    WordPracticeStage.ListenNewWord,
    WordPracticeStage.ListenReview,
    WordPracticeStage.Complete,
  ],
  [WordPracticeMode.System]: [
    WordPracticeStage.FollowWriteNewWord,
    WordPracticeStage.ListenNewWord,
    WordPracticeStage.DictationNewWord,
    WordPracticeStage.IdentifyReview,
    WordPracticeStage.ListenReview,
    WordPracticeStage.DictationReview,
    WordPracticeStage.Complete,
  ],
  [WordPracticeMode.Shuffle]: [WordPracticeStage.Shuffle, WordPracticeStage.Complete],
  [WordPracticeMode.Review]: [
    WordPracticeStage.IdentifyReview,
    WordPracticeStage.ListenReview,
    WordPracticeStage.DictationReview,
    WordPracticeStage.Complete,
  ],
  [WordPracticeMode.ShuffleWordsTest]: null,
  [WordPracticeMode.ReviewWordsTest]: null,
}
export const WordPracticeStageNameMap: Record<WordPracticeStage, string> = {
  [WordPracticeStage.FollowWriteNewWord]: 'stage_follow_new',
  [WordPracticeStage.IdentifyNewWord]: 'stage_identify_new',
  [WordPracticeStage.ListenNewWord]: 'stage_listen_new',
  [WordPracticeStage.DictationNewWord]: 'stage_dictation_new',
  [WordPracticeStage.FollowWriteReview]: 'stage_follow_review',
  [WordPracticeStage.IdentifyReview]: 'stage_identify_review',
  [WordPracticeStage.ListenReview]: 'stage_listen_review',
  [WordPracticeStage.DictationReview]: 'stage_dictation_review',
  [WordPracticeStage.Complete]: 'stage_complete',
  [WordPracticeStage.Shuffle]: 'stage_shuffle',
}
export const WordPracticeModeNameMap: Record<WordPracticeMode, string> = {
  [WordPracticeMode.System]: 'mode_system',
  [WordPracticeMode.Free]: 'mode_free',
  [WordPracticeMode.IdentifyOnly]: 'mode_identify',
  [WordPracticeMode.DictationOnly]: 'mode_dictation',
  [WordPracticeMode.ListenOnly]: 'mode_listen',
  [WordPracticeMode.Shuffle]: 'mode_shuffle',
  [WordPracticeMode.Review]: 'mode_review',
  [WordPracticeMode.ShuffleWordsTest]: 'mode_shuffle_test',
  [WordPracticeMode.ReviewWordsTest]: 'mode_test',
  [WordPracticeMode.Custom]: 'mode_custom',
}
export const WordPracticeModeUrlMap: Record<WordPracticeMode, string> = {
  [WordPracticeMode.System]: '/practice-words',
  [WordPracticeMode.Free]: '/practice-words',
  [WordPracticeMode.IdentifyOnly]: '/practice-words',
  [WordPracticeMode.DictationOnly]: '/practice-words',
  [WordPracticeMode.ListenOnly]: '/practice-words',
  [WordPracticeMode.Shuffle]: '/practice-words',
  [WordPracticeMode.Review]: '/practice-words',
  [WordPracticeMode.ShuffleWordsTest]: '/words-test',
  [WordPracticeMode.ReviewWordsTest]: '/words-test',
  [WordPracticeMode.Custom]: '/practice-words',
}
export class DictId {
  static wordCollect = 'wordCollect'
  static wordWrong = 'wordWrong'
  static wordKnown = 'wordKnown'
  static articleCollect = 'articleCollect'
}
