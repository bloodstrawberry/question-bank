import json
import re

log_path = r"d:\github\question-bank\src\api\dummy\log.txt"
log_err_path = r"d:\github\question-bank\src\api\dummy\log_error.txt"
default_json_path = r"d:\github\question-bank\src\api\dummy\default.json"
mismatch_txt_path = r"d:\github\question-bank\src\api\dummy\mismatch.txt"

def parse_log(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = r'\[(\d+)/\d+\]\s+(?:\(원래 전체 (\d+)번\)\s+)?Script:\s*(\w+)\s*\|\s*문제\s*#(\d+)'
    matches = list(re.finditer(pattern, content))
    problems = []
    
    for idx, m in enumerate(matches):
        seq = int(m.group(1))
        orig_seq = int(m.group(2)) if m.group(2) else seq
        script_id = m.group(3)
        prob_num = int(m.group(4))
        
        start_pos = m.end()
        end_pos = matches[idx+1].start() if idx+1 < len(matches) else len(content)
        block_text = content[start_pos:end_pos]
        
        is_match = "✅ MATCH" in block_text
        is_mismatch = "❌ MISMATCH" in block_text
        
        pred_match = re.search(r'LLM 예측 정답:\s*(\d+)', block_text)
        llm_pred = int(pred_match.group(1)) if pred_match else None
        
        ans_match = re.search(r'실제 정답:\s*([^\n|]+)', block_text)
        actual_ans = ans_match.group(1).strip() if ans_match else None
        
        concept_match = re.search(r'핵심 개념:\s*([^\n]+)', block_text)
        concept = concept_match.group(1).strip() if concept_match else None

        problems.append({
            "seq": seq,
            "orig_seq": orig_seq,
            "script_id": script_id,
            "problem_num": prob_num,
            "is_match": is_match,
            "is_mismatch": is_mismatch,
            "llm_pred": llm_pred,
            "actual_ans": actual_ans,
            "concept": concept
        })
    return problems

# 1. Parse log.txt (find all 42 initial mismatches)
log_probs = parse_log(log_path)
log_dict = {}
for p in log_probs:
    key = (p["script_id"], p["problem_num"])
    log_dict[key] = p

log_mismatches = [p for p in log_dict.values() if p["is_mismatch"]]
log_mismatches.sort(key=lambda x: x["orig_seq"])

# 2. Parse log_error.txt (find retry results)
err_probs = parse_log(log_err_path)
err_dict = {}
for p in err_probs:
    key = (p["script_id"], p["problem_num"])
    err_dict[key] = p

# 3. Load default.json to get full question details
with open(default_json_path, "r", encoding="utf-8") as f:
    default_data = json.load(f)

script_problems_lookup = {}
if isinstance(default_data, dict):
    scripts_obj = default_data.get("scripts", {})
    if isinstance(scripts_obj, dict):
        for s_id, s_val in scripts_obj.items():
            probs = s_val.get("problems", []) if isinstance(s_val, dict) else []
            for p_idx, prob in enumerate(probs):
                script_problems_lookup[(str(s_id), p_idx + 1)] = prob
    elif isinstance(scripts_obj, list):
        for script_obj in scripts_obj:
            s_id = str(script_obj.get("id") or script_obj.get("fileId") or "")
            probs = script_obj.get("problems", [])
            for p_idx, prob in enumerate(probs):
                script_problems_lookup[(s_id, p_idx + 1)] = prob

print(f"Loaded {len(script_problems_lookup)} problems from default.json")

# Generate mismatch.txt
lines = []
lines.append("=" * 80)
lines.append("📋 [Gemini LLM 문제 풀이 MISMATCH 오답 문제 목록 및 상세 내용]")
lines.append("=" * 80)
lines.append(f"• 총 원본 오답 문제 수: {len(log_mismatches)}개 (전체 1,400 문제 중)")
resolved_count = sum(1 for p in log_mismatches if (p["script_id"], p["problem_num"]) in err_dict and err_dict[(p["script_id"], p["problem_num"])]["is_match"])
still_mismatch_count = len(log_mismatches) - resolved_count
lines.append(f"• 오답 재풀이 성공(일치 극복): {resolved_count}개")
lines.append(f"• 최종 미해결(MISMATCH 유지 / 재풀이 미완료): {still_mismatch_count}개")
lines.append("=" * 80)
lines.append("")

# Section 1: Summary Table
lines.append("--------------------------------------------------------------------------------")
lines.append("📌 [오답 문제 요약 목록]")
lines.append("--------------------------------------------------------------------------------")
lines.append(f"{'번호':<4} | {'전체순번':<8} | {'Script ID':<15} | {'문제#':<6} | {'실제정답':<6} | {'1차예측':<6} | {'2차재풀이':<12} | {'상태'}")
lines.append("-" * 80)

for idx, p in enumerate(log_mismatches, 1):
    key = (p["script_id"], p["problem_num"])
    err_entry = err_dict.get(key)
    
    if err_entry:
        if err_entry["is_match"]:
            retry_res = f"{err_entry['llm_pred']}번(MATCH)"
            status = "✅ 정답 일치 해결"
        elif err_entry["is_mismatch"]:
            retry_res = f"{err_entry['llm_pred']}번(MISMATCH)"
            status = "❌ 불일치 유지"
        else:
            retry_res = "중단"
            status = "⚠️ 재풀이 중단"
    else:
        retry_res = "-"
        status = "⏳ 재풀이 미시도"
        
    lines.append(f"#{idx:<3} | 전체 {p['orig_seq']:<6} | {p['script_id']:<15} | #{p['problem_num']:<5} | {p['actual_ans']:<8} | {p['llm_pred'] if p['llm_pred'] else '?':<8} | {retry_res:<14} | {status}")

lines.append("")
lines.append("=" * 80)
lines.append("📝 [각 오답 문제별 상세 내용 (질문 / 보기 / 실제정답 / 해설 / LLM 예측 및 핵심개념)]")
lines.append("=" * 80)
lines.append("")

for idx, p in enumerate(log_mismatches, 1):
    key = (p["script_id"], p["problem_num"])
    err_entry = err_dict.get(key)
    prob_data = script_problems_lookup.get(key)
    
    # fallback
    if not prob_data:
        for (s_id, p_num), d_prob in script_problems_lookup.items():
            if str(s_id) == str(p["script_id"]) and p_num == p["problem_num"]:
                prob_data = d_prob
                break

    lines.append(f"[{idx}/{len(log_mismatches)}] 📌 전체 {p['orig_seq']}번 | Script: {p['script_id']} | 문제 #{p['problem_num']}")
    if prob_data and prob_data.get("hashtags"):
        lines.append(f"🏷️  해시태그: {' '.join(prob_data['hashtags'])}")
    
    lines.append("-" * 70)
    
    if prob_data:
        q_text = prob_data.get("question", "").strip()
        lines.append(f"❓ [질문]:\n{q_text}")
        
        desc = prob_data.get("description", "").strip()
        if desc:
            lines.append(f"\n📄 [지문/보기상자]:\n{desc}")
            
        choices = prob_data.get("choices", [])
        if choices:
            lines.append("\n🔢 [보기]:")
            for c_idx, choice in enumerate(choices, 1):
                lines.append(f"  {c_idx}) {choice}")
                
        actual_ans = prob_data.get("answer")
        ans_list = prob_data.get("answers", [actual_ans])
        lines.append(f"\n🎯 [실제 정답]: {actual_ans}번 (복수정답 목록: {ans_list})")
    else:
        lines.append(f"❓ [질문]: {p['q_snippet']}")
        lines.append(f"🎯 [실제 정답]: {p['actual_ans']}")
        
    lines.append(f"🤖 [1차 LLM 예측 정답]: {p['llm_pred']}번 -> ❌ MISMATCH (불일치)")
    
    if err_entry:
        if err_entry["is_match"]:
            lines.append(f"🔄 [2차 LLM 오답 재풀이]: {err_entry['llm_pred']}번 -> ✅ MATCH (일치 극복 성공)")
        elif err_entry["is_mismatch"]:
            lines.append(f"🔄 [2차 LLM 오답 재풀이]: {err_entry['llm_pred']}번 -> ❌ MISMATCH (여전히 불일치)")
        if err_entry.get("concept"):
            lines.append(f"🔑 [LLM 핵심 개념]: {err_entry['concept']}")
    elif p.get("concept"):
        lines.append(f"🔑 [LLM 핵심 개념]: {p['concept']}")
        
    if prob_data:
        exp = prob_data.get("explanation", "").strip()
        if exp:
            lines.append(f"\n💡 [전체 해설]:\n{exp}")
            
        choice_exps = prob_data.get("choiceExplanations", [])
        valid_choice_exps = [ce for ce in choice_exps if isinstance(ce, str) and ce.strip()]
        if valid_choice_exps:
            lines.append("\n📌 [보기별 상세 해설]:")
            for ce_idx, ce in enumerate(choice_exps, 1):
                if isinstance(ce, str) and ce.strip():
                    lines.append(f"  {ce_idx}) {ce.strip()}")
                    
    lines.append("")
    lines.append("=" * 80)
    lines.append("")

output_text = "\n".join(lines)

with open(mismatch_txt_path, "w", encoding="utf-8") as f:
    f.write(output_text)

with open(r"d:\github\question-bank\mismatch.txt", "w", encoding="utf-8") as f:
    f.write(output_text)

print(f"Successfully generated mismatch.txt ({len(lines)} lines, {len(log_mismatches)} problems)")
