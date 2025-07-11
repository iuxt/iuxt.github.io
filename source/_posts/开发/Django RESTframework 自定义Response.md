---
title: Django RESTframework 自定义Response
categories:
  - 开发
tags:
  - django
  - Python
  - drf
abbrlink: sfz4bc
cover: 'https://s3.babudiu.com/iuxt/public/DjangoRESTFramework.svg'
date: 2024-01-02 10:01:59
---

比如我想给返回的 json 加上 code/ msg 等信息，可以通过修改 drf 的 response 来实现。

## 全局生效

参考：<https://www.cnblogs.com/henryhong/p/djangodrf-zi-ding-yi-shu-ju-fan-hui-ge-shi.html>

### 默认情况

```json
{
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 2,
            "url": "http://localhost:8000/api/category/2/",
            "title": "AAA",
            "created": "2024-07-02T14:18:44.993194+08:00"
        },
        {
            "id": 1,
            "url": "http://localhost:8000/api/category/1/",
            "title": "AAA",
            "created": "2024-07-02T14:18:00+08:00"
        }
    ]
}
```

`djangorestframwork` 可以通过自定义返回模板来重构返回数据的格式，我们查看 `restframework` 的默认设置可以看到,默认的模板是 `rest_framework.renderers.JSONRenderer` 和 `rest_framework.renderers.BrowsableAPIRenderer`，其中第一个是用于前端接收数据时的数据格式模板，第二个是 drf 在 api 查看界面的数据显示模式。

```python
'DEFAULT_RENDERER_CLASSES': [
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
]
```

### 修改模板

如果我们想要修改返回给前端的数据格式，那么我们可以首先修改配置参数（settings.py）中的 `DEFAULT_RENDERER_CLASSES`，将 `rest_framework.renderers.JSONRenderer` 修改为自己定义的模板类：

```python
'DEFAULT_RENDERER_CLASSES': (
    'utils.custom_renderer.CustomRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
),
```

这里有一个注意点就是在开发时如果需要通过 drf 的 api 查看界面查看相应的 api 一定要将这个模板加上 `rest_framework.renderers.BrowsableAPIRenderer`，否则的话无法看到相应的界面，生产时无需该界面，也可通过相关命令关闭显示。

`utils.custom_renderer.CustomRenderer` 其中 `utils.custome_render` 是自己的文件路径可根据自己的实际情况进行修改，`CustomRenderer` 是自己定义的返回模板类的名称

```python
from rest_framework.renderers import JSONRenderer
# 导入控制返回的JSON格式的类

class CustomRenderer(JSONRenderer):
    # 重构render方法
    def render(self, data, accepted_media_type=None, renderer_context=None):
        if renderer_context:
            # 判断实例的类型，返回的数据可能是列表也可能是字典
            if isinstance(data, dict):
                # 如果是字典的话应该是返回的数据，会包含msg,code,status等字段必须抽离出来
                msg = data.pop('msg', 'success')
                code = data.pop('code', 200)
                # 重新构建返回的JSON字典
                if 'status' in data.keys():
                    del data['status']
                    data = data['data']
                else:
                    data = data
            # 自定义返回数据格式
            ret = {
                'msg': msg,
                'code': code,
                'data': {
                    'list': data,
                    'total': len(data),
                },
            }
            # 返回JSON数据
            return super().render(ret, accepted_media_type, renderer_context)
        else:
            return super().render(data, accepted_media_type, renderer_context)
```

## 灵活调用

创建 `utils/response.py` 文件内容如下：

```python
from django.utils import six
from rest_framework.response import Response
from rest_framework.serializers import Serializer
from django.http import HttpResponse


class JsonResponse(Response):
    """
    重写 from django.http import JsonResponse
    An HttpResponse that allows its data to be rendered into arbitrary media types.
    """

    def __init__(self, data=None, code=200, msg="success", status=None, template_name=None, headers=None,
                 exception=False, content_type=None, **kwargs):
        """
        Alters the init arguments slightly.
        For example, drop 'template_name', and instead use 'data'.
        Setting 'renderer' and 'media_type' will typically be deferred,
        For example being set automatically by the `APIView`.
        """
        super(Response, self).__init__(None, status=status)
        if isinstance(data, Serializer):
            msg = (
                'You passed a Serializer instance as data, but '
                'probably meant to pass serialized `.data` or `.error`. representation.'
            )
            raise AssertionError(msg)
        self.data = {"code": code, "message": msg, "data": data}
        self.data.update(kwargs)
        self.template_name = template_name
        self.exception = exception
        self.content_type = content_type
        if headers:
            for name, value in six.iteritems(headers):
                self[name] = value

```

在 `views.py` 中调用：

```python
            return JsonResponse(detail="您只能修改自己的数据", code=403, status=status.HTTP_403_FORBIDDEN)
```