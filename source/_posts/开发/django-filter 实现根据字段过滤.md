---
title: Django Restframework 实现根据字段过滤
categories:
  - 开发
tags:
  - drf
  - django
  - Python
abbrlink: ltmpr1yl
cover: 'https://static.zahui.fan/public/DjangoRESTFramework.svg'
date: 2024-03-11 17:00:42
---

## 安装

```bash
pip install django-filter
```

## 注册进 Django

vim settings.py

```python
INSTALLED_APPS = [
    ...
    'django_filters',
]

# 配置在这里的是系统的默认设置，也可以在视图集中单独指定
REST_FRAMEWORK = {
   # 过滤器默认后端
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
}
```

### 视图中单独指定

```python
    # 你也可以将其单独配置在特定的视图中：
    
     from django_filters.rest_framework import DjangoFilterBackend
    
    
     class ArticleViewSet(viewsets.ModelViewSet):
         # 设置过滤的后端，不设置则走上面的默认配置。
         filter_backends = [DjangoFilterBackend]
         # 设置过滤的字段，这个需要配置一下。
         filterset_fields = ['author__username', 'title']
```

## 使用

上面指定了过滤的字段，那么可以根据这两个字段进行过滤了。

```bash
curl http://localhost:8000/api/article/?author__username=iuxt&title=
```

## 模糊搜索

上面的搜索（过滤）方式是精确搜索， 如果你使用的是 DRF，需要模糊搜索可以使用 `rest_framework` 的 filters

vim views.py

```python
...
from rest_framework import filters

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    filter_backends = [filters.SearchFilter]
    search_fields = ['title']

    # 这个属性不需要了
    # filterset_fields = ['author__username', 'title']

```

搜索方式

```bash
curl http://localhost:8000/api/article/?search=测试测
```