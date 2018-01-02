# iphoneX前端适配调研
iphoneX相对于之前的版本，主要变化就是首次实现了全面屏。由此带来的几个变化：
1. 屏幕宽高比缩小，纵向可显示区域变大
2. 顶部状态栏高度增加，包含一个居中的不透明的传感器区域，俗称`刘海`
2. 底部home键换成了虚拟区域，此区域可透视页面内容  
这些变化带来的好处就是一屏可以展现更多的内容了以及更加沉浸体验。
带来的问题就是客户端、前端会存在诸多的兼容性问题，产品开发的诸多环节都会多一份适配的工作量。

## 宽高比变化
iphoneX宽高比是9:19.5, 之前的iphone是9:16，下图是iphone8/X的屏幕尺寸对比：
![](https://fulme.github.io/preview/doc/images/ihpne8-iphonex.png)

竖直方向增加145pt(近20%)的显示区域，具体来说：
- 顶部statusbar增加24pt，总高达44pt（包含高度30pt的`刘海`，详见下面statusbar区域图）
- 底部tabbar占34pt（home bar，此区域可以透视页面内容，但不能响应交互）
- 剩余87pt就是方正的纯内容显示区域

## 区域划分
区域主要划分成三部分：头部statusbar、安全区域、底部home bar(home键指示区域)

- statusbar区域(此区域内容需要考虑被顶部`刘海`遮挡的问题)  
![](https://fulme.github.io/preview/doc/images/sensor.jpeg)

- 安全区域(苹果官方推荐的交互内容呈现区域)  
![](https://fulme.github.io/preview/doc/images/safe-area.png)

- home bar区域(此区域内容可以透视展现，但不可做点击之类的交互)  

## safari
竖屏情况下不管有没有`viewport-fit: cover`，显示效果没有区别，内容限定在安全区域。
![](https://fulme.github.io/preview/doc/images/safari-portrain-default.png)

横屏情况默认显示在安全区域，但设置`viewport-fit: cover`后，遮挡问题就比较明显了
![](https://fulme.github.io/preview/doc/images/safari-landscape-default.png)
![](https://fulme.github.io/preview/doc/images/safari-landscape-fullscreen.png)

## WebView
WebView主要有两种: UIWebView和WkWebView，WkWebView在iOS8中新增，用于替代性能比较差的UIWebView。
但并非所有的客户端都全部升级了，而且也不一定会升级，所以两者肯能会长期并存。  

1. UIWebView  
UIWebView是很早以前提供的组件了，自行编写代码实测与之前别人写的介绍及截图表现已知，详见下面的截图。
- 竖屏  
![](https://fulme.github.io/preview/doc/images/UIWebView-portrain.png)  
- 横屏  
![](https://fulme.github.io/preview/doc/images/UIWebView-landscape.png)  
问题：内容限定在安全区域，但statusbar和home bar会透视溢出内容，且不能通过`viewport-fit: cover`实现全屏
方案：客户端把安全区域拓展到全屏（有对应的接口），页面通过padding或者占位元素处理遮挡问题

2. WkWebView  
WkWebView的表现一直在变化中，看了之前别人写的一些文档都是说默认会将内容渲染在安全区域，通过`viewport-fit: cover`可以铺满全屏显示，表现跟safari一致。
但通过自行编写代码，用WkWebView加载页面，结果默认铺满全屏显示，如下图所示。
- 竖屏  
![](https://fulme.github.io/preview/doc/images/WkWebView-portrain.png)  
- 横屏  
![](https://fulme.github.io/preview/doc/images/WkWebView-landscape.png)  
问题：吸顶元素会被statusbar遮挡，吸底元素会被home bar遮挡
方案：通过padding或者站位元素处理遮挡

3. swift3测试代码

- WkWebView测试代码

```
import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    @IBOutlet var containerView: UIView!
    var webView: WKWebView?
    
    override func loadView() {
        super.loadView()
        
        self.webView = WKWebView(frame: self.view.frame)
        self.view = self.webView
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        var url = URL(string: "https://ai.58.com/#/")
        
        var req = URLRequest(url: url!)
        self.webView?.load(req)
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
}
```

- UIWebView测试代码  

```
import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    @IBOutlet var containerView: UIView!
    var webView: UIWebView?
    
    override func loadView() {
        super.loadView()
        
        self.webView = UIWebView(frame: self.view.frame)
        self.view = self.webView
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        var url = URL(string: "https://ai.58.com/#/")
        
        var req = URLRequest(url: url!)
        self.webView?.loadRequest(req)
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
}
```

## 留白问题
当内容渲染到安全区域（默认safari及UIWebView），其他区域会用`body`或者`html`的`background-color`填充，如果都没有则填充白色。
这个有两种解决办法：
1. 适用于上述两种情况， 给`body`或者`html`设置合适的背景色，防止填充默认的白色影响页面的整体性。   
![](https://fulme.github.io/preview/doc/images/white.png)
2. 适用于safari, 通过`viewport-fit:cover + padding-*: safe-area-inset-*`将内容覆盖整个屏幕，并设置合适的边距（避开`刘海`和home键区域）
![](https://fulme.github.io/preview/doc/images/cover.png)

## 吸顶问题
因为内容被限定在了安全区域（UIWebView），页面的吸顶元素（`position: fixed; top: 0`）并非是屏幕的顶而是安全区域的顶。
当页面滚动时，页面内容会滚动到吸顶元素的上方且可见。  
![](https://fulme.github.io/preview/doc/images/fixed.gif)

同理，默认safari及UIWebView，吸底元素也会有同样的问题。
safari，通过`viewport-fit:cover + padding-*: safe-area-inset-*`将内容覆盖整个屏幕，并设置合适的边距解决
UIWebView，只能通过客户端把安全区域拓展到全屏（有对应的接口）解决了。

## 遮挡问题
safari通过`viewport-fit:cover`内容延伸到全屏后，所引入的问题就是顶部`刘海`和底部home bar遮挡问题。
- 竖屏(没有效果，所以不用处理)  
![](https://fulme.github.io/preview/doc/images/portrait.jpg)

- 横屏(这个基本就无法接受了)  
![](https://fulme.github.io/preview/doc/images/landscape.jpg)

可以通过`padding-*: safe-area-inset-*`解决遮挡问题。

```css
@supports(padding: max(0px)) {
  body {
    padding-left: max(12px, env(safe-area-inset-left));
    padding-right: max(12px, env(safe-area-inset-right));
  }
}
```

- 增加padding后竖屏如下图：  
![](https://fulme.github.io/preview/doc/images/max-safe-areas-insets.png)
- 增加padding后横屏如下图：  
![](https://fulme.github.io/preview/doc/images/safe-area-constants.png)


## 写在最后
> 上面的一些结论是基于iphoneX模拟器得出了，跟真机可能有出入，待我借到iphoneX真机后再check一下。

从前端的角度，针对iphoneX带来的问题需要做的工作如下：
- 为`html`或`body`设置一个跟主题内容区域背景接近的`background-color`
- 通过`viewport-fit:cover + padding-*: safe-area-inset-*`，增强页面的沉浸体验
- 对于吸顶/底的设计，safari、WKWebView、UIWebView三种方式的表现是有差异的需要综合考虑