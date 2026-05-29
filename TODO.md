# MongoDB Connection Fix Guide

## Status: 🔄 In Progress

## Steps:

### 1. 🔍 Verify MongoDB Atlas Configuration (Highest Priority)
```
1. Login to https://cloud.mongodb.com
2. Go to Network Access → Add IP Address → Add Current IP Address (or 0.0.0.0/0 temporarily)
3. Database Access → Verify user 'ekavwormiracle' has ReadWrite perms
4. Check cluster 'Cluster0' is running (not paused)
```

**Test after:** `npm start`

### 2. 🖥️ Windows DNS/Network Diagnostics
Run in **new Command Prompt as Administrator**:

```cmd
REM Flush DNS
ipconfig /flushdns

REM Test DNS resolution
nslookup cluster0.0e2bmlv.mongodb.net 8.8.8.8

REM Test SRV record
nslookup -type=SRV _mongodb._tcp.cluster0.0e2bmlv.mongodb.net 8.8.8.8

REM Test internet
ping 8.8.8.8

REM Temporarily change DNS (requires admin)
netsh interface ip set dns "Wi-Fi" static 8.8.8.8
netsh interface ip add dns "Wi-Fi" 8.8.4.4 index=2
```

**Expected:** SRV should resolve to port 27017 endpoints.

### 3. 🔧 Quick Code Improvement (Optional - Non-blocking DB)
Edit **server.js** to start server even if DB fails:

**Current (exits on DB fail):**
```js
connectDB(); // sync call, exits if fails
app.listen(PORT)
```

**Improved:**
```js
connectDB().catch(err => console.error('DB failed, server continues:', err));
app.listen(PORT)
```

### 4. 🧪 Test Connection Standalone
Create `test-db.js`:
```js
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ DB Connected!');
  process.exit(0);
}).catch(err => {
  console.error('❌ DB Error:', err.message);
  process.exit(1);
});
```
Run: `node test-db.js`

### 5. 🚀 Final Test
```
npm start
```
Should show: `MongoDB Connected: cluster0.0e2bmlv-shard-00-...`

## Common Issues & Solutions:
| Issue | Solution |
|-------|----------|
| Atlas IP not whitelisted | Step 1 |
| Windows DNS cache | Step 2 |
| VPN/Firewall | Disable temporarily |
| Cluster paused | Resume in Atlas |
| Wrong DB user/pass | Reset in Atlas |

---

**Next:** Complete Step 1 → Mark as ✅ → Test → Report results**

