# Summer2021-No.54 开发Linux内核结构体关联关系分析工具

### 介绍
https://gitee.com/openeuler-competition/summer-2021/issues/I3EIK7

### 软件架构
#### 关联关系提取
该部分主要完成 C 代码的基本分析工作，基于 LLVM 完成，将 C 代码库经编译、IR 转换、关联分析后，转化为包含全部结构体的 DOT 格式关联关系图。

#### 可视化
支持使用基于 Web 的可视化工具，动态查看依赖关系图。

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

#### Step 0 编译内核

首先使用 [wllvm](https://github.com/travitch/whole-program-llvm) 编译内核
```shell
$ cd linux-openeuler-4.19/
$ export LLVM_COMPILER=clang    # 指定 LLVM 编译器
$ make CC=wllvm defconfig       # 可以进行更多配置
$ make CC=wllvm -j$(nproc)      # 使用 wllvm 编译内核
```

#### Step 1a 直接运行 Web 可视化工具

运行本项目的 `run.sh`，启动 Web 可视化工具。脚本支持 ELF、IR、Bitcode 三种格式的文件输入，具体参数可以查看 `./run.sh -h`。

#### Step 1b 手动生成关联数据用于其他场合

1. 使用 wllvm 编译后，内核各驱动、模块的 .o 文件中，均已包含了 LLVM Bitcode。以 `net/ipv4/tcp_ipv4.o` 为例，使用以下命令提取 LLVM IR：
```shell
$ extract-bc net/ipv4/tcp_ipv4.o    # 获得 tcp_ipv4.o.bc
$ llvm-dis net/ipv4/tcp_ipv4.o.bc   # 将 Bitcode 反汇编为 IR
$ ls net/ipv4/tcp_ipv4.o*
net/ipv4/tcp_ipv4.o  net/ipv4/tcp_ipv4.o.bc  net/ipv4/tcp_ipv4.o.ll
```

2. 使用本项目提供的 Python 脚本，解析 IR 并获得 JSON 格式的关系数据
```shell
$ python3 ir_parser/main.py net/ipv4/tcp_ipv4.o.ll --json_dir output/
Dependency graph has 626 nodes and 1664 edges
```
