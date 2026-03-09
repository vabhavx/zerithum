#!/bin/bash
# Setup Square OAuth credentials for Supabase Edge Functions

set -e

echo "==================================================================="
echo "Square OAuth Setup for Zerithum"
echo "==================================================================="
echo ""
echo "This script will set the required Square OAuth environment variables"
echo "in your Supabase Edge Functions."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Install it from: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "Error: Not logged in to Supabase."
    echo "Run: supabase login"
    exit 1
fi

# Get project ref
PROJECT_REF="pfhsqgkenjiugnegzcvx"

echo "Project: $PROJECT_REF"
echo ""

# Prompt for credentials
read -p "Enter Square Application ID (SQUARE_CLIENT_ID): " SQUARE_CLIENT_ID
read -s -p "Enter Square Application Secret (SQUARE_CLIENT_SECRET): " SQUARE_CLIENT_SECRET
echo ""

if [ -z "$SQUARE_CLIENT_ID" ] || [ -z "$SQUARE_CLIENT_SECRET" ]; then
    echo "Error: Both values are required."
    exit 1
fi

echo ""
echo "Setting secrets..."

# Set the secrets
supabase secrets set --project-ref "$PROJECT_REF" SQUARE_CLIENT_ID="$SQUARE_CLIENT_ID"
supabase secrets set --project-ref "$PROJECT_REF" SQUARE_CLIENT_SECRET="$SQUARE_CLIENT_SECRET"

echo ""
echo "==================================================================="
echo "Success! Square OAuth credentials have been set."
echo "==================================================================="
echo ""
echo "Set variables:"
echo "  - SQUARE_CLIENT_ID"
echo "  - SQUARE_CLIENT_SECRET"
echo ""
echo "You can now connect Square accounts."
echo ""
