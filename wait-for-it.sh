#!/bin/bash
# wait-for-it.sh: Waits for a service to become available
# Usage: ./wait-for-it.sh HOST:PORT [-- COMMAND]

set -e

TIMEOUT=15
WAIT_START=$(date +%s)

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 host:port [-t timeout] [-- command args]"
    exit 1
fi

# Parse host and port
WAIT_HOST=$(echo $1 | cut -d: -f1)
WAIT_PORT=$(echo $1 | cut -d: -f2)

# Parse optional timeout
if [[ "$2" == "-t" ]]; then
    TIMEOUT=$3
    shift 3
else
    shift 1
fi

# Parse command to run after wait
if [[ "$1" == "--" ]]; then
    shift 1
    WAIT_CMD="$@"
fi

echo "Waiting for $WAIT_HOST:$WAIT_PORT..."

# Loop until connection succeeds or timeout
while true; do
    if nc -z "$WAIT_HOST" "$WAIT_PORT" 2>/dev/null; then
        echo "✓ Service at $WAIT_HOST:$WAIT_PORT is available"
        break
    fi

    WAIT_CURRENT=$(date +%s)
    WAIT_ELAPSED=$((WAIT_CURRENT - WAIT_START))

    if [[ $WAIT_ELAPSED -gt $TIMEOUT ]]; then
        echo "✗ Timeout waiting for $WAIT_HOST:$WAIT_PORT"
        exit 1
    fi

    echo "  Retrying in 1s... ($WAIT_ELAPSED/$TIMEOUT)"
    sleep 1
done

# Run command if provided
if [[ -n "$WAIT_CMD" ]]; then
    echo "Executing: $WAIT_CMD"
    exec $WAIT_CMD
fi
