from app.models.trip import Trip


def calculate_safety_score(trip: Trip):
    score = 100

    # SPEED CHECK
    if trip.average_speed > 120:
        score -= 30
    elif trip.average_speed > 100:
        score -= 20
    elif trip.average_speed > 80:
        score -= 10

    # DISTANCE FATIGUE
    if trip.distance_km > 500:
        score -= 20
    elif trip.distance_km > 300:
        score -= 10

    # RISK LEVEL
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