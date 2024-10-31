---
title: Django RestFramework 使用router生成路由
categories:
  - 开发
tags:
  - drf
  - django
  - Python
abbrlink: lqmfi6wc
cover: 'https://static.zahui.fan/public/DjangoRESTFramework.svg'
date: 2023-12-26 22:14:45
---

django 使用的是模块化结构，每个 app 都可以独立拆分，那么注册路由的时候也可以灵活一点， 使用 drf 框架提供的 router 来自动生成路由

应用级 urls.py

```python
from django.urls import path, include
from rest_framework import routers
from app01 import views

router = routers.DefaultRouter()
router.register(r'groups', views.GroupViewSet)
router.register(r'students', views.StudentViewSet)


urlpatterns = [
    path('/', include(router.urls)),
]

```

这里 path 路径是/， 引用了 router， router 注册了两个路由， 分别是 groups 和 students， 生成的 api 路径就是 `/groups/` 和 `/students`

根级路由 urls.py

```python
from django.contrib import admin
from django.urls import path, include
from app01.urls import router as app01_router

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(app01_router.urls))
]
```

这里定义了 api/ 引入了 app01 里面的 router

那么最终的 url 结构就是：

```url
http://localhost:8000/api/groups/
http://localhost:8000/api/students/
```
