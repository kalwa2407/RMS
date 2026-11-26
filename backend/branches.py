"""
Persian Darbar outlets: the Porter pickup point for each branch.

Mumbai entries mirror PERSIAN_DARBAR_BRANCHES in frontend/src/pages/customer/customerAssets.js.
Pune keeps the values porter_service.py already used (RESTAURANT_* env vars) so existing Pune
bookings don't change. Verify every pin and phone on Google Maps before going live with Porter:
the rider is sent to exactly these coordinates.
"""

import os
from typing import Any, Dict, Optional

BRANCHES: Dict[str, Dict[str, Any]] = {
    "pune": {
        "name": "Persian Darbar - Camp, Pune",
        "lat": float(os.environ.get("RESTAURANT_LAT", "18.519514")),
        "lng": float(os.environ.get("RESTAURANT_LNG", "73.874114")),
        "address": os.environ.get("RESTAURANT_ADDRESS", "Wellesley Rd, Camp, Pune, Maharashtra 411001"),
        "phone": os.environ.get("RESTAURANT_PHONE", "+919594287868"),
    },
    "bandra": {
        "name": "Persian Darbar - Bandra",
        "lat": 19.0550, "lng": 72.8360,
        "address": "Moray Mahal, Linking Road, Bandra West, Mumbai 400050",
        "phone": "+919892957741",
    },
    "andheri": {
        "name": "Persian Darbar - Andheri East",
        "lat": 19.1130, "lng": 72.8796,
        "address": "Times Square Building, B-3, Andheri-Kurla Road, Marol, Andheri (E), Mumbai 400059",
        "phone": "+918779919652",
    },
    "kurla": {
        "name": "Persian Darbar - Kurla West",
        "lat": 19.0700, "lng": 72.8800,
        "address": "No.17, Kanakia Zillion, L.B.S Marg, CST Road Junction, Kurla West, Mumbai 400070",
        "phone": "+919167510547",
    },
}


def pickup_for_branch(branch_id: Optional[str]) -> Optional[Dict[str, Any]]:
    """Pickup details for an order's branch, or None if the branch is unknown."""
    return BRANCHES.get(str(branch_id or "").strip().lower())


def pickup_for_order(order: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    return pickup_for_branch(order.get("branch_id") or order.get("branch"))
