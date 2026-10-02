"""Submit the sitemap to Search Console (needs a service account with full permission on the property)."""
import os
import sys

from google.oauth2 import service_account
from googleapiclient.discovery import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_URL = os.environ.get("GSC_SITE_URL", "")
SITEMAP = os.environ.get("SITEMAP_URL", "")
if not SITE_URL or not SITEMAP:
    sys.exit("GSC_SITE_URL and SITEMAP_URL are required")

creds = service_account.Credentials.from_service_account_file(
    os.path.join(ROOT, "gsc-credentials.json"),
    scopes=["https://www.googleapis.com/auth/webmasters"],
)
service = build("searchconsole", "v1", credentials=creds)
service.sitemaps().submit(siteUrl=SITE_URL, feedpath=SITEMAP).execute()
print("submitted", SITEMAP, "to", SITE_URL)
for s in service.sitemaps().list(siteUrl=SITE_URL).execute().get("sitemap", []):
    print(s.get("path"), "| lastSubmitted:", s.get("lastSubmitted"), "| errors:", s.get("errors"), "| warnings:", s.get("warnings"))
