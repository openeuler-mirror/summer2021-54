# Summer2021-No.54 开发Linux内核结构体关联关系分析工具

### 介绍
https://gitee.com/openeuler-competition/summer-2021/issues/I3EIK7

### 软件架构
#### 关联关系提取
该部分主要完成 C 代码的基本分析工作，基于 LLVM 完成，将 C 代码库经编译、IR 转换、关联分析后，转化为包含全部结构体的 DOT 格式关联关系图。

#### 可视化
目前使用 Graphviz 提供的 sfdp 工具进行简单的静态图片绘制，未来将开发动态绘制工具。

### 依赖安装
```shell
(Arch Linux)
# pacman -S base-devel python python-pip clang graphviz
$ pip3 install wllvm networkx

(Debian)
# apt install build-essential clang python3 python3-pip graphviz
$ pip3 install wllvm networkx
```
### 使用说明

1. 使用 [wllvm](https://github.com/travitch/whole-program-llvm) 编译内核
```shell
$ cd linux-openeuler-4.19/
$ export LLVM_COMPILER=clang    # 指定 LLVM 编译器
$ make CC=wllvm defconfig       # 可以进行更多配置
$ make CC=wllvm -j$(nproc)      # 使用 wllvm 编译内核
```

2. 编译后，内核各驱动、模块的 .o 文件中，均已包含了 LLVM Bitcode。以 `net/ipv4/tcp_ipv4.o` 为例，使用以下命令提取 LLVM IR：
```shell
$ extract-bc net/ipv4/tcp_ipv4.o    # 获得 tcp_ipv4.o.bc
$ llvm-dis net/ipv4/tcp_ipv4.o.bc   # 将 Bitcode 反汇编为 IR
$ ls net/ipv4/tcp_ipv4.o*
net/ipv4/tcp_ipv4.o  net/ipv4/tcp_ipv4.o.bc  net/ipv4/tcp_ipv4.o.ll
```

3. 使用本项目提供的 Python 脚本，解析 IR 并获得 DOT
```shell
$ python3 ir_parser/main.py net/ipv4/tcp_ipv4.o.ll tcp_ipv4.dot
Dependency graph has 626 nodes and 1664 edges
```

4. 使用 sfdp 获取关系图
```shell
$ sfdp -x -Goverlap=prism -Tpng tcp_ipv4.dot > tcp_ipv4.png
```
