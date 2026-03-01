
```bash
wget https://get.helm.sh/helm-v4.1.1-linux-amd64.tar.gz
kubectl create namespace cattle-system

helm repo add rancher-stable https://releases.rancher.com/server-charts/stable

helm install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --set hostname=rancher.i.com \
  --set bootstrapPassword=admin \
  --set ingress.tls.source=secret
```