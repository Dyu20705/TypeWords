/**
 * localize-catalog.ts
 *
 * Transforms the 194-entry production catalog into a localized Vietnamese
 * catalog for public/list/word.json and public/list/recommend_word.json.
 * Also localizes public/list/article.json for the 4 NCE article books.
 *
 * Rules:
 * - Preserve all official examination acronyms (CET-4, CET-6, IELTS, TOEFL, GRE, GMAT, SAT, TEM-4, TEM-8, PTE, TOEIC, BEC, VOA)
 * - Translate categories and tags into natural Vietnamese
 * - Translate names and descriptions into natural Vietnamese
 * - Set translateLanguage to "vi"
 */

import fs from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const CATALOG_PATH = path.resolve(import.meta.dirname, 'production-catalog.json')
const WORD_LIST_PATH = path.resolve(PROJECT_ROOT, 'public/list/word.json')
const RECOMMEND_WORD_PATH = path.resolve(PROJECT_ROOT, 'public/list/recommend_word.json')
const ARTICLE_LIST_PATH = path.resolve(PROJECT_ROOT, 'public/list/article.json')
const RECOMMEND_ARTICLE_PATH = path.resolve(PROJECT_ROOT, 'public/list/recommend_article.json')

// Category translations
const CATEGORY_MAP: Record<string, string> = {
  '中国考试': 'Luyện thi Trung Quốc',
  '国际考试': 'Luyện thi quốc tế',
  '青少年英语': 'Tiếng Anh cho học sinh',
  '代码练习': 'Luyện tập lập trình',
}

// Tag translations
const TAG_MAP: Record<string, string> = {
  '大学英语': 'Đại học',
  '考研': 'Cao học',
  '新概念英语': 'New Concept English',
  '通用': 'Thông dụng',
  '其他': 'Tổng hợp',
  '自考英语二': 'Tự học tiếng Anh 2',
  '人教版': 'Nhân giáo (PEP)',
  '外研版': 'Ngoại nghiên (FLTRP)',
  '牛津版': 'Oxford',
  '上海版': 'Thượng Hải',
  '译林版': 'Dịch Lâm (Yilin)',
  '北师大': 'Bắc Sư Đại (BNU)',
  '冀教版': 'Ký giáo (Hebei)',
  'IELTS': 'IELTS',
  'TOEFL': 'TOEFL',
  'GRE': 'GRE',
  'GMAT': 'GMAT',
  'SAT': 'SAT',
  'BEC': 'BEC',
  'PTE': 'PTE',
  'PET': 'PET',
  'KET': 'KET',
  'TOEIC': 'TOEIC',
  'CEFR': 'CEFR',
}

