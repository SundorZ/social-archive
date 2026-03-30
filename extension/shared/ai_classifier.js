import { CATEGORY_KEYWORDS, DEFAULT_CATEGORIES, STORAGE_KEY } from './constants.js';

// ─── 키워드 매칭 (단음절 한글은 단어 경계 검사) ────────────
function matchesKeyword(text, kw) {
  let pos = 0;
  while (true) {
    const idx = text.indexOf(kw, pos);
    if (idx === -1) return false;

    // 한글 단음절 키워드: 앞뒤가 한글 음절이면 더 긴 단어의 일부 → 제외
    if (kw.length === 1 && kw >= '\uac00' && kw <= '\ud7a3') {
      const before = idx > 0 ? text[idx - 1] : '';
      const after  = idx + 1 < text.length ? text[idx + 1] : '';
      const isKoreanSyl = c => c >= '\uac00' && c <= '\ud7a3';
      if (!isKoreanSyl(before) && !isKoreanSyl(after)) return true;
      pos = idx + 1;
      continue;
    }

    return true;
  }
}

// ─── 규칙 기반 분류 ───────────────────────────────────────
export function classifyByRules(text) {
  const lower = text.toLowerCase();
  const matched = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => matchesKeyword(lower, kw.toLowerCase()))) {
      matched.push(category);
    }
  }

  return matched.length > 0 ? matched : ['기타'];
}

// ─── Claude Haiku API 분류 ────────────────────────────────
async function classifyWithClaude(textForClassification, apiKey) {
  const prompt = `Instagram/YouTube SNS 콘텐츠를 보고 카테고리를 분류해주세요.

콘텐츠:
${textForClassification}

카테고리 기준:
- 육아: 임신, 출산, 신생아, 어린이 양육, 이유식, 유치원
- 요리: 레시피, 요리법, 맛집 리뷰, 베이킹, 먹방, 카페
- 여행: 국내외 여행, 관광지, 호텔, 캠핑, 나들이, 여행 브이로그
- IT: 프로그래밍, 개발, 앱/웹 서비스, 기술 트렌드, 스타트업
- AI: 인공지능, ChatGPT, Claude, 생성형 AI, 자동화 툴, LLM
- 운동: 헬스, 피트니스, 요가, 러닝, 스포츠, 홈트, 바디프로필
- 인테리어: 집꾸미기, 홈데코, 가구, 셀프인테리어, 정원, 플랜테리어
- 패션: 옷, 코디, OOTD, 스타일링, 신발, 가방, 악세서리
- 뷰티: 화장품, 스킨케어, 메이크업, 헤어, 향수, 피부 관리
- 금융: 주식, 재테크, 코인, 부동산, 절약, 펀드, 경제
- 자기계발: 독서, 공부, 자격증, 생산성, 동기부여, 커리어, 습관
- 반려동물: 강아지, 고양이, 펫, 동물 일상
- 기타: 위 카테고리 어디에도 명확히 해당하지 않는 경우에만

규칙:
- 가장 관련 높은 카테고리 1~2개만 선택 (최대 2개)
- 명확히 해당하는 카테고리가 있으면 절대 '기타' 사용 금지
- JSON 배열만 반환, 설명 없이
- 예시: ["패션", "뷰티"] 또는 ["IT"]`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 64,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}`);

  const data = await res.json();
  const raw  = data.content?.[0]?.text?.trim() || '[]';

  // JSON 파싱 — 실패 시 예외를 던져 호출자에서 fallback 처리
  const parsed = JSON.parse(raw);
  return {
    categories:        Array.isArray(parsed) ? parsed : [parsed],
    classifiedBy:      'ai',
    classificationRaw: data,
  };
}

// ─── 단건 분류 (규칙 → Claude 순서) ─────────────────────
export async function classifyOne(content, apiKey) {
  const text = [
    content.title,
    content.description?.slice(0, 500),
    content.collection?.name,
    content.authorName,
    (content.hashtags || []).join(' '),
  ].filter(Boolean).join('\n');

  // 1차: 규칙 기반
  const ruleResult = classifyByRules(text);
  if (ruleResult[0] !== '기타') {
    return { categories: ruleResult, classifiedBy: 'rule', classificationRaw: null };
  }

  // 2차: Claude API (API 키 없으면 규칙 결과 반환)
  if (!apiKey) {
    return { categories: ruleResult, classifiedBy: 'rule', classificationRaw: null };
  }

  try {
    return await classifyWithClaude(text, apiKey);
  } catch (err) {
    console.warn('[SocialArchive] Claude 분류 실패, 규칙 기반 사용:', err.message);
    return { categories: ruleResult, classifiedBy: 'rule', classificationRaw: null };
  }
}

// ─── 배치 분류 ────────────────────────────────────────────
export async function batchClassify(contents, onProgress) {
  const { [STORAGE_KEY.CLAUDE_API_KEY]: apiKey } = await chrome.storage.local.get(STORAGE_KEY.CLAUDE_API_KEY);

  const results = [];

  for (let i = 0; i < contents.length; i++) {
    const result = await classifyOne(contents[i], apiKey);
    results.push({ id: contents[i].id, ...result });

    // Claude API 레이트리밋 방지
    if (result.classifiedBy === 'ai') await delay(200);

    onProgress?.(i + 1, contents.length);
  }

  return results;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
