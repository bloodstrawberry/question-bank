import os
import json
import glob

base_dir = r"d:\github\question-bank\macro\real-estate"
years = ["2019_30", "2020_31", "2021_32", "2022_33", "2023_34", "2024_35", "2025_36"]
sessions = [("1_1", 80), ("2_1", 80), ("2_2", 40)]

total_folders = 0
total_questions = 0
total_images = 0
errors = []

print("=" * 85)
print(f"| {'Exam Target':<18} | {'Target':<6} | {'Manifest':<10} | {'Full':<6} | {'Quest':<6} | {'Choice':<6} | {'Status':<8} |")
print("=" * 85)

for year in years:
    for sub, expected in sessions:
        folder_name = f"{year}_{sub}"
        folder_path = os.path.join(base_dir, year, folder_name)
        total_folders += 1

        if not os.path.exists(folder_path):
            errors.append(f"{folder_name}: folder does not exist")
            print(f"| {folder_name:<18} | {expected:<6} | {'MISSING':<10} | 0      | 0      | 0      | FAILED   |")
            continue

        manifest_p = os.path.join(folder_path, "manifest.json")
        manifest_count = 0
        missing_q = []
        if os.path.exists(manifest_p):
            try:
                with open(manifest_p, "r", encoding="utf-8") as f:
                    m = json.load(f)
                manifest_count = m.get("total_extracted", len(m.get("questions", [])))
                missing_q = m.get("missing_questions", [])
            except Exception as e:
                errors.append(f"{folder_name} manifest parse error: {e}")

        full_imgs = glob.glob(os.path.join(folder_path, "*_full_image.png"))
        q_imgs = glob.glob(os.path.join(folder_path, "*_question.png"))
        c_imgs = glob.glob(os.path.join(folder_path, "*_choices.png"))

        c_full = len(full_imgs)
        c_q = len(q_imgs)
        c_c = len(c_imgs)

        total_questions += manifest_count
        total_images += (c_full + c_q + c_c)

        is_ok = (
            manifest_count == expected
            and c_full == expected
            and c_q == expected
            and c_c == expected
            and len(missing_q) == 0
        )
        status = "OK (100%)" if is_ok else "INCOMPLETE"
        if not is_ok:
            errors.append(
                f"{folder_name}: expected {expected}, got manifest={manifest_count}, full={c_full}, q={c_q}, c={c_c}, missing={missing_q}"
            )

        print(f"| {folder_name:<18} | {expected:<6} | {manifest_count:<10} | {c_full:<6} | {c_q:<6} | {c_c:<6} | {status:<8} |")

print("=" * 85)
print(f"Total Target Folders: {total_folders} / 21")
print(f"Total Extracted Questions: {total_questions} / 1400")
print(f"Total Saved Image Files: {total_images} / 4200")
if errors:
    print(f"Errors Found ({len(errors)}):")
    for e in errors:
        print("  -", e)
else:
    print("SUCCESS: 100% of all questions and images across all 21 exams are present and verified!")
print("=" * 85)
