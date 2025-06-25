# Base directory to check
directory="/home/fly"

# Exclude string, add flywp.xyz to ignore test sites
exclude_string="nothing"

# Optional: IP address for local resolve
resolve_ip=""
use_resolve=1
show_cert=1

if [ -n "$1" ]; then
    resolve_ip="$1"
else
    # Fetch public IP from ip.wtf
    resolve_ip=$(curl -s https://ip.wtf)
fi

# Check for --no-resolve and --show-cert options
for arg in "$@"; do
    if [ "$arg" == "--no-resolve" ]; then
        use_resolve=0
    fi
    if [ "$arg" == "--show-cert" ]; then
        show_cert=1
    fi
done

# Function to curl with optional --resolve
curl_with_optional_resolve() {
    local url="$1"
    if [ -n "$resolve_ip" ] && [ "$use_resolve" -eq 1 ]; then
        # Extract domain from URL
        domain=$(echo "$url" | awk -F[/:] '{print $4}')
        curl --resolve "$domain:443:$resolve_ip" --resolve "$domain:80:$resolve_ip" -o /dev/null -s -w "%{http_code}\n" --max-time 10 "$url"
    else
        curl -o /dev/null -s -w "%{http_code}\n" --max-time 10 "$url"
    fi
}

# Function to show certificate expiration date
show_cert_expiry() {
    local domain="$1"
    # Use openssl to get the cert expiry date
    expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    if [ -n "$expiry" ]; then
        echo "Certificate for $domain expires on: $expiry"
    else
        echo "Could not retrieve certificate for $domain"
    fi
}

# Iterate through each item in the directory
for folder in "$directory"/*; do
   if [ -d "$folder" ]; then
       folder_name=$(basename "$folder")

       # Check if the folder name contains the exclude string
       if [[ "$folder_name" != *"$exclude_string"* ]]; then
           url="https://$folder_name/flywp-magic-login/"
           domain="$folder_name"

           if [ "$show_cert" -eq 1 ]; then
               show_cert_expiry "$domain"
           else
               # Make an HTTP request with a timeout of 10 seconds and get the status code
               status_code=$(curl_with_optional_resolve "$url")

               # Only show URLs with status codes that are not 2xx or 4xx
               if [[ "$status_code" -ge 300 && "$status_code" -lt 400 ]]; then
                   echo "3xx Redirect URL: $url (Status: $status_code)"
               elif [[ "$status_code" -ge 500 ]]; then
                   echo "Server Error URL: $url (Status: $status_code)"
               elif [[ "$status_code" -eq 000 ]]; then
                   echo "Timeout URL: $url"
               fi
           fi
       else
           echo "Skipping folder: $folder_name (contains exclude string)"
       fi
   fi
done
