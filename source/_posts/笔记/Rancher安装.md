---
date: 2026-03-02 07:42:57
updated: 2026-03-02 07:47:46
---

```bash
sudo kubeadm init \
--kubernetes-version 1.34.5 \
--control-plane-endpoint "10.0.0.10:6443" \
--upload-certs \
--service-cidr=10.96.0.0/12 \
--pod-network-cidr=10.244.0.0/16
```

```bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

```bash
apt-get install bash-completion

cat >> ~/.bashrc <<'EOF'
source /usr/share/bash-completion/bash_completion
source <(kubectl completion bash)
EOF

kubectl taint nodes --all node-role.kubernetes.io/control-plane-
```

```bash
wget https://get.helm.sh/helm-v4.1.1-linux-amd64.tar.gz
kubectl create namespace cattle-system

helm repo add rancher-stable https://releases.rancher.com/server-charts/stable

helm install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --set hostname=rancher.i.com \
  --set bootstrapPassword=admin \
  --set ingress.tls.source=secret
  
  
  
  
  vim /etc/kubernetes/manifests/kube-apiserver.yaml
      - --service-node-port-range=1-65535
```
