---
title: Django RestFramework 使用 JWT 认证
categories:
  - 开发
tags:
  - drf
  - django
  - Python
abbrlink: lsbj20sj
cover: 'https://s3.babudiu.com/iuxt/public/DjangoRESTFramework.svg'
date: 2024-02-07 16:28:06
---

## JWT 的优点

优点：无状态，服务端不保存 token
缺点：生成的 token 在有效期内一直有效，无论用户注销、修改密码。(可以通过存 redis，通过代码进行删除 redis 里的 token 解决。)

## 开始使用

### 配置

setting.py 里面设置默认值

```python
REST_FRAMEWORK = {
'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_jwt.authentication.JSONWebTokenAuthentication',
    ),
}
JWT_AUTH = {
    'JWT_EXPIRATION_DELTA': datetime.timedelta(days=7),  # Token 过期时间为一周
    'JWT_AUTH_HEADER_PREFIX': 'JWT',  # Token的头为：JWT
    'JWT_ALLOW_REFRESH': False,
}
```

这里的 DEFAULT_AUTHENTICATION_CLASSES 是默认设置，也可以给类视图自定义
views.py

```python
class XxxView(APIView):
    # 不用认证
    # authentication_classes = []

    # 基于jwt验证
    # authentication_classes = [JSONWebTokenAuthentication]

    # 只有登录才能访问
    # permission_classes = [IsAuthenticated]
```

authentication_classes = [JSONWebTokenAuthentication]

urls.py 里面配置生成 token 的路由

```python
from rest_framework_jwt.views import obtain_jwt_token
path('api-token-auth/', obtain_jwt_token),
```

### 使用

先访问 api-token-auth 接口，这个接口只能通过 POST 访问，带上用户名和密码，认证成功后会生成一个 token 类似于：

```json
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6Iml1eHQiLCJleHAiOjE3MDc5MDI5MTUsImVtYWlsIjoiaXV4dEBxcS5jb20ifQ.tHc3koO95mEh_HKUc3QNge0KwBYwoRz4n4bltq4xadg"
}
```

拿着这个 token 去请求接口：

```bash
curl --location 'http://localhost:8000/jwttest/carts/' \
--header 'Authorization: JWT  eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6Iml1eHQiLCJleHAiOjE3MDc5MDI5MTUsImVtYWlsIjoiaXV4dEBxcS5jb20ifQ.tHc3koO95mEh_HKUc3QNge0KwBYwoRz4n4bltq4xadg'
```

我们前缀设置的是 JWT， 所以在请求时在 Header 里带上 `JWT  ` 即可

## 修改默认返回值

默认的返回值仅有 token，通过修改该视图的返回值可以完成我们的需求。在应用中新建一个 utils.py 文件：

```python
def jwt_response_payload_handler(token, user=None, request=None):

    return {
        'token': token,
        'id': user.id,
        'username': user.username,
    }
```

在 settings.py 里面引用

```python
JWT_AUTH = {
    'JWT_EXPIRATION_DELTA': datetime.timedelta(days=7),
    'JWT_ALLOW_REFRESH': False,
    'JWT_AUTH_HEADER_PREFIX': 'JWT',
    'JWT_RESPONSE_PAYLOAD_HANDLER': '< app名字 >.utils.jwt_response_payload_handler',
}
```

这样获取 token 的时候返回：

```json
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6Iml1eHQiLCJleHAiOjE3MDc5MDMwODMsImVtYWlsIjoiaXV4dEBxcS5jb20ifQ.YR0X8-b1gEPnp-xZd0wavszWVwBQVBaCnd4_LDqnGn8",
    "id": 1,
    "username": "iuxt"
}
```

## JWT 判断权限

permissions.py

```python
from rest_framework_jwt.authentication import jwt_decode_handler


class IsOwnOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # if request.method in permissions.SAFE_METHODS:
        #     return True

        token = request.META.get('HTTP_AUTHORIZATION')[5:]  # 从 header 中获取 token
        token_user = jwt_decode_handler(token)  # 解析出来
        if token_user:
            return obj.user.id == token_user.get('user_id')  # 证明 当前jwt验证的用户就是数据创建者
        return False
```

在类视图里定义权限

```python
from .permissions import IsOwnOrReadOnly

class GameDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated, IsOwnOrReadOnly]
```
