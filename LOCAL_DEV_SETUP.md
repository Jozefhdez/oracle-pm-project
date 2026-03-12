# Local Development Setup

## Step 1: Copy the local build script

```bash
cd MtdrSpring/backend
cp build-local.sh.template build-local.sh
chmod +x build-local.sh
```

---

## Step 2: Get the team's wallet

1. Go to **OCI Console → Autonomous Database → team's DB → Database Connection**
2. Click **Download wallet** and set any password
3. Unzip it and change its name to wallet-local, then move it into `MtdrSpring/backend/`, at the end should be here `MtdrSpring/backend/wallet-local/`:

---

## Step 3: Fill in `build-local.sh`

Open `MtdrSpring/backend/build-local.sh` and set (Ask jozef for credentials hehe):

```bash
DB_USER=""
DB_PASSWORD=""
DB_URL=""
```

---

## Step 4: Create your `.env` file for API keys

```bash
cd MtdrSpring/backend
cp .env.template .env
```

Open `.env` and fill in your real values (same here, jozef has them):

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_NAME=your_bot_name
DEEPSEEK_API_KEY=sk-your-key
```

---

## Step 5: Build and run

```bash
cd MtdrSpring/backend
./build-local.sh
```

Then start the container:

```bash
docker stop todolistapp 2>/dev/null; docker rm todolistapp 2>/dev/null
docker run -d --name todolistapp -p 8080:8080 --env-file .env todolistapp-springboot:local
```

Open **http://localhost:8080**.