from app.models.trip import Trip

def calculate_safety_score(trip: Trip):
    score = 100

    # =========================
    # SAFETY: SPEED CHECK
    # =========================
    speed = trip.average_speed or 0

    if speed > 120:
        score -= 30
    elif speed > 100:
        score -= 20
    elif speed > 80:
        score -= 10

    # =========================
    # SAFETY: DISTANCE FATIGUE
    # =========================
    distance = trip.distance_km or 0

    if distance > 500:
        score -= 20
    elif distance > 300:
        score -= 10

    # =========================
    # FINAL CLAMP (IMPORTANT)
    # =========================
    score = max(0, min(score, 100))

    # =========================
    # RISK LEVEL
    # =========================
    if score >= 90:
        risk = "SAFE"
    elif score >= 70:
        risk = "LOW"
    elif score >= 50:
        risk = "MEDIUM"
    elif score >= 30:
        risk = "HIGH"
    else:
        risk = "CRITICAL"

    return {
        "score": score,
        "risk": risk
    }