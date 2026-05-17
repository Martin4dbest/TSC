from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="tsc-app")

def get_address(lat: float, lon: float):
    try:
        location = geolocator.reverse((lat, lon), language="en")
        return location.address if location else "Unknown address"
    except:
        return "Unknown address"