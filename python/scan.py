import requests
from tqdm import tqdm

print("Starting the scan...")

# Read each line from ip.txt
with open('ip.txt', 'r') as ip_file:
    for ip in ip_file:
        ip = ip.strip()
        # Read each line from port.txt
        with open('port.txt', 'r') as port_file:
            ports = port_file.readlines()
            for port in tqdm(ports, desc=f"Scanning IP: {ip}", bar_format='{l_bar}{bar}| ETA: {remaining}'):
                port = port.strip()
                try:
                    # Send a request to the IP:port and save the HTTP status code
                    response = requests.get(f"http://{ip}:{port}", timeout=5)
                    # If the HTTP status code is 200, write the IP:port to output.txt
                    if response.status_code == 200:
                        print(f"\n{ip}:{port} is active. Writing to output.txt...")
                        with open('output.txt', 'a') as output_file:
                            output_file.write(f"{ip}:{port}\n")
                except requests.exceptions.RequestException:
                    pass

print("Scan complete.")