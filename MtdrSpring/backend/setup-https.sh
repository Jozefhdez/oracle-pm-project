#!/bin/bash
# Configures HTTPS on the OCI Load Balancer after a fresh deploy.
# Run from Cloud Shell after deploy.sh completes.
# Usage: . setup-https.sh

set -e

DUCKDNS_TOKEN="5aef6643-46d3-430e-b6f2-5fb458b3b6e9"
DOMAIN="oracle-pm.duckdns.org"
CERT_DIR="$HOME/.acme.sh/oracle-pm.duckdns.org"

echo "==> Getting compartment and LB info..."
COMPARTMENT_ID=$(oci iam compartment list --all \
  --query "data[?name=='reacttodo'].id | [0]" --raw-output)

LB_ID=$(oci lb load-balancer list --compartment-id "$COMPARTMENT_ID" \
  --query "data[0].id" --raw-output)

LB_IP=$(oci lb load-balancer get --load-balancer-id "$LB_ID" \
  --query "data.\"ip-addresses\"[0].\"ip-address\"" --raw-output)

NODEPORT=$(kubectl get svc todolistapp-springboot-service -n mtdrworkshop \
  -o jsonpath='{.spec.ports[0].nodePort}')

BACKEND_IPS=$(kubectl get nodes \
  -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}')

echo "    LB ID:     $LB_ID"
echo "    LB IP:     $LB_IP"
echo "    NodePort:  $NODEPORT"
echo "    Backends:  $BACKEND_IPS"

echo "==> Updating DuckDNS to $LB_IP..."
curl -s "https://www.duckdns.org/update?domains=oracle-pm&token=${DUCKDNS_TOKEN}&ip=${LB_IP}"
echo ""

echo "==> Uploading RSA certificate..."
oci lb certificate create \
  --load-balancer-id "$LB_ID" \
  --certificate-name oracle-pm-cert-rsa \
  --public-certificate-file "$CERT_DIR/fullchain.cer" \
  --private-key-file "$CERT_DIR/oracle-pm.duckdns.org.key" \
  --wait-for-state SUCCEEDED 2>&1 | grep -E "lifecycle-state|type|message" || true

echo "==> Tearing down existing HTTPS config (if any)..."
oci lb listener delete \
  --load-balancer-id "$LB_ID" \
  --listener-name "HTTPS-443" \
  --force --wait-for-state SUCCEEDED 2>&1 | grep -E "lifecycle-state|type" || true
oci lb backend-set delete \
  --load-balancer-id "$LB_ID" \
  --backend-set-name "HTTP-HTTPS" \
  --force --wait-for-state SUCCEEDED 2>&1 | grep -E "lifecycle-state|type" || true

echo "==> Creating HTTP-HTTPS backend set..."
oci lb backend-set create \
  --load-balancer-id "$LB_ID" \
  --name "HTTP-HTTPS" \
  --policy "IP_HASH" \
  --health-checker-protocol "TCP" \
  --health-checker-port "$NODEPORT" \
  --health-checker-retries 3 \
  --wait-for-state SUCCEEDED 2>&1 | grep -E "lifecycle-state|type" || true

echo "==> Adding backends..."
for IP in $BACKEND_IPS; do
  echo "    Adding $IP:$NODEPORT"
  oci lb backend create \
    --load-balancer-id "$LB_ID" \
    --backend-set-name "HTTP-HTTPS" \
    --ip-address "$IP" \
    --port "$NODEPORT" \
    --weight 1 \
    --wait-for-state SUCCEEDED 2>&1 | grep -E "lifecycle-state|type" || true
done

echo "==> Creating HTTPS-443 listener..."
oci lb listener create \
  --load-balancer-id "$LB_ID" \
  --name "HTTPS-443" \
  --default-backend-set-name "HTTP-HTTPS" \
  --port 443 \
  --protocol "HTTP" \
  --ssl-certificate-name "oracle-pm-cert-rsa" \
  --wait-for-state SUCCEEDED 2>&1 | grep -E "lifecycle-state|type" || true

echo ""
echo "==> Done! HTTPS is configured."
echo "    https://$DOMAIN"
