#!/bin/sh
# Hugging Face Spaces probes port 7860. Docker also injects HOSTNAME as the
# container id; Next.js would bind to that name, so force a public bind here.
set -eu
export HOSTNAME=0.0.0.0
export PORT=7860
if [ -z "${PATENT_DATA_SOURCE:-}" ]; then
  export PATENT_DATA_SOURCE=mock
fi
exec node server.js
