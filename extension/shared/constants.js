// ─── 플랫폼 ───────────────────────────────────────────────
export const PLATFORM = {
  INSTAGRAM: 'instagram',
  YOUTUBE: 'youtube',
  PINTEREST: 'pinterest',
};

// ─── 콘텐츠 타입 ──────────────────────────────────────────
export const CONTENT_TYPE = {
  POST: 'post',
  REEL: 'reel',
  VIDEO: 'video',
  SHORT: 'short',
  PIN: 'pin',
};

// ─── 수집 소스 ────────────────────────────────────────────
export const SOURCE = {
  LIKED: 'liked',
  SAVED: 'saved',
};

// ─── 분류 방법 ────────────────────────────────────────────
export const CLASSIFIED_BY = {
  AI: 'ai',
  RULE: 'rule',
  MANUAL: 'manual',
};

// ─── 카테고리 ────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  '육아', '요리', '여행', 'IT', 'AI',
  '운동', '인테리어', '패션', '뷰티', '금융',
  '자기계발', '반려동물', '기타',
];

// ─── 규칙 기반 분류 키워드 딕셔너리 ─────────────────────
export const CATEGORY_KEYWORDS = {
  '육아': [
    '아기', '육아', '임신', '출산', '신생아', '어린이', '유아', '맘', '베이비',
    '맘카페', '어린이집', '유치원', '기저귀', '분유', '이유식', '유모차', '태교',
    '임산부', '아이들', '초등학생', '육아템', '모유수유', '돌잔치', '100일',
    '첫돌', '임신일기', '육아일기', '베이비샤워', '어린이날',
    'baby', 'parenting', 'toddler', 'newborn', 'momlife', 'babyshower',
  ],
  '요리': [
    '레시피', '요리', '맛집', '먹방', '음식', '조리', '식당', '카페', '베이킹',
    '밥', '국물', '찌개', '된장', '탕수육', '반찬', '볶음', '튀김', '라면', '빵',
    '케이크', '디저트', '간식', '한식', '일식', '중식', '비건', '채식', '홈쿡',
    '집밥', '배달음식', '술안주', '음료수', '커피', '녹차', '홍차', '유자차',
    '밀크티', '브런치', '오마카세', '먹스타그램', '맛스타그램', '푸드스타그램',
    '홈베이킹', '과자', '쿠키', '파스타', '피자', '스테이크', '해산물', '냉면',
    '떡볶이', '삼겹살', '치킨', '초밥', '짜장면', '김치',
    'recipe', 'cooking', 'food', 'restaurant', 'baking', 'foodie', 'cafe',
  ],
  '여행': [
    '여행', '관광', '호텔', '항공', '숙소', '휴가', '투어', '나들이', '캠핑',
    '드라이브', '펜션', '게스트하우스', '국내여행', '해외여행', '유럽', '일본', '미국',
    '동남아', '제주', '부산', '전주', '경주', '강릉', '여수', '속초', '강원', '거제',
    '맛집투어', '백패킹', '리조트', '여행스타그램', '국내여행스타그램', '세계여행',
    '배낭여행', '자동차여행', '여행일기', '여행에세이',
    'travel', 'trip', 'vlog', 'vacation', 'hotel', 'camping', 'backpacking', 'tour',
  ],
  'IT': [
    '개발', '프로그래밍', '코딩', '소프트웨어', '개발자', '앱개발', '웹개발',
    '클라우드', '데이터', '데이터베이스', '서버', '보안', '알고리즘', '자료구조',
    '네트워크', '스타트업', '테크', '개발툴', '오픈소스',
    'javascript', 'python', 'github', 'devops', 'backend', 'frontend',
    'java', 'typescript', 'react', 'vue', 'aws', 'docker', 'kubernetes',
    'sql', 'api', 'tech', 'startup', 'saas', 'engineering',
  ],
  'AI': [
    '인공지능', '생성형', '머신러닝', '딥러닝', '챗봇', '자동화', '프롬프트',
    '자연어처리', '컴퓨터비전',
    'chatgpt', 'claude', 'llm', 'ai', 'gpt', 'midjourney', 'stable diffusion',
    'openai', 'gemini', 'copilot', 'rag', 'neural', 'nlp', 'diffusion',
    'sora', 'runway', 'dall-e', 'dalle', 'perplexity', 'cursor', 'windsurf',
  ],
  '운동': [
    '운동', '헬스', '피트니스', '요가', '러닝', '필라테스', '수영', '자전거',
    '등산', '산책', '마라톤', '크로스핏', '골프', '축구', '농구', '배드민턴',
    '테니스', '클라이밍', '홈트', 'PT', '트레이너', '근육', '체력', '스트레칭',
    '바디프로필', '헬스타그램', '운동루틴', '체중감량', '벌크업', '다이어트',
    '폼롤러', '스쿼트', '데드리프트', '벤치프레스',
    'workout', 'fitness', 'gym', 'yoga', 'running', 'cycling', 'pilates',
  ],
  '인테리어': [
    '인테리어', '집꾸미기', '홈데코', '리모델링', '가구', '셀프인테리어',
    '조명', '커튼', '벽지', '바닥재', '타일', '주방', '욕실', '거실', '침실',
    '베란다', '발코니', '정원', '홈가드닝', '플랜테리어', '빈티지', '미니멀',
    '북유럽', '무드등', '소품', '인테리어스타그램', '집스타그램', '셀프시공',
    '아파트인테리어', '신혼집', '원룸인테리어',
    'interior', 'homedecor', 'furniture', 'decor', 'renovation',
  ],
  '패션': [
    '패션', '코디', '스타일', '쇼핑', '데일리룩', '오오티디', '데님',
    '재킷', '코트', '후드', '티셔츠', '원피스', '스커트', '아우터', '캐주얼',
    '스트릿', '포멀', '신발', '스니커즈', '가방', '핸드백', '크로스백', '악세서리', '주얼리',
    '시계', '선글라스', '패션스타그램', '옷스타그램', '남성패션', '여성패션',
    '빈티지패션', '명품', '브랜드', '하이힐', '슬랙스', '청바지',
    'fashion', 'ootd', 'style', 'outfit', 'sneakers', 'streetwear',
  ],
  '뷰티': [
    '뷰티', '화장품', '메이크업', '스킨케어', '립스틱', '파운데이션', '향수',
    '헤어', '염색', '파마', '피부', '보습', '선크림', '에센스', '세럼', '크림',
    '마스크팩', '클렌징', '뷰스타그램', '메이크업스타', '뷰티유튜버', '코스메틱',
    '글로우', '무기자차', '수분크림', '아이섀도', '쿠션', '비비크림',
    'beauty', 'skincare', 'makeup', 'cosmetics', 'haircare', 'skincareroutine',
  ],
  '금융': [
    '주식', '투자', '재테크', '코인', '부동산', '경제', '절약', '펀드', 'ETF',
    '적금', '예금', '보험', '세금', '연말정산', '통장', '재무', '지출', '가계부',
    '절세', 'ISA', 'IRP', '연금', '비트코인', '이더리움', '청약', '분양',
    '금리', '인플레이션', '경매', '월세', '부동산투자', '주식투자', '배당',
    'finance', 'stock', 'crypto', 'investment', 'bitcoin', 'realestate',
  ],
  '자기계발': [
    '자기계발', '독서', '공부', '자격증', '생산성', '동기부여', '커리어',
    '취업', '이직', '면접', '포트폴리오', '스펙', '영어공부', '어학', '토익',
    '습관', '루틴', '목표', '성장', '마인드셋', '긍정', '멘탈', '심리',
    '명상', '마음챙김', '일기', '기록', '플래너', '다이어리', '독서노트',
    'selfdevelopment', 'motivation', 'productivity', 'study', 'career',
  ],
  '반려동물': [
    '강아지', '고양이', '펫', '반려동물', '애완동물', '댕댕이', '냥이',
    '반려견', '반려묘', '강아지일상', '고양이일상', '펫스타그램', '멍스타그램',
    '냥스타그램', '동물', '새', '토끼', '햄스터', '물고기', '파충류',
    'dog', 'cat', 'pet', 'puppy', 'kitten', 'doglife', 'catlife',
  ],
};

