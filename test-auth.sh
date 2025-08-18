#!/bin/bash

# Service role token for testing (simulates authenticated admin)
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdGdjcXR0YnZuZ294enh2bXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc5NjYxMCwiZXhwIjoyMDcwMzcyNjEwfQ.YabaCUS4l9BbizHN832eX-tIZgXrRs5cfl_1vCOvJ3c"

echo "=== Testing Balance Endpoint ==="
curl -s -H "Authorization: Bearer $AUTH_TOKEN" http://localhost:4444/balance | jq .

echo -e "\n=== Testing Admin Users with Balances ==="
curl -s -H "Authorization: Bearer $AUTH_TOKEN" http://localhost:4444/admin/users-with-balances | jq .

echo -e "\n=== Testing Admin Wallets ==="
curl -s -H "Authorization: Bearer $AUTH_TOKEN" http://localhost:4444/admin/wallets | jq .

echo -e "\n=== Testing Admin User Emails ==="
curl -s -H "Authorization: Bearer $AUTH_TOKEN" http://localhost:4444/admin/users/emails | jq .
