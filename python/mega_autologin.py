import argparse
import subprocess
import pyotp
# pip install pyotp

def main():
    parser = argparse.ArgumentParser(description="Mega auto login script")
    parser.add_argument("credentials_file", help="Path to the credentials file")
    args = parser.parse_args()

    # Logout of any existing account first
    print("[INFO] Logging out of any existing account")
    subprocess.run(["mega-logout"], check=False)
    subprocess.run(["mega-killsession", "-a"], check=False)

    with open(args.credentials_file, "r") as f:
        for line in f:
            parts = line.strip().split(",")
            if len(parts) == 3:
                email, password, seed = parts
                totp = pyotp.TOTP(seed)
                code = totp.now()
                print(f"[INFO] Generated 2FA code: {code}")
                print(f"[INFO] Logging in with {email} using 2FA")
                subprocess.run(["mega-login", email, password, f"--auth-code={code}"], check=False)
            elif len(parts) == 2:
                email, password = parts
                print(f"[INFO] Logging in with {email} without 2FA")
                subprocess.run(["mega-login", email, password], check=False)
            else:
                print(f"[ERROR] Invalid line: {line}")
                continue

            # Run mega-session and mega-whoami after successful login
            subprocess.run(["mega-session"], check=False)
            subprocess.run(["mega-whoami"], check=False)

            print(f"[INFO] Logged in. Now logging out {email}")
            subprocess.run(["mega-logout"], check=False)
            print(f"[INFO] Logged out {email}")

if __name__ == "__main__":
    main()
