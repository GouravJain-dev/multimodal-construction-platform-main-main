import urllib.request
import json
import sys

def test_endpoint(name, url, method='GET', data=None):
    headers = {'Content-Type': 'application/json'} if data else {}
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            resp_body = res.read().decode('utf-8')
            parsed = json.loads(resp_body)
            print(f"[PASS] {res.status} {name}")
            return True
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f"[FAIL] {e.code} {name}: {err_msg}")
        return False
    except Exception as e:
        print(f"[FAIL] Error on {name}: {e}")
        return False

def run_live_tests():
    base = 'http://127.0.0.1:8000/api/v1'
    results = []

    print("--- Testing Live Backend Endpoints on http://127.0.0.1:8000 ---")

    # 1. Health
    results.append(test_endpoint('Health Check', f'{base}/health'))

# 2. Preset Samples
results.append(test_endpoint('Preset Samples', f'{base}/samples'))

# 3. Safety (JSON)
results.append(test_endpoint('Safety JSON Inspection', f'{base}/safety/analyze-json', 'POST', {
    'project_name': 'Skyline Heights Tower B (Commercial Core)',
    'site_zone': 'Scaffolding Zone B - Level 4'
}))

# 4. Crack (JSON)
results.append(test_endpoint('Crack Analysis JSON', f'{base}/crack/analyze-json', 'POST', {
    'structural_element': 'Beam',
    'concrete_grade': 'M25 / 3500 PSI',
    'image_base64': 'demo_beam'
}))

# 5. Planning (Generate)
results.append(test_endpoint('Project Planning (CPM)', f'{base}/planning/generate', 'POST', {
    'project_name': 'Apex Commercial Complex',
    'project_type': 'Commercial',
    'total_built_up_area_sqft': 45000,
    'target_budget_usd': 3200000,
    'target_duration_months': 14,
    'location': 'Dallas, TX',
    'soil_condition': 'Standard Clay',
    'floors': 4
}))

# 6. Valuation (Calculate)
results.append(test_endpoint('Real Estate Valuation', f'{base}/valuation/calculate', 'POST', {
    'property_type': 'Residential High-Rise',
    'built_up_area_sqft': 2400,
    'construction_quality': 'Premium',
    'location_tier': 'Prime Urban Core',
    'amenities': ['Underground Parking', 'Swimming Pool'],
    'bedrooms': 3,
    'bathrooms': 3,
    'age_years': 0,
    'land_area_sqft': 2880
}))

# 7. Daily Log (Process)
results.append(test_endpoint('Daily Log Assistant', f'{base}/daily-log/process', 'POST', {
    'date': '2026-10-19',
    'supervisor_name': 'Marcus Vance',
    'workforce_headcount': 34,
    'weather_observed': 'Clear, 28°C',
    'raw_field_notes': 'Poured 120 cu.yd concrete. Transit mixer delayed 1.5 hrs. Fixed scaffold wire.'
}))

# 8. Weather Advisory
results.append(test_endpoint('Weather Advisory Triage', f'{base}/weather/advisory', 'POST', {
    'temperature_c': 36.5,
    'humidity_pct': 32,
    'precipitation_chance_pct': 10,
    'wind_speed_kmh': 28,
    'uv_index': 9,
    'scheduled_trades': ['Concrete Pouring & Curing', 'Tower Crane & Aerial Hoists']
}))

# 9. Knowledge Assistant (Chat)
results.append(test_endpoint('Knowledge Chat Assistant', f'{base}/chat/message', 'POST', {
    'message': 'What is the minimum curing period for OPC concrete according to ACI 308?',
    'conversation_history': []
}))

# 10. Multipart Image Upload - Safety
try:
    import io
    from PIL import Image
    test_img = Image.new('RGB', (300, 200), color=(60, 70, 80))
    buf = io.BytesIO()
    test_img.save(buf, format='JPEG')
    img_data = buf.getvalue()

    boundary = '----WebKitFormBoundaryX9Y8Z7A6B5C4'
    mp_body = (
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="file"; filename="safety_test.jpg"\r\n'
        'Content-Type: image/jpeg\r\n\r\n'
    ).encode('utf-8') + img_data + (
        f'\r\n--{boundary}\r\n'
        'Content-Disposition: form-data; name="project_name"\r\n\r\n'
        'Upload Project Test\r\n'
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="site_zone"\r\n\r\n'
        'Zone C\r\n'
        f'--{boundary}--\r\n'
    ).encode('utf-8')

    req_mp = urllib.request.Request(
        f'{base}/safety/analyze',
        data=mp_body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST'
    )
    with urllib.request.urlopen(req_mp, timeout=10) as res_mp:
        print(f"[PASS] {res_mp.status} Safety Multipart Upload")
        results.append(True)
except Exception as e:
    print(f"[FAIL] Safety Multipart Upload: {e}")
    results.append(False)

# 11. Multipart Image Upload - Crack
try:
    boundary = '----WebKitFormBoundaryC4D5E6F7'
    crack_body = (
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="file"; filename="crack_test.jpg"\r\n'
        'Content-Type: image/jpeg\r\n\r\n'
    ).encode('utf-8') + img_data + (
        f'\r\n--{boundary}\r\n'
        'Content-Disposition: form-data; name="structural_element"\r\n\r\n'
        'Beam\r\n'
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="concrete_grade"\r\n\r\n'
        'M25 / 3500 PSI\r\n'
        f'--{boundary}--\r\n'
    ).encode('utf-8')

    req_crack_mp = urllib.request.Request(
        f'{base}/crack/analyze',
        data=crack_body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST'
    )
    with urllib.request.urlopen(req_crack_mp, timeout=10) as res_crack_mp:
        print(f"[PASS] {res_crack_mp.status} Crack Multipart Upload")
        results.append(True)
except Exception as e:
    print(f"[FAIL] Crack Multipart Upload: {e}")
    results.append(False)

passed = sum(1 for r in results if r)
total = len(results)
print(f"\nSummary: {passed}/{total} endpoints passed.")
sys.exit(0 if passed == total else 1)
