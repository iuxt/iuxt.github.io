---
date: 2025-01-14 17:50:22
updated: 2025-01-14 19:05:27
---

```conf
  location /vos/portal/ {
    proxy_pass http://vos-portal.vos-rp-dev/portal/;
  }
```

```yaml
kind: Ingress
apiVersion: networking.k8s.io/v1
metadata:
  name: vos-portal-wfe
  namespace: vos
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
spec:
  ingressClassName: private-nginx
  rules:
    - host: test.example.com
      http:
        paths:
          - path: /
            pathType: ImplementationSpecific
            backend:
              service:
                name: vos-portal-wfe
                port:
                  number: 80

---
kind: Ingress
apiVersion: networking.k8s.io/v1
metadata:
  name: vos-portal
  namespace: vos
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/rewrite-target: /portal/$2
spec:
  ingressClassName: private-nginx
  rules:
    - host: test.example.com
      http:
        paths:
          - path: /vos/portal(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: vos-portal
                port: 
                  number: 80
```

```yaml
curl test.example.com/vos/portal/xxx/xxx

/portal/xxx/xxx
```