// Specific dictionary name translations
const NAME_MAP: Record<string, string> = {
  'CET-4': 'CET-4',
  'CET-4（翻译带频率）': 'CET-4 (Hiển thị từ tần)',
  'CET-6': 'CET-6',
  'CET-4-Sub': 'CET-4 Cốt lõi rút gọn',
  'CET-6-Sub': 'CET-6 Cốt lõi rút gọn',
  '四级巧记速记': 'CET-4 Mẹo nhớ nhanh',
  '六级巧记速记': 'CET-6 Mẹo nhớ nhanh',
  '考研': 'Từ vựng thi Cao học (KaoYan)',
  '考研 2024': 'Từ vựng thi Cao học 2024',
  '考研闪过 2023': 'Cao học cấp tốc 2023 (Tần suất cao/vừa/thấp)',
  '考研926词汇': 'Cao học 926 từ vựng cốt lõi',
  '单词的秘密-英语一': 'Bí mật từ vựng - Tiếng Anh 1 (Cao học)',
  '单词的秘密-英语二': 'Bí mật từ vựng - Tiếng Anh 2 (Cao học)',
  '2024考研英语hongbaoshu(上)': '2024 Sách Đỏ Cao học (Phần trên)',
  '2024考研英语hongbaoshu(下)': '2024 Sách Đỏ Cao học (Phần dưới)',
  '2026考研英语 hongbaoshu': '2026 Sách Đỏ Cao học (Bắt buộc + Căn bản + Nâng cao)',
  '英语二单词书': 'Sổ từ Tiếng Anh 2 (Cao học)',
  '考研 shanguo 2025': 'Cao học Shanguo 2025',
  '2025考研英语词汇hongbao书': '2025 Sách Đỏ từ vựng Cao học',
  '专四': 'Chuyên ngành Anh cấp 4 (TEM-4)',
  '专八': 'Chuyên ngành Anh cấp 8 (TEM-8)',
  'PETS': 'PETS (Thi chứng chỉ tiếng Anh quốc gia TQ)',
  'PETS-2023': 'PETS 2023',
  '自考1800高频单词': 'Tự học 1800 từ tần suất cao',
  '自考英语二高频悠悠单词': 'Tự học Tiếng Anh 2 - Từ vựng tần suất cao',
  '自考英语二完整单词': 'Tự học Tiếng Anh 2 - Trọn bộ từ vựng',
  '专升本词汇': 'Từ vựng Liên thông Đại học',
  '专插本英语词汇': 'Từ vựng Chuyên tiếp Đại học',
  '专升本学士学位的英语': 'Tiếng Anh Cử nhân Liên thông',
  '专升本3000词': 'Liên thông Đại học 3000 từ',
  '听说考试常见词汇': 'Từ vựng thường gặp bài thi Nghe - Nói',
  '韦氏词根词典': 'Từ điển Gốc từ Merriam-Webster',
  '超频单词level 1': 'Từ vựng tần suất siêu cao - Level 1',
  '超频单词level 2': 'Từ vựng tần suất siêu cao - Level 2',
  '超频单词level 3': 'Từ vựng tần suất siêu cao - Level 3',
  'Coder Dict': 'Từ vựng Lập trình viên',
  '程序员常用词': 'Từ vựng thông dụng cho Lập trình viên',
  '计算机专用英语': 'Tiếng Anh chuyên ngành CNTT & Khoa học Máy tính',
  'IELTS': 'IELTS Cốt lõi',
  'IELTS乱序完整版': 'IELTS Trọn bộ (Đảo trật tự ngẫu nhiên)',
  '雅思词库': 'Từ vựng IELTS',
  '雅思听力场景词汇': 'IELTS Từ vựng theo ngữ cảnh bài Nghe',
  'heQiong雅思听力必考词汇': 'IELTS He Qiong - Từ vựng bài thi Nghe bắt buộc',
  '雅思wang C3': 'IELTS Wang Lu C3 - Danh từ đặc biệt bài Nghe',
  '雅思wang C4': 'IELTS Wang Lu C4 - Tính từ & Trạng từ bài Nghe',
  '雅思wang C5': 'IELTS Wang Lu C5 - Nuốt âm & Nối âm',
  '雅思wang C11': 'IELTS Wang Lu C11 - Luyện tập tổng hợp',
  '鸭圈雅思核心词': 'IELTS Yaquan - Từ vựng trọng tâm',
  '雅思词汇真经': 'IELTS Chân Kinh Từ Vựng',
  '雅思 wanglu 807': 'IELTS Wang Lu 807 Từ vựng bài Nghe',
  '王陆807雅思词汇听力第2版': 'IELTS Wang Lu 807 Bài Nghe (Tái bản lần 2)',
  '雅思 real 词汇 高频': 'IELTS Real - Từ vựng tần suất cao',
  '雅思 real 词汇 5': 'IELTS Real - Từ tần 5',
  '雅思 real 词汇 4': 'IELTS Real - Từ tần 4',
  '雅思 real 词汇 3': 'IELTS Real - Từ tần 3',
  '雅思 real 词汇 2': 'IELTS Real - Từ tần 2',
  '雅思 real 词汇 1': 'IELTS Real - Từ tần 1',
  '100个句子记完7000个雅思单词': '100 câu nhớ 7000 từ vựng IELTS (Tân Đông Phương)',
  'TOEFL': 'TOEFL Cốt lõi',
  '张红岩的TOEFL词汇书': 'TOEFL Trương Hồng Nham - Phân loại theo chủ đề',
  'GMAT': 'GMAT Cốt lõi',
  'GRE': 'GRE Cốt lõi',
  'GRE3000': 'GRE 3000',
  '再要你命GRE3000': 'GRE 3000 Cốt lõi (Bản kèm từ tính mới)',
  'GRE重点1500词-fen哥': 'GRE 1500 từ trọng tâm (Trùng lặp TEM-8)',
  'GRE机经词汇': 'GRE Từ vựng thực chiến phòng thi',
  'GRE等价词': 'GRE Từ vựng tương đương (Sentence Equivalence)',
  'GRE词以类记': 'GRE Từ vựng phân loại theo chủ đề',
  'SAT': 'SAT Cốt lõi (Hoa Kỳ)',
  'BEC': 'BEC Tiếng Anh Thương Mại',
  '商务英语': 'Tiếng Anh Thương Mại thông dụng',
  'PET-2024': 'Cambridge PET - 2024',
  'KET': 'Cambridge KET',
  'TOEIC 词汇': 'Từ vựng TOEIC',
  'PTE 基础词汇': 'PTE Từ vựng căn bản',
  'PTE 高阶词汇': 'PTE Từ vựng nâng cao',
  '阅读 FIB 基础机经词汇': 'PTE Reading FIB - Căn bản',
  '阅读 FIB 高阶机经词汇': 'PTE Reading FIB - Nâng cao',
  'WFD 机经词汇': 'PTE Write From Dictation (WFD)',
  '听力 FIB 机经词汇': 'PTE Listening FIB',
  'PTE 基础词汇 xingji': 'PTE Tinh Cơ - Căn bản',
  'PTE 高阶词汇 xingji': 'PTE Tinh Cơ - Nâng cao',
  'PTE 阅读FIB机经词汇 xingji': 'PTE Reading FIB Tinh Cơ',
  'PTE 听力FIB机经词汇 xingji': 'PTE Listening FIB Tinh Cơ',
  '多邻国分级词汇B1': 'Duolingo Phân cấp B1',
  '多邻国分级词汇B2': 'Duolingo Phân cấp B2',
  '多邻国分级词汇C1': 'Duolingo Phân cấp C1',
  '牛津3000词': 'Oxford 3000 từ cốt lõi',
  '牛津5000词': 'Oxford 5000 từ',
  'Longman Communication 3000': 'Longman Giao tiếp 3000 từ',
  'Top 2000 words': 'Top 2000 từ thông dụng nhất',
  'Top 1500 Nouns': 'Top 1500 Danh từ thông dụng nhất',
  'Top 1000 Verbs': 'Top 1000 Động từ thông dụng nhất',
  'Top 500 adj.': 'Top 500 Tính từ thông dụng nhất',
  'Top 250 adv.': 'Top 250 Trạng từ thông dụng nhất',
  'Top 60 pron.': 'Top 60 Đại từ thông dụng nhất',
  'Top 50 prep.': 'Top 50 Giới từ thông dụng nhất',
  'Essential Words': '4000 Từ vựng tiếng Anh thiết yếu (4000 Essential English Words)',
  '麦克米伦7000': 'Macmillan 7000 từ vựng',
  'VOA 基础词库': 'VOA Từ vựng căn bản',
  '高考 3500 词': '3500 từ vựng thi Tốt nghiệp THPT / Đại học',
  '高考历年真题核心高频': 'Từ vựng cốt lõi tần suất cao đề thi Đại học các năm',
  '高考英语阅读高频词汇': 'Từ vựng bài Đọc hiểu thi Đại học tần suất cao',
  '中考核心词': 'Từ vựng cốt lõi thi Vào Lớp 10 (Trung khảo)',
  '新概念英语-1': 'New Concept English - Quyển 1',
  '新概念英语-2': 'New Concept English - Quyển 2',
  '新概念英语-3': 'New Concept English - Quyển 3',
  '新概念英语-4': 'New Concept English - Quyển 4',
  '上海初中牛津词汇': 'Oxford THCS Thượng Hải',
  '上海新教材六年级下': 'Sách giáo khoa Thượng Hải Lớp 6 (Học kỳ 2)',
  '北京初中': 'THCS Bắc Kinh',
  'Reading Explorer 3': 'Reading Explorer 3 (Third Edition)',
  '剑桥小学英语 JOIN IN': 'Tiếng Anh Tiểu học Cambridge JOIN IN',
}

