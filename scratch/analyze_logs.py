import json
import re

log_path = r"d:\github\question-bank\src\api\dummy\log.txt"
log_err_path = r"d:\github\question-bank\src\api\dummy\log_error.txt"
default_json_path = r"d:\github\question-bank\src\api\dummy\default.json"

def parse_log(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Split by problem entry: [123/1400] or [1/42]
    # Regex to find problem blocks
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
        
        q_match = re.search(r'질문:\s*([^\n]+)', block_text)
        q_snippet = q_match.group(1).strip() if q_match else None
        
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
            "q_snippet": q_snippet,
            "concept": concept
        })
    return problems

log_probs = parse_log(log_path)
print(f"Total entries in log.txt: {len(log_probs)}")
log_mismatches = [p for p in log_probs if p["is_mismatch"]]
print(f"Mismatches in log.txt: {len(log_mismatches)}")

err_probs = parse_log(log_err_path)
print(f"Total entries in log_error.txt: {len(err_probs)}")
err_matches = [p for p in err_probs if p["is_match"]]
print(f"Fixed (MATCH) in log_error.txt: {len(err_matches)}")
for em in err_matches:
    print(f"  Fixed: 전체 {em['orig_seq']}번 (Script: {em['script_id']}, #{em['problem_num']})")

err_mismatches = [p for p in err_probs if p["is_mismatch"]]
print(f"Still MISMATCH in log_error.txt: {len(err_mismatches)}")
