def send_email(alert):
    print("📧 EMAIL SENT:", alert.id, "-", alert.escalated_to)


def send_sms(alert):
    print("📱 SMS SENT:", alert.id, "-", alert.escalated_to)


def send_whatsapp(alert):
    print("💬 WHATSAPP SENT:", alert.id, "-", alert.escalated_to)