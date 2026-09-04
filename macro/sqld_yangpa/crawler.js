/**
 * SQLD양파 (https://sqldyangpa.com/) 기출문제 크롤링 & 표준화 변환 스크립트
 * 
 * - 대상: 제45회 ~ 제60회 (총 16회차, 800문항) + AI 모의고사 (1,331문항)
 * - 출력:
 *   1) sqld_yangpa_raw.json     : 크롤링 원본 데이터 (회차별 그룹화 + 메타정보)
 *   2) sqld_ai_mock_raw.json    : AI 모의고사 원본 데이터 (1,331문항)
 *   3) sqld_yangpa_all.json     : question-bank 표준 포맷 통합 JSON
 *   4) rounds/round_XX/round_XX.json : 회차별 독립 파일 ({"problems": [...]})
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sqldyangpa.com/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  return res.text();
}

/**
 * 홈페이지에서 최신 Vite 번들 JS URL 동적 감지
 */
async function findBundleUrl() {
  console.log(`[1/5] 홈페이지(${BASE_URL}) 분석 중...`);
  const html = await fetchText(BASE_URL);
  const match = html.match(/src=["'](\/assets\/index-[a-zA-Z0-9_\-]+\.js)["']/);
  if (!match) {
    console.warn('⚠️ 번들 스크립트 태그를 찾지 못해 기본 경로 사용');
    return `${BASE_URL}assets/index-Cb36LGEs.js`;
  }
  const bundleUrl = new URL(match[1], BASE_URL).toString();
  console.log(`  -> 번들 JS 발견: ${bundleUrl}`);
  return bundleUrl;
}

/**
 * 번들 JS 다운로드 및 문제 데이터 파싱
 */
async function extractDataFromBundle(bundleUrl) {
  console.log(`[2/5] 번들 JS 다운로드 중...`);
  const jsText = await fetchText(bundleUrl);
  console.log(`  -> 다운로드 완료 (${(jsText.length / 1024 / 1024).toFixed(2)} MB)`);

  console.log(`[3/5] 기출문제 및 모의고사 데이터 추출 중...`);
  const startMarker = 'Xt=[{id:1e4';
  const endMarker = 'J=[...pa,...La]';

  const startIdx = jsText.indexOf(startMarker);
  const endMarkerIdx = jsText.indexOf(endMarker);

  if (startIdx === -1 || endMarkerIdx === -1) {
    throw new Error('번들 내 문제 데이터 배열(Xt ~ J) 위치를 찾을 수 없습니다.');
  }

  const endIdx = endMarkerIdx + endMarker.length;
  const codeSlice = jsText.slice(startIdx, endIdx);

  // JavaScript VM 환경에서 안전하게 객체 평가
  const evaluatorCode = `var ${codeSlice}; return { se, pa, La };`;
  const fn = new Function(evaluatorCode);
  const { se, pa, La } = fn();

  console.log(`  -> 기출 회차 메타정보: ${se.length}개 회차`);
  console.log(`  -> 기출문제 총 문항수: ${pa.length}개 문항`);
  console.log(`  -> AI 모의고사 총 문항수: ${La.length}개 문항`);

  return { roundsInfo: se, pastExams: pa, aiMock: La };
}

/**
 * 테이블 데이터를 마크다운 표 문자열로 변환
 */
function formatTableToMarkdown(table) {
  if (!table) return '';
  let md = '';
  if (table.caption) {
    md += `**${table.caption}**\n\n`;
  }
  const headers = table.headers || [];
  if (headers.length > 0) {
    const headerRow = '| ' + headers.map(h => String(h ?? '').replace(/\n/g, ' ')).join(' | ') + ' |';
    const separatorRow = '| ' + headers.map(() => '---').join(' | ') + ' |';
    md += `${headerRow}\n${separatorRow}\n`;
  }
  const rows = table.rows || [];
  for (const row of rows) {
    const rowStr = '| ' + (row || []).map(cell => String(cell ?? '').replace(/\n/g, ' ')).join(' | ') + ' |';
    md += `${rowStr}\n`;
  }
  return md.trim();
}

/**
 * 문제 지문(references) 파싱 -> description 및 erds 추출
 */
function formatReferences(references) {
  const descriptionParts = [];
  const erds = [];

  for (const ref of references || []) {
    if (ref.type === 'text') {
      if (ref.content) descriptionParts.push(ref.content.trim());
    } else if (ref.type === 'sql') {
      if (ref.code) descriptionParts.push("```sql\n" + ref.code.trim() + "\n```");
    } else if (ref.type === 'table') {
      const tableMd = formatTableToMarkdown(ref);
      if (tableMd) descriptionParts.push(tableMd);
    } else if (ref.type === 'ascii') {
      if (ref.text) descriptionParts.push("```text\n" + ref.text.trim() + "\n```");
    } else if (ref.type === 'erd') {
      if (ref.caption) {
        descriptionParts.push(`**[ERD] ${ref.caption}**`);
      }
      if (ref.mermaid) {
        erds.push(ref.mermaid.trim());
      }
    }
  }

  return {
    description: descriptionParts.join('\n\n'),
    erds
  };
}

/**
 * 보기별 지문(optionReferences) 파싱 -> choiceDescriptions 및 choiceErds 추출
 */
function formatOptionReferences(optionReferences, count) {
  const choiceDescriptions = Array(count).fill('');
  const choiceErds = Array.from({ length: count }, () => []);

  if (Array.isArray(optionReferences)) {
    optionReferences.forEach((optRefs, idx) => {
      if (idx >= count || !Array.isArray(optRefs)) return;
      const descParts = [];
      for (const ref of optRefs) {
        if (ref.type === 'table') {
          const tableMd = formatTableToMarkdown(ref);
          if (tableMd) descParts.push(tableMd);
        } else if (ref.type === 'erd') {
          if (ref.caption) descParts.push(`**${ref.caption}**`);
          if (ref.mermaid) choiceErds[idx].push(ref.mermaid.trim());
        } else if (ref.type === 'text' && ref.content) {
          descParts.push(ref.content.trim());
        }
      }
      if (descParts.length > 0) {
        choiceDescriptions[idx] = descParts.join('\n\n');
      }
    });
  }

  return { choiceDescriptions, choiceErds };
}

/**
 * SQLD양파 문항 -> question-bank 표준 Problem 객체로 변환
 */
function convertToQuestionBankProblem(item) {
  const count = (item.options && item.options.length) || 4;
  const { description, erds } = formatReferences(item.references);
  const { choiceDescriptions, choiceErds } = formatOptionReferences(item.optionReferences, count);

  const answer = (typeof item.correctIndex === 'number') ? item.correctIndex + 1 : 0;

  return {
    hashtags: [
      "#SQLD",
      `#제${item.round}회`,
      `#${item.subject || '과목'}`,
      `#${item.number}번`
    ],
    question: item.title || '',
    description: description,
    conceptLinks: [],
    formulas: [],
    explanationFormulas: [],
    erds: erds,
    explanationErds: [],
    charts: [],
    explanationCharts: [],
    choices: item.options || [],
    choiceDescriptions: choiceDescriptions,
    choiceFormulas: Array.from({ length: count }, () => []),
    choiceErds: choiceErds,
    choiceCharts: Array.from({ length: count }, () => []),
    answer: answer,
    answers: answer > 0 ? [answer] : [],
    isMultipleAnswer: false,
    showMultipleCount: true,
    disableChoiceShuffle: false,
    isHold: false,
    explanation: item.explanation || '',
    choiceExplanations: Array(count).fill(''),
    choiceExplanationDescriptions: Array(count).fill(''),
    choiceExplanationFormulas: Array.from({ length: count }, () => []),
    choiceExplanationErds: Array.from({ length: count }, () => []),
    choiceExplanationCharts: Array.from({ length: count }, () => [])
  };
}

async function main() {
  console.log('=== [SQLD양파] 기출문제 크롤러 시작 ===\n');
  const bundleUrl = await findBundleUrl();
  const { roundsInfo, pastExams, aiMock } = await extractDataFromBundle(bundleUrl);

  const baseDir = __dirname;
  const roundsDir = path.join(baseDir, 'rounds');
  if (!fs.existsSync(roundsDir)) {
    fs.mkdirSync(roundsDir, { recursive: true });
  }

  console.log(`[4/5] 원본 및 통합 JSON 생성 중...`);

  // 1. 회차별로 그룹화
  const examsByRound = {};
  for (const q of pastExams) {
    const roundKey = q.round;
    if (!examsByRound[roundKey]) {
      examsByRound[roundKey] = [];
    }
    examsByRound[roundKey].push(q);
  }

  // 회차 번호 기준 정렬 (45회 ~ 60회)
  const sortedRounds = Object.keys(examsByRound).map(Number).sort((a, b) => a - b);

  // 2. 원본 JSON 저장 (sqld_yangpa_raw.json)
  const rawOutputPath = path.join(baseDir, 'sqld_yangpa_raw.json');
  const rawPayload = {
    metadata: {
      source: 'https://sqldyangpa.com/',
      crawledAt: new Date().toISOString(),
      totalRounds: sortedRounds.length,
      totalQuestions: pastExams.length,
      roundsInfo: roundsInfo
    },
    rounds: {}
  };
  for (const r of sortedRounds) {
    rawPayload.rounds[`round_${r}`] = examsByRound[r];
  }
  fs.writeFileSync(rawOutputPath, JSON.stringify(rawPayload, null, 2), 'utf-8');
  console.log(`  -> 원본 저장 완료: sqld_yangpa_raw.json (${(fs.statSync(rawOutputPath).size / 1024).toFixed(1)} KB)`);

  // 3. AI 모의고사 원본 저장 (sqld_ai_mock_raw.json)
  const mockOutputPath = path.join(baseDir, 'sqld_ai_mock_raw.json');
  fs.writeFileSync(mockOutputPath, JSON.stringify({
    metadata: {
      source: 'https://sqldyangpa.com/',
      crawledAt: new Date().toISOString(),
      totalQuestions: aiMock.length
    },
    questions: aiMock
  }, null, 2), 'utf-8');
  console.log(`  -> AI 모의고사 원본 저장 완료: sqld_ai_mock_raw.json (${(fs.statSync(mockOutputPath).size / 1024).toFixed(1)} KB)`);

  // 4. question-bank 표준 포맷 변환 및 통합 JSON (sqld_yangpa_all.json)
  const standardizedAll = {};

  console.log(`[5/5] 회차별 표준 포맷 파일 생성 중...`);
  for (const r of sortedRounds) {
    const roundQuestions = examsByRound[r];
    // 문항 번호 순 정렬
    roundQuestions.sort((a, b) => a.number - b.number);

    const convertedProblems = roundQuestions.map(convertToQuestionBankProblem);

    // 통합 포맷: { "SQLD_60": { "1": [prob], "2": [prob], ... } }
    const roundMap = {};
    convertedProblems.forEach((prob, idx) => {
      roundMap[String(idx + 1)] = [prob];
    });
    standardizedAll[`SQLD_${r}`] = roundMap;

    // 회차별 개별 폴더 & 파일 생성: rounds/round_XX/round_XX.json ({"problems": [...]})
    const roundSubDir = path.join(roundsDir, `round_${r}`);
    if (!fs.existsSync(roundSubDir)) {
      fs.mkdirSync(roundSubDir, { recursive: true });
    }
    const singleRoundPath = path.join(roundSubDir, `round_${r}.json`);
    fs.writeFileSync(singleRoundPath, JSON.stringify({ problems: convertedProblems }, null, 2), 'utf-8');
  }

  const allOutputPath = path.join(baseDir, 'sqld_yangpa_all.json');
  fs.writeFileSync(allOutputPath, JSON.stringify(standardizedAll, null, 2), 'utf-8');
  console.log(`  -> 표준 통합 파일 저장 완료: sqld_yangpa_all.json (${(fs.statSync(allOutputPath).size / 1024).toFixed(1)} KB)`);
  console.log(`  -> 회차별 개별 파일 저장 완료: rounds/round_45/ ~ rounds/round_60/ (총 ${sortedRounds.length}개 파일)`);

  console.log('\n========================================');
  console.log('🎉 크롤링 및 변환 작업이 성공적으로 완료되었습니다!');
  console.log(`- 수집된 기출 회차: 제${sortedRounds[0]}회 ~ 제${sortedRounds[sortedRounds.length - 1]}회 (총 ${sortedRounds.length}개 회차)`);
  console.log(`- 총 기출 문항 수: ${pastExams.length}문항 (회차당 50문항)`);
  console.log(`- 추가 수집 AI 모의고사: ${aiMock.length}문항`);
  console.log('========================================');
}

main().catch(err => {
  console.error('\n❌ 크롤링 중 오류 발생:', err);
  process.exit(1);
});