// ─── Instagram 인터셉트 대상 경로 ────────────────────────
export const INSTAGRAM_TARGET_PATHS = [
  '/api/v1/feed/liked/',
  '/api/v1/feed/saved/',
  '/api/v1/feed/collection/',
];

// ─── YouTube API ──────────────────────────────────────────
export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
export const YOUTUBE_SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
export const YOUTUBE_MAX_RESULTS = 50;
export const YOUTUBE_MAX_PAGES = 20; // 최대 1,000개

// ─── IndexedDB ────────────────────────────────────────────
export const DB_NAME = 'social_archive_v1';
export const DB_VERSION = 1;
export const STORE_NAME = 'contents';

// ─── 메시지 타입 (Extension 내부 통신) ───────────────────
export const MSG = {
  INSTAGRAM_ITEMS: 'INSTAGRAM_ITEMS_INTERCEPTED',
  YOUTUBE_LL_ITEMS: 'YOUTUBE_LL_ITEMS_INTERCEPTED',
  PINTEREST_ITEMS: 'PINTEREST_ITEMS_INTERCEPTED',
  CLASSIFY_START: 'CLASSIFY_START',
  CLASSIFY_DONE: 'CLASSIFY_DONE',
  RECLASSIFY_ALL: 'RECLASSIFY_ALL',
  RECLASSIFY_PROGRESS: 'RECLASSIFY_PROGRESS',
  COLLECT_ALL: 'COLLECT_ALL',
  COLLECT_PROGRESS: 'COLLECT_PROGRESS',
  COLLECT_DONE: 'COLLECT_DONE',
  GET_STATS: 'GET_STATS',
  // ── 대시보드 ↔ 서비스워커 DB 접근 ──
  GET_ALL_CONTENTS: 'GET_ALL_CONTENTS',
  DELETE_CONTENT: 'DELETE_CONTENT',
  UPDATE_MEMO: 'UPDATE_MEMO',
  UPDATE_CATEGORIES: 'UPDATE_CATEGORIES',
};

// ─── chrome.storage 키 ───────────────────────────────────
export const STORAGE_KEY = {
  CLAUDE_API_KEY: 'claudeApiKey',
  YOUTUBE_CLIENT_ID: 'youtubeClientId',
  USER_CATEGORIES: 'userCategories',
  LAST_SYNC: 'lastSync',
};

// ─── Pinterest 인터셉트 대상 경로 ──────────────────────────
export const PINTEREST_TARGET_PATHS = [
  '/resource/BoardFeedResource/',
  '/resource/UserFeedResource/',
  '/resource/PinsFeedResource/',
  '/resource/UserActivityPinsResource/',
];
