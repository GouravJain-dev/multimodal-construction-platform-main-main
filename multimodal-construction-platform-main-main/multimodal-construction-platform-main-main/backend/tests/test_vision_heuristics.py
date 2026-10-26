import pytest
import sys
import os
import importlib.util

# Explicitly import root app.py to avoid colliding with backend/app package
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
app_path = os.path.join(ROOT_DIR, "app.py")
spec = importlib.util.spec_from_file_location("root_streamlit_app", app_path)
root_app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(root_app)

def test_iou_calculation_and_person_deduplication():
    """Verify that bounding box overlap correctly calculates IoU and eliminates duplicate phantom detections."""
    # Two identical boxes (100% overlap)
    box_a = [350, 248, 600, 372]
    box_b = [355, 250, 605, 375]
    
    iou = root_app.calculate_iou(box_a, box_b)
    assert iou > 0.85, f"Expected high IoU for nearly identical boxes, got {iou}"

    # Non-overlapping boxes
    box_c = [100, 100, 200, 200]
    box_d = [500, 500, 600, 600]
    assert root_app.calculate_iou(box_c, box_d) == 0.0

    # NMS Deduplication: 3 detections representing 2 real workers (W1 duplicated)
    raw_persons = [
        {"category": "person", "box_2d": [350, 248, 600, 372], "confidence": 0.95},
        {"category": "person", "box_2d": [352, 250, 598, 370], "confidence": 0.80}, # Duplicate of W1
        {"category": "person", "box_2d": [460, 138, 695, 273], "confidence": 0.92}  # W2 distinct
    ]
    deduped = root_app.deduplicate_person_detections(raw_persons, iou_threshold=0.35)
    assert len(deduped) == 2, f"Expected exactly 2 workers after NMS deduplication, got {len(deduped)}"

def test_canonical_osha_hazard_registry():
    """Verify OSHA standard lookup consistency across Subpart L, Subpart M, and Subpart E."""
    registry = root_app.OSHA_HAZARD_REGISTRY
    
    # Scaffold Fall Protection
    assert registry["scaffold_no_fall_arrest"]["standard"] == "OSHA 1926.451(g)(1)"
    assert registry["scaffold_no_fall_arrest"]["severity"] == "Critical"
    assert "Subpart L" in registry["scaffold_no_fall_arrest"]["subpart"]
    
    # Scaffold Guardrail System
    assert registry["scaffold_missing_guardrail"]["standard"] == "OSHA 1926.451(g)(4)(i)"
    assert registry["scaffold_missing_guardrail"]["is_scene_level"] is True
    
    # Head Protection
    assert registry["ppe_no_hardhat"]["standard"] == "OSHA 1926.100(a)"
    assert registry["ppe_unverified"]["standard"] == "OSHA 1926.100"

def test_scene_level_finding_suppression():
    """Verify that scene-level guardrail findings are suppressed from drawing to eliminate spatial variance."""
    raw_data = {
        "scene_type": "construction_active",
        "detections": [
            {"category": "person", "box_2d": [350, 248, 600, 372], "hazard_key": "scaffold_no_fall_arrest"},
            {"category": "person", "box_2d": [460, 138, 695, 273], "hazard_key": "scaffold_no_fall_arrest"},
            {"category": "hazard", "box_2d": [100, 100, 200, 200], "hazard_key": "scaffold_missing_guardrail"}
        ]
    }
    audit = root_app.build_unified_audit_findings(raw_data)
    
    # Total hazards must be 3 (2 workers + 1 scene guardrail finding)
    assert len(audit["hazards"]) == 3
    
    # Drawable detections must contain ONLY the 2 physical workers (scaffold box suppressed)
    assert len(audit["all_detections"]) == 2
    for det in audit["all_detections"]:
        assert det["category"] == "person"
        assert det.get("is_scene_level") is not True

def test_empty_scaffold_zero_hazards():
    """Verify that an unoccupied scaffold structure reports 0 active fall hazards and 0 risk score."""
    raw_empty = {
        "scene_type": "construction_empty",
        "detections": []
    }
    audit = root_app.build_unified_audit_findings(raw_empty)
    assert audit["workers_detected"] == 0
    assert len(audit["hazards"]) == 0
    assert audit["hazard_score"] == 0
    assert audit["fall_risk_pct"] == 0
    assert audit["ppe_status_text"] == "N/A"