// Recommended list: curated list of high-priority dictionaries for general learners
const RECOMMENDED_IDS = new Set([
  '1', '2', '18', '19', '57', '113', '7', '132', '136', '137', '138', '139',
  '27', '51', '25', '26', '50', '48', '70', '84', '89', '192', '193'
])

function translateDesc(desc: string, name: string): string {
  if (!desc || desc.trim() === '') {
    return NAME_MAP[name] || name
  }
  
  // Direct translation overrides
  if (desc === '大学英语四级词库') return 'Từ vựng tiếng Anh đại học CET-4 cốt lõi'
  if (desc === '大学英语六级词库') return 'Từ vựng tiếng Anh đại học CET-6 cốt lõi'
  if (desc === '大学英语四级词库（翻译带频率显示）') return 'Từ vựng tiếng Anh đại học CET-4 (Kèm tần suất xuất hiện)'
  if (desc === '研究生英语入学考试词库') return 'Từ vựng thi tuyển sinh sau đại học / Cao học'
  if (desc === '英语专业四级词库') return 'Từ vựng chuyên ngành tiếng Anh cấp 4 (TEM-4)'
  if (desc === '英语专业八级词库') return 'Từ vựng chuyên ngành tiếng Anh cấp 8 (TEM-8)'
  if (desc === '雅思词库') return 'Từ vựng trọng tâm kỳ thi IELTS'
  if (desc === '托福考试常见词') return 'Từ vựng thường gặp trong kỳ thi TOEFL'
  if (desc === '程序员常见单词词库') return 'Từ vựng tiếng Anh thông dụng dành cho lập trình viên'
  if (desc === '大学计算机专业英语词汇') return 'Từ vựng tiếng Anh chuyên ngành Khoa học Máy tính & CNTT'
  if (desc === '高考常见词 3500') return '3500 từ vựng cốt lõi chuẩn bị kỳ thi Tốt nghiệp THPT và Đại học'
  if (desc === '新概念英语第一册') return 'New Concept English Quyển 1 - First Things First (Căn bản)'
  if (desc === '新概念英语第二册') return 'New Concept English Quyển 2 - Practice and Progress (Thực hành)'
  if (desc === '新概念英语第三册') return 'New Concept English Quyển 3 - Developing Skills (Phát triển kỹ năng)'
  if (desc === '新概念英语第四册') return 'New Concept English Quyển 4 - Fluency in English (Lưu loát)'
  if (desc === '美国 SAT 考试词库') return 'Bộ từ vựng chuẩn bị cho kỳ thi SAT tại Hoa Kỳ'
  if (desc === 'GMAT 词库') return 'Bộ từ vựng chuẩn bị cho kỳ thi GMAT'
  if (desc === 'GRE 词库') return 'Bộ từ vựng chuẩn bị cho kỳ thi GRE'
  if (desc === '商务英语常见词') return 'Từ vựng tiếng Anh thương mại và giao tiếp công sở'
  if (desc === 'BEC考试常见词') return 'Từ vựng thường gặp trong kỳ thi chứng chỉ tiếng Anh thương mại BEC'

  // Pattern-based translations for textbooks
  let v = desc
  v = v.replace(/人教版高中必修(\d+)/g, 'Sách giáo khoa Nhân giáo (PEP) THPT Bắt buộc $1')
  v = v.replace(/人教版高中选修(\d+)/g, 'Sách giáo khoa Nhân giáo (PEP) THPT Tự chọn $1')
  v = v.replace(/人教版七年级上册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 7 (Học kỳ 1)')
  v = v.replace(/人教版七年级下册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 7 (Học kỳ 2)')
  v = v.replace(/人教版八年级上册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 8 (Học kỳ 1)')
  v = v.replace(/人教版八年级下册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 8 (Học kỳ 2)')
  v = v.replace(/人教版九年级全册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 9 (Cả năm)')
  v = v.replace(/人教版三年级上册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 3 (Học kỳ 1)')
  v = v.replace(/人教版三年级下册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 3 (Học kỳ 2)')
  v = v.replace(/人教版四年级上册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 4 (Học kỳ 1)')
  v = v.replace(/人教版四年级下册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 4 (Học kỳ 2)')
  v = v.replace(/人教版五年级上册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 5 (Học kỳ 1)')
  v = v.replace(/人教版五年级下册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 5 (Học kỳ 2)')
  v = v.replace(/人教版六年级上册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 6 (Học kỳ 1)')
  v = v.replace(/人教版六年级下册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 6 (Học kỳ 2)')
  v = v.replace(/人教版一年级上册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 1 (Học kỳ 1)')
  v = v.replace(/人教版一年级下册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 1 (Học kỳ 2)')
  v = v.replace(/人教版二年级上册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 2 (Học kỳ 1)')
  v = v.replace(/人教版二年级下册/g, 'Sách giáo khoa Nhân giáo (PEP) Lớp 2 (Học kỳ 2)')
  v = v.replace(/外研版/g, 'Ngoại nghiên (FLTRP) ')
  v = v.replace(/外研高中必修(\d+)/g, 'Ngoại nghiên (FLTRP) THPT Bắt buộc $1')
  v = v.replace(/北师大版高中必修(\d+)/g, 'Bắc Sư Đại (BNU) THPT Bắt buộc $1')
  v = v.replace(/北师大版高中选修(\d+)/g, 'Bắc Sư Đại (BNU) THPT Tự chọn $1')
  v = v.replace(/译林版高中必修(\d+)/g, 'Dịch Lâm (Yilin) THPT Bắt buộc $1')
  v = v.replace(/冀教版/g, 'Ký giáo (Hebei) ')
  v = v.replace(/七年级/g, 'Lớp 7 ')
  v = v.replace(/八年级/g, 'Lớp 8 ')
  v = v.replace(/九年级/g, 'Lớp 9 ')
  v = v.replace(/三年级/g, 'Lớp 3 ')
  v = v.replace(/四年级/g, 'Lớp 4 ')
  v = v.replace(/五年级/g, 'Lớp 5 ')
  v = v.replace(/六年级/g, 'Lớp 6 ')
  v = v.replace(/一年级/g, 'Lớp 1 ')
  v = v.replace(/二年级/g, 'Lớp 2 ')
  v = v.replace(/上册/g, 'Học kỳ 1')
  v = v.replace(/下册/g, 'Học kỳ 2')
  v = v.replace(/上/g, 'HK1')
  v = v.replace(/下/g, 'HK2')

  if (v !== desc) return v
  return NAME_MAP[name] || name
}

function translateName(name: string): string {
  if (NAME_MAP[name]) return NAME_MAP[name]

  // Pattern matching for school grade names
  let n = name
  n = n.replace(/^三年级上$/, 'Tiểu học Lớp 3 (Học kỳ 1)')
  n = n.replace(/^三年级下$/, 'Tiểu học Lớp 3 (Học kỳ 2)')
  n = n.replace(/^四年级上$/, 'Tiểu học Lớp 4 (Học kỳ 1)')
  n = n.replace(/^四年级下$/, 'Tiểu học Lớp 4 (Học kỳ 2)')
  n = n.replace(/^五年级上$/, 'Tiểu học Lớp 5 (Học kỳ 1)')
  n = n.replace(/^五年级下$/, 'Tiểu học Lớp 5 (Học kỳ 2)')
  n = n.replace(/^六年级上$/, 'Tiểu học Lớp 6 (Học kỳ 1)')
  n = n.replace(/^六年级下$/, 'Tiểu học Lớp 6 (Học kỳ 2)')
  n = n.replace(/^七年级上$/, 'THCS Lớp 7 (Học kỳ 1)')
  n = n.replace(/^七年级下$/, 'THCS Lớp 7 (Học kỳ 2)')
  n = n.replace(/^八年级上$/, 'THCS Lớp 8 (Học kỳ 1)')
  n = n.replace(/^八年级下$/, 'THCS Lớp 8 (Học kỳ 2)')
  n = n.replace(/^九年级$/, 'THCS Lớp 9 (Cả năm)')
  n = n.replace(/^高中必修(\d+)$/, 'THPT Bắt buộc $1')
  n = n.replace(/^高中选修(\d+)$/, 'THPT Tự chọn $1')
  n = n.replace(/^人教版\(新起点\)(.*)$/, 'Nhân giáo (PEP Điểm mới) $1')
  n = n.replace(/^外研(.*)$/, 'Ngoại nghiên (FLTRP) $1')
  n = n.replace(/^冀教(.*)$/, 'Ký giáo (Hebei) $1')
  return n
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'))
  console.log(`[INFO] Loaded ${catalog.length} dictionaries from production catalog`)

  const localizedCatalog = catalog.map((item: any) => {
    const idStr = String(item.id)
    const name = translateName(item.name)
    const description = translateDesc(item.description, item.name)
    const category = CATEGORY_MAP[item.category] || item.category
    const tags = (item.tags || []).map((t: string) => TAG_MAP[t] || t)
    const isRecommended = RECOMMENDED_IDS.has(idStr) || item.recommended === true

    return {
      id: item.id,
      enName: item.url.replace(/\.json$/i, '').toLowerCase(),
      name,
      description,
      categoryId: item.categoryId || 1,
      url: item.url,
      length: item.length,
      language: 'en',
      translateLanguage: 'vi',
      version: item.version || 1,
      type: 'word',
      isDefault: item.id === 1 || item.id === '1' || item.id === 'cet4',
      recommended: isRecommended,
      category,
      tags,
    }
  })

  // Write public/list/word.json
  fs.writeFileSync(WORD_LIST_PATH, JSON.stringify(localizedCatalog, null, 2), 'utf-8')
  console.log(`[OK] Written ${localizedCatalog.length} entries to ${WORD_LIST_PATH}`)

  // Write public/list/recommend_word.json
  const recommendedList = localizedCatalog.filter((item: any) => item.recommended)
  fs.writeFileSync(RECOMMEND_WORD_PATH, JSON.stringify(recommendedList, null, 2), 'utf-8')
  console.log(`[OK] Written ${recommendedList.length} recommended entries to ${RECOMMEND_WORD_PATH}`)

  // Article catalog localization
  const articleCatalog = [
    {
      id: 246,
      enName: 'nce1',
      name: 'New Concept English 1',
      description: 'Quyển 1: First Things First - Bước đầu làm quen với ngữ âm, ngữ điệu, ngữ pháp căn bản và cấu trúc câu thông dụng.',
      categoryId: 4,
      url: 'NCE_1.json',
      length: 72,
      language: 'en',
      translateLanguage: 'vi',
      version: 1,
      type: 'article',
      isDefault: false,
      recommended: true,
      category: 'Luyện đọc bài văn',
      tags: ['New Concept English'],
    },
    {
      id: 247,
      enName: 'nce2',
      name: 'New Concept English 2',
      description: 'Quyển 2: Practice and Progress - Thực hành và tiến bộ qua các đoạn văn ngắn hài hước, rèn luyện tư duy ngữ pháp và viết thư.',
      categoryId: 4,
      url: 'NCE_2.json',
      length: 96,
      language: 'en',
      translateLanguage: 'vi',
      version: 1,
      type: 'article',
      isDefault: false,
      recommended: true,
      category: 'Luyện đọc bài văn',
      tags: ['New Concept English'],
    },
    {
      id: 248,
      enName: 'nce3',
      name: 'New Concept English 3',
      description: 'Quyển 3: Developing Skills - Phát triển kỹ năng tư duy ngôn ngữ, phân tích cấu trúc quan hệ logic phức tạp giữa các câu.',
      categoryId: 4,
      url: 'NCE_3.json',
      length: 60,
      language: 'en',
      translateLanguage: 'vi',
      version: 1,
      type: 'article',
      isDefault: false,
      recommended: true,
      category: 'Luyện đọc bài văn',
      tags: ['New Concept English'],
    },
    {
      id: 249,
      enName: 'nce4',
      name: 'New Concept English 4',
      description: 'Quyển 4: Fluency in English - Tiếng Anh lưu loát qua các bài viết văn hóa, kinh tế, triết học và chính trị đa dạng.',
      categoryId: 4,
      url: 'NCE_4.json',
      length: 48,
      language: 'en',
      translateLanguage: 'vi',
      version: 1,
      type: 'article',
      isDefault: false,
      recommended: true,
      category: 'Luyện đọc bài văn',
      tags: ['New Concept English'],
    },
  ]

  fs.writeFileSync(ARTICLE_LIST_PATH, JSON.stringify(articleCatalog, null, 2), 'utf-8')
  fs.writeFileSync(RECOMMEND_ARTICLE_PATH, JSON.stringify(articleCatalog, null, 2), 'utf-8')
  console.log(`[OK] Written ${articleCatalog.length} entries to ${ARTICLE_LIST_PATH} & recommend_article.json`)
}

main()
