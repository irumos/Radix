import requests
from shared.config import settings

def inspect_schema():
    url = f"{settings.SUPABASE_URL}/rest/v1/"
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}"
    }
    try:
        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            spec = res.json()
            print("=== EXPOSED TABLES & VIEWS ===")
            definitions = spec.get("definitions", {})
            for table_name in definitions.keys():
                cols = list(definitions[table_name].get("properties", {}).keys())
                print(f"Table: {table_name}")
                print(f"  Columns: {cols}")
        else:
            print(f"Error fetching schema: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    inspect_schema()
