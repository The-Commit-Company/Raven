import json
import re
import emoji
import html
import unicodedata
import frappe
from bs4 import BeautifulSoup
from linkpreview import Link, LinkGrabber, LinkPreview, link_preview

def handle_emojis(text):
    if text:
        # Decode HTML entities
        text = html.unescape(text)
        # Normalize text to NFC (Normalization Form C)
        text = unicodedata.normalize('NFC', text)
        # Replace emoji codes with corresponding emojis
        text = emoji.emojize(text)
    return text

def fetch_link_preview(url):
    grabber = LinkGrabber()
    content, url_fetched = grabber.get_content(url)
    soup = BeautifulSoup(content, 'html.parser')
    title = soup.title.string if soup.title else ""
    description = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
    description = description['content'] if description else ""
    image = soup.find('meta', attrs={'property': 'og:image'}) or soup.find('meta', attrs={'name': 'twitter:image'})
    image = image['content'] if image else ""
    site_name = soup.find('meta', attrs={'property': 'og:site_name'}) or soup.find('meta', attrs={'name': 'twitter:site'})
    site_name = site_name['content'] if site_name else ""

    return {
        'title': title,
        'description': description,
        'image': image,
        'site_name': site_name
    }

@frappe.whitelist(methods=["GET"])
def get_preview_link(urls):

    empty_data = {
        "title": "",
        "description": "",
        "image": "",
        "force_title": "",
        "absolute_image": "",
        "site_name": "",
    }
    message_links = []

    if urls and urls != "[]":
        urls = json.loads(urls)

        for url in urls:
            data = frappe.cache().get_value(url)
            if data is None:
                # Don't try to preview insecure links like IP addresses
                if (
                    url.startswith("mailto")
                    or url.startswith("tel")
                    or re.match(r"http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.*", url)
                    or re.match(r"https://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.*", url)
                    or re.match(r"http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", url)
                    or re.match(r"https://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", url)
                ):
                    data = empty_data
                else:
                    preview = None
                    try:
                        # If this is a Twitter/X URL, then we need to fetch the preview from the Twitter API
                        if "twitter.com" in url or "x.com" in url:
                            grabber = LinkGrabber()
                            content, url_fetched = grabber.get_content(url, headers="imessagebot")
                            link = Link(url_fetched, content)
                            preview = LinkPreview(link)
                        else:
                            preview = fetch_link_preview(url)
                    except Exception:
                        preview = None
                        pass
                    if preview is None:
                        data = empty_data
                    else:
                        title = handle_emojis(preview['title'])
                        description = handle_emojis(preview['description'])
                        image = preview['image']
                        site_name = preview['site_name']

                        data = {
                            "title": title,
                            "description": description,
                            "image": image,
                            "force_title": "",
                            "absolute_image": "",
                            "site_name": site_name,
                        }
                    frappe.cache().set_value(url, data)
            message_links.append(data)

    frappe.local.response.json = json.dumps(message_links, ensure_ascii=False)
    return message_links

@frappe.whitelist(methods=["POST"])
def hide_link_preview(message_id: str):
    """
    Remove the preview from the message
    """
    message = frappe.get_doc("Raven Message", message_id)
    message.flags.ignore_permissions = True
    message.hide_link_preview = 1
    message.save()