def test_compliant_ground_worker():
    """Verify that a compliant worker on stable grade reports 100% PPE pass and low baseline score."""
    raw_compliant = {
        "scene_type": "construction_active",
        "ppe_status": "compliant",
        "detections": [
            {
                "category": "person",
                "hazard_key": "worker_compliant",
                "severity": "OK",
                "short_label": "Worker 1 · PPE Compliant",
                "box_2d": [300, 300, 700, 500]
            }
        ]
    }
    audit = root_app.build_unified_audit_findings(raw_compliant)
    assert audit["workers_detected"] == 1
    assert len(audit["hazards"]) == 0
    assert audit["hazard_score"] == 12
    assert audit["fall_risk_pct"] == 10
    assert "100% Pass" in audit["ppe_status_text"]

def test_non_construction_scene():
    """Verify that a non-construction scene returns 'Unable to assess' and 0 hazards."""
    raw_non_con = {
        "scene_type": "non_construction",
        "detections": []
    }
    audit = root_app.build_unified_audit_findings(raw_non_con)
    assert audit["scene_type"] == "non_construction"
    assert audit["workers_detected"] == 0
    assert len(audit["hazards"]) == 0
    assert audit["hazard_score"] == 0
    assert audit["fall_risk_pct"] == 0
    assert "Unable to assess" in audit["ppe_status_text"]
    assert "Unable to assess" in audit["actions"][0]

def test_bbox_normalization_inverted_and_scale_invariants():
    """Verify that bounding box normalization safely handles inverted coordinates, 1000-scale pixels, dict schemas, and degenerate inputs."""
    # Inverted coordinates: ymax before ymin, xmax before xmin
    inverted_box = [600, 372, 350, 248]
    y1, x1, y2, x2 = root_app.normalize_bbox(inverted_box)
    assert y1 < y2 and x1 < x2, "Normalized coordinates must satisfy y1 < y2 and x1 < x2"
    assert (y1, x1, y2, x2) == (0.35, 0.248, 0.60, 0.372)

    # Dictionary schema with x, y, width, height in 1000-scale
    dict_box = {"x": 100, "y": 200, "w": 300, "h": 400}
    dy1, dx1, dy2, dx2 = root_app.normalize_bbox(dict_box)
    assert dy1 == pytest.approx(0.2) and dx1 == pytest.approx(0.1)
    assert dy2 == pytest.approx(0.6) and dx2 == pytest.approx(0.4)

    # Degenerate / invalid inputs return safe fallback tuple without raising exceptions
    assert len(root_app.normalize_bbox(None)) == 4
    assert len(root_app.normalize_bbox([])) == 4
    assert len(root_app.normalize_bbox("invalid_string")) == 4

def test_dense_cluster_person_deduplication():
    """Verify that Non-Maximum Suppression collapses a dense cluster of 10 overlapping candidate proposals to exactly 1 distinct worker."""
    dense_proposals = [
        {"category": "person", "box_2d": [350 + i, 250 + i, 600 + i, 370 + i], "confidence": 0.90 - (i * 0.01)}
        for i in range(10)
    ]
    deduped = root_app.deduplicate_person_detections(dense_proposals, iou_threshold=0.35)
    assert len(deduped) == 1, f"Dense cluster of 10 overlapping boxes must collapse to 1 worker, got {len(deduped)}"

def test_hallucinated_hazard_key_graceful_fallback():
    """Verify that hallucinated or unrecognized hazard keys from the multimodal model map safely to canonical OSHA taxonomy without raising KeyError."""
    raw_hallucinated = {
        "scene_type": "construction_active",
        "detections": [
            {
                "category": "person",
                "box_2d": [350, 248, 600, 372],
                "hazard_key": "hallucinated_worker_fall_key",
                "observation": "worker at height without lanyard"
            },
            {
                "category": "hazard",
                "box_2d": [100, 100, 200, 200],
                "hazard_key": "hallucinated_edge_key",
                "short_label": "perimeter guardrail missing"
            }
        ]
    }
    audit = root_app.build_unified_audit_findings(raw_hallucinated)
    assert len(audit["hazards"]) == 2
    # Verify fallback mapped to valid registry keys
    assert audit["hazards"][0]["hazard_key"] in root_app.OSHA_HAZARD_REGISTRY
    assert audit["hazards"][1]["hazard_key"] in root_app.OSHA_HAZARD_REGISTRY
    assert audit["hazards"][0]["osha_standard"] == "OSHA 1926.451(g)(1)"
    assert audit["hazards"][1]["osha_standard"] == "OSHA 1926.451(g)(4)(i)"

