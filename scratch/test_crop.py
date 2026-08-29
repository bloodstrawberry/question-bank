from PIL import Image

img = Image.open("scratch/test_pages/page_1.png")
w, h = img.size

boxes = [
  {
    "question_number": 1,
    "box_2d": [151, 58, 517, 484]
  },
  {
    "question_number": 2,
    "box_2d": [546, 58, 928, 484]
  },
  {
    "question_number": 3,
    "box_2d": [151, 510, 502, 942]
  },
  {
    "question_number": 4,
    "box_2d": [528, 510, 928, 942]
  }
]

import os
os.makedirs("scratch/test_crops", exist_ok=True)
for item in boxes:
    q_num = item["question_number"]
    ymin, xmin, ymax, xmax = item["box_2d"]
    # 0~1000 scale
    crop_box = (
        int(xmin / 1000.0 * w),
        int(ymin / 1000.0 * h),
        int(xmax / 1000.0 * w),
        int(ymax / 1000.0 * h)
    )
    cropped = img.crop(crop_box)
    out_path = f"scratch/test_crops/q_{q_num}.png"
    cropped.save(out_path)
    print(f"Saved {out_path} size: {cropped.size}")
