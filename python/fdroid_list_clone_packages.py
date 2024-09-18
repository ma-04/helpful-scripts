import argparse
import os
import requests  # Add this line to import the requests module
from urllib.parse import urlparse, urljoin
import xml.etree.ElementTree as ET  # This import is necessary for parsing XML

parser = argparse.ArgumentParser(description="List or clone F-Droid repository apps.")
parser.add_argument("repo_url", help="The base URL of the F-Droid repository")
parser.add_argument("--clone", action="store_true", help="(Optional) Download all APKs into a folder with the repo name")
args = parser.parse_args()

def download_apk(download_url, folder_path):
    apk_name = download_url.split('/')[-1]
    full_path = os.path.join(folder_path, apk_name)
    response = requests.get(download_url, stream=True)
    with open(full_path, 'wb') as file:
        for chunk in response.iter_content(chunk_size=128):
            file.write(chunk)
    print(f"Downloaded {apk_name} to {folder_path}")

def list_fdroid_apps(repo_url, clone=False):
    base_repo_url = repo_url.split('?')[0]
    
    # Step 2: Ensure the URL ends with a slash
    if not base_repo_url.endswith('/'):
        base_repo_url = base_repo_url + '/'
    
    # Step 3: Append 'index.xml' to the base URL
    repo_url_with_index = base_repo_url + 'index.xml'

    try:
        response = requests.get(repo_url_with_index)
        response.raise_for_status()
        #print(response.text)  # Temporarily print the XML content to verify its structure
        root = ET.fromstring(response.content)  # Use response.text instead of response.content
        repo_name = urlparse(repo_url).netloc  # Extract repo name from URL

        if clone:
            folder_path = os.path.join(os.getcwd(), repo_name)
            if not os.path.exists(folder_path):
                os.makedirs(folder_path)

        for application in root.findall(".//application"):
            app_name_element = application.find('name')
            latest_package_element = application.find('.//package[1]')  # Correct XPath to find the first package element
            if app_name_element is not None and latest_package_element is not None:
                app_name = app_name_element.text.strip()  # Clean app name text
                apk_name_element = latest_package_element.find('apkname')
                if apk_name_element is not None:
                    apk_name = apk_name_element.text.strip()  # Clean apk name text
                    # Use urljoin to correctly form the download link
                    download_link = urljoin(repo_url + '/', apk_name)
                    print(f"{app_name}: {download_link}")
                    if clone:
                        download_apk(download_link, folder_path)
    except requests.RequestException as e:
        print(f"Error fetching repo index: {e}")
    except ET.ParseError as e:
        print(f"Error parsing XML: {e}")

if __name__ == "__main__":
    list_fdroid_apps(args.repo_url, args.clone)