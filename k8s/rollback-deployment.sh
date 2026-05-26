#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-mtdrworkshop}"
DEPLOYMENT="${DEPLOYMENT:-todolistapp-springboot-deployment}"
OCI_NOTIFICATION_TOPIC_ID="${OCI_NOTIFICATION_TOPIC_ID:-ocid1.onstopic.oc1.mx-queretaro-1.amaaaaaazfu3rdyaukxhxbsgiezmoarvx4s6e6xtd5dueqzyn4cg54teunkq}"
ROLLBACK_REASON="${1:-Manual rollback requested}"

notify() {
  local title="$1"
  local body="$2"

  if [ -z "${OCI_NOTIFICATION_TOPIC_ID}" ]; then
    return
  fi

  if ! oci ons message publish \
    --topic-id "${OCI_NOTIFICATION_TOPIC_ID}" \
    --title "${title}" \
    --body "${body}"; then
    echo "Warning: failed to publish OCI notification"
  fi
}

notify \
  "Oracle PM manual rollback started" \
  "${ROLLBACK_REASON}. Rolling back deployment/${DEPLOYMENT} in namespace ${NAMESPACE}."

kubectl rollout undo "deployment/${DEPLOYMENT}" -n "${NAMESPACE}"

if kubectl rollout status "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" --timeout=120s; then
  notify \
    "Oracle PM manual rollback completed" \
    "Rollback completed for deployment/${DEPLOYMENT} in namespace ${NAMESPACE}. Reason: ${ROLLBACK_REASON}."
else
  notify \
    "Oracle PM manual rollback failed" \
    "Rollback failed for deployment/${DEPLOYMENT} in namespace ${NAMESPACE}. Manual intervention required. Reason: ${ROLLBACK_REASON}."
  exit 1
fi
