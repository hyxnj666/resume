# 数字人 3D 模型（可选）

将你的 3D 人物模型命名为 **`avatar.glb`** 并放在本目录（即站点根路径 `/avatar.glb`），数字人弹层会自动加载并显示，替代默认的几何占位。

## 生成默认 GLB 模型

项目自带脚本可用 Three.js 生成一个 stylized 人形 GLB（与占位人形同款），无需外链资源：

```bash
npm run generate-avatar
```

会生成本目录下的 **`avatar.glb`**，数字人页面将自动加载该模型，不再使用纯代码占位。

## 使用自己的模型

- 推荐来源：[Ready Player Me](https://readyplayer.me/) 或 [VRoid](https://vroid.com/) 导出 glb
- 若未放置 `avatar.glb` 或加载失败，将显示默认占位人形
