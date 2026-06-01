import urllib.request, json, random

def api(method, path, body=None, token=None):
    url = f"http://localhost:8000{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read())

# Login
swz = api("POST", "/api/auth/login", body={"username": "Shenwei Zhang", "password": "swz123"})
st = swz["access_token"]
ly = api("POST", "/api/auth/login", body={"username": "Liye Fu", "password": "lyf123"})
lt = ly["access_token"]
jy = api("POST", "/api/auth/login", body={"username": "Jiying Yin", "password": "jyy123"})
mt = jy["access_token"]

# Delete all existing
print("Deleting all bills...")
bills = api("GET", "/api/billing/recent?page=0&page_size=10000", token=mt)
for b in bills["items"]:
    api("DELETE", f"/api/billing/delete?bill_id={b['id']}", token=mt)
print(f"Deleted {bills['total']} bills.\n")

# 3 weeks: Week1=6/1-6/7, Week2=6/8-6/14, Week3=6/15-6/21
# For each week, generate varied data
weekday_names = ["周一","周二","周三","周四","周五","周六","周日"]

lunch_range = (18, 42)
dinner_range = (28, 55)

count = 0
for week_start in [1, 8, 15]:
    for offset in range(7):
        day = week_start + offset
        month = 6
        date_str = f"06.{day:02d}"
        # Each person: Shenwei Zhang and Liye Fu
        # Lunch: 70% chance, Dinner: 60% chance
        for name, token in [("Shenwei Zhang", st), ("Liye Fu", lt)]:
            if random.random() < 0.75:
                amt = random.randint(*lunch_range)
                api("POST", "/api/billing/add", body={"original_amount": amt, "dining_type": "lunch"}, token=token)
                count += 1
            if random.random() < 0.65:
                amt = random.randint(*dinner_range)
                api("POST", "/api/billing/add", body={"original_amount": amt, "dining_type": "dinner"}, token=token)
                count += 1
    print(f"Week starting 6/{week_start}: added bills")

print(f"\nTotal bills added: {count}")

# Now fix created_at dates
import asyncio
from server.store.database import get_db
from server.store.schema.bill import Bill
from sqlalchemy import select, update
from datetime import datetime

async def fix_dates():
    async for db in get_db():
        result = await db.execute(select(Bill).order_by(Bill.created_at.asc()))
        all_bills = result.scalars().all()

        # Assign dates: for each week, assign bills round-robin to each day
        week_configs = [
            (1, 7, 12, 10, 0),   # week 1: 6/1-6/7
            (8, 14, 10, 11, 0),  # week 2: 6/8-6/14
            (15, 21, 10, 11, 0), # week 3: 6/15-6/21
        ]

        bill_idx = 0
        for week_start, week_end, lunch_hour, dinner_hour, minute in week_configs:
            week_bills = [b for b in all_bills if b.created_at.month == 6 and b.created_at.day >= 15] if week_start == 15 else (
                [b for b in all_bills if b.created_at.month == 6 and b.created_at.day >= 8 and b.created_at.day < 15] if week_start == 8 else
                [b for b in all_bills if b.created_at.month == 6 and b.created_at.day < 8]
            )

            # Actually let's just assign directly by index
            pass

        # Simpler approach: just interleave days
        bill_list = list(all_bills)
        bill_list.sort(key=lambda b: (b.user_id, b.dining_type))

        lunch_idx = {}
        dinner_idx = {}

        for b in bill_list:
            key = b.user_id
            if b.dining_type == "lunch":
                lunch_idx[key] = lunch_idx.get(key, 0) + 1
            else:
                dinner_idx[key] = dinner_idx.get(key, 0) + 1

        # Distribute across 21 days
        # Each user, each meal type: count how many bills we have
        users = {}
        for b in bill_list:
            uid = b.user_id
            if uid not in users:
                users[uid] = {"lunch": [], "dinner": []}
            users[uid][b.dining_type].append(b)

        # Assign randomly across 21 days with some clustering
        random.seed(42)
        for uid, meals in users.items():
            day_pool = list(range(1, 22))  # 6/1 to 6/21
            for meal_type, bills in meals.items():
                # Pick N random days
                days = sorted(random.sample(day_pool, min(len(bills), len(day_pool))))
                for i, b in enumerate(bills):
                    if i < len(days):
                        d = days[i]
                        month = 6
                        hour = 12 if meal_type == "lunch" else 18
                        minute = random.randint(0, 59)
                        dt = datetime(2026, month, d, hour, minute, 0)
                        await db.execute(update(Bill).where(Bill.id == b.id).values(created_at=dt))
                        wd = (d - 1) % 7
                        wd_name = ["周一","周二","周三","周四","周五","周六","周日"][wd]
                        user_name = "SWZ" if uid else "LY"
                        print(f"  {d:02d} {wd_name} | {meal_type} | ¥{b.original_amount}")

        await db.commit()
    print("done")

asyncio.run(fix_dates())