def test_corrupted_and_none_input_resilience():
    """Verify that None, empty dicts, or corrupted model strings gracefully trigger the calibrated fallback audit with zero exceptions."""
    for corrupted in [None, {}, "corrupted_json_string", []]:
        audit = root_app.build_unified_audit_findings(corrupted)
        assert isinstance(audit, dict)
        assert audit["hazard_score"] == 88
        assert audit["fall_risk_pct"] == 90
        assert audit["workers_detected"] == 2
        assert len(audit["hazards"]) == 3
        assert len(audit["actions"]) == 3

def test_subpart_l_exclusion_from_subpart_m():
    """Verify jurisdictional hierarchy: scaffold fall protection is governed under Subpart L (§ 1926.451), excluded from Subpart M per § 1926.500(a)(2)(i)."""
    reg = root_app.OSHA_HAZARD_REGISTRY
    assert reg["scaffold_no_fall_arrest"]["standard"] == "OSHA 1926.451(g)(1)"
    assert "Subpart L" in reg["scaffold_no_fall_arrest"]["subpart"]
    assert reg["scaffold_missing_guardrail"]["standard"] == "OSHA 1926.451(g)(4)(i)"
    # High-vis head protection is under Subpart E
    assert reg["ppe_no_hardhat"]["standard"] == "OSHA 1926.100(a)"
    assert "Subpart E" in reg["ppe_no_hardhat"]["subpart"]

def test_deterministic_scoring_monotonicity():
    """Verify deterministic scoring monotonicity: higher infraction counts yield equal or higher hazard scores."""
    score_empty_hz, score_empty_fall = root_app.calculate_deterministic_scores("construction_empty", 0, [])
    assert (score_empty_hz, score_empty_fall) == (0, 0)

    score_compliant_hz, score_compliant_fall = root_app.calculate_deterministic_scores("construction_active", 1, [])
    assert (score_compliant_hz, score_compliant_fall) == (12, 10)

    one_crit_worker = [{"category": "person", "severity": "Critical"}]
    one_crit_scaffold = [{"category": "hazard", "severity": "Critical"}]
    score_1w_1s_hz, score_1w_1s_fall = root_app.calculate_deterministic_scores("construction_active", 1, one_crit_worker + one_crit_scaffold)
    assert (score_1w_1s_hz, score_1w_1s_fall) == (84, 85)

    two_crit_workers = [{"category": "person", "severity": "Critical"}, {"category": "person", "severity": "Critical"}]
    score_2w_1s_hz, score_2w_1s_fall = root_app.calculate_deterministic_scores("construction_active", 2, two_crit_workers + one_crit_scaffold)
    assert (score_2w_1s_hz, score_2w_1s_fall) == (88, 90)

    # Monotonicity checks
    assert score_empty_hz < score_compliant_hz < score_1w_1s_hz <= score_2w_1s_hz
    assert score_empty_fall < score_compliant_fall < score_1w_1s_fall <= score_2w_1s_fall

def test_actions_protocol_generation():
    """Verify that findings generate the mandatory 3-step prioritized corrective action protocol."""
    raw_active = {
        "scene_type": "construction_active",
        "detections": [
            {"category": "person", "box_2d": [350, 248, 600, 372], "hazard_key": "scaffold_no_fall_arrest"}
        ]
    }
    audit = root_app.build_unified_audit_findings(raw_active)
    actions = audit["actions"]
    assert len(actions) == 3
    assert actions[0].startswith("01 [IMMEDIATE ACTION]")
    assert actions[1].startswith("02 [ENGINEERING FIX]")
    assert actions[2].startswith("03 [DOCUMENTATION & RE-INSPECTION]")

def test_unattended_scaffold_hazard_suppression():
    """Verify that if no workers are present, scaffold structural hazards do not trigger active fall violation penalization."""
    raw_unattended_scaffold = {
        "scene_type": "construction_active",
        "detections": [
            {"category": "hazard", "box_2d": [100, 100, 200, 200], "hazard_key": "scaffold_missing_guardrail"}
        ]
    }
    audit = root_app.build_unified_audit_findings(raw_unattended_scaffold)
    # Since total_workers is 0, no active workers are exposed to the unguarded edge
    assert audit["workers_detected"] == 0
    assert len(audit["hazards"]) == 0
    assert audit["hazard_score"] == 0
