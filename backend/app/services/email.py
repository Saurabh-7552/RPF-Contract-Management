import os
from abc import ABC, abstractmethod
from typing import Optional

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


class EmailService(ABC):
    @abstractmethod
    def send(self, *, to_email: str, subject: str, html_content: str) -> None:  # pragma: no cover - IO
        ...


class ConsoleEmailService(EmailService):
    def send(self, *, to_email: str, subject: str, html_content: str) -> None:  # pragma: no cover - IO
        print(f"[Email DEV] to={to_email} subject={subject}\n{html_content}")


class SendGridEmailService(EmailService):
    def __init__(self, api_key: str) -> None:
        self.client = SendGridAPIClient(api_key)

    def send(self, *, to_email: str, subject: str, html_content: str) -> None:  # pragma: no cover - IO
        message = Mail(from_email=os.getenv("SENDGRID_FROM", "no-reply@example.com"), to_emails=to_email, subject=subject, html_content=html_content)
        self.client.send(message)


def get_email_service() -> EmailService:
    api_key = os.getenv("SENDGRID_KEY")
    if api_key:
        return SendGridEmailService(api_key)
    return ConsoleEmailService()






