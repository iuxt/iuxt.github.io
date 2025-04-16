---
date: 2025-01-07 19:05:10
updated: 2025-04-16 17:01:46
---

首先替换：
<https://github.com/kubernetes/ingress-nginx/blob/main/deploy/static/provider/baremetal/deploy.yaml>

`ingress-nginx` --> `public-ingress-nginx`

找到： kind: IngressClass

name 改个名字

```yml
      - args:
        - /nginx-ingress-controller
        - --publish-service=$(POD_NAMESPACE)/ingress-nginx-controller
        - --election-id=ingress-nginx-leader
        - --controller-class=k8s.io/ingress-nginx
        - --ingress-class=nginx
```

这里的 ingress-class 改个名字

误替换的镜像名字，改回来。
